'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  const FilterCategory = require('./filtercategory')(sequelize, DataTypes);

  class Filter extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Filter.belongsTo(models.FilterCategory, { foreignKey: 'category_id' });
    }
  }
  Filter.init({
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'FilterCategory',
        key: 'id'
      }
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sub_category: {
      type: DataTypes.STRING,
      allowNull: false
    },
  }, {
    sequelize,
    modelName: 'Filter',
  });

  return Filter;
};
