const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        quizId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        subjectId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Subjects',
                key: 'subjectId'
            }
        },
        title: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        totalPoints: { type: DataTypes.INTEGER, allowNull: true },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    };

    return sequelize.define('Quiz', attributes, { timestamps: false });
}

