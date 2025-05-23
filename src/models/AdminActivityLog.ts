import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import AdminUser from './AdminUser';

class AdminActivityLog extends Model {
  public id!: number;
  public adminId!: number;
  public action!: string;
  public description!: string;
  public ipAddress!: string;
  public userAgent!: string;
  public readonly createdAt!: Date;
}

AdminActivityLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    adminId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: AdminUser,
        key: 'id',
      },
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'AdminActivityLog',
    tableName: 'admin_activity_logs',
  }
);

export default AdminActivityLog; 