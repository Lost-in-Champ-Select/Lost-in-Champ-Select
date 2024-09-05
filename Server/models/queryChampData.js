import client from "./ingest/clickhouse.js";
import { champions }  from "../champions.js"
// TODO : define queries to get win rate data etc.


const aramWinRates = async (champArray) => {
  let convertIdToChamp = (champArray) => {
    if (typeof champArray === "string") champArray = JSON.parse(champArray);
    if (!Array.isArray(champArray)) return;

    return champArray.map((champId) => champions[champId] || null);
  };

  champArray = convertIdToChamp(champArray);

  if (!champArray || champArray.length === 0) {
    throw new Error("Invalid or empty champion array");
  }

  // Simplified query with a parameter for the champion array
  let query = `
    WITH
    flattened_data AS (
      SELECT
        champion,
        win
      FROM (
        SELECT
          arrayJoin(team1_champions) AS champion,
          team1_win AS win
        FROM
          aram_matches
        UNION ALL
        SELECT
          arrayJoin(team2_champions) AS champion,
          NOT team1_win AS win
        FROM
          aram_matches
      )
    ),
    champion_win_rates AS (
      SELECT
        champion,
        avg(win) AS win_rate
      FROM
        flattened_data
      WHERE
        champion IN ?  
      GROUP BY
        champion
    )
  SELECT
    champion,
    win_rate
  FROM
    champion_win_rates
  ORDER BY
    champion;
  `;

  try {
    // Pass champArray as a parameter to the query
    const result = await client.query({
      query,
      params: [champArray], // Pass champArray directly as a parameter
    });

    console.log(result);
    return result;
  } catch (error) {
    console.log("Error querying ClickHouse:", error);
  }
};



//! give it 10 champs and get back aram win rates for those champs
// const aramWinRates = async (champArray) => {


//   let convertIdToChamp = (champArray) => {
//     if(typeof(chammpArray) === "string" ) champArray = JSON.parse(champArray);
//     if (!Array.isArray(champArray)) return;

//     return champArray.map((champId) => champions[champId] || null);
//   };

//   champArray = convertIdToChamp(champArray);

//   // Function to safely escape identifiers (such as column names)
//   function escapeIdentifier(identifier) {
//     return "`" + identifier.replace(/`/g, "``") + "`";
//   }

//   // Function to safely escape strings (such as values)
//   function escapeString(str) {
//     return "'" + str.replace(/'/g, "''") + "'";
//   }

//   let query = `
//   WITH
//   flattened_data AS (
//     SELECT
//       champion,
//       win
//     FROM (
//       SELECT
//         arrayJoin(${escapeIdentifier("team1_champions")}) AS champion,
//         ${escapeIdentifier("team1_win")} AS win
//       FROM
//         ${escapeIdentifier("aram_matches")}
//       UNION ALL
//       SELECT
//         arrayJoin(${escapeIdentifier("team2_champions")}) AS champion,
//         NOT ${escapeIdentifier("team1_win")} AS win
//       FROM
//         ${escapeIdentifier("aram_matches")}
//     )
//   ),
//   champion_win_rates AS (
//     SELECT
//       champion,
//       avg(win) AS win_rate
//     FROM
//       flattened_data
//     WHERE
//       champion IN (${champArray.map((champ) => escapeString(champ)).join(", ")})
//     GROUP BY
//       champion
//   )
// SELECT
//   champion,
//   win_rate
// FROM
//   champion_win_rates
// ORDER BY
//   champion;
//   `;



//   let data = await client.query(query)
//   console.log('CHAMP WINRATE DATA::::', data)
//   return data
// };

//! CLICKHOUSE PROJECTIONS


// WITH
//   flattened_data AS (
//     SELECT
//       champion,
//       win
//     FROM (
//       SELECT
//         arrayJoin(team1_champions) AS champion,
//         team1_win AS win
//       FROM
//         aram_matches
//       UNION ALL
//       SELECT
//         arrayJoin(team2_champions) AS champion,
//         NOT team1_win AS win
//       FROM
//         aram_matches
//     )
//   ),

//   champion_win_rates AS (
//     SELECT
//       champion,
//       avg(win) AS win_rate
//     FROM
//       flattened_data
//     WHERE
//       champion IN ('Tryndamere', 'Tristana', 'Fiddlesticks', 'Vi', 'Jinx', 'Janna', 'Nasus', 'Jayce', 'Varus', 'Irelia')
//     GROUP BY
//       champion
//   )
// SELECT
//   champion,
//   win_rate
// FROM
//   champion_win_rates
// ORDER BY
//   champion;


export default aramWinRates