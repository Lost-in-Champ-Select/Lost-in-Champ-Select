import express from 'express'
const app = express()
const port = 4000
import routes from './routes/routes.js'
import dotenv from 'dotenv'
import cors from "cors";
import path from "path";
dotenv.config()

const allowedOrigins = [
  "https://lostinchampselect.com",
  "https://www.lostinchampselect.com",
  "http://localhost:9000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(express.json());

app.use(express.static("build"));

app.use('/', routes)

app.listen(port, () => {
  console.log(`live on port ${port}`)
})


// https://api.lostinchampselect.com/account-by-summoner-name?name=juxx&region=americas&tag=na1