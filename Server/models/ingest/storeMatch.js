//USE THIS FILE TO WRITE SCRIPT TO TAKE IN GAME DATA, PARSE AND STORE ACCORDING TO SCHEMA
import client from './clickhouse.js'
import apiCalls from '../../apiCalls.js'
import pool from './pg.js'
import { getMatchById } from '../../apiCalls.js'

//! connect to pg and disconnect
let postgres;

let connectToPG = async () => {
  postgres = await pool.connect()
  console.log("CONNECTED TO PG")
}

let disconnectPG = async() => {
  await postgres.release();
  console.log("PG CONNECTION CLOSED");
}

//! RATE LIMITS FOR DEV KEY
//! 20 requests every 1 seconds(s)
//! 100 requests every 2 minutes(s)

let matchIds= [];
let currentMatch = '';
let participants = {};



//! created function to store in clickhouse, will call it if we havent seen the match
const matchDataIntoClickhouse = async () => {
  console.log('***** getting data for match:',currentMatch)
  let { info, metadata } = await (getMatchById(currentMatch))
  if (metadata === undefined) return

  for (let i = 0; i < metadata.participants.length; i++) {
    if (participants[`${metadata.participants[i]}`] !== undefined) continue
    participants[`${metadata.participants[i]}`] = 1;
  }

  // TODO: store relevant data --> add more fields as project evloves
  let insertMe = {
    game_id: info.gameId,
    match_id: metadata.matchId,
    game_start: info.gameStartTimestamp,
    game_version: info.gameVersion,
    team_one_participants: metadata.participants.slice(0, 5),
    team_two_participants: metadata.participants.slice(5, 10),
    team_one_champ_one: info.participants[0].championName,
    team_one_champ_two: info.participants[1].championName,
    team_one_champ_three: info.participants[2].championName,
    team_one_champ_four: info.participants[3].championName,
    team_one_champ_five: info.participants[4].championName,
    team_two_champ_one: info.participants[5].championName,
    team_two_champ_two: info.participants[6].championName,
    team_two_champ_three: info.participants[7].championName,
    team_two_champ_four: info.participants[8].championName,
    team_two_champ_five: info.participants[9].championName,
    team_one_win: info.participants[0].win,
    team_two_win: info.participants[6].win,
  };
  console.log('*BUILT OBJECT TO INSERT*')
  // add match into CLickhouse and to pg seen matches list
  try {
    let result = await client.insert({
      table: info.gameMode === "ARAM" ? "aram_matches" : "classic_matches",
      values: [
        insertMe
      ],
      format: "JSONEachRow",
    });

    console.log("*INSERT SUCCESS =",result.executed, '*')

    let storeMatchId =await postgres.query('INSERT INTO match_ids (match_id) VALUES ($1);', [currentMatch])
    console.log(storeMatchId.command, "INTO PG ",storeMatchId.rowCount > 0 ? "SUCCESS":"FAILED")
  } catch (err) {
    console.log('ERROR', err)
  }
}

let matchesSeen = 0;

const ingestOrRejectMatch = async () => {
  //! check PG for seen match
  // await connectToPG()
  let foundMatch = await postgres.query(`SELECT match_id from match_ids WHERE match_id = $1;`, [currentMatch])

  //! if we havent seen the match we get the data and store it
  if (foundMatch.rows.length !== 0) {
    console.log("match already seen");
  } else {
    await matchDataIntoClickhouse();
    matchesSeen += 1
  }
  // await disconnectPG()
}

const getUnseenPlayerId = (playersObj = participants) => {
  for (let key in playersObj) {
    if (playersObj[key] === 0) continue
    // have we already got this players last 20 ? set their entry to 0 so we know
    playersObj[key] = 0
    return key
  }
}

//!A func to get participants match histories and add matches to the queue when matches are out of data
//! gets a players last 20 matches and refreshes the list
const refreshMatchIds = async (playerId) => {
  const playersMatchs = await apiCalls.getLastTwentyMatches(playerId)
  matchIds = playersMatchs;
  participants[playersMatchs] = 0
}

let counter = 0;

//! else call api for each match and repeat process
const getEachMatchesData = async (numberOfMatchesToGet) => {
  try {
    await connectToPG();
    if (Object.keys(participants).length === 0) {
      console.log(' NO UNSEEN PLAYERS****************************')
      let unseenPlayersPG = await postgres.query("SELECT * FROM unseen_players");
      let updatePlayers = await JSON.parse(unseenPlayersPG.rows[0].player);
      participants=updatePlayers
    }
    let unseenMatchList = await postgres.query("SELECT * FROM unseen_matches");
    let updateUnseen = await JSON.parse(unseenMatchList.rows[0].matches_array);
    matchIds = updateUnseen;
    console.log(updateUnseen, matchIds);
  } catch (err) {
    console.log(err);
  }
  while (matchesSeen < numberOfMatchesToGet) {
    currentMatch = matchIds.at(-1)
    await ingestOrRejectMatch()
    matchIds.pop()

    if (matchIds.length === 0) {
      const unseenPlayer = getUnseenPlayerId()
      await refreshMatchIds(unseenPlayer)
    }
    console.log(`:::::: SEEN ${matchesSeen} MATCHES ::::::`)
  }
  matchesSeen = 0
  //! store the extra unseen matches in pg

  if (typeof(matchIds[0]) === 'string') {
    let matchIdsToString = JSON.stringify(matchIds)
    let participantsToString = JSON.stringify(participants)
    try {
      let updateUnseenMatchesPG = await postgres.query('UPDATE unseen_matches SET matches_array = ($1)', [matchIdsToString]);
      let updateUnseenPlayersPG = await postgres.query('UPDATE unseen_players SET player = ($1)', [participantsToString]);
      console.log(updateUnseenMatchesPG.command, 'to unseen matches in PG Sucessful')
      console.log(updateUnseenPlayersPG.command, 'to unseen players in PG Sucessful')
    } catch (err) {
      console.log("ERROR", err);
    }
  } else {
    throw new Error ('NOT AN ARRAY OF MATCHES')
  }
  counter+=1
  console.log(`*^^@#* INTERVAL COUNT ${counter}`)
  await disconnectPG();
}

//! get x matches and then wait x  then keep going

//! RATE LIMITS FOR DEV KEY
//! 20 requests every 1 seconds(s)
//! 100 requests every 2 minutes(s)

setInterval(function () {
  getEachMatchesData(15)
}, 30000)

// getEachMatchesData(5)