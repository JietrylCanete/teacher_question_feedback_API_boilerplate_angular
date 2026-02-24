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
    db.Question = require('../classroom/question.model')(sequelize);
    db.Answer = require('../classroom/answer.model')(sequelize);
    db.AIReview = require('../classroom/ai-review.model')(sequelize);

    // Define relationships
    db.Account.hasMany(db.RefreshToken, { foreignKey: 'AccountId', onDelete: 'CASCADE' });
    db.RefreshToken.belongsTo(db.Account, { foreignKey: 'AccountId' });

    db.ActivityLog.belongsTo(db.Account, { foreignKey: 'AccountId' });
    db.Preferences.belongsTo(db.Account, { foreignKey: 'AccountId' });

    // Classroom relationships
    db.Question.hasMany(db.Answer, { foreignKey: 'questionId' });
    db.Answer.belongsTo(db.Question, { foreignKey: 'questionId' });

    db.Answer.hasOne(db.AIReview, { foreignKey: 'answerId' });
    db.AIReview.belongsTo(db.Answer, { foreignKey: 'answerId' });

    // Sync all models with database
    await sequelize.sync({ alter: true });
    
    console.log('Database synchronized successfully');
}