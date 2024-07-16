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
    const containsSmallLetters = /[a-z]/.test(mainQuestionIdentifier);
    const containsBlockLetters = /[A-Z]/.test(mainQuestionIdentifier);
    const romanNumeralPattern = /^(?=[MDCLXVI])M*(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})$/;
    const containsRomanNumerals = romanNumeralPattern.test(mainQuestionIdentifier);

    if (containsNumbers && containsSmallLetters && containsBlockLetters) {
        return "The string contains numbers, small letters, and block letters.";
    } else if (containsNumbers && containsSmallLetters) {
        return "The string contains numbers and small letters.";
    } else if (containsNumbers && containsBlockLetters) {
        return "The string contains numbers and block letters.";
    } else if (containsSmallLetters && containsBlockLetters) {
        return "The string contains small letters and block letters.";
    } else if (containsNumbers) {
        return "The string contains numbers.";
    } else if (containsSmallLetters) {
        return "The string contains small letters.";
    } else if (containsBlockLetters) {
        return "The string contains block letters.";
    } else if (containsRomanNumerals) {
        return "The string contains Roman numerals.";
    } else {
        return "The string does not contain numbers, letters, or Roman numerals.";
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
        let lastIndex

        while(mainQuestions[index] !== undefined){            
            const mainQuestionsMatches = [...mainQuestions[index].matchAll(regex)]
            // console.log('ques :', mainQuestionsMatches) 

            firstMainQuestionIdentfierType = checkMainQuestionIdentifier(mainQuestionsMatches[0][1])

            const questions = mainQuestionsMatches.map(match => match[0].trim())
            // console.log('question :', questions)
            // console.log('firstMainQuestionIdentfierType :', firstMainQuestionIdentfierType)
             
            let questionIndex = 0

            while(questions[questionIndex] !== undefined){
                const subQuestionsMatches = [...questions[questionIndex].matchAll(regex)]
                QuestionIdentfierType = checkMainQuestionIdentifier(subQuestionsMatches[0][1])
                // console.log('QuestionIdentfierType :', QuestionIdentfierType)
                // console.log('subQuestionsMatches :', subQuestionsMatches)
                if(firstMainQuestionIdentfierType === QuestionIdentfierType){
                    QuestionWithSubQuestions[index] = {
                        mainQuestion : subQuestionsMatches[0][0],
                        subQuestions : []
                    }
                    lastIndex = index
                    // console.log('mainques :', subQuestionsMatches[0][0]) 
                }
                else{
                    // console.log('subquess :', subQuestionsMatches[0][0]) 
                    QuestionWithSubQuestions[lastIndex].subQuestions.push(subQuestionsMatches[0][0])
                    // extractSubQuestions(subQuestionsMatches[0][0])
                }
                questionIndex++

            }
            index++

        }
        // console.log('QuestionWithSubQuestions :', QuestionWithSubQuestions)
        return QuestionWithSubQuestions
    }

    const subQuestions = extractSubQuestions(mainQuestions)
    return subQuestions

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