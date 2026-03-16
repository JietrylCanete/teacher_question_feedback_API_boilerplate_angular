const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        answerId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        questionId: { type: DataTypes.INTEGER, allowNull: false },
        studentId: { type: DataTypes.INTEGER, allowNull: false },
        answerText: { type: DataTypes.TEXT, allowNull: false },
        // Score for this answer (for auto-graded questions)
        score: { type: DataTypes.INTEGER, allowNull: true },
        submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    };

    return sequelize.define('Answer', attributes, { timestamps: false });
}