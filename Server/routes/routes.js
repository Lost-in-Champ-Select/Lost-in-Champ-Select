import express from 'express'
import dotenv from 'dotenv'
import process from 'process'

const router = express.Router()
dotenv.config()
const riotKey = process.env.RIOT_KEY


router.get('/accountByRiotId', async (req, res) => {
  let summoner = req.query.name;
  let tag = req.query.tag;
  const { data } = await fetch(`https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summoner}/${tag}?api_key=${riotKey}`)
  res.send(data)
})

router.get('/accountBySummonerName', async (req, res) => {
  let summoner = req.query.name;
  let region = req.query.region;
  let { data } = await fetch(
    `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summoner}?api_key=${riotKey}`
  );
  res.send(data);
})

router.get('/singleMatch', async (req, res) => {
  let matchId = req.query.id;
  let { data } = await fetch(
    `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${riotKey}`
  );
  res.send(data)
})

router.get('/liveMatch', async (req, res) => {
  let sumId = req.query.sumId;
  let region = req.query.region;
  let data;
  try {
    let { data } = await fetch(`https://${region}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${sumId}?api_key=${riotKey}`)
    res.send(data)
  } catch (err) {
    console.log('error no live match')
    data = 'Summoner is not currently in a game'
  } finally {
    res.send(data)
  }
})

export default router;