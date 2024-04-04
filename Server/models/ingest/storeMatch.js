//USE THIS FILE TO WRITE SCRIPT TO TAKE IN GAME DATA, PARSE AND STORE ACCORDING TO SCHEMA
import client from './clickhouse.js'
import apiCalls from '../../apiCalls.js'
import pool from './pg.js'

// TODO: read from somewhere to get last progress for scirpt
const hardCodedMatch = { params: { id: 'NA1_4896796017' }}
//console.log(hardCodedMatch)

// TODO check PG for seen match
let postgres = await pool.connect()
console.log("CONNECTED TO PG")

let foundMatch = postgres.query(`SELECT match_id from match_ids WHERE match_id = $1;`, [hardCodedMatch])

if (foundMatch.rows === 0) {

  // TODO: call api for a match
  let { info, metadata } = await (apiCalls.getMatchById(hardCodedMatch))
  //? we can change hardcodedmatch and this param when we have somewhere to read from.


  // TODO: set aside participants for later call for more matches
  let participants = metadata.participants


  // TODO: store relevant data
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
  console.log(insertMe)

  let result = await client.insert({
    table: "aram_matches",
    values: [
      insertMe
    ],
    format: "JSONEachRow",
  });

  console.log(result)

  // TODO: add match to pg seen matches list
  let storeMatchId = postgres.query('INSERT INTO aram_matches (match_id) VALUES ($1);', [hardCodedMatch])
  console.log(storeMatchId)
} else {
  console.log('match already seen')
}
// TODO: take participants and get their match history, add each participants match history to a queue


// TODO: else call api for that match and repeat process