const express = require('express');
const router = express.Router();
const authorize = require('_middleware/authorize');
const subjectService = require('./subject.service');

// Subject routes
router.post('/', authorize(['Teacher', 'Admin']), createSubject);
router.get('/', authorize(), getSubjects);
router.get('/my-subjects', authorize(), getMySubjects);
router.get('/:subjectId', authorize(), getSubjectById);
router.put('/:subjectId', authorize(['Teacher', 'Admin']), updateSubject);
router.delete('/:subjectId', authorize(['Teacher', 'Admin']), deleteSubject);

// Enrollment routes
router.post('/:subjectId/enroll', authorize(['Student', 'User']), enrollStudent);
router.post('/:subjectId/students', authorize(['Teacher', 'Admin']), addStudent);
router.delete('/:subjectId/students/:studentId', authorize(['Teacher', 'Admin']), removeStudent);
router.get('/:subjectId/students', authorize(['Teacher', 'Admin']), getSubjectStudents);

// Subject questions
router.get('/:subjectId/questions', authorize(), getSubjectQuestions);

// Teacher approval routes
router.get('/:subjectId/pending-students', authorize(['Teacher', 'Admin']), getPendingStudents);
router.put('/:subjectId/approve/:studentId', authorize(['Teacher', 'Admin']), approveStudent);
router.put('/:subjectId/reject/:studentId', authorize(['Teacher', 'Admin']), rejectStudent);

module.exports = router;

// Controller functions
function getSubjects(req, res, next) {
    //console.log('GET /subjects called');
    //console.log('User data:', req.user);
    
    subjectService.getAll(req.user.AccountId, req.user.role)
        .then(subjects => {
            //console.log(`Successfully fetched ${subjects.length} subjects`);
            res.json(subjects);
        })
        .catch(error => {
            //console.error('Error in getSubjects:', error);
            res.status(500).json({ 
                message: error.message || 'Failed to fetch subjects',
                error: error.toString()
            });
        });
}

function getMySubjects(req, res, next) {
    //console.log('GET /my-subjects called');
    subjectService.getMySubjects(req.user.AccountId, req.user.role)
        .then(subjects => res.json(subjects))
        .catch(next);
}

function getSubjectById(req, res, next) {
    subjectService.getSubjectById(req.params.subjectId, req.user.AccountId, req.user.role)
        .then(subject => subject ? res.json(subject) : res.sendStatus(404))
        .catch(next);
}

function createSubject(req, res, next) {
    subjectService.createSubject({
        ...req.body,
        teacherId: req.user.AccountId
    })
        .then(subject => res.json(subject))
        .catch(next);
}

function updateSubject(req, res, next) {
    subjectService.updateSubject(req.params.subjectId, req.body)
        .then(subject => res.json(subject))
        .catch(next);
}

function deleteSubject(req, res, next) {
    subjectService.deleteSubject(req.params.subjectId)
        .then(() => res.json({ message: 'Subject deleted successfully' }))
        .catch(next);
}

function enrollStudent(req, res, next) {
    subjectService.enrollStudent(req.params.subjectId, req.user.AccountId)
        .then(() => res.json({ message: 'Successfully enrolled in subject' }))
        .catch(next);
}

function addStudent(req, res, next) {
    const { studentId } = req.body;
    subjectService.enrollStudent(req.params.subjectId, studentId)
        .then(() => res.json({ message: 'Student added to subject successfully' }))
        .catch(next);
}

function removeStudent(req, res, next) {
    subjectService.removeStudent(req.params.subjectId, req.params.studentId)
        .then(() => res.json({ message: 'Student removed from subject successfully' }))
        .catch(next);
}

function getSubjectStudents(req, res, next) {
    subjectService.getSubjectStudents(req.params.subjectId)
        .then(students => res.json(students))
        .catch(next);
}

function getSubjectQuestions(req, res, next) {
    subjectService.getSubjectQuestions(req.params.subjectId, req.user.AccountId, req.user.role)
        .then(questions => res.json(questions))
        .catch(next);
}

function getPendingStudents(req, res, next) {
    subjectService.getPendingStudents(req.params.subjectId)
        .then(students => res.json(students))
        .catch(next);
}

function approveStudent(req, res, next) {
    subjectService.approveStudent(req.params.subjectId, req.params.studentId)
        .then(() => res.json({ message: 'Student approved successfully' }))
        .catch(next);
}

function rejectStudent(req, res, next) {
    subjectService.rejectStudent(req.params.subjectId, req.params.studentId)
        .then(() => res.json({ message: 'Student rejected successfully' }))
        .catch(next);
}