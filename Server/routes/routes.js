import express from 'express'
import dotenv from 'dotenv'
import apiCalls from '../apiCalls'

const router = express.Router()
dotenv.config()




router.get('/accountByRiotId', apiCalls.getAccountByRiotId)

router.get('/accountBySummonerName', apiCalls.getAccountBySummonerName)

router.get('/singleMatch', apiCalls.getMatchById)

router.get('/liveMatch', apiCalls.getLiveMatch)

export default router