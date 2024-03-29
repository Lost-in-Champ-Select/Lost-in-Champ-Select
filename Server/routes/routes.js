const router = require('express').Router()
require('dotenv').config()
const riotKey = process.env.RIOT_KEY


router.get('/accountByRiotId', async (req, res) => {
  let summoner = req.query.name;
  let tag = req.query.tag;
  const { data } = await fetch(`https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${sum}/${tag}?api_key=${riotKey}`)
  res.send(data)
})

module.exports = router;