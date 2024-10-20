//USE THIS FILE TO WRITE SCRIPT TO TAKE IN GAME DATA, PARSE AND STORE ACCORDING TO SCHEMA
import client from "./clickhouse.js";
import pool from "./pg.js";
import { getMatchById, getLastNumMatches } from "../../apiCalls.js";
import process from "process"
import puuuidObj from "../../database/puuidFallback.js"

let totalARAMMatches = 0;
let totalCLASSICMatches = 0;
let breakLoop = false;
let postgres;

async function connectToPostgreSQL() {
  try {
    postgres = await pool.connect();
    console.log("Connected to PostgreSQL.");
  } catch (error) {
    console.error("Error connecting to PostgreSQL:", error.message);
    throw error; // Rethrow the error to handle it at a higher level
  }
}

await connectToPostgreSQL();

const getEachMatchesData = async (queueType) => {
  let initialPlayer =
    "2H0QnLfmiPxeRr7dg9PRiiBpKA086TloQenQzqHygSvVI6mOMc0haAI2o0mqy0qOMheAWXP4zv0J9w";

  const getMatchIdHistoryAndStore = async (playerId, numMatches) => {

    let playerHistory = await getLastNumMatches(playerId, numMatches, queueType);
    console.log('player history:', playerHistory)
    if (!Array.isArray(playerHistory)) {
      console.log("getMatchIdHistoryAndStore ERROR", playerHistory);
      return;
    }
    let query = "INSERT INTO matches (match_id) VALUES ";
    playerHistory.forEach((match) => {
      query += `('${match}'),`;
    });
    try {
      query = query.slice(0, query.length - 1);
      query += " ON CONFLICT (match_id) DO NOTHING";
      await postgres.query(query);
    } catch (err) {
      console.log(err);
    } finally {
      console.log("Batched current players last 20 into PG");
    }
  };

  const storePlayerIds = async (playersArray) => {
    try {
      await postgres.query('BEGIN');
      playersArray.forEach(async (player) => {
      await postgres.query(
        "INSERT INTO players (player_id) VALUES ($1) ON CONFLICT (player_id) DO NOTHING",
        [player]
      );
      })
      await postgres.query('COMMIT');
      console.log(`insert ${playersArray.size} players into PG success`)
    } catch (error) {
      await postgres.query('ROLLBACK');
      console.error("Error inserting players:", error);
    }
  }

  const loadMatchesOrGetMore = async () => {
    let loadMatches = await postgres.query(
      "SELECT match_id FROM matches WHERE seen = FALSE LIMIT 20;"
    );

    if (loadMatches.rows.length === 0) {
      console.log("NO MATCHES FROM PG GETTING MORE FROM NEW PLAYERS");
      let players = await postgres.query(
        "SELECT player_id FROM players WHERE seen = FALSE LIMIT 20"
      );
      players.rows.forEach(async (playerObject) => {
        console.log('getting history for ', playerObject.player_id)
        let id = playerObject.player_id
        try {
          await getMatchIdHistoryAndStore(id, 20);
          console.log('we got here')
          await postgres.query("UPDATE players SET seen = TRUE WHERE player_id = ($1)", [id])
          console.log('should be set to T')
        } catch (err) {
          console.log("ERROR IN loadMatchesOrGetMore", err)
        }
      });
      loadMatches = await postgres.query(
        "SELECT match_id FROM matches WHERE seen = FALSE LIMIT 20;"
      );
    }
    return loadMatches
  }

  //! take an array of matchIds, await the call for all their match datas and build an object to batch insert some may still be promise
  const callMultipleMatchesData =  (matchIdArray) => {
    console.log("FETCHING DATA FOR MATCHES:", matchIdArray.rows);
    let promises = [];
    matchIdArray.rows.forEach((matchObj) => {
      let currentMatch = matchObj.match_id;
      promises.push(getMatchById(currentMatch))
    });
    //! return a list of promises to parse
    return promises;
  };

  const parseMatchData = async (promiseArray) => {
    console.log('PARSE MATCH DATA START')
    let matches = await Promise.all(promiseArray);
    let parsed = [];
    let matchIdsSeen = [];
    let playerIds = new Set()
    matches.forEach((match) => {

      if (typeof match === "string") {
        console.log(`GOT ${match.status} FROM RIOT`)
        matchIdsSeen.push(match.match)
        return;
      }

      let { info, metadata } = match;

      matchIdsSeen.push(metadata?.matchId);

      if (info?.gameType === "CUSTOM_GAME") return;
      if (info?.endOfGameResult === "Abort_TooFewPlayers") return;
      if (info?.endOfGameResult === "Abort_Unexpected") return;
      if (metadata === undefined) return;

      let parsedMatchData = {
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
        team1_champ1_damage_dealt: info.participants[0]?.totalDamageDealtToChampions,
        team1_champ2_damage_dealt: info.participants[1]?.totalDamageDealtToChampions,
        team1_champ3_damage_dealt: info.participants[2]?.totalDamageDealtToChampions,
        team1_champ4_damage_dealt: info.participants[3]?.totalDamageDealtToChampions,
        team1_champ5_damage_dealt: info.participants[4]?.totalDamageDealtToChampions,
        team2_champ1_damage_dealt: info.participants[5]?.totalDamageDealtToChampions,
        team2_champ2_damage_dealt: info.participants[6]?.totalDamageDealtToChampions,
        team2_champ3_damage_dealt: info.participants[7]?.totalDamageDealtToChampions,
        team2_champ4_damage_dealt: info.participants[8]?.totalDamageDealtToChampions,
        team2_champ5_damage_dealt: info.participants[9]?.totalDamageDealtToChampions,
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
      parsed.push(parsedMatchData);
      //! for now limiting the num of players i will call match ids for at the end

      metadata.participants.forEach(id => {
        playerIds.add(id)
      })

    });
    await postgres.query("UPDATE matches SET seen = TRUE WHERE match_id = ANY($1)", [matchIdsSeen]);
    console.log('*** UPDATED MATCHES TO SEEN ***')
    await storePlayerIds(playerIds)
    return parsed;
  };

  const batchInsertMatchesClickhouse = async (matchDataArray) => {
    let arams = 0;
    let sr = 0;
    let insertAram = [];
    let insertSR = [];

    matchDataArray.forEach((match) => {
      if (match.game_mode === "ARAM") {
        insertAram.push(match);
        arams += 1;
      } else if (match.game_mode) {
        insertSR.push(match);
        sr += 1;
      } else {
        console.log("THIS MATCH IS ODD: ", match);
      }
    });

    try {
      let result = await client.insert({
        table: "aram_matches",
        values: [insertAram],
        format: "JSONEachRow",
      });
    } catch (error) {
      console.error("Error inserting ARAM:", error);
    }

    try {
      let result2 = await client.insert({
        table: "classic_matches",
        values: [insertSR],
        format: "JSONEachRow",
      });
    } catch (error) {
      console.error("Error inserting SR:", error);
    }
    console.log(`inserted ${arams} ARAM matches and ${sr} CLASSIC matches`);
    totalCLASSICMatches += sr;
    totalARAMMatches += arams;
  };

  //! ********************************** WORK STARTS HERE **********************************

  try {
    let initialMatches = await loadMatchesOrGetMore()
    console.log('INITIAL MATCHES COMPLETE')
    let matchData = callMultipleMatchesData(initialMatches);
    console.log('CALLDATA COMPLETE')
    let parsedData = await parseMatchData(matchData);
    console.log('PARSEDDATA COMPLETE')
    await batchInsertMatchesClickhouse(parsedData);
    console.log("**match ingestion end**");

  } catch (err) {
    console.log(err)
}

};

// getEachMatchesData(10);

for (; ;) {
  if (breakLoop) {
    await postgres.release();
    console.log("PG CLOSED");
    break;
  }
  await getEachMatchesData();
  console.log(`
  ********* ********* ********* ********* ********* ********* ********* ********* *********
  ********* ********* ********* ********* ********* ********* ********* ********* *********
  Total ARAM Matches Ingested: ${totalARAMMatches}
  Total CLASSIC Matches Ingested: ${totalCLASSICMatches}
  ********* ********* ********* ********* ********* ********* ********* ********* *********
  ********* ********* ********* ********* ********* ********* ********* ********* *********
  `);

}



//!RATE LIMITS
//! 20 requests every 1 seconds(s)
//! 100 requests every 2 minutes(s)


// TODO ISSUES
//? need it to stop looking up matches if requests arent coming back
//? need it to keep going if its just a one off

//!   400	Bad request
//!   401	Unauthorized
//!   403	Forbidden
//!   404	Data not found
//!   405	Method not allowed
//!   415	Unsupported media type
//!   429	Rate limit exceeded
//!   500	Internal server error
//!   502	Bad gateway
//!   503	Service unavailable
//!   504	Gateway timeout