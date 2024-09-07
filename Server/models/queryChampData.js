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

  // Join the array into a string for ClickHouse array syntax
  const championArrayString = champArray
    .map((champ) => `'${champ}'`)
    .join(", ");

  console.log("querying winrates for:", championArrayString);

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
        champion IN (${championArrayString})
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
    const result = await client.query({
      query, // Passing query string here
      format: "JSON", // Ensure response is JSON formatted
    })

    console.log('QUERY RESULTS: ',result);
    return result;
  } catch (error) {
    console.error("Error querying ClickHouse:", error);
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