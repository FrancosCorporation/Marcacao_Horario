const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3000

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
require('./controller/authController')(app)

app.listen(port,() => {
  console.log("Listeing in http://localhost:"+port)
})