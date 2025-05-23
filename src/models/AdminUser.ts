import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcrypt';

class AdminUser extends Model {
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public role!: 'super_admin' | 'admin' | 'manager';
  public status!: 'active' | 'inactive';
  public lastLogin!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
}

AdminUser.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('super_admin', 'admin', 'manager'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'AdminUser',
    tableName: 'admin_users',
    hooks: {
      beforeCreate: async (admin: AdminUser) => {
        if (admin.password) {
          const salt = await bcrypt.genSalt(10);
          admin.password = await bcrypt.hash(admin.password, salt);
        }
      },
      beforeUpdate: async (admin: AdminUser) => {
        if (admin.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          admin.password = await bcrypt.hash(admin.password, salt);
        }
      },
    },
  }
);

export default AdminUser; 