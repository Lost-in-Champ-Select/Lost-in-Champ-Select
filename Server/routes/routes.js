import express from 'express'
import dotenv from 'dotenv'
import path from "path"
import { fileURLToPath } from "url";
import {
  getMatchById,
  getLiveMatch,
  getAccountBySummonerName,
  getAccountByPuuid,
  getAramWinRatesFromDB,
} from "../apiCalls.js";



const router = express.Router()
dotenv.config()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get("/riot.txt", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  const filePath = path.join(__dirname, "../../docs/riot.txt");
  res.sendFile(filePath);
});

router.get("/account-by-puuid", getAccountByPuuid);

router.get("/account-by-summoner-name", getAccountBySummonerName);

router.get('/single-match/:id', getMatchById)

router.get("/live-match", getLiveMatch);

router.get("/aram-win-rates", getAramWinRatesFromDB);


export default router