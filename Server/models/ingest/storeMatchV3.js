//USE THIS FILE TO WRITE SCRIPT TO TAKE IN GAME DATA, PARSE AND STORE ACCORDING TO SCHEMA
import client from "./clickhouse.js";
import apiCalls from "../../apiCalls.js";
import pool from "./pg.js";
import { getMatchById, getLastNumMatches } from "../../apiCalls.js";
import process from "process"

let totalARAMMatches = 0;
let totalCLASSICMatches = 0;

const getEachMatchesData = async () => {
  //! first open a connection to postgres and define some places to store data
  let postgres = await pool.connect();
  let initialPlayer =
    "2H0QnLfmiPxeRr7dg9PRiiBpKA086TloQenQzqHygSvVI6mOMc0haAI2o0mqy0qOMheAWXP4zv0J9w";
  let playerIds = new Set()

  //! FN will get last 20 and store them into PG
  const getMatchIdHistoryAndStore = async (playerId, numMatches) => {
    let playerHistory = await getLastNumMatches(playerId, numMatches);
    if (!Array.isArray(playerHistory)) {
      console.log("getMatchIdHistoryAndStore ERROR");
      return;
    }
    let query = "INSERT INTO matches (match_id) VALUES ";
    playerHistory.forEach((match) => {
      query += `(${match}),`;
    });
    try {
      query = query.slice(0, query.length - 1);
      postgres.query(query);
    } catch (err) {
      console.log(err);
    }
    console.log("Batched current players last 20 into PG");
  };

  //! take an array of matchIds, await the call for all their match datas and build an object to batch insert some may still be promise
  const getMatchDataAndParse = async (matchIdArray) => {
    let parsed = [];
    matchIdArray.forEach((match) => {
      console.log("FETCHING DATA FOR MATCH::", match);
      try {
        let { info, metadata } = await getMatchById(match);
        if (info?.gameType === "CUSTOM_GAME") return "SKIPPING CUSTOM MATCH";
        if (
          metadata === undefined ||
          info.endOfGameResult === "Abort_Unexpected"
        ) {
          return `problem fetching match ${match}`;
        }
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
        metadata.participants.forEach(player => {
          playerIds.add(player)
        })
        parsed.push(parsedMatchData);
      } catch (err) {
        console.log("ERROR GETTING MATCH", match, err.message, err.status);
        return 403;
      }

      return parsed;
    });
  };

  const batchInsertMatchesClickhouse = (matchDataArray) => {
    //? build a query for aram and one for classic


    //  let result = await client.insert({
    //     table: info.gameMode === "ARAM" ? "aram_matches" : "classic_matches",
    //     values: [parsedMatchData],
    //     format: "JSONEachRow",
    //   });

    //   let insertSuccess = result.executed && storeMatchId.rowCount > 0 ? "SUCCESS" : "FAILED";
    //   insertSuccess === "SUCCESS" && info.gameMode === "ARAM" ? totalARAMMatches+=1 : totalCLASSICMatches+=1
    //   return `INSERT = ${insertSuccess} FOR MATCH: ${currentMatch}`;
  };

  //! start with an unseen match from the PG list (next one in line set to False)
  // TODO: if no seen matches start with initial player and pull last 20 games thru a function
  let initialMatches = postgres.query("SELECT match_id FROM matches WHERE seen = FALSE LIMIT 20;")
  if (initialMatches.rows.length === 0) {
    getMatchIdHistoryAndStore(initialPlayer, 20);
  }
  //! call the match data and parse the info as long as it passes edge tests (built into funct)
  let parsedMatches = getMatchDataAndParse(initialMatches)
  //! pass off all the players to our pull 20 matches function if we havent seen that player today (pull 20 and store Ids)
  playerIds.forEach(id => {
    getMatchIdHistoryAndStore(id,20)
  });

  // TODO: parsedMatches needs to be stored in clickhouse
  // TODO: run a count and keep concatting the parsed games into a big array to insert 100 at a time
  // TODO:

  await postgres.release();
  console.log("PG CLOSED");
}



// for (;;) {
//   await getEachMatchesData();
//   console.log(`Total ARAM Matches Ingested: ${totalARAMMatches}`);
//   console.log(`Total CLASSIC Matches Ingested: ${totalCLASSICMatches}`);
// }
