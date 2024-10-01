import client from "./ingest/clickhouse.js";
import { champions }  from "../champions.js"
// TODO : define queries to get win rate data etc.
import { PassThrough } from "stream";

const aramWinRates = async (champArray) => {
  console.log('CHAMPARRAY:', champArray)
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
    });
    const data = await new Promise((resolve, reject) => {
      const passThrough = new PassThrough();
      const chunks = [];

      passThrough.on("data", (chunk) => chunks.push(chunk));
      passThrough.on("end", () => {
        try {
          const result = JSON.parse(Buffer.concat(chunks).toString());
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      passThrough.on("error", reject);

      result._stream.pipe(passThrough); // Use the stream from the ResultSet
    });

    console.log("Parsed QUERY RESULTS: ", data);
    // Create a map of champion names to win rates to keep the team order
    const winRateMap = new Map(
      data.data.map((entry) => [entry.champion, entry.win_rate])
    );

    // Reorder the data based on the original champArray
    const reorderedData = champArray.map((champ) => ({
      champion: champ,
      win_rate: Math.floor((winRateMap.get(champ) || 0) * 100),
    }));

    console.log("Reordered win rates: ", reorderedData);
    return reorderedData;
  } catch (error) {
    console.error("Error querying ClickHouse:", error);
  }
};

//! give it 10 champs and get back aram win rates for those champs
//! CLICKHOUSE PROJECTIONS

export default aramWinRates