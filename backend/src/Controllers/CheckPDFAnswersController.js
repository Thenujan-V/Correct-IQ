const express = require('express');
const openAiModel = require('../Models/OpenAiModel')
const pdf = require('pdf-parse');

const sendPairToOpenAi = async(pair, index) => {
    try{
        const result = await openAiModel.gptCheck(pair)
        if(result === null){
            return {
                status : 404,
                json : {
                    error : "Result not found"
                }
            }
        }
        return {
                Question : `Q${index + 1}: ${pair.question}`,
                Answer : `Answer: ${pair.answer}`,
                Status : result
        }
    }
    catch(error){
        throw error
    }
}
 
const extractQuestionsAnswers = (text) => {
    const pairs = text.split("\nQUESTION: ")
    const data = []

    pairs.forEach(pair => {
        const parts = pair.split(" - ANSWER: ")
        if (parts.length === 2) {
            const question = parts[0].trim()
            const answerStatus = parts[1].split(" - STATUS: ")

            if (answerStatus.length === 1) {
                const answer = answerStatus[0].trim()
                data.push({ question, answer})
            }
        }
    });

    return data;
}

exports.checkAnswers = async(req, res) => {
    try{
        if (!req.file || !req.file.buffer) {
            throw new Error('No file uploaded or file is empty');
        }

        const dataBuffer = req.file.buffer;
        const data = await pdf(dataBuffer);
        let text = data.text;
        text = text.replace(/(\r\n|\n|\r)/gm, ' ')


        const qaPattern = /(?:[Qq]\d+[\.\)\-]|[IVXLCDMivxlcdm]+\.[\)\-]|\d+[\.\)\-])\s*(.*?)\s*\?\s*([\s\S]*?)(?=(?:[Qq]\d+[\.\)\-]|[IVXLCDMivxlcdm]+\.[\)\-]|\d+[\.\)\-]|$))/gi;
        const questionAnswerPairs = [];
        let match;
        while ((match = qaPattern.exec(text)) !== null) {
            const question = match[1].trim();
            const answer = match[2].trim();
            questionAnswerPairs.push({ question, answer });
        }

        console.log("Question and Answer Pairs:");
        const resultSet = []
        for(let i = 0; i < questionAnswerPairs.length; i++){
            // console.log(`Q${i + 1}: ${questionAnswerPairs[i].question}`);
            // console.log(`ANS: ${questionAnswerPairs[i].answer}\n`);

            const result = await sendPairToOpenAi(questionAnswerPairs[i], i)
            resultSet.push(result)   
        }

        return res.status(200).send({resultSet})
        // return res.status(200).send({text})
    }
    catch(error){
        return res.status(500).json({
            error : "Internal Server Error",
            detail : error.message
        })
    }
}

exports.unFormatePDFCheck = async (req, res) => {
    try{
        if (!req.file || !req.file.buffer) {
            throw new Error('No file uploaded or file is empty');
        }
        const buffer = req.file.buffer
        const data = await pdf(buffer)
        let text = data.text
        text = text.replace(/(\r\n|\n|\r)/gm, ' ')

        const result = await openAiModel.gptGetQuetionsAndAnswers(text)
    	// console.log("result : ",result)

        const extractResult = extractQuestionsAnswers(result)
        const resultSet = []

        for(let index = 0; index < extractResult.length; index++){
            const sendToAi = await sendPairToOpenAi(extractResult[index], index)
            resultSet.push(sendToAi)
        }
        return res.status(200).send({resultSet})

    }
    catch(error){
        return res.status(500).json({
            error : "Internal Server Error",
            detail : error.message
        })
    }
}