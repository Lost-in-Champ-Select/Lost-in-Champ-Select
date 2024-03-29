const express = require('express')
const cors = require('cors')
const path = require('path')
const app = express()
const port = 3000
const routes = require('./routes/routes.js')

app.use(express.json());
app.use(express.static("public"));
app.use('/api', routes)

app.listen(port, () => {
  console.log(`live on port ${port}`)
})