import express from 'express'
const app = express()
const port = 4000
import routes from './routes/routes.js'
import dotenv from 'dotenv'
const cors = require("cors");

dotenv.config()

app.use(
  cors({
    origin: "https://lostinchampselect.com/",
  })
);
app.use(express.json());
app.use(express.static("build"));
app.use('/', routes)

app.listen(port, () => {
  console.log(`live on port ${port}`)
})


