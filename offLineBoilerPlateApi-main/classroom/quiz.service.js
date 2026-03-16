const db = require('_helpers/db');
const aiService = require('./ai.service');

module.exports = {
    createQuiz,
    getQuizById,
    submitQuizAnswers,
    getQuizResults
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

        let options = Array.isArray(q.options) ? q.options.filter(o => !!o) : [];
        const points = q.points || 1;

        // If teacher did not provide options, use AI to generate distractors
        if (options.length === 0 && q.correctAnswer) {
            const aiOptions = await aiService.generateMcqOptions(q.questionText, q.correctAnswer);
            options = [q.correctAnswer, ...aiOptions];
        }

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

    // Prevent multiple submissions: if the student has already answered
    // any question in this quiz, block a new submission
    const quizQuestionIds = questions.map(q => q.questionId);
    const existing = await db.Answer.findOne({
        where: {
            questionId: quizQuestionIds,
            studentId
        }
    });
    if (existing) {
        throw new Error('You have already submitted this quiz.');
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

async function getQuizResults(quizId) {
    const quiz = await db.Quiz.findByPk(quizId, {
        include: [db.Question]
    });

    if (!quiz) {
        throw new Error('Quiz not found');
    }

    const questions = quiz.Questions || [];
    const questionIds = questions.map(q => q.questionId);

    const answers = await db.Answer.findAll({
        where: { questionId: questionIds },
        include: [{
            model: db.Account,
            as: 'student',
            attributes: ['AccountId', 'firstName', 'lastName', 'email']
        }],
        order: [['submittedAt', 'DESC']]
    });

    return {
        quiz: quiz.toJSON(),
        questions: questions.map(q => q.toJSON()),
        answers: answers.map(a => {
            const data = a.toJSON();
            if (data.student) {
                data.student = {
                    AccountId: data.student.AccountId,
                    firstName: data.student.firstName,
                    lastName: data.student.lastName,
                    email: data.student.email
                };
            }
            return data;
        })
    };
}

