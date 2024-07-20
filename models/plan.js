'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Plan extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Plan.init({
    label: DataTypes.STRING,
    value: DataTypes.STRING,
    credit: DataTypes.STRING,
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true, // Allow NULL for active users
      defaultValue: null
    }, 
  }, {
    sequelize,
    modelName: 'Plan',
  });
  return Plan;
};