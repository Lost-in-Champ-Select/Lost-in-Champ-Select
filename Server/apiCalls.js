import process from "process";
import dotenv from "dotenv";
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
      throw new Error(error);
    } else {
      // return `skipMatch`;
    //  return { status: response.status, match: id };
      throw new Error(`Did not recieve valid response, response recieved: ${response.status}`);
    }

}

export async function getLastNumMatches(playerId, numMatches){
  const response = await fetch(
    `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${playerId}/ids?start=0&count=${numMatches}&api_key=${riotKey}`
  );
  if (response.status === 200) {
      return await response.json();
    } else if (response.status === 429) {
      const retry = response.headers.get("Retry-After")
      console.log(`HIT RATE LIMIT RETRYING AFTER ${retry}`)
      await new Promise((resolve) => setTimeout(resolve, retry * 1000));
      return getLastNumMatches(playerId,numMatches)
    } else if (response.status === 403 | 401) {
       let error = {
         status: response.status,
         message: `Did not recieve valid response, response recieved: ${response.status}`,
       };
    // return `skipPlayer`
      throw new Error(error);
    } else {
    throw new Error(`Did not recieve valid response, response recieved: ${response.status}`)
    // return {status: response.status, player:playerId}
    }
  }


export async function getLiveMatch(req, res) {
  let puuid = req.query.puuid;
  let region = req.query.region;

  try {
    let data = await fetch(
      `https://${region}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`
    );

    let resolved = await data.json()
    console.log(resolved)
  } catch (err) {
    console.log("error no live match:", err);
    data = "Summoner is not currently in a game";
  } finally {
    res.send(data);
  }
}

export async function getAccountBySummonerName (req, res) {
  let summoner = req.query.name;
  let tag = req.query.tag;
  let region = req.query.region;
  try {
    const data = await fetch(
      `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summoner}/${tag}?api_key=${riotKey}`
    );
    let resolved = await data.json()
    console.log(resolved)
  } catch (err) {
    console.log("Error getting summoner by name:", err);
    data = "Summoner does not exist";
  } finally(){
    res.send(data);
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

