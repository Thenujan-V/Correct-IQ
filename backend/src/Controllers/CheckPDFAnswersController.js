const e = require('express');
const openAiModel = require('../Models/OpenAiModel')
const pdf = require('pdf-parse');


exports.checkAnswers = async(req, res) => {
    try{
        const dataBuffer = req.file.buffer;
        const data = await pdf(dataBuffer);
        let text = data.text;
        text = text.replace(/(\r\n|\n|\r)/gm, ' ')


        // const qaPattern = /(?:[Qq]\d+[\.\)\-]|\d+[\.\)\-])\s*(.*?)\s+(?:ANS\)|ANS:|ANSWER\)|ANSWER:|ANSWERS\)|ANSWERS:|ans:|ans\)|ANS-|ans-|ANS |ans )\s*([\s\S]*?)(?=(?:[Qq]\d+[\.\)\-]|\d+[\.\)\-]|$))/gi;
        const qaPattern = /(?:[Qq]\d+[\.\)\-]|\d+[\.\)\-])\s*(.*?)\s+(?:ANS(?:WER)?[):\-\s]*)\s*([\s\S]*?)(?=(?:[Qq]\d+[\.\)\-]|\d+[\.\)\-]|$))/gi;
        const questionAnswerPairs = [];

        let match;
        while ((match = qaPattern.exec(text)) !== null) {
            const question = match[1].trim();
            const answer = match[2].trim();
            questionAnswerPairs.push({ question, answer });
        }
        console.log('match :', questionAnswerPairs)

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