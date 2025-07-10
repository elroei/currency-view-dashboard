# 💱 Currency Wallet – Full Stack (React + PHP + MySQL + Docker)

---

## ✨ Recent UX & Feature Improvements

- **Modernized Login Experience:**
  - Login screen now features a blurred, static preview of the dashboard behind the form, giving a “locked app” effect.
  - The preview uses realistic, non-interactive mock data for balances, rates, and transactions.
  - Blur intensity is tuned for a clear, inviting look.
- **Registration & User Profile:**
  - Registration form now uses separate **First Name** and **Last Name** fields (no more single "name").
  - User’s full name is displayed throughout the dashboard and profile/settings.
- **Email Verification Flow:**
  - New users must verify their email before logging in.
  - Clear error messages and a “Resend Verification Email” button for unverified users.
  - Seamless integration with Mailpit for local email testing.
- **Password Reset & Security:**
  - Password reset and change flows are fully modernized and user-friendly.
  - Password visibility toggle is available on reset screens, but removed from login for a cleaner look.
- **Navigation & Onboarding:**
  - “Back to Login” links added to registration and forgot password screens for smoother navigation.
  - All error and success messages are clear and accessible.
- **General Polish:**
  - All forms and modals are visually consistent, accessible, and mobile-friendly.
  - Improved error handling and onboarding flow throughout the app.

---

## 🛠️ Prerequisites

- **Docker Desktop** must be installed and running on your system.
  - Download: https://www.docker.com/products/docker-desktop/
  - Works on Windows, macOS, and Linux.

---

A modern, multi-user currency wallet system supporting USD, EUR, GBP, and Israeli Shekel (ILS).
Built with React (Vite + TailwindCSS), PHP (Apache), MySQL, and Docker for zero-effort local setup.

---

## 🚀 Quick Start

**1. Clone the repository:**
```sh
git clone https://github.com/elroei/currency-view-dashboard.git
cd currency-view-dashboard
```

**2. Start all services (no manual DB setup needed!):**
```sh
docker-compose up --build
```

**3. Access the app:**
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000/api/](http://localhost:8000/api/)
- **phpMyAdmin:** [http://localhost:8081](http://localhost:8081)
  (Login: `wallet_user` / `wallet_pass`, Server: `db`)
- **Mailpit (Email Testing):** [http://localhost:8025](http://localhost:8025)
  (No login required. Use this to view all outgoing emails, including verification and password reset links.)

---

## 👥 Default Users

Upon running the project, the following users are available for testing:

- **user1@example.com** / `demo123`  
  - Initial balance: USD 1000, EUR 500, ILS 2000

- **user2@example.com** / `demo123`  
  - Initial balance: USD 0, EUR 0, ILS 0

---

## 🗄️ Database & Seeding

- **MySQL 8.0** container auto-creates the `wallet` database.
- **Schema and seed data** are loaded automatically from [`backend/init.sql`](backend/init.sql):
  - **Tables:** `users`, `transactions`
  - **Seed users:**
    - `user1@example.com` (id: 1, initial: USD 1000, EUR 500, ILS 2000)
    - `user2@example.com` (id: 2, initial: USD 0, EUR 0, ILS 0)
- **No manual SQL or DB creation required.**

---

## 🔐 Authentication & Security

- **Session-based authentication:** Secure login/logout with PHP sessions. Only authenticated users can access the dashboard and perform actions.
- **User-specific dashboard:** All balances, transactions, and actions are tied to the currently logged-in user. No manual user selection.
- **Email verification required:** New users must verify their email before logging in. Unverified users are prompted to resend the verification email.
- **Password confirmation for transfers:** Before sending money, users must re-enter their password for extra security.
- **Change password:** Users can securely change their password from the profile/settings modal.

---

## 🧩 Project Structure

```
/frontend   # React + Vite + TailwindCSS frontend
/backend    # PHP 7.4+ backend (Apache), API endpoints in /api
/backend/init.sql  # MySQL schema & seed data (auto-loaded)
/docker-compose.yml # Multi-service orchestration
```

---

## 🔌 API Endpoints

All endpoints return JSON and support CORS.

| Method | Endpoint                | Description                                 |
|--------|-------------------------|---------------------------------------------|
| POST   | `/api/deposit.php`      | Deposit funds (requires `user_id`)          |
| GET/POST | `/api/balance.php`    | Get balances for a user (`user_id`)         |
| GET    | `/api/get_rates.php`    | Get latest exchange rates                   |
| GET/POST | `/api/transactions.php` | List transactions for a user (`user_id`)   |
| POST   | `/api/transfer.php`     | Transfer between users (by email)           |
| POST   | `/api/convert.php`      | Currency exchange within wallet (see below) |
| POST   | `/api/register.php`     | Register new user (first/last name, email, password) |
| POST   | `/api/verify_email.php` | Verify user email with token                |
| POST   | `/api/resend_verification.php` | Resend verification email                 |
| POST   | `/api/request_password_reset.php` | Request password reset link              |
| POST   | `/api/reset_password.php` | Reset password using token                 |

---

## 👤 Multi-User Support

- **User selector** in the frontend: switch between `user1@example.com` and `user2@example.com`.
- All wallet actions (deposit, transfer, currency exchange, view balances) are user-specific.
- Transfers are performed by entering the recipient's email.

---

## 💱 Currency & Exchange Rate Features

- **Supported:** USD, EUR, GBP, ILS (Israeli Shekel)
- All wallet operations and balances support ILS natively.
- **Live exchange rates** are fetched from the backend and displayed in the dashboard.
- **Currency Exchange:**
  - The dashboard features a unified card for **Quick Deposit** and **Currency Exchange**.
  - Instantly convert between currencies in your wallet using the latest available rate.
  - **Exchange rate logic:**
    - The backend fetches rates for the last 5 days from the Bank of Israel API.
    - The most recent available rate (starting from today, going backwards) is used for conversions.
    - If no rate is found in the last 5 days, the conversion fails gracefully.
    - The confirmation popup before conversion shows the exact date of the rate being used.
- **Historical Exchange Rates:**
  - The dashboard displays a chart of historical rates (USD/EUR/GBP to ILS) for the last 3 months.
  - The most recent historical rate is used for equivalent value calculations, ensuring consistency across the dashboard.

---

## 📈 Dashboard Features

- **Modern, responsive UI** with TailwindCSS and custom design.
- **Blurred dashboard preview on login:** Users see a blurred, static preview of the dashboard behind the login form, creating a “locked app” effect.
- **Session-based login/logout:** Only authenticated users can access the dashboard.
- **User-specific data:** Balances, transactions, and actions reflect the logged-in user only.
- **Profile & Settings modal:** Edit profile info (first/last name), change password, set preferences, and view activity log in a modern glassy modal.
- **Change password:** Securely update your password from the settings modal.
- **Language support:** Instantly switch between English and Hebrew throughout the UI. All new features and transaction types are fully translated.
- **Password confirmation before transfers:** Extra security step before sending money.
- **Theme toggle:** Light/dark mode available in the settings panel.
- **In-app notifications:** All important actions (deposits, transfers, rate alerts, currency exchanges) trigger notifications in the UI.
- **Rate Alerts:** Set custom alerts for exchange rates. Alerts are saved in your browser and persist across reloads. When the rate meets or exceeds your threshold, you receive an in-app notification. Manage (add/remove) active alerts in the dashboard.
- **Currency conversion:** Each currency card shows the original amount and the equivalent in ILS, calculated using the most recent historical rate. The total wallet balance is always shown in your selected display currency, with all conversions based on the latest rates.
- **Transaction history:**
  - View all recent transactions, including deposits, transfers, and currency exchanges.
  - The Type column clearly labels each transaction (Deposit, Conversion In, Conversion Out, Transfer In, Transfer Out, etc.).
  - The Date column shows the correct date and time of each transaction (DD-MM-YYYY  HH:mm).
  - Equivalent values in ILS are shown where relevant.
- **Quick deposit, transfer, and exchange:** Instantly add funds, transfer, or exchange between currencies with a simple, intuitive UI.
- **Seamless onboarding:** Clear error/success messages, “Back to Login” links, and a polished, accessible experience throughout registration, login, and password reset flows.

---

## 🛠️ Development & Customization

- **To reset the database** (wipe all data and re-seed):
  ```sh
  docker-compose down -v
  docker-compose up --build
  ```
- **To add more sample data:**
  Edit [`backend/init.sql`](backend/init.sql) and re-run the above reset.

- **Backend environment variables** (see `backend/config.php`):
  - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, `DEFAULT_DISPLAY_CURRENCY`
  - These are set automatically by Docker Compose.

---

## 📝 Notes

- **No manual setup required:**
  Just run `docker-compose up --build` and everything is ready.
- **phpMyAdmin** is available for DB inspection and manual queries.
- **Frontend** is served on port 3000, backend API on 8000, phpMyAdmin on 8081.
- **Favicon:** To change the site icon, replace `frontend/public/favicon.png` and update the link in `frontend/index.html`.

---

AI Tools Used
This project utilized the following AI-related tools during development:

ChatGPT – for code generation, debugging assistance, and feature planning
Claude – for code review and UI/UX suggestions
Cursor – AI-powered IDE for inline coding and completion
LOVable – for generating and customizing frontend components

## 📄 License
elroei seadia

---

**Enjoy your full-stack, multi-currency wallet!**
If you have questions or want to contribute, open an issue or pull request.
