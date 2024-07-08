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

function checkMainQuestionIdentifier(mainQuestionIdentifier) {
    const containsNumbers = /\d/.test(mainQuestionIdentifier);
    const containsAlphabets = /[a-zA-Z]/.test(mainQuestionIdentifier);

    if (containsNumbers && containsAlphabets) {
        return "The string contains both numbers and alphabets.";
    } else if (containsNumbers) {
        return "The string contains numbers.";
    } else if (containsAlphabets) {
        return "The string contains alphabets.";
    } else {
        return "The string does not contain numbers or alphabets.";
    }
}

const cleanText = (text) => text.replace(/\s+/g, ' ').trim();

const extractStructuredQuestions = (text) => {
   // Regex for main questions (any identifier followed by a period)
   const mainQuestionPattern = /^\s*([a-zA-Z0-9]+)\.*(.+?)(?=\n\s*([a-zA-Z0-9]+)\.|\n*$)/gms;

   // Regex for sub-questions (based on the main question identifier type)
   const subQuestionPattern = (identifier) => {
       const isAlpha = /^[a-zA-Z]+$/.test(identifier);
       return new RegExp(`^\\s*(${isAlpha ? '\\d+' : '[a-zA-Z]'})\\.\\s*(.+)$`, 'gm');
   };

    let questions = [];
    let mainMatch;
    let previousQuestionIdentifierType
    let subQuestionIdentifierType

    while ((mainMatch = mainQuestionPattern.exec(text)) !== null) {
        console.log('mainMatch',mainMatch)
        const mainQuestionIdentifier = cleanText(mainMatch[1]);
        const mainQuestionText = cleanText(mainMatch[0]);
        console.log('mainQuestionIdentifier',mainQuestionIdentifier)
        console.log('mainQuestionText',mainQuestionText)

        let mainQuestion = { main: mainQuestionText, subQuestions: [] };

        if(questions.length > 1 && previousQuestionIdentifierType !== subQuestionIdentifierType){
            console.log('type QM :',checkMainQuestionIdentifier(subQuestionIdentifierType))
            console.log('type PQM :',previousQuestionIdentifierType)
            const typeOfMainQuestionIdentifier = checkMainQuestionIdentifier(mainQuestionIdentifier)
            if(typeOfMainQuestionIdentifier !== previousQuestionIdentifierType){
                const subPattern = subQuestionPattern(mainQuestionIdentifier);
                const subText = text.substring(mainMatch.index + mainMatch[0].length, );

                while ((subMatch = subPattern.exec(subText)) !== null) {
                    const subQuestionText = cleanText(subMatch[0]);
                    const subQuestionIdentifier = cleanText(subMatch[1]);
                    mainQuestion.subQuestions.push(subQuestionText);
                    console.log('subText',subQuestionText)
                    subQuestionIdentifierType = checkMainQuestionIdentifier(subQuestionIdentifier)
                }
            }
        }
        previousQuestionIdentifierType = checkMainQuestionIdentifier(mainQuestionIdentifier)

        // let subMatch;
        // const subPattern = subQuestionPattern(mainQuestionIdentifier);
        // const subText = text.substring(mainMatch.index + mainMatch[0].length, mainQuestionPattern.lastIndex);
        // console.log('subPattern',subPattern)
        // console.log('subText',subText)
        // console.log(mainMatch.index + mainMatch[0].length)
        // console.log(mainQuestionPattern.lastIndex)
        // console.log('input :',mainMatch.input)
        // console.log('input :',mainMatch.input[mainQuestionPattern.lastIndex])
        // console.log('input:',mainMatch.input[mainMatch.index+4])


        // while ((subMatch = subPattern.exec(subText)) !== null) {
        //     const subQuestionText = cleanText(subMatch[2]);
        //     mainQuestion.subQuestions.push(subQuestionText);
        // console.log('subText',subQuestionText)
        // }

        questions.push(mainQuestion);
    }

    return questions;
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