const express = require('express')
const router = express.Router()
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage })

const extractPDFController = require('../Controllers/extractPDFController')

router.post('/extract', upload.fields([{ name: 'questions', maxCount: 1 }, { name: 'answers', maxCount: 1 }]), extractPDFController.extractPDF)



module.exports = router