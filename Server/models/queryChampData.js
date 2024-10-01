import client from "./ingest/clickhouse.js";
import {getTenChampsStats} from "./clickhouseQueries.js";
import { champions } from "../champions.js"
import {calculateModifiedWinRates} from "./predictWinChance.js"
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

  let query = getTenChampsStats(championArrayString)

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

    const modifiedWin = await calculateModifiedWinRates(data.data)
    console.log('Modified Champ Data:',modifiedWin)
    // Create a map of champion names to win rates to keep the team order

    const winRateMap = new Map(
      modifiedWin.map((entry) => [
        entry.champion,
        {
          win_rate: Math.floor(entry.win_rate * 100),
          kda: entry.kda,
          gold: entry.gold,
          damage: entry.damage,
          modified_win_rate: entry.modified_win_rate,
        },
      ])
    );

    // Reorder the data based on the original champArray
    const reorderedData = champArray.map((champ) => {
      const champData = winRateMap.get(champ) || {
        win_rate: 0,
        kda: 0,
        gold: 0,
        damage: 0,
        modified_win_rate: 0,
      };

      return {
        champion: champ,
        ...champData, // Spread operator to include all properties
      };
    });

    console.log("Reordered champion stats: ", reorderedData);
    return reorderedData;
  } catch (error) {
    console.error("Error querying ClickHouse:", error);
  }
};

//! give it 10 champs and get back aram win rates for those champs
//! CLICKHOUSE PROJECTIONS

export default aramWinRates