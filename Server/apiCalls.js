import process from "process";
import dotenv from "dotenv";
import aramWinRates from "./models/queryChampData.js";
import teamWinRates from "./teamWinRates.js"
dotenv.config();
const riotKey = process.env.RIOT_KEY;
// import fetch from 'node-fetch'

export async function getMatchById(id) {
  const matchId = id;
    const  response  = await fetch(
      `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${riotKey}`
    );
    if (response.status === 200) {
      return await response.json();
    } else if (response.status === 429) {
      const retry = response.headers.get("Retry-After")
      console.log(`HIT RATE LIMIT RETRYING AFTER ${retry}`)
      await new Promise((resolve) => setTimeout(resolve, retry * 1000));
      return getMatchById(id)
    } else if (response.status === 403 | 401) {
       let error = {
         status: response.status,
         message: `Did not recieve valid response, response recieved: ${response.status}`,
       };
      // return `skipMatch`;
      console.log(error)
      console.log(response)
      throw new Error(error);
    } else {
      // return `skipMatch`;
    //  return { status: response.status, match: id };
      throw new Error(`Did not recieve valid response, response recieved: ${response.status}`);
    }

}

export async function getLastNumMatches(playerId, numMatches, queue) {
  //? queue info  https://static.developer.riotgames.com/docs/lol/queues.json
  if (!queue) queue = "";
  const response = await fetch(
    `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${playerId}/ids?${queue}start=0&count=${numMatches}&api_key=${riotKey}`
    );
// console.log(
//   `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${playerId}/ids?${queue}start=0&count=${numMatches}?api_key=${riotKey}`
// );
  if (response.status === 200) {
    return await response.json();
  } else if (response.status === 429) {
    const retry = response.headers.get("Retry-After");
    console.log(`HIT RATE LIMIT RETRYING AFTER ${retry}`);
    await new Promise((resolve) => setTimeout(resolve, retry * 1000));
    return getLastNumMatches(playerId, numMatches);
  } else if (response.status === 401) {
    let bad = {
      status: response.status,
      message: `Unauthorized(401) : ${response.status}`,
    };
    console.log('Error in getLastNumMatches (API calls)',bad)
    return bad
  } else if (response.status === 403) {
    let error = {
      status: response.status,
      message: `Forbidden(403): ${response.status}`,
    };
    console.log(error)
    throw new Error(error);
  } else if (response.status === 400) {
    let bad = {
      message: "bad request",
      status: 400,
    };
    console.log('Error in getLastNumMatches (API calls)',bad)
    return bad
  } else {
    throw new Error(
      `Did not recieve valid response, response recieved: ${response.status}`
    );
  }
}

//! gets live match and win %s / team win chance
export async function getLiveMatch(req, res) {
  let puuid = req.query.puuid;
  let region = req.query.region;
  let gameData = {};
  console.log('getlivematch', req.query);
  //TODO this region is NA1 / BR1 / EUN1 / EUW1 / JP1 / KR / LA1/ LA2 / OC1 / PH2 / RU / SG2 / TH2 / TR1 / TW2 / VN2
  try {
    let data = await fetch(
      `https://na1.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}?api_key=${riotKey}`
    );

    let resolved = await data.json();
    //console.log(resolved);

    //! send custom win rates too
    gameData.data = resolved
    console.log('resolved data in get live match:',resolved)
    let champArray = resolved.participants?.map((player) => {
      return player.championId
    })
    let winRates = await aramWinRates(champArray)
    gameData.winRates = winRates;
    let teamChance = await teamWinRates(winRates)
    gameData.teamChance = teamChance
    console.log('Sending back gamedata:', gameData)
    res.json(gameData);
  } catch (err) {
    console.log("Error getting live match:", err);
    res.status(500);
    res.json({ message: err });
  }
}

export async function getAccountBySummonerName (req, res) {
  let summoner = req.query.name;
  let tag = req.query.tag;
  let region = req.query.region;
//TODO this region is AMERICAS / ASIA / ESPORTS / EUROPE (have this auto resolve get na1 style region then resolve the major region from that)
  try {
    let data = await fetch(
      `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summoner}/${tag}?api_key=${riotKey}`
    );
    let accountInfo = await data.json()
    console.log('ACCOUNT INFO',accountInfo)
    let moreInfo = await fetch(
      `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${accountInfo.puuid}?api_key=${riotKey}`
    );
    let resolved = await moreInfo.json();
    console.log('MORE INFO',resolved);
    res.json(resolved);
  } catch (err) {
    console.log("Error getting summoner by name:", err);
    res.status(500)
    res.json({message:err})
  }

}

export async function getAccountByPuuid (req, res) {
  let puuid = req.query.puuid;
  let tag = req.query.tag;
  let region = req.query.region;
  const data = await fetch(
    `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}?api_key=${riotKey}`
  );
  res.send(data);
  }

export async function getAramWinRatesFromDB(req, res) {
  let champs = req.query.champs
  console.log('GET ARAM WIN RATES FROM DB NOW:')
  try {
    let winRates = await aramWinRates(champs)
    console.log(winRates);
    res.json(winRates)
  } catch (err) {
     console.log("Error getting winrates:", err);
     res.status(500);
     res.json({ message: err });
  }

}

