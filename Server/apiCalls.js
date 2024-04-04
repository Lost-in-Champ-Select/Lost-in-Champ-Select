import process from "process";
import dotenv from "dotenv";
dotenv.config();
const riotKey = process.env.RIOT_KEY;
// import fetch from 'node-fetch'

const apiCalls = {
  getMatchById: async (req, res) => {

    try {
      const matchId = req.params.id;
      const  data  = await fetch(
        `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${riotKey}`
      );
      const data2 = await data.json();
      //console.log('data2::', data2);
      //data2.info has all the match
      return data2
      //res.send(data2);
    } catch (err) {
      console.log(`error getting match: ${err}`)
    }
  },
  getLiveMatch: async (req, res) => {
    let sumId = req.params.sumId;
    let region = req.params.region;
    let data;
    try {
      let { data } = await fetch(
        `https://${region}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${sumId}?api_key=${riotKey}`
      );
      res.send(data);
    } catch (err) {
      console.log("error no live match");
      data = "Summoner is not currently in a game";
    } finally {
      res.send(data);
    }
  },
  getAccountBySummonerName: async (req, res) => {
    let summoner = req.params.name;
    let region = req.params.region;
    let { data } = await fetch(
      `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summoner}?api_key=${riotKey}`
    );
    res.send(data);
  },
  getAccountByRiotId: async (req, res) => {
    let summoner = req.params.name;
    let tag = req.params.tag;
    const { data } = await fetch(
      `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summoner}/${tag}?api_key=${riotKey}`
    );
    res.send(data);
  },
};

export default apiCalls;
