const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        enrollmentId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        subjectId: { type: DataTypes.INTEGER, allowNull: false },
        studentId: { type: DataTypes.INTEGER, allowNull: false },
        enrolledAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        status: { type: DataTypes.ENUM('active', 'completed', 'dropped', 'pending'), defaultValue: 'pending' }
    };

    return sequelize.define('SubjectEnrollment', attributes, { timestamps: false });
}