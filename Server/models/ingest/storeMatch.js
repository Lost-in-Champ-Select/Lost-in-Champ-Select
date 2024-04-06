//USE THIS FILE TO WRITE SCRIPT TO TAKE IN GAME DATA, PARSE AND STORE ACCORDING TO SCHEMA
import client from './clickhouse.js'
import apiCalls from '../../apiCalls.js'
import pool from './pg.js'


//! RATE LIMITS FOR DEV KEY
//! 20 requests every 1 seconds(s)
//! 100 requests every 2 minutes(s)
// TODO: read from somewhere to get last progress for scirpt
let matchesSeen = 0;
let matchIds = [
  "NA1_4907194745",
  "NA1_4904392604",
  "NA1_4902580260",
  "NA1_4902571283",
  "NA1_4902555882",
  "NA1_4896796017",
  "NA1_4894714375",
  "NA1_4894687465",
  "NA1_4894653027",
  "NA1_4894621454",
];
let hardCodedMatch = 'NA1_4894621454';
//? should I store participants in pg as well to have a list of peopple to always draw from.
//?  or maybe just store the match ids
let participants = {};

//! connect to pg and disconnect
let postgres;

let connectToPG = async () => {
  postgres = await pool.connect()
  console.log("CONNECTED TO PG")
}

let disconnectPG = async() => {
  await postgres.release();
  console.log("CONNECTION CLOSED");
}


//! created function to store in clickhouse, will call it if we havent seen the match
const matchDataIntoClickhouse = async () => {
  console.log('***** getting data for match:',hardCodedMatch)
  let { info, metadata } = await (apiCalls.getMatchById(hardCodedMatch))
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

    let storeMatchId =await postgres.query('INSERT INTO match_ids (match_id) VALUES ($1);', [hardCodedMatch])
    console.log(storeMatchId.command, "INTO PG ",storeMatchId.rowCount > 0 ? "SUCCESS":"FAILED")
  } catch (err) {
    console.log('ERROR', err)
  }
}

const ingestOrRejectMatch = async () => {
  //! check PG for seen match
  await connectToPG()
  let foundMatch = await postgres.query(`SELECT match_id from match_ids WHERE match_id = $1;`, [hardCodedMatch])

  //! if we havent seen the match we get the data and store it
  if (foundMatch.rows.length !== 0) {
    console.log("match already seen");
    await disconnectPG()
  } else {
    await matchDataIntoClickhouse();
    await disconnectPG()
    matchesSeen += 1
    console.log(`** SEEN ${matchesSeen} MATCHES **`)
  }
}


// TODO: A func to get participants match histories and add matches to the queue when matches are out of data
//! have we already got this players last 20 ?

const getUnseenPlayerId = (playersObj = participants) => {
  for (let key in playersObj) {
    if (playersObj[key] === 0) continue
    playersObj[key] = 0
    return key
  }

}

//! gets a players last 20 matches and refreshes the list
const refreshMatchIds = async (playerId) => {
  const playersMatchs = await apiCalls.getLastTwentyMatches(playerId)
  matchIds = playersMatchs;
  participants[playersMatchs] = 0
}

// TODO: else call api for each match and repeat process

while (matchIds.length > 0) {
  if (matchesSeen >= 100) {
    console.log('SEEN 100 MATCHES')
    break
  }

  hardCodedMatch = matchIds.at(-1)
  await ingestOrRejectMatch()
  matchIds.pop()

  //console.log('*** # of Participants in stored ***', Object.keys(participants).length)
  if (matchIds.length === 0) {
    const unseenPlayer = getUnseenPlayerId()
    await refreshMatchIds(unseenPlayer)
  }
}

