import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class AdminPermission extends Model {
  public id!: number;
  public name!: string;
  public description!: string;
  public readonly createdAt!: Date;
}

AdminPermission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'AdminPermission',
    tableName: 'admin_permissions',
  }
);

export default AdminPermission; 