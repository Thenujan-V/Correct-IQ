const express = require('express')
const router = express.Router()

const checkAnswersController = require('../Controllers/CheckTextAnswersController')

router.post('/check-answers', checkAnswersController.checkAnswers)



module.exports = router