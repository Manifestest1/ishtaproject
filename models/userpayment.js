'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  const User = require('./user')(sequelize, DataTypes);
  class UserPayment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      UserPayment.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }
  UserPayment.init({
    user_id: DataTypes.INTEGER,
    order_payment_id: DataTypes.STRING, 
    payment_id: DataTypes.STRING, 
    payment: DataTypes.STRING,
    credit: DataTypes.STRING,
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true, // Allow NULL for active users
      defaultValue: null
    }, 
  }, {
    sequelize,
    modelName: 'UserPayment',
  });
  return UserPayment;
};