const e = require('express');
const openAiModel = require('../Models/OpenAiModel')
const pdf = require('pdf-parse');

const extractQuestionsAnswers = (text) => {
    try{
        const questionPattern = /.*?\?/g
        const answerPattern = /(ans\))\s*(.*?)(?=(\s*\d+\.|$))/gi

        const questions = text.match(questionPattern);
        console.log("Questions:");
        if (questions) {
            questions.forEach(question => {
                console.log(question.trim());
            });
        }

        const answers = [];
        let match;
        while ((match = answerPattern.exec(text)) !== null) {
            answers.push(match[2]);
        }

        console.log("\nAnswers:");
        answers.forEach(answer => {
            console.log('answer :',answer.trim());
        });
        
    }
    catch(error){
        throw error
    }
}

exports.checkAnswers = async(req, res) => {
    try{
        const dataBuffer = req.file.buffer;
        const data = await pdf(dataBuffer);
        let text = data.text;

        const qaPattern = /Q\d+\.\s*(.*?)\s+ANS\)\s*(.*)/gs
        const questionAnswerPairs = [];

        let match;
        while ((match = qaPattern.exec(text)) !== null) {
            const question = match[1].trim();
            const answer = match[2].trim();
            questionAnswerPairs.push({ question, answer });
        }

        console.log("Question and Answer Pairs:");
        questionAnswerPairs.forEach((pair, index) => {
            console.log(`Q${index + 1}: ${pair.question}`);
            console.log(`ANS: ${pair.answer}\n`);
        });

        return res.status(200).json({Correct : text})
    }
    catch(error){
        return res.status(500).json({
            error : "Internal Server Error",
            detail : error.message
        })
    }
}