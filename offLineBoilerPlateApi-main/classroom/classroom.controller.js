const express = require('express');
const router = express.Router();
const authorize = require('_middleware/authorize');
const classroomService = require('./classroom.service');
const quizService = require('./quiz.service');

// Existing routes
router.post('/questions', authorize(), createQuestion);
router.get('/questions', authorize(), getQuestions);
router.post('/questions/:id/answer', authorize(), submitAnswer);

// NEW: Get answers for a specific question (for teachers/admins)
router.get('/questions/:id/answers', authorize(['Teacher', 'Admin']), getAnswers);

// NEW: Get a single question by ID
router.get('/questions/:id', authorize(), getQuestionById);
router.get('/questions/:id/my-answer', authorize(), checkMyAnswer);

// Quiz routes
router.post('/quizzes', authorize(['Teacher', 'Admin']), createQuiz);
router.get('/quizzes/:id', authorize(), getQuiz);
router.post('/quizzes/:id/answers', authorize(['Student', 'User']), submitQuizAnswers);
router.get('/quizzes/:id/results', authorize(['Teacher', 'Admin']), getQuizResults);

function checkMyAnswer(req, res, next) {
    classroomService.checkMyAnswer(req.params.id, req.user.AccountId)
        .then(result => res.json(result))
        .catch(next);
}
function createQuestion(req, res, next) {
    //console.log('Create question request body:', req.body); // Debug log
    //console.log('User ID:', req.user.AccountId); // Debug log
    
    classroomService.createQuestion(
        req.body.questionText, 
        req.user.AccountId,
        req.body.subjectId,
        req.body.dueDate,
        req.body.points,
        req.body.type,
        req.body.options
    )
        .then(question => res.json(question))
        .catch(next);
}

function getQuestions(req, res, next) {
    // Pass user ID and role to service
    classroomService.getQuestions(req.user.AccountId, req.user.role)
        .then(questions => res.json(questions))
        .catch(next);
}

function getQuestionById(req, res, next) {
    classroomService.getQuestionById(req.params.id)
        .then(question => question ? res.json(question) : res.sendStatus(404))
        .catch(next);
}

function submitAnswer(req, res, next) {
    classroomService.submitAnswer(
        req.params.id,
        req.user.AccountId,
        req.body.answerText
    )
        .then(result => res.json(result))
        .catch(next);
}

function getAnswers(req, res, next) {
    classroomService.getAnswersByQuestionId(
        req.params.id, 
        req.user.AccountId, 
        req.user.role
    )
        .then(answers => res.json(answers))
        .catch(next);
}

function createQuiz(req, res, next) {
    quizService.createQuiz(req.user.AccountId, req.body)
        .then(quiz => res.json(quiz))
        .catch(next);
}

function getQuiz(req, res, next) {
    quizService.getQuizById(req.params.id)
        .then(quiz => res.json(quiz))
        .catch(next);
}

function submitQuizAnswers(req, res, next) {
    quizService.submitQuizAnswers(req.params.id, req.user.AccountId, req.body)
        .then(result => res.json(result))
        .catch(next);
}

function getQuizResults(req, res, next) {
    quizService.getQuizResults(req.params.id)
        .then(results => res.json(results))
        .catch(next);
}

module.exports = router;