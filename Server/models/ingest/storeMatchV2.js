//USE THIS FILE TO WRITE SCRIPT TO TAKE IN GAME DATA, PARSE AND STORE ACCORDING TO SCHEMA
import client from "./clickhouse.js";
import apiCalls from "../../apiCalls.js";
import pool from "./pg.js";
import { getMatchById } from "../../apiCalls.js";

//! first open a connection to postgres and define some places to store data
//let postgres = await pool.connect();
let totalARAMMatches = 0;
let totalCLASSICMatches = 0;

const getEachMatchesData = async (numberOfMatchesToGet) => {
  let postgres = await pool.connect();
  let participants = {};
  let matchIds = [];
  let matchesSeen = 0;

  const loadMatchesAndPlayers = async () => {
    try {
      //! pull the last group of unseen matches from previous run
      let unseenMatchList = await postgres.query(
        "SELECT * FROM unseen_matches"
      );
      let updateUnseen = await JSON.parse(
        unseenMatchList.rows[0].matches_array
      );
      if (Array.isArray(updateUnseen)) matchIds = updateUnseen;
    } catch (err) {
      console.log("error getting unseen matches array", err);
    }

    try {
      //! pull Object of unseen players
      let unseenPlayersPG = await postgres.query(
        "SELECT * FROM unseen_players"
      );
      let updatePlayers = await JSON.parse(unseenPlayersPG.rows[0].player);
      if (Object.keys(updatePlayers).length > 0) participants = updatePlayers;
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
      //! set value in player obj to 0 signifying we have seen this player recently
      playersObj[key] = 0;
      return key;
    }
  };

  const refreshMatches = async (playerId) => {
    //! gets a players last NUM matches and returns the array of matches
    const playersMatchs = await apiCalls.getLastNumMatches(playerId, numberOfMatchesToGet); //? get last 10 matches
    return playersMatchs;
  };

  const refreshMatchIds = async () => {
    console.log("**  REFRESHING MATCH IDS  **");
    try {
      const unseenPlayer = await getUnseenPlayerId(participants);
      const newMatches = await refreshMatches(unseenPlayer);
      if (Array.isArray(newMatches)) {
        matchIds = newMatches;
        console.log(`Updated matchIds with these new matches:${newMatches}`);
        return
      } else {
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
      if (metadata === undefined) return `problem fetching match ${currentMatch}`;

      for (let i = 0; i < metadata.participants.length; i++) {
        //! storing seen players in obj to draw from when out of matches
        if (playersObject[`${metadata.participants[i]}`] !== undefined) continue;
        playersObject[`${metadata.participants[i]}`] = 1;
      }

      // TODO: store relevant data --> add more fields as project evloves
      let insertMe = {
        game_id: info.gameId,
        match_id: metadata.matchId,
        game_start: info.gameStartTimestamp,
        game_version: info.gameVersion,
        team_one_participants: metadata.participants.slice(0, 5),
        team_two_participants: metadata.participants.slice(5, 10),
        team_one_champ_one: info.participants[0]?.championName,
        team_one_champ_two: info.participants[1]?.championName,
        team_one_champ_three: info.participants[2]?.championName,
        team_one_champ_four: info.participants[3]?.championName,
        team_one_champ_five: info.participants[4]?.championName,
        team_two_champ_one: info.participants[5]?.championName,
        team_two_champ_two: info.participants[6]?.championName,
        team_two_champ_three: info.participants[7]?.championName,
        team_two_champ_four: info.participants[8]?.championName,
        team_two_champ_five: info.participants[9]?.championName,
        team_one_win: info.participants[0].win,
        team_two_win: info.participants[6].win,
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
      console.log("ERROR GETTING MATCH", err)
    }

    return;
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
      if (tryInsert === 'SUCCESS' ) matchesSeen += 1;
    }
  };

  const storeUnseenPlayersPG = async () => {
    //! updates the player object stored in pg
    try {
      let playerObjectToString = JSON.stringify(participants);
      let updateUnseenPlayerObjPG = await postgres.query(
        "UPDATE unseen_players SET player = ($1)",
        [playerObjectToString]
      );
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
      let updateUnseenMatchIdsPG = await postgres.query(
        "UPDATE unseen_matches SET matches_array = ($1)",
        [matchIdsToString]
      );
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
    console.log(resolved);
    console.log(resolved.length, 'calls resolved');
    matchesRan += resolved.length;
    await refreshMatchIds()

    console.log(`${matchesSeen} Matches Seen this interval`);
  }
  await storeUnseenMatchesPG();
  await storeUnseenPlayersPG();
  console.log(`MATCH INGESTION COMPLETE`);

  await postgres.release();
  console.log("PG CLOSED");
}

while (true) {
  await getEachMatchesData(5);
  console.log(`Total ARAM Matches Ingested: ${totalARAMMatches}`);
  console.log(`Total CLASSIC Matches Ingested: ${totalCLASSICMatches}`)
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
//       console.log(key === 0);
//       console.log(participants[key]);
//       if (key === 0) delete participants.key;
//     }

//   }

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
//cleanPlayerObj()