const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        cardLogId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        cardUID: { type: DataTypes.STRING, allowNull: false },
        event: { type: DataTypes.STRING, allowNull: false },
        details: { type: DataTypes.TEXT, allowNull: true },
        timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        AccountId: { type: DataTypes.INTEGER, allowNull: false } // Link log to user
    };

    const options = {
        timestamps: false
    };

    return sequelize.define('ArduinoLog', attributes, options);
}