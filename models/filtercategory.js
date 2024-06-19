'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => { 
  class FilterCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically. 
     */
    static associate(models) 
    {
      // define association here
    }
  }
  FilterCategory.init({
    name: { 
     type: DataTypes.STRING,
    allowNull: false
    },
    order_no: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  }, 
  {
    sequelize,
    modelName: 'FilterCategory',
  });
  return FilterCategory;
};