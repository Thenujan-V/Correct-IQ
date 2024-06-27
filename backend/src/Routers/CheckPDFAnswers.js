const express = require('express')
const router = express.Router()
const multer = require('multer');

const upload = multer();


const checkPDFAnswersController = require('../Controllers/CheckPDFAnswersController')

router.post('/check-answers', upload.single('file'), checkPDFAnswersController.checkAnswers)
router.post('/check-unformat-pdf', upload.single('file'), checkPDFAnswersController.unFormatePDFCheck)



module.exports = router