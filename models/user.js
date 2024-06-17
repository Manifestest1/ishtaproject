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
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
