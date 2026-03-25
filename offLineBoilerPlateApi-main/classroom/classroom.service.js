const db = require('_helpers/db');
const aiService = require('./ai.service');
const { Op } = require('sequelize');

module.exports = {
    createQuestion,
    getQuestions,
    getQuestionById,
    submitAnswer,
    getAnswersByQuestionId,
    checkMyAnswer
};

async function checkMyAnswer(questionId, studentId) {
    const answer = await db.Answer.findOne({
        where: {
            questionId: questionId,
            studentId: studentId
        }
    });
    
    return {
        hasAnswered: !!answer,
        answer: answer ? {
            answerId: answer.answerId,
            answerText: answer.answerText,
            submittedAt: answer.submittedAt
        } : null
    };
}

async function createQuestion(questionText, teacherId, subjectId, dueDate, points, type, options) {
    // Validate required fields
    if (!questionText) {
        throw new Error('Question text is required');
    }
    if (!teacherId) {
        throw new Error('Teacher ID is required');
    }
    if (!subjectId) {
        throw new Error('Subject ID is required');
    }

    // Fetch subject details to get subject name for AI check
    const subject = await db.Subject.findByPk(subjectId);
    if (!subject) {
        throw new Error('Subject not found');
    }

    // Prepare question data
    const questionData = { 
        questionText, 
        teacherId,
        subjectId,
        createdAt: new Date()
    };
    
    // Add optional fields
    if (dueDate) {
        questionData.dueDate = dueDate;
    }
    if (points) {
        questionData.points = points;
    }

    // Question type (default to ESSAY if not provided)
    questionData.type = type || 'ESSAY';

    // Serialize options for MCQ or other types that need them
    if (options && Array.isArray(options) && options.length > 0) {
        questionData.options = JSON.stringify(options);
    }

    // Call AI to check relevance
    let aiResult = {
        isRelevant: false,
        feedback: 'AI relevance check unavailable.'
    };
    try {
        aiResult = await aiService.checkQuestionRelevance(subject.subjectName, questionText);
        console.log('AI relevance result:', aiResult);
    } catch (err) {
        console.error('AI relevance check failed:', err);
        // Proceed without AI feedback
    }

    // Add AI results to question data
    questionData.aiRelevance = aiResult.isRelevant;
    questionData.aiFeedback = aiResult.feedback;

    console.log('Creating question with data:', questionData);
    
    const question = await db.Question.create(questionData);

    // Normalize options in returned object
    const plain = question.toJSON();
    if (plain.options) {
        try {
            plain.options = JSON.parse(plain.options);
        } catch {
            // leave as-is if parsing fails
        }
    }

    return plain;
}

async function getQuestions(userId, userRole) {
    const isStudent = userRole === 'Student' || userRole === 'User';

    const whereClause = {
        quizId: { [Op.is]: null }
    };

    if (isStudent) {
        const enrollments = await db.SubjectEnrollment.findAll({
            where: { studentId: userId, status: 'active' },
            attributes: ['subjectId']
        });
        const enrolledSubjectIds = enrollments.map(e => e.subjectId);
        if (enrolledSubjectIds.length === 0) {
            return [];
        }
        whereClause.subjectId = { [Op.in]: enrolledSubjectIds };
    }

    const questions = await db.Question.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        include: [
            {
                model: db.Account,
                as: 'teacher',
                attributes: ['firstName', 'lastName', 'email']
            },
            {
                model: db.Subject,
                attributes: ['subjectId', 'subjectName', 'subjectCode']
            }
        ]
    });

    let answeredIds = [];
    if (isStudent) {
        const answeredQuestions = await db.Answer.findAll({
            where: { studentId: userId },
            attributes: ['questionId']
        });
        answeredIds = answeredQuestions.map(a => a.questionId);
    }

    return questions.map(q => {
        const question = q.toJSON();

        if (question.Subject) {
            question.subjectName = question.Subject.subjectName;
            question.subjectCode = question.Subject.subjectCode;
            delete question.Subject;
        }

        if (question.teacher) {
            question.teacherName = `${question.teacher.firstName} ${question.teacher.lastName}`;
            delete question.teacher;
        } else {
            question.teacherName = 'Unknown Teacher';
        }

        if (question.options) {
            try {
                question.options = JSON.parse(question.options);
            } catch {
                // keep raw value if parsing fails
            }
        }

        if (isStudent) {
            question.hasAnswered = answeredIds.includes(question.questionId);
        }

        return question;
    });
}

async function getQuestionById(questionId) {
    const question = await db.Question.findByPk(questionId, {
        include: [{
            model: db.Account,
            as: 'teacher',
            attributes: ['firstName', 'lastName', 'email']
        }]
    });
    
    if (question) {
        const questionData = question.toJSON();
        
        // Format teacher name
        if (questionData.teacher) {
            questionData.teacherName = `${questionData.teacher.firstName} ${questionData.teacher.lastName}`;
        } else {
            questionData.teacherName = 'Unknown Teacher';
        }
        
        // Parse options if present
        if (questionData.options) {
            try {
                questionData.options = JSON.parse(questionData.options);
            } catch {
                // keep raw value if parsing fails
            }
        }

        // Remove the teacher object to keep response clean
        delete questionData.teacher;
        
        return questionData;
    }
    
    return null;
}

async function submitAnswer(questionId, studentId, answerText) {
    // Check if question exists
    const question = await db.Question.findByPk(questionId);
    if (!question) {
        throw new Error('Question not found');
    }

    // Check if student has already answered this question
    const existingAnswer = await db.Answer.findOne({
        where: {
            questionId: questionId,
            studentId: studentId
        }
    });

    if (existingAnswer) {
        throw new Error('You have already answered this question. Only one answer per student is allowed.');
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

async function getAnswersByQuestionId(questionId, requestingUserId, requestingUserRole) {
    // Check if question exists
    const question = await db.Question.findByPk(questionId);
    if (!question) {
        throw new Error('Question not found');
    }

    let whereClause = { questionId };
    
    // If user is a student or regular user, only return their own answer
    if (requestingUserRole === 'Student' || requestingUserRole === 'User') {
        whereClause.studentId = requestingUserId;
    }

    // Get all answers for this question with their AI reviews and student info
    const answers = await db.Answer.findAll({
        where: whereClause,
        include: [{
            model: db.AIReview,
            required: false
        }, {
            model: db.Account,
            as: 'student',
            attributes: ['AccountId', 'firstName', 'lastName', 'email'],
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

        // Normalize student info
        if (answerData.student) {
            answerData.student = {
                AccountId: answerData.student.AccountId,
                firstName: answerData.student.firstName,
                lastName: answerData.student.lastName,
                email: answerData.student.email
            };
        }
        
        return answerData;
    });
}