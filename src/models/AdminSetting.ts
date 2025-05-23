import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import AdminUser from './AdminUser';

class AdminSetting extends Model {
  public id!: number;
  public settingKey!: string;
  public settingValue!: string;
  public description!: string;
  public updatedBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AdminSetting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    settingKey: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    settingValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: AdminUser,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'AdminSetting',
    tableName: 'admin_settings',
  }
);

export default AdminSetting; 