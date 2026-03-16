const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        questionId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        subjectId: { 
            type: DataTypes.INTEGER, 
            allowNull: false,
            references: {
                model: 'Subjects',
                key: 'subjectId'
            }
        },
        questionText: { type: DataTypes.TEXT, allowNull: false },
        teacherId: { 
            type: DataTypes.INTEGER, 
            allowNull: false,
            references: {
                model: 'Accounts',
                key: 'AccountId'
            }
        },
        dueDate: { type: DataTypes.DATE, allowNull: true },
        points: { type: DataTypes.INTEGER, defaultValue: 100 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        aiRelevance: { type: DataTypes.BOOLEAN, allowNull: true },
        aiFeedback: { type: DataTypes.TEXT, allowNull: true }
    };

    const options = {
        timestamps: false
    };

    return sequelize.define('Question', attributes, options);
}