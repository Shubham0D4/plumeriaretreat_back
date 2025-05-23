import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Activity extends Model {
  public id!: number;
  public name!: string;
  public description!: string;
  public duration!: number;
  public price!: number;
  public maxParticipants!: number;
  public imageUrl!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Activity.init(
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
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Duration in minutes',
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Activity',
    tableName: 'activities',
  }
);

export default Activity; 