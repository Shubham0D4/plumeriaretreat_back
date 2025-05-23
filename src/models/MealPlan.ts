import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class MealPlan extends Model {
  public id!: number;
  public name!: string;
  public description!: string;
  public price!: number;
  public type!: 'breakfast' | 'lunch' | 'dinner' | 'all_inclusive';
  public menuItems!: string[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MealPlan.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('breakfast', 'lunch', 'dinner', 'all_inclusive'),
      allowNull: false,
    },
    menuItems: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: 'MealPlan',
    tableName: 'meal_plans',
  }
);

export default MealPlan; 