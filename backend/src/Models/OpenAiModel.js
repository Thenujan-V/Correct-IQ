const OpenAI = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

openai.gptCheck = async(dataToCheck, res) => {
    const {question, answer} = dataToCheck
    try{
        const prompt = `Question: ${question}\nStudent's Answer: ${answer}\nIs this answer correct? (only say yes or no don't need to explanations and do not want to check grammar)`;
        
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-3.5-turbo-16k",
          })

        const isCorrect =  completion.choices[0].message.content.trim().toLowerCase().includes('yes')
        if(isCorrect === 'undefined'){
            return res.status(500).json({
                error : 'Internal server error',
                detail: 'isCorrect is not defined'
            })
        }           
        return isCorrect
    }
    catch(error){
        throw error
    }
}

module.exports = openai