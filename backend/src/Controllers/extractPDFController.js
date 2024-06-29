const express = require('express');
const openAiModel = require('../Models/OpenAiModel')
const pdf = require('pdf-parse');

const extractTextsFromPDF = async(file) => {
    try{
        if (!file || !file.buffer) {
            throw new Error('No file uploaded or file is empty');
        }
        else{    
            const dataBuffer = file.buffer
            const data = await pdf(dataBuffer)
            let text = data.text
            // text = text.replace(/(\r\n|\n|\r)/gm, ' ')

            return text
        }
        
    }
    catch(error){
        return {
                status : 500,
                error : 'Internal Server Error',
                detail : error.message
        }   
    }
}

// Function to extract structured questions
const extractStructuredQuestions = (text) => {
    const questionPattern = /^[0-9a-zA-Z]+\.+.*?(?=(^[0-9a-zA-Z]+\.\s+|$))/gms;
    const subQuestionPattern = /^[a-c]\.\s+.*?(?=(^[a-c]\.\s+|^[0-9a-zA-Z]+\.\s+|$))/gms;

    let questions = [];
    let match;

    // Match main questions and headings
    while ((match = questionPattern.exec(text)) !== null) {
        console.log(match[0])
        const questionText = match[0];
        const subMatches = questionText.match(subQuestionPattern);
        let question = {
            main: questionText.split('\n')[0].trim(),
            subQuestions: subMatches ? subMatches.map(sub => sub.trim()) : []
        };
        questions.push(question);
    }

    // Clean up uploaded file
    // fs.unlinkSync(path.join(__dirname, req.file.path));

    return questions
};


exports.extractPDF = async (req, res) => {
    try{
        const questionsFile = req.files['questions'] ? req.files['questions'][0] : null;
        const answersFile = req.files['answers'] ? req.files['answers'][0] : null;
        if (!questionsFile || !answersFile) {
            return res.status(400).send('Both question and answer files must be uploaded.');
        }
        else{
            const extractQuestions = await extractTextsFromPDF(questionsFile)
            const extractAnswers = await extractTextsFromPDF(answersFile)

            const questionMatches = extractStructuredQuestions(extractQuestions)


            return res.status(200).json({
                questions : questionMatches,
                // answers : extractAnswers
            })
        }
    }
    catch(error){
        return res.status(500).json({
            error : 'Internal Server Error',
            detail : error.message
        })
    }
}