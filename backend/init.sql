-- init.sql - Multi-user schema and seed data

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    name VARCHAR(255),
    password VARCHAR(255) NOT NULL, -- bcrypt hash
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_verified TINYINT(1) DEFAULT 0,
    verification_token VARCHAR(255) DEFAULT NULL
);

-- Transactions table (linked to users)
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(32) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    currency VARCHAR(8) NOT NULL,
    description VARCHAR(255),
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Historical exchange rates table
CREATE TABLE IF NOT EXISTS historical_exchange_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    currency VARCHAR(8) NOT NULL,
    rate_to_ils DECIMAL(18,6) NOT NULL,
    date DATE NOT NULL,
    UNIQUE KEY unique_currency_date (currency, date)
);

-- Seed users
INSERT INTO users (id, email, first_name, last_name, name, password, is_verified, verification_token) VALUES
  (1, 'user1@example.com', 'User', 'One', 'User One', '$2y$12$33Mjnmpl6pbz56NXDM16Wus.m6MS2SXU8nYKJQ4QE2zG/3qHgFoYC', 1, NULL),
  (2, 'user2@example.com', 'User', 'Two', 'User Two', '$2y$12$33Mjnmpl6pbz56NXDM16Wus.m6MS2SXU8nYKJQ4QE2zG/3qHgFoYC', 1, NULL)
ON DUPLICATE KEY UPDATE email=email;

-- Seed initial balances as deposits for user1
INSERT INTO transactions (user_id, type, amount, currency, description, created_at) VALUES
  (1, 'deposit', 1000, 'USD', 'Initial deposit', NOW()),
  (1, 'deposit', 500, 'EUR', 'Initial deposit', NOW()),
  (1, 'deposit', 2000, 'ILS', 'Initial deposit', NOW());

-- (No exchange_rates table, as rates are now fetched live from the API) 

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
); 