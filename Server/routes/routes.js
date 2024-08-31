import express from 'express'
import dotenv from 'dotenv'

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



export default router