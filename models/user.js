'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => { 
  class User extends Model {
    static associate(models) {
      // define association here 
    }
  }
  User.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {  
      type: DataTypes.STRING, 
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    }, 
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    credit_balance: { 
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true, // Allow NULL for active users
      defaultValue: null
    },
    
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};
