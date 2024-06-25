const express = require('express')
const router = express.Router()

const checkPDFAnswersController = require('../Controllers/CheckPDFAnswersController')

router.post('/check-answers', checkPDFAnswersController.checkAnswers)



module.exports = router