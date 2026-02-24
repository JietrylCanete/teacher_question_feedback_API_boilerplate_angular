const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        reviewId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        answerId: { type: DataTypes.INTEGER, allowNull: false },
        isRelevant: { type: DataTypes.BOOLEAN, allowNull: false },
        feedback: { type: DataTypes.TEXT, allowNull: false },
        reviewedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    };

    return sequelize.define('AIReview', attributes, { timestamps: false });
}