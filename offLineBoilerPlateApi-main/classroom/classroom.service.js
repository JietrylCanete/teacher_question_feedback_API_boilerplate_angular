const db = require('_helpers/db');
const aiService = require('./ai.service');

module.exports = {
    createQuestion,
    getQuestions,
    getQuestionById,
    submitAnswer,
    getAnswersByQuestionId
};

async function createQuestion(questionText, teacherId) {
    return await db.Question.create({ 
        questionText, 
        teacherId,
        createdAt: new Date()
    });
}

async function getQuestions() {
    return await db.Question.findAll({ 
        order: [['createdAt', 'DESC']] 
    });
}

async function getQuestionById(questionId) {
    return await db.Question.findByPk(questionId);
}

async function submitAnswer(questionId, studentId, answerText) {
    // Check if question exists
    const question = await db.Question.findByPk(questionId);
    if (!question) {
        throw new Error('Question not found');
    }

    // Save the answer
    const answer = await db.Answer.create({
        questionId,
        studentId,
        answerText,
        submittedAt: new Date()
    });

    // Get AI review
    let aiResult = {
        isRelevant: false,
        feedback: 'AI review unavailable'
    };

    try {
        aiResult = await aiService.reviewAnswer(
            question.questionText,
            answerText
        );

        // Save AI review
        await db.AIReview.create({
            answerId: answer.answerId,
            isRelevant: aiResult.isRelevant,
            feedback: aiResult.feedback,
            reviewedAt: new Date()
        });
    } catch (err) {
        console.error('AI review failed:', err);
    }

    return {
        ...aiResult,
        answerId: answer.answerId
    };
}

async function getAnswersByQuestionId(questionId) {
    // Check if question exists
    const question = await db.Question.findByPk(questionId);
    if (!question) {
        throw new Error('Question not found');
    }

    // Get all answers for this question with their AI reviews
    const answers = await db.Answer.findAll({
        where: { questionId },
        include: [{
            model: db.AIReview,
            required: false
        }],
        order: [['submittedAt', 'DESC']]
    });

    // Format the answers
    return answers.map(answer => {
        const answerData = answer.toJSON();
        
        // Format the date
        if (answerData.submittedAt) {
            answerData.submittedAt = new Date(answerData.submittedAt).toISOString();
        }
        
        // Ensure AI review is properly formatted
        if (answerData.AIReview) {
            answerData.aiReview = answerData.AIReview;
            delete answerData.AIReview;
        }
        
        return answerData;
    });
}