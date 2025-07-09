-- init.sql - Multi-user schema and seed data

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
INSERT INTO users (id, email, name) VALUES
  (1, 'user1@example.com', 'User One'),
  (2, 'user2@example.com', 'User Two')
ON DUPLICATE KEY UPDATE email=email;

-- Seed initial balances as deposits for user1
INSERT INTO transactions (user_id, type, amount, currency, description, created_at) VALUES
  (1, 'deposit', 1000, 'USD', 'Initial deposit', NOW()),
  (1, 'deposit', 500, 'EUR', 'Initial deposit', NOW()),
  (1, 'deposit', 2000, 'ILS', 'Initial deposit', NOW());

-- (No exchange_rates table, as rates are now fetched live from the API) 