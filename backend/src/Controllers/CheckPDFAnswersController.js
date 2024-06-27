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
        console.log('pair :',answerStatus)

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
            console.log(`Q${i + 1}: ${questionAnswerPairs[i].question}`);
            console.log(`ANS: ${questionAnswerPairs[i].answer}\n`);

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

        // const result = await openAiModel.gptGetQuetionsAndAnswers(text)
    	// console.log("result : ",result)

        const result = `QUESTION: State four reasons why computers are used? - ANSWER: Computers are more accurate and faster than humans. They can store a lot of data in a small space. They can work for long periods without taking a break for weekends and holidays. They can connect us to a vast amount of information through the internet, allowing us to communicate easily with people around the world.
QUESTION: List three ways technology has enhanced productivity at the workplace? - ANSWER: Goods can be produced faster through the use of computer-aided design (CAD) and manufacturing. The use of the internet may help to bring in more sales. The use of the internet may also enable faster distribution and better after-sales service.
QUESTION: Describe an example of how you use technology to assist with your studies? - ANSWER: An example of how a student can use technology to assist with studies: Use social media to link up with a study group in which students ask and answer one another’s difficult questions. (There are other possible answers; accept any that are sensible.)
QUESTION: Using examples, explain the difference between 'data' and 'information'? - ANSWER: Data: all the raw facts and figures that a computer processes; for example, data could be a list of the favourite colour of 11 students: red, blue, yellow, blue, green, blue, red, yellow, blue, red, blue. Information is organised data that brings out meaning and is produced when data is processed to give meaning. For example, if you were to count and tabulate the number of each colour of the data, then you would get information such as: The most popular colour is blue. (Five students said 'blue'.) and The least favourite colour in the list is green. (Only one student said 'green'.)
QUESTION: Explain why it is necessary to use cable ties to keep your cables and cords organized? - ANSWER: Use cable ties to organise cords and cables, as jumbled cords can be easily damaged if they are twisted or tugged.
QUESTION: List three common types of computer cable? - ANSWER: Data cable, wired cable, computer cable
QUESTION: One of the largest volcanos in our solar system, if not the largest, is named Olympus Mons. Name the planet which has the volcano? - ANSWER: JUPITER
QUESTION: What is a Time of Use Rate of electric vehicles (TOU)? - ANSWER: A rate offered by some utilities that’s based on the length of time an electric vehicle is charging
QUESTION: What is the best-selling EV model in Minnesota? - ANSWER: Tesla Model S`

        const extractResult = extractQuestionsAnswers(result)
        return res.status(200).send({extractResult})

    }
    catch(error){
        return res.status(500).json({
            error : "Internal Server Error",
            detail : error.message
        })
    }
}