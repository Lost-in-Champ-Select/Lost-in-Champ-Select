//USE THIS FILE TO WRITE SCRIPT TO TAKE IN GAME DATA, PARSE AND STORE ACCORDING TO SCHEMA
import client from "./clickhouse.js";
import apiCalls from "../../apiCalls.js";
import pool from "./pg.js";
import { getMatchById } from "../../apiCalls.js";
import process from "process"

//! first open a connection to postgres and define some places to store data
//let postgres = await pool.connect();
let newID;
let oldID;
let totalARAMMatches = 0;
let totalCLASSICMatches = 0;
let firstRun = true;
let defaultMatches = [
  "NA1_4974079281",
  "NA1_4907194745",
  "NA1_4980738714",
  "NA1_4974098720",
  "NA1_4980891892",
];
// TODO: function must be able to run with no players or matches... see if theres a way to get a random player id at all times, maybe refactor for this

const getEachMatchesData = async (numberOfMatchesToGet) => {
  let postgres = await pool.connect();
  let participants = {};
  let matchIds = [];
  let matchesSeen = 0;


  // TODO check if things are empty and give default values only if

  const loadMatchesAndPlayers = async () => {
    try {
      //! pull the last group of unseen matches from previous run
      let isMatchesEmpty = await postgres.query("SELECT COUNT(*) FROM unseen_matches;")
      if (isMatchesEmpty.rows[0].count === "0") {
        matches = defaultMatches
      } else {
        let unseenMatchList = await postgres.query(
          "SELECT * FROM unseen_matches"
        );
        let updateUnseen = await JSON.parse(
          unseenMatchList?.rows[0].matches_array
        );
        if (Array.isArray(updateUnseen)) matchIds = updateUnseen;
      }
    } catch (err) {
      console.log("error getting unseen matches array", err);
    }

    try {
      //! pull Object of unseen players
      let isPlayersEmpty = await postgres.query("SELECT COUNT(*) FROM unseen_players;")
      if (isPlayersEmpty.rows[0].count === "0") {
        participants = {"2H0QnLfmiPxeRr7dg9PRiiBpKA086TloQenQzqHygSvVI6mOMc0haAI2o0mqy0qOMheAWXP4zv0J9w": 1};
      } else {
        let unseenPlayersPG = await postgres.query(
          "SELECT * FROM unseen_players"
        );
        let updatePlayers = await JSON.parse(unseenPlayersPG.rows[0].player);
        if (Object.keys(updatePlayers).length > 0) participants = updatePlayers;
      }
    } catch (err) {
      console.log("Error getting players object", err);
    }
  };


  await loadMatchesAndPlayers()

  console.log('Initial Load complete')

  const getUnseenPlayerId = (playersObj) => {
    //! gets an unseen player from an object of players
    for (let key in playersObj) {
      if (playersObj[key] === 0) continue
      let unseenID = key
      newID = key
      console.log('GOT PLAYER:', unseenID)
      return unseenID;
    }
    console.log("PROBLEMO: UNSEEN PLAYER LIST IS EMPTY!!")

  };

  const refreshMatches = async (playerId, callXMatches) => {
    //! gets a players last NUM matches and returns the array of matches
    const playersMatchs = await apiCalls.getLastNumMatches(playerId, callXMatches); //? get last 10 matches
    if (Array.isArray(playersMatchs)) {
       participants[playerId] = 0
    }
    return playersMatchs;
  };

  const refreshMatchIds = async () => {
    console.log("**  REFRESHING MATCH IDS  **");
    try {
      let unseenPlayer = await getUnseenPlayerId(participants);
      if (oldID === newID) {
        console.log('we should get here if we are stuck in A LOOOOP')
        delete participants[oldID]
        unseenPlayer = await getUnseenPlayerId(participants)
      }
      oldID = unseenPlayer
      let newMatches = await refreshMatches(unseenPlayer, numberOfMatchesToGet);
      if (Array.isArray(newMatches)) {
        matchIds = newMatches;
        console.log(`new matches pulled:`, newMatches);
        return
      } else {
        console.log(newMatches)
        console.log("ERROR GETTING NEW MATCHES TRYING AGAIN WITH NEW PLAYER");
        return;
      }
    } catch (err) {
      console.log(`refresh matchIds error: ${err}`)
    }
    return
  };

  const matchDataIntoClickhouse = async (currentMatch, playersObject) => {
    //! FN takes a match and parses relevant data and stores into clickhouse and returns if it was a success in string format
    //console.log("FETCHING DATA FOR MATCH::", currentMatch);
    try {
      let { info, metadata } = await getMatchById(currentMatch);
      //!guard clauses
      if (info?.gameType === "CUSTOM_GAME") return "SKIPPING CUSTOM MATCH";
      if (metadata === undefined || info.endOfGameResult === "Abort_Unexpected") {
        return `problem fetching match ${currentMatch}`;
      }

      if (Object.keys(participants).length < 500) {
        for (let i = 0; i < metadata.participants.length; i++) {
          //! storing seen players in obj to draw from when out of matches
          if (playersObject[`${metadata.participants[i]}`] !== undefined) continue;
          playersObject[`${metadata.participants[i]}`] = 1;
        }
        console.log('ADDED TO PLAYER OBJ; PLAYERS:',Object.keys(participants).length)
      }

      // TODO: store relevant data --> add more fields as project evloves
      let insertMe = {
        game_id: info.gameId,
        match_id: metadata.matchId,
        team1_win: info.participants[0].win,
        team1_participants: metadata.participants.slice(0, 5),
        team2_participants: metadata.participants.slice(5, 10),
        team1_champions: [
          info.participants[0]?.championName,
          info.participants[1]?.championName,
          info.participants[2]?.championName,
          info.participants[3]?.championName,
          info.participants[4]?.championName,
        ],
        team2_champions: [
          info.participants[5]?.championName,
          info.participants[6]?.championName,
          info.participants[7]?.championName,
          info.participants[8]?.championName,
          info.participants[9]?.championName,
        ],
        game_mode: info.gameMode,
        game_version: info.gameVersion,
        game_duration: info.gameDuration,
        game_start_timestamp: info.gameStartTimestamp,
        game_end_timestamp: info.gameEndTimestamp,
        game_creation_timestamp: info.gameCreation,
        // Kills
        team1_champ1_kills: info.participants[0]?.kills,
        team1_champ2_kills: info.participants[1]?.kills,
        team1_champ3_kills: info.participants[2]?.kills,
        team1_champ4_kills: info.participants[3]?.kills,
        team1_champ5_kills: info.participants[4]?.kills,
        team2_champ1_kills: info.participants[5]?.kills,
        team2_champ2_kills: info.participants[6]?.kills,
        team2_champ3_kills: info.participants[7]?.kills,
        team2_champ4_kills: info.participants[8]?.kills,
        team2_champ5_kills: info.participants[9]?.kills,
        // Deaths
        team1_champ1_deaths: info.participants[0]?.deaths,
        team1_champ2_deaths: info.participants[1]?.deaths,
        team1_champ3_deaths: info.participants[2]?.deaths,
        team1_champ4_deaths: info.participants[3]?.deaths,
        team1_champ5_deaths: info.participants[4]?.deaths,
        team2_champ1_deaths: info.participants[5]?.deaths,
        team2_champ2_deaths: info.participants[6]?.deaths,
        team2_champ3_deaths: info.participants[7]?.deaths,
        team2_champ4_deaths: info.participants[8]?.deaths,
        team2_champ5_deaths: info.participants[9]?.deaths,
        // Assists
        team1_champ1_assists: info.participants[0]?.assists,
        team1_champ2_assists: info.participants[1]?.assists,
        team1_champ3_assists: info.participants[2]?.assists,
        team1_champ4_assists: info.participants[3]?.assists,
        team1_champ5_assists: info.participants[4]?.assists,
        team2_champ1_assists: info.participants[5]?.assists,
        team2_champ2_assists: info.participants[6]?.assists,
        team2_champ3_assists: info.participants[7]?.assists,
        team2_champ4_assists: info.participants[8]?.assists,
        team2_champ5_assists: info.participants[9]?.assists,
        // Gold Earned
        team1_champ1_gold_earned: info.participants[0]?.goldEarned,
        team1_champ2_gold_earned: info.participants[1]?.goldEarned,
        team1_champ3_gold_earned: info.participants[2]?.goldEarned,
        team1_champ4_gold_earned: info.participants[3]?.goldEarned,
        team1_champ5_gold_earned: info.participants[4]?.goldEarned,
        team2_champ1_gold_earned: info.participants[5]?.goldEarned,
        team2_champ2_gold_earned: info.participants[6]?.goldEarned,
        team2_champ3_gold_earned: info.participants[7]?.goldEarned,
        team2_champ4_gold_earned: info.participants[8]?.goldEarned,
        team2_champ5_gold_earned: info.participants[9]?.goldEarned,
        // Damage Dealt
        team1_champ1_damage_dealt: info.participants[0]?.totalDamageDealt,
        team1_champ2_damage_dealt: info.participants[1]?.totalDamageDealt,
        team1_champ3_damage_dealt: info.participants[2]?.totalDamageDealt,
        team1_champ4_damage_dealt: info.participants[3]?.totalDamageDealt,
        team1_champ5_damage_dealt: info.participants[4]?.totalDamageDealt,
        team2_champ1_damage_dealt: info.participants[5]?.totalDamageDealt,
        team2_champ2_damage_dealt: info.participants[6]?.totalDamageDealt,
        team2_champ3_damage_dealt: info.participants[7]?.totalDamageDealt,
        team2_champ4_damage_dealt: info.participants[8]?.totalDamageDealt,
        team2_champ5_damage_dealt: info.participants[9]?.totalDamageDealt,
        // Damage Taken
        team1_champ1_damage_taken: info.participants[0]?.totalDamageTaken,
        team1_champ2_damage_taken: info.participants[1]?.totalDamageTaken,
        team1_champ3_damage_taken: info.participants[2]?.totalDamageTaken,
        team1_champ4_damage_taken: info.participants[3]?.totalDamageTaken,
        team1_champ5_damage_taken: info.participants[4]?.totalDamageTaken,
        team2_champ1_damage_taken: info.participants[5]?.totalDamageTaken,
        team2_champ2_damage_taken: info.participants[6]?.totalDamageTaken,
        team2_champ3_damage_taken: info.participants[7]?.totalDamageTaken,
        team2_champ4_damage_taken: info.participants[8]?.totalDamageTaken,
        team2_champ5_damage_taken: info.participants[9]?.totalDamageTaken,
        // Items
        team1_champ1_items: [
          info.participants[0]?.item0,
          info.participants[0]?.item1,
          info.participants[0]?.item2,
          info.participants[0]?.item3,
          info.participants[0]?.item4,
          info.participants[0]?.item5,
          info.participants[0]?.item6,
        ],
        team1_champ2_items: [
          info.participants[1]?.item0,
          info.participants[1]?.item1,
          info.participants[1]?.item2,
          info.participants[1]?.item3,
          info.participants[1]?.item4,
          info.participants[1]?.item5,
          info.participants[1]?.item6,
        ],
        team1_champ3_items: [
          info.participants[2]?.item0,
          info.participants[2]?.item1,
          info.participants[2]?.item2,
          info.participants[2]?.item3,
          info.participants[2]?.item4,
          info.participants[2]?.item5,
          info.participants[2]?.item6,
        ],
        team1_champ4_items: [
          info.participants[3]?.item0,
          info.participants[3]?.item1,
          info.participants[3]?.item2,
          info.participants[3]?.item3,
          info.participants[3]?.item4,
          info.participants[3]?.item5,
          info.participants[3]?.item6,
        ],
        team1_champ5_items: [
          info.participants[4]?.item0,
          info.participants[4]?.item1,
          info.participants[4]?.item2,
          info.participants[4]?.item3,
          info.participants[4]?.item4,
          info.participants[4]?.item5,
          info.participants[4]?.item6,
        ],
        team2_champ1_items: [
          info.participants[5]?.item0,
          info.participants[5]?.item1,
          info.participants[5]?.item2,
          info.participants[5]?.item3,
          info.participants[5]?.item4,
          info.participants[5]?.item5,
          info.participants[5]?.item6,
        ],
        team2_champ2_items: [
          info.participants[6]?.item0,
          info.participants[6]?.item1,
          info.participants[6]?.item2,
          info.participants[6]?.item3,
          info.participants[6]?.item4,
          info.participants[6]?.item5,
          info.participants[6]?.item6,
        ],
        team2_champ3_items: [
          info.participants[7]?.item0,
          info.participants[7]?.item1,
          info.participants[7]?.item2,
          info.participants[7]?.item3,
          info.participants[7]?.item4,
          info.participants[7]?.item5,
          info.participants[7]?.item6,
        ],
        team2_champ4_items: [
          info.participants[8]?.item0,
          info.participants[8]?.item1,
          info.participants[8]?.item2,
          info.participants[8]?.item3,
          info.participants[8]?.item4,
          info.participants[8]?.item5,
          info.participants[8]?.item6,
        ],
        team2_champ5_items: [
          info.participants[9]?.item0,
          info.participants[9]?.item1,
          info.participants[9]?.item2,
          info.participants[9]?.item3,
          info.participants[9]?.item4,
          info.participants[9]?.item5,
          info.participants[9]?.item6,
        ],
        // Champion Levels
        team1_champ1_level: info.participants[0]?.champLevel,
        team1_champ2_level: info.participants[1]?.champLevel,
        team1_champ3_level: info.participants[2]?.champLevel,
        team1_champ4_level: info.participants[3]?.champLevel,
        team1_champ5_level: info.participants[4]?.champLevel,
        team2_champ1_level: info.participants[5]?.champLevel,
        team2_champ2_level: info.participants[6]?.champLevel,
        team2_champ3_level: info.participants[7]?.champLevel,
        team2_champ4_level: info.participants[8]?.champLevel,
        team2_champ5_level: info.participants[9]?.champLevel,
      };
      //console.log("*BUILT OBJECT TO INSERT*", insertMe);

      //! then add match into CLickhouse and to pg seen matches list

      let result = await client.insert({
        table: info.gameMode === "ARAM" ? "aram_matches" : "classic_matches",
        values: [insertMe],
        format: "JSONEachRow",
      });

      let storeMatchId = await postgres.query(
        "INSERT INTO match_ids (match_id) VALUES ($1);",
        [currentMatch]
      );
      let insertSuccess = result.executed && storeMatchId.rowCount > 0 ? "SUCCESS" : "FAILED";
      insertSuccess === "SUCCESS" && info.gameMode === "ARAM" ? totalARAMMatches+=1 : totalCLASSICMatches+=1
      return `INSERT = ${insertSuccess} FOR MATCH: ${currentMatch}`;


    } catch (err) {
      console.log("ERROR GETTING MATCH", currentMatch, err.message, err.status)
      return 403
    }
  };

  const ingestOrRejectMatch = async (currentMatch) => {
    //! logic to check PG for seen match and pass or reject it
    let foundMatch = await postgres.query(
    `SELECT match_id from match_ids WHERE match_id = $1;`,
    [currentMatch]
  );

    //! if we havent seen the match we get the data and store it
    if (foundMatch.rows.length !== 0) {
      console.log("match already seen");
      return null
    } else {
      let tryInsert = await matchDataIntoClickhouse(currentMatch, participants);
      console.log(tryInsert)
      if (tryInsert === 'SUCCESS') matchesSeen += 1;
      if (tryInsert === 403) {
        console.log(`Recieved 403 from RIOT, exiting script`)
        process.exit(1)
      }
    }
  };

  const storeUnseenPlayersPG = async () => {
    //! updates the player object stored in pg
    try {
      let playerObjectToString = JSON.stringify(participants);
      let update = "UPDATE unseen_players SET player = ($1);"
      let insert = "INSERT INTO unseen_players (player) VALUES ($1);"
      let isEmpty = await postgres.query("SELECT COUNT(*) FROM unseen_players;")
      let query = isEmpty.rows[0].count === "0" ? insert : update;

      let updateUnseenPlayerObjPG = await postgres.query(query,[playerObjectToString]);

      console.log(
          updateUnseenPlayerObjPG.command,
          "to unseen players in PG Sucessful"
          );
        } catch (err) {
          console.log("ERROR", err);
    }
  };

  const storeUnseenMatchesPG = async () => {
    //! store the extra unseen matches in pg for next time
    try {
      let matchIdsToString = JSON.stringify(matchIds);
      let update = "UPDATE unseen_matches SET matches_array = ($1);";
      let insert = "INSERT INTO unseen_matches (matches_array) VALUES ($1);";

      let isEmpty = await postgres.query(
        "SELECT COUNT(*) FROM unseen_matches;"
      );
      let query = isEmpty.rows[0].count === "0" ? insert : update

      let updateUnseenMatchIdsPG = await postgres.query(query,[matchIdsToString]);
      console.log(
      updateUnseenMatchIdsPG.command,
      "to unseen matches in PG Sucessful"
      );
      console.log("Players Stored:", Object.keys(participants).length);
    } catch (err) {
      console.log("ERROR", err);
    }
  };

  //!  calls api for each match, gets new list of matches from unseen player and repeat process until X games ingested
  //? **************************WORK STARTS HERE **********************
  console.log("Requesting data for match Ids:", matchIds)
  let matchesRan = 0

  while (matchesRan < numberOfMatchesToGet) {
    let matches = [];
    matchIds.forEach(async(match) => {
      let res =  ingestOrRejectMatch(match);
      if (res !== null) {
        matches.push(res);
      }
    });

    let resolved = await Promise.all(matches);
    console.log('Resolved:',resolved);
    console.log(resolved.length, 'calls resolved');
    matchesRan += resolved.length;
    await refreshMatchIds()
    console.log("PLAYER OBJ PLAYERS:", Object.keys(participants).length);
    console.log('NEW MATCH IDS =', matchIds)

    console.log(`${matchesSeen} Matches Seen this interval`);
    let count = 0
    for (let key in participants) {
      if (key === 0) delete participants[key];
      count += 1
    }
    console.log(`deleted ${count} players from players object`)
  }
  await storeUnseenMatchesPG();
  await storeUnseenPlayersPG();
  console.log(`MATCH INGESTION COMPLETE`);

  await postgres.release();
  console.log("PG CLOSED");
}


// TODO: error handling, rate limit handling, apply for production key, get a URL
// TODO: is there a way to run the script on an interval without needing setinterval(worker or something?)

// const cleanPlayerObj = async () => {
//   //! this fn can clean the player object, possibly run when obj gets to X size or clean every patch?
//   let participants = {}
//   let postgres = await pool.connect();
//   try {
//     //! pull Object of unseen players
//     let unseenPlayersPG = await postgres.query("SELECT * FROM unseen_players");
//     let updatePlayers = await JSON.parse(unseenPlayersPG.rows[0].player);
//     if (Object.keys(updatePlayers).length > 0) participants = updatePlayers;
//   } catch (err) {
//     console.log("Error getting players object", err);
//     return
//   }

//   const clean = async () => {
//     for (let key in participants) {
//       // console.log(key === 0);
//       // console.log(participants[key]);
//       if (key === 0) delete participants.key;
//     }

//   }
//   const deleteHalf = async (obj) => {
//     let counter = 0;
//     for (let key in obj) {
//       if (counter % 2 === 0) {
//         delete obj[key];
//       }
//       counter++;
//     }
//   };
//   await deleteHalf(participants)
//   await clean()

//   try {
//     let playerObjectToString = JSON.stringify(participants);
//     let updateUnseenPlayerObjPG = await postgres.query(
//       "UPDATE unseen_players SET player = ($1)",
//       [playerObjectToString]
//     );
//     console.log(
//       updateUnseenPlayerObjPG.command,
//       "to unseen players in PG Sucessful"
//     );
//   } catch (err) {
//     console.log("ERROR", err);
//   }


//   postgres.release()
//   console.log(`new player obj is ${Object.keys(participants).length} entries`)
// }



//cleans player obj of seen players before running fn

for (;;) {
  await getEachMatchesData(5);
  console.log(`Total ARAM Matches Ingested: ${totalARAMMatches}`);
  console.log(`Total CLASSIC Matches Ingested: ${totalCLASSICMatches}`);
}
