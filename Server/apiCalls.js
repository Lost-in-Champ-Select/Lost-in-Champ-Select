import process from "process";
const riotKey = process.env.RIOT_KEY;

const apiCalls = {
  getMatchById: async (req, res) => {
    try {
      const matchId = req.query.id;
      const { data } = await fetch(
        `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${riotKey}`
      );
      res.send(data);
    } catch (err) {
      throw new Error("error getting match");
    }
  },
  getLiveMatch: async (req, res) => {
    let sumId = req.query.sumId;
    let region = req.query.region;
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
    let summoner = req.query.name;
    let region = req.query.region;
    let { data } = await fetch(
      `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summoner}?api_key=${riotKey}`
    );
    res.send(data);
  },
  getAccountByRiotId: async (req, res) => {
    let summoner = req.query.name;
    let tag = req.query.tag;
    const { data } = await fetch(
      `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summoner}/${tag}?api_key=${riotKey}`
    );
    res.send(data);
  },
};

export default apiCalls;
