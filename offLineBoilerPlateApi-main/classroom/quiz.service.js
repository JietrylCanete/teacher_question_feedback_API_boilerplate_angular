const db = require('_helpers/db');

module.exports = {
    createQuiz,
    getQuizById,
    submitQuizAnswers
};

async function createQuiz(teacherId, quizData) {
    const { subjectId, title, description, questions } = quizData;

    if (!subjectId) throw new Error('subjectId is required');
    if (!title) throw new Error('title is required');
    if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('At least one question is required');
    }

    // Create quiz
    const quiz = await db.Quiz.create({
        subjectId,
        title,
        description: description || null,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    let totalPoints = 0;

    // Create questions linked to this quiz
    for (const q of questions) {
        if (!q.questionText) continue;
        const options = Array.isArray(q.options) ? q.options.filter(o => !!o) : [];
        const points = q.points || 1;
        totalPoints += points;

        const questionData = {
            quizId: quiz.quizId,
            subjectId,
            teacherId,
            questionText: q.questionText,
            type: 'MCQ',
            options: options.length ? JSON.stringify(options) : null,
            correctAnswer: q.correctAnswer || null,
            points,
            createdAt: new Date()
        };

        await db.Question.create(questionData);
    }

    // Update quiz with totalPoints
    quiz.totalPoints = totalPoints;
    await quiz.save();

    return getQuizById(quiz.quizId);
}

async function getQuizById(quizId) {
    const quiz = await db.Quiz.findByPk(quizId, {
        include: [{
            model: db.Question,
            order: [['questionId', 'ASC']]
        }]
    });

    if (!quiz) {
        throw new Error('Quiz not found');
    }

    const quizData = quiz.toJSON();
    if (quizData.Questions) {
        quizData.questions = quizData.Questions.map(q => {
            const question = q;
            if (question.options && typeof question.options === 'string') {
                try {
                    question.options = JSON.parse(question.options);
                } catch {
                    // keep raw
                }
            }
            return question;
        });
        delete quizData.Questions;
    }

    return quizData;
}

async function submitQuizAnswers(quizId, studentId, payload) {
    const quiz = await db.Quiz.findByPk(quizId, {
        include: [db.Question]
    });

    if (!quiz) {
        throw new Error('Quiz not found');
    }

    const questions = quiz.Questions || [];
    if (!Array.isArray(payload.answers)) {
        throw new Error('answers must be an array');
    }

    const answersByQuestionId = new Map();
    for (const a of payload.answers) {
        if (!a.questionId) continue;
        answersByQuestionId.set(a.questionId, a.answerText);
    }

    let totalScore = 0;
    let maxScore = 0;
    const results = [];

    for (const question of questions) {
        const q = question.toJSON();
        const userAnswer = answersByQuestionId.get(q.questionId);
        const points = q.points || 1;
        maxScore += points;

        if (!userAnswer) {
            results.push({
                questionId: q.questionId,
                correct: false,
                pointsEarned: 0,
                pointsPossible: points
            });
            continue;
        }

        // Save answer
        const isCorrect = q.correctAnswer != null &&
            String(userAnswer).trim() === String(q.correctAnswer).trim();

        const score = isCorrect ? points : 0;
        totalScore += score;

        await db.Answer.create({
            questionId: q.questionId,
            studentId,
            answerText: userAnswer,
            score,
            submittedAt: new Date()
        });

        results.push({
            questionId: q.questionId,
            correct: isCorrect,
            pointsEarned: score,
            pointsPossible: points
        });
    }

    return {
        quizId,
        studentId,
        totalScore,
        maxScore,
        results
    };
}

