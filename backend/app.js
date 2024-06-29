const express = require('express')
const path = require('path')
const body_parser = require('body-parser')
const cors = require('cors')


const app = express()
const port = 4000

app.use(body_parser.json())
app.use(cors())

const checkAnswersRouter = require('./src/Routers/CheckTextAnswers')
const checkPDFAnswersRouter = require('./src/Routers/CheckPDFAnswers')
const extractPDFRouterRouter = require('./src/Routers/extractPDFRouter')

app.use('/api/text-answers',checkAnswersRouter)
app.use('/api/pdf-answers',checkPDFAnswersRouter)
app.use('/api/extract-pdf',extractPDFRouterRouter)

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`)
})
