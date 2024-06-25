const express = require('express')
const path = require('path')
const body_parser = require('body-parser')
const cors = require('cors')

const app = express()
const port = 4000

app.use(body_parser.json())
app.use(cors())

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`)
})
