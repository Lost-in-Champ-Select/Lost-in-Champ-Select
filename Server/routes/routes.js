import express from 'express'
import dotenv from 'dotenv'
import path from "path"

import {
  getMatchById,
  getLiveMatch,
  getAccountBySummonerName,
  getAccountByPuuid,
  getAramWinRatesFromDB,
} from "../apiCalls.js";



const router = express.Router()
dotenv.config()


router.get("/account-by-puuid", getAccountByPuuid);

router.get("/account-by-summoner-name", getAccountBySummonerName);

router.get('/single-match/:id', getMatchById)

router.get("/live-match", getLiveMatch);

router.get("/aram-win-rates", getAramWinRatesFromDB);

router.get("/riot.txt", (req, res) => {
  const filePath = path.join(__dirname, "../../docs/riot.txt");
  res.sendFile(filePath);
});

export default router