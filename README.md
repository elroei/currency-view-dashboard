# 💱 Currency Wallet – Full Stack (React + PHP + MySQL + Docker)

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

---

## 👤 Multi-User Support

- **User selector** in the frontend: switch between `user1@example.com` and `user2@example.com`.
- All wallet actions (deposit, transfer, view balances) are user-specific.
- Transfers are performed by entering the recipient's email.

---

## 💱 Currency & Exchange Rate Features

- **Supported:** USD, EUR, GBP, ILS (Israeli Shekel)
- All wallet operations and balances support ILS natively.
- **Live exchange rates** are fetched from the backend and displayed in the dashboard.
- **Historical Exchange Rates:**
  - The dashboard displays a chart of historical rates (USD/EUR/GBP to ILS) for the last 3 months.
  - The most recent historical rate is used for equivalent value calculations, ensuring consistency across the dashboard.

---

## 📈 Dashboard Features

- **Modern, responsive UI** with TailwindCSS and custom design.
- **Session-based login/logout:** Only authenticated users can access the dashboard.
- **User-specific data:** Balances, transactions, and actions reflect the logged-in user only.
- **Profile & Settings modal:** Edit profile info, change password, set preferences, and view activity log in a modern glassy modal.
- **Change password:** Securely update your password from the settings modal.
- **Language support:** Instantly switch between English and Hebrew throughout the UI.
- **Password confirmation before transfers:** Extra security step before sending money.
- **Theme toggle:** Light/dark mode available in the settings panel.
- **In-app notifications:** All important actions (deposits, transfers, rate alerts) trigger notifications in the UI.
- **Rate Alerts:** Set custom alerts for exchange rates. Alerts are saved in your browser and persist across reloads. When the rate meets or exceeds your threshold, you receive an in-app notification. Manage (add/remove) active alerts in the dashboard.
- **Currency conversion:** Each currency card shows the original amount and the equivalent in ILS, calculated using the most recent historical rate. The total wallet balance is always shown in your selected display currency, with all conversions based on the latest rates.
- **Transaction history:** View all recent transactions, including deposits and transfers, with equivalent values in ILS.
- **Quick deposit and transfer:** Instantly add funds or transfer between users with a simple, intuitive UI.

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
