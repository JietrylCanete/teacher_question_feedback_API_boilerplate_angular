const config = require('config.json');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

module.exports = db = {};

initialize();

async function initialize() { 
    const { host, port, user, password, database } = config.database;
    const connection = await mysql.createConnection({ host, port, user, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    
    await connection.end();

    const sequelize = new Sequelize(database, user, password, { 
        host: 'localhost', 
        dialect: 'mysql',
        logging: false // Set to true for debugging
    });

    // Initialize models
    db.Account = require('../accounts/account.model')(sequelize);
    db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);
    db.Preferences = require('../models/preferences.model')(sequelize);
    db.ActivityLog = require('../models/activitylog.model')(sequelize);

    // Classroom models
    db.Quiz = require('../classroom/quiz.model')(sequelize);
    db.Question = require('../classroom/question.model')(sequelize);
    db.Answer = require('../classroom/answer.model')(sequelize);
    db.AIReview = require('../classroom/ai-review.model')(sequelize);
    db.Subject = require('../classroom/subject.model')(sequelize);
    db.SubjectEnrollment = require('../classroom/subject-enrollment.model')(sequelize);

    // Define relationships
    db.Account.hasMany(db.RefreshToken, { foreignKey: 'AccountId', onDelete: 'CASCADE' });
    db.RefreshToken.belongsTo(db.Account, { foreignKey: 'AccountId' });

    db.ActivityLog.belongsTo(db.Account, { foreignKey: 'AccountId' });
    db.Preferences.belongsTo(db.Account, { foreignKey: 'AccountId' });

    // Classroom relationships
    // Quiz <-> Subject
    db.Subject.hasMany(db.Quiz, { foreignKey: 'subjectId' });
    db.Quiz.belongsTo(db.Subject, { foreignKey: 'subjectId' });

    // Quiz <-> Question
    db.Quiz.hasMany(db.Question, { foreignKey: 'quizId' });
    db.Question.belongsTo(db.Quiz, { foreignKey: 'quizId' });

    // Question <-> Answer
    db.Question.hasMany(db.Answer, { foreignKey: 'questionId' });
    db.Answer.belongsTo(db.Question, { foreignKey: 'questionId' });

    // Answer <-> AIReview
    db.Answer.hasOne(db.AIReview, { foreignKey: 'answerId' });
    db.AIReview.belongsTo(db.Answer, { foreignKey: 'answerId' });

    // Student relationships for answers
    db.Account.hasMany(db.Answer, { foreignKey: 'studentId', as: 'answers' });
    db.Answer.belongsTo(db.Account, { foreignKey: 'studentId', as: 'student' });

    // Teacher relationship for questions
    db.Account.hasMany(db.Question, { foreignKey: 'teacherId', as: 'questions' });
    db.Question.belongsTo(db.Account, { foreignKey: 'teacherId', as: 'teacher' });

    // Subject relationships
    db.Account.hasMany(db.Subject, { foreignKey: 'teacherId', as: 'taughtSubjects' });
    db.Subject.belongsTo(db.Account, { foreignKey: 'teacherId', as: 'teacher' });

    // Enrollment relationships
    db.Subject.belongsToMany(db.Account, { 
        through: db.SubjectEnrollment, 
        foreignKey: 'subjectId', 
        otherKey: 'studentId',
        as: 'students'
    });
    db.Account.belongsToMany(db.Subject, { 
        through: db.SubjectEnrollment, 
        foreignKey: 'studentId', 
        otherKey: 'subjectId',
        as: 'enrolledSubjects' 
    });
    db.Subject.hasMany(db.SubjectEnrollment, { foreignKey: 'subjectId' });
    db.SubjectEnrollment.belongsTo(db.Subject, { foreignKey: 'subjectId' });
    db.Account.hasMany(db.SubjectEnrollment, { foreignKey: 'studentId' });
    db.SubjectEnrollment.belongsTo(db.Account, { foreignKey: 'studentId', as: 'student' });

    // Subject <-> Question
    db.Subject.hasMany(db.Question, { foreignKey: 'subjectId' });
    db.Question.belongsTo(db.Subject, { foreignKey: 'subjectId' });








    // Sync all models with database
    await sequelize.sync({ alter: true });
    
    console.log('Database synchronized successfully');
}