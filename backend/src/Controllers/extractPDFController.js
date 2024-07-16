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
            text = text.replace(/(\r\n|\n|\r)/gm, ' ')

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
let mainQuestionIdentfierType
let index = 0
let extractQuestionsFromText = []
let mainQuestionNumber

const extractStructuredQuestions = (text) => {
    const regex = /(\d+|[a-zA-Z])[\.\-\)]\s*(.*?)(?=\d+[\.\-\)]\s*|\b[a-zA-Z][\.\-\)]\s*|$)/gs;

    function extractMainQuestions(text) {
        const matches = [...text.matchAll(regex)]
        mainQuestionIdentfierType = checkMainQuestionIdentifier(matches[0][1])

        const questions = matches.map(match => match[0].trim())
        // console.log('questions : ', questions)

        while(matches[index] !== undefined){
            // console.log(matches[index][1])
            const questionIdentifier = checkMainQuestionIdentifier(matches[index][1])
            if(mainQuestionIdentfierType === questionIdentifier){
                if(matches[index][0] !== null){
                    extractQuestionsFromText[index] = matches[index][0]
                }
                // console.log('aaa :', extractQuestionsFromText[index])
                mainQuestionNumber = index
            }
            else{
                if(matches[index][0] !== null){
                    extractQuestionsFromText[mainQuestionNumber] += ' ' + matches[index][0] 
                }
            }
            
            index++
        }
        const newExtractQuestionsFromText = extractQuestionsFromText.filter(value => value !== null)
        return newExtractQuestionsFromText
    }
    
    const mainQuestions = extractMainQuestions(text)
    // return mainQuestions

    const extractSubQuestions = (mainQuestions) => {
        let index = 0
        let firstMainQuestionIdentfierType
        let QuestionWithSubQuestions = []
        let QuestionIdentfierType

        while(mainQuestions[index] !== undefined){            
            const mainQuestionsMatches = [...mainQuestions[index].matchAll(regex)]
            // console.log('ques :', mainQuestionsMatches) 

            firstMainQuestionIdentfierType = checkMainQuestionIdentifier(mainQuestionsMatches[0][1])

            QuestionIdentfierType = checkMainQuestionIdentifier(mainQuestionsMatches[0][1])

            const questions = mainQuestionsMatches.map(match => match[0].trim())
            // console.log('question :', questions)
            if(firstMainQuestionIdentfierType === QuestionIdentfierType){
                // QuestionWithSubQuestions[index].push({
                //     mainQuestion : questions
                // })
            console.log('ques :', questions) 

            }
            else{
            console.log('quess :', questions) 

                // QuestionWithSubQuestions[index].subQuestions = questions 
            }
            
            index++
            // console.log('index :', index) 

        }
    }

    const subQuestions = extractSubQuestions(mainQuestions)

}

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