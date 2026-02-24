const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        questionId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        questionText: { type: DataTypes.TEXT, allowNull: false },
        teacherId: { type: DataTypes.INTEGER, allowNull: false },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    };

    return sequelize.define('Question', attributes, { timestamps: false });
}