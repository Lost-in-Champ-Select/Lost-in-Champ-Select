import express from 'express'
import dotenv from 'dotenv'
import {
  getMatchById,
  getLiveMatch,
  getAccountBySummonerName,
  getAccountByRiotId,
} from "../apiCalls.js";
import aramWinRates from "../models/queryChampData.js"
const router = express.Router()
dotenv.config()




router.get("/accountByRiotId", getAccountByRiotId);

router.get("/accountBySummonerName", getAccountBySummonerName);

router.get('/singleMatch/:id', getMatchById)

router.get("/liveMatch", getLiveMatch);

router.get("/aramWinRates", aramWinRates);

export default router