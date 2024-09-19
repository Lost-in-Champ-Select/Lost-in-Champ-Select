import express from 'express'
const app = express()
const port = 4000
import routes from './routes/routes.js'
import dotenv from 'dotenv'
import cors from "cors";
import path from "path";
dotenv.config()

app.use(
  cors({
    origin: "https://lostinchampselect.com",
  })
);
app.use(express.json());

app.use("/docs", express.static("docs"));
app.get("/riot.txt", (req, res) => {
  res.sendFile(path.resolve("docs", "riot.txt"));
});
app.use(express.static("build"));

app.use('/', routes)

app.listen(port, () => {
  console.log(`live on port ${port}`)
})


// https://api.lostinchampselect.com/account-by-summoner-name?name=juxx&region=americas&tag=na1