-- Admin Users Table
CREATE TABLE admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin', 'manager') NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Admin Permissions Table
CREATE TABLE admin_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Role Permissions Table
CREATE TABLE admin_role_permissions (
    role_id INT,
    permission_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES admin_users(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES admin_permissions(id) ON DELETE CASCADE
);

-- Admin Activity Logs Table
CREATE TABLE admin_activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Admin Settings Table
CREATE TABLE admin_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Activities Table
CREATE TABLE activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    duration INT NOT NULL COMMENT 'Duration in minutes',
    price DECIMAL(10, 2) NOT NULL,
    max_participants INT NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Meal Plans Table
CREATE TABLE meal_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    type ENUM('breakfast', 'lunch', 'dinner', 'all_inclusive') NOT NULL,
    menu_items JSON NOT NULL DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default admin user
INSERT INTO admin_users (username, email, password, role) 
VALUES ('admin', 'admin@plumeriaretreat.com', '$2a$10$your_hashed_password', 'super_admin');

-- Insert default permissions
INSERT INTO admin_permissions (name, description) VALUES
('manage_users', 'Can manage user accounts'),
('manage_bookings', 'Can manage bookings'),
('manage_payments', 'Can manage payments'),
('manage_accommodations', 'Can manage accommodations'),
('manage_activities', 'Can manage activities'),
('manage_meal_plans', 'Can manage meal plans'),
('view_reports', 'Can view reports'),
('manage_settings', 'Can manage system settings'),
('manage_admins', 'Can manage admin users');

-- Assign all permissions to super_admin
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT 1, id FROM admin_permissions;

-- Insert default settings
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
('site_name', 'Plumeria Retreat', 'Name of the resort'),
('contact_email', 'contact@plumeriaretreat.com', 'Contact email address'),
('contact_phone', '+1234567890', 'Contact phone number'),
('check_in_time', '14:00', 'Default check-in time'),
('check_out_time', '11:00', 'Default check-out time'),
('min_partial_payment', '20', 'Minimum partial payment percentage'),
('currency', 'INR', 'Default currency'),
('tax_rate', '18', 'Default tax rate percentage'); 