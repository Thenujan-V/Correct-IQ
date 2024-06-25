const OpenAI = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

exports.checkAnswers = async (req, res) => {
    const {question, answer} = req.body
    console.log('question :', question)
    console.log('answers :', answer)
    

    try{
        const prompt = `Question: ${question}\nStudent's Answer: ${answer}\nIs this answer correct? (only say yes or no don't need to explanations)`;
        
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-3.5-turbo-16k",
          })

        const isCorrect =  completion.choices[0].message.content.trim().toLowerCase().includes('yes')
        if(!isCorrect){
            return res.status(500).json({
                error : 'Internal server error',
                detail : error.message
            })
        }
        return res.status(200).json({Correct : isCorrect})
        
    }
    catch(error){
        return res.status(500).json({
            error : 'Internal server error',
            detail : error.message
        })
    }
}