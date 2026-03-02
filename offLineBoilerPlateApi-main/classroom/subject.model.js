const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        subjectId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        subjectName: { type: DataTypes.STRING, allowNull: false },
        subjectCode: { type: DataTypes.STRING, allowNull: false, unique: true },
        description: { type: DataTypes.TEXT, allowNull: true },
        teacherId: { type: DataTypes.INTEGER, allowNull: false },
        schedule: { type: DataTypes.STRING, allowNull: true }, // e.g., "Mon/Wed 10:00-11:30"
        room: { type: DataTypes.STRING, allowNull: true },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    };

    return sequelize.define('Subject', attributes, { timestamps: true });
}