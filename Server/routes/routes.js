import express from 'express'
import dotenv from 'dotenv'
import {
  getMatchById,
  getLiveMatch,
  getAccountBySummonerName,
  getAccountByRiotId,
} from "../apiCalls.js";
import aramWinRates from "../models/queryChampData.js";



const router = express.Router()
dotenv.config()


router.get("/account-by-riot-id", getAccountByRiotId);

router.get("/account-by-summonerName", getAccountBySummonerName);

router.get('/single-match/:id', getMatchById)

router.get("/live-match", getLiveMatch);

router.get("/aram-win-rates", aramWinRates);

export default router