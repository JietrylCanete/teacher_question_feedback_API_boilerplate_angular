const db = require('_helpers/db');
const { Op } = require('sequelize');

// Define all functions first
async function createSubject(params) {
    // Check if subject code already exists
    const existingSubject = await db.Subject.findOne({ 
        where: { subjectCode: params.subjectCode } 
    });
    
    if (existingSubject) {
        throw new Error(`Subject code "${params.subjectCode}" is already taken`);
    }

    const subject = new db.Subject(params);
    await subject.save();
    
    return getSubjectById(subject.subjectId);
}

async function getAll(userId, userRole) {
    try {
        //console.log('=== getAll subjects service ===');
        //console.log('Received userId:', userId, 'userRole:', userRole);
        
        // First, check if Subjects table has data
        const subjects = await db.Subject.findAll({
            include: [{
                model: db.Account,
                as: 'teacher',
                attributes: ['AccountId', 'firstName', 'lastName', 'email']
            }],
            order: [['createdAt', 'DESC']]
        });

        //console.log(`Found ${subjects.length} total subjects in database`);
        
        if (subjects.length === 0) {
            //console.log('No subjects found in database');
            return [];
        }

// If user is a student, check enrollment status for each subject
if (userRole === 'Student' || userRole === 'User') {
    //console.log('User is student, checking enrollments for userId:', userId);
    
    // Get active (approved) enrollments
    const activeEnrollments = await db.SubjectEnrollment.findAll({
        where: { 
            studentId: userId,
            status: 'active'
        },
        attributes: ['subjectId']
    });
    
    // Get pending enrollments
    const pendingEnrollments = await db.SubjectEnrollment.findAll({
        where: { 
            studentId: userId,
            status: 'pending'
        },
        attributes: ['subjectId']
    });
    
    const activeSubjectIds = activeEnrollments.map(e => e.subjectId);
    const pendingSubjectIds = pendingEnrollments.map(e => e.subjectId);
    
    //console.log('Active subjects:', activeSubjectIds);
    //console.log('Pending subjects:', pendingSubjectIds);
    
    const result = subjects.map(subject => {
        const subjectData = subject.toJSON();
        subjectData.isEnrolled = activeSubjectIds.includes(subject.subjectId);
        subjectData.isPending = pendingSubjectIds.includes(subject.subjectId);
        
        if (subjectData.teacher) {
            subjectData.teacherName = `${subjectData.teacher.firstName} ${subjectData.teacher.lastName}`;
            delete subjectData.teacher;
        }
        
        return subjectData;
    });
    
    //console.log('Returning subjects with enrollment status');
    return result;
}

        // For teachers/admins
        //console.log('User is teacher/admin, returning all subjects without enrollment status');
        return subjects.map(subject => {
            const subjectData = subject.toJSON();
            if (subjectData.teacher) {
                subjectData.teacherName = `${subjectData.teacher.firstName} ${subjectData.teacher.lastName}`;
                delete subjectData.teacher;
            }
            return subjectData;
        });
    } catch (error) {
        //console.error('ERROR in getAll service:', error);
        throw new Error(`Failed to fetch subjects: ${error.message}`);
    }
}

async function getMySubjects(userId, userRole) {
    let subjects;
    
    if (userRole === 'Teacher' || userRole === 'Admin') {
        subjects = await db.Subject.findAll({
            where: { teacherId: userId },
            include: [{
                model: db.Account,
                as: 'teacher',
                attributes: ['AccountId', 'firstName', 'lastName', 'email']
            }],
            order: [['createdAt', 'DESC']]
        });
    } else {
        // Students see subjects they're enrolled in
        subjects = await db.Subject.findAll({
            include: [
                {
                    model: db.Account,
                    as: 'teacher',
                    attributes: ['AccountId', 'firstName', 'lastName', 'email']
                },
                {
                    model: db.SubjectEnrollment,
                    where: { 
                        studentId: userId,
                        status: 'active'
                    },
                    required: true,
                    attributes: []
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        
        // Mark all as enrolled since this query only returns enrolled subjects
        subjects = subjects.map(subject => {
            const subjectData = subject.toJSON();
            subjectData.isEnrolled = true;
            return subjectData;
        });
    }

    // Add counts
    const subjectsWithStats = await Promise.all(subjects.map(async (subject) => {
        const subjectData = subject.toJSON ? subject.toJSON() : subject;
        
        const studentCount = await db.SubjectEnrollment.count({
            where: { 
                subjectId: subjectData.subjectId,
                status: 'active'
            }
        });
        
        const questionCount = await db.Question.count({
            where: { subjectId: subjectData.subjectId }
        });
        
        if (subjectData.teacher) {
            subjectData.teacherName = `${subjectData.teacher.firstName} ${subjectData.teacher.lastName}`;
            delete subjectData.teacher;
        }
        
        return {
            ...subjectData,
            studentCount,
            questionCount
        };
    }));

    return subjectsWithStats;
}

async function getSubjectById(subjectId, userId, userRole) {
    const subject = await db.Subject.findByPk(subjectId, {
        include: [{
            model: db.Account,
            as: 'teacher',
            attributes: ['AccountId', 'firstName', 'lastName', 'email']
        }]
    });

    if (!subject) {
        throw new Error('Subject not found');
    }

    const subjectData = formatSubject(subject);

    // Check if user is enrolled (for students)
if (userRole === 'Student' || userRole === 'User') {
    const activeEnrollment = await db.SubjectEnrollment.findOne({
        where: {
            subjectId: subjectId,
            studentId: userId,
            status: 'active'
        }
    });
    const pendingEnrollment = await db.SubjectEnrollment.findOne({
        where: {
            subjectId: subjectId,
            studentId: userId,
            status: 'pending'
        }
    });
    subjectData.isEnrolled = !!activeEnrollment;
    subjectData.isPending = !!pendingEnrollment;
}
    // Get stats
    subjectData.studentCount = await db.SubjectEnrollment.count({
        where: { 
            subjectId: subjectId,
            status: 'active'
        }
    });

    subjectData.questionCount = await db.Question.count({
        where: { subjectId: subjectId }
    });

    return subjectData;
}

async function updateSubject(subjectId, params) {
    const subject = await db.Subject.findByPk(subjectId);
    
    if (!subject) {
        throw new Error('Subject not found');
    }

    // Check if subject code is being changed and is unique
    if (params.subjectCode && params.subjectCode !== subject.subjectCode) {
        const existingSubject = await db.Subject.findOne({ 
            where: { subjectCode: params.subjectCode } 
        });
        
        if (existingSubject) {
            throw new Error(`Subject code "${params.subjectCode}" is already taken`);
        }
    }

    Object.assign(subject, params);
    await subject.save();

    return getSubjectById(subjectId);
}

async function deleteSubject(subjectId) {
    const subject = await db.Subject.findByPk(subjectId);
    
    if (!subject) {
        throw new Error('Subject not found');
    }

    // Check if there are any questions or enrollments
    const questionCount = await db.Question.count({ where: { subjectId } });
    const enrollmentCount = await db.SubjectEnrollment.count({ where: { subjectId } });

    if (questionCount > 0 || enrollmentCount > 0) {
        throw new Error('Cannot delete subject with existing questions or enrollments');
    }

    await subject.destroy();
    return { message: 'Subject deleted successfully' };
}

async function enrollStudent(subjectId, studentId) {
    const subject = await db.Subject.findByPk(subjectId);
    
    if (!subject) {
        throw new Error('Subject not found');
    }

    // Check if already enrolled or pending
    const existingEnrollment = await db.SubjectEnrollment.findOne({
        where: {
            subjectId,
            studentId
        }
    });

    if (existingEnrollment) {
        if (existingEnrollment.status === 'active') {
            throw new Error('You are already enrolled in this subject');
        }
        if (existingEnrollment.status === 'pending') {
            throw new Error('Your enrollment request is already pending approval');
        }
        if (existingEnrollment.status === 'dropped') {
            // Re-enroll by setting to pending
            existingEnrollment.status = 'pending';
            existingEnrollment.enrolledAt = new Date();
            await existingEnrollment.save();
            return { message: 'Enrollment request submitted for approval' };
        }
    }

    // Create new enrollment with pending status
    await db.SubjectEnrollment.create({
        subjectId,
        studentId,
        enrolledAt: new Date(),
        status: 'pending'
    });

    return { message: 'Enrollment request submitted for approval' };
}

async function removeStudent(subjectId, studentId) {
    const enrollment = await db.SubjectEnrollment.findOne({
        where: {
            subjectId,
            studentId,
            status: 'active'
        }
    });

    if (!enrollment) {
        throw new Error('Student is not enrolled in this subject');
    }

    enrollment.status = 'dropped';
    await enrollment.save();

    return { message: 'Student removed from subject successfully' };
}

async function getSubjectStudents(subjectId) {
    const enrollments = await db.SubjectEnrollment.findAll({
        where: { 
            subjectId,
            status: 'active'
        },
        include: [{
            model: db.Account,
            as: 'student',
            attributes: ['AccountId', 'firstName', 'lastName', 'email']
        }],
        order: [['enrolledAt', 'DESC']]
    });

    return enrollments.map(e => ({
        enrollmentId: e.enrollmentId,
        enrolledAt: e.enrolledAt,
        student: e.student ? {
            AccountId: e.student.AccountId,
            firstName: e.student.firstName,
            lastName: e.student.lastName,
            email: e.student.email
        } : null
    }));
}

async function getSubjectQuestions(subjectId, userId, userRole) {
    // Check if user has access to this subject
    if (userRole === 'Student' || userRole === 'User') {
        const enrollment = await db.SubjectEnrollment.findOne({
            where: {
                subjectId,
                studentId: userId,
                status: 'active'
            }
        });

        if (!enrollment) {
            throw new Error('You are not enrolled in this subject');
        }
    }

    const questions = await db.Question.findAll({
        where: { subjectId },
        include: [{
            model: db.Account,
            as: 'teacher',
            attributes: ['firstName', 'lastName']
        }],
        order: [['createdAt', 'DESC']]
    });

    // If user is a student, check which questions they've answered
    if (userRole === 'Student' || userRole === 'User') {
        const answeredQuestions = await db.Answer.findAll({
            where: { studentId: userId },
            attributes: ['questionId']
        });
        
        const answeredIds = answeredQuestions.map(a => a.questionId);
        
        return questions.map(q => {
            const question = q.toJSON();
            question.hasAnswered = answeredIds.includes(q.questionId);
            
            if (question.teacher) {
                question.teacherName = `${question.teacher.firstName} ${question.teacher.lastName}`;
                delete question.teacher;
            }
            
            return question;
        });
    }

    return questions.map(q => {
        const question = q.toJSON();
        if (question.teacher) {
            question.teacherName = `${question.teacher.firstName} ${question.teacher.lastName}`;
            delete question.teacher;
        }
        return question;
    });
}

// Helper function to format subject
function formatSubject(subject) {
    const subjectData = subject.toJSON();
    
    if (subjectData.teacher) {
        subjectData.teacherName = `${subjectData.teacher.firstName} ${subjectData.teacher.lastName}`;
        delete subjectData.teacher;
    }
    
    return subjectData;
}

async function approveStudent(subjectId, studentId) {
    const enrollment = await db.SubjectEnrollment.findOne({
        where: {
            subjectId,
            studentId,
            status: 'pending'
        }
    });

    if (!enrollment) {
        throw new Error('Pending enrollment not found');
    }

    enrollment.status = 'active';
    await enrollment.save();

    return { message: 'Student approved successfully' };
}

async function rejectStudent(subjectId, studentId) {
    const enrollment = await db.SubjectEnrollment.findOne({
        where: {
            subjectId,
            studentId,
            status: 'pending'
        }
    });

    if (!enrollment) {
        throw new Error('Pending enrollment not found');
    }

    enrollment.status = 'dropped'; // or you could use 'rejected' if you add that enum
    await enrollment.save();

    return { message: 'Student rejected successfully' };
}

async function getPendingStudents(subjectId) {
    const enrollments = await db.SubjectEnrollment.findAll({
        where: {
            subjectId,
            status: 'pending'
        },
        include: [{
            model: db.Account,
            as: 'student',
            attributes: ['AccountId', 'firstName', 'lastName', 'email']
        }],
        order: [['enrolledAt', 'DESC']]
    });

    return enrollments.map(e => ({
        enrollmentId: e.enrollmentId,
        enrolledAt: e.enrolledAt,
        student: e.student ? {
            AccountId: e.student.AccountId,
            firstName: e.student.firstName,
            lastName: e.student.lastName,
            email: e.student.email
        } : null
    }));
}

// Export all functions at the END
module.exports = {
    createSubject,
    getAll,           // This is for the main /subjects route
    getMySubjects,    // This is for the /my-subjects route
    getSubjectById,
    updateSubject,
    deleteSubject,
    enrollStudent,
    removeStudent,
    getSubjectStudents,
    getSubjectQuestions,
    approveStudent,
    rejectStudent,
    getPendingStudents
};