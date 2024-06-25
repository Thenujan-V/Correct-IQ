const openAiModel = require('../Models/OpenAiModel')

exports.checkAnswers = (req, res) => {
    try{
        const result = openAiModel.gptCheck(req.body)
        return res.status(200).json({Correct : result})
    }
    catch(error){
        return res.status(500).json({
            error : "Internal Server Error",
            detail : error.message
        })
    }
}