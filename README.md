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
cd currency-view-dashboar
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

## 🗄️ Database & Seeding

- **MySQL 8.0** container auto-creates the `wallet` database.
- **Schema and seed data** are loaded automatically from [`backend/init.sql`](backend/init.sql):
  - **Tables:** `users`, `transactions`
  - **Seed users:**
    - `user1@example.com` (id: 1, initial: USD 1000, EUR 500, ILS 2000)
    - `user2@example.com` (id: 2, initial: USD 0, EUR 0, ILS 0)
- **No manual SQL or DB creation required.**

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

## 💱 Currency Support

- **Supported:** USD, EUR, GBP, ILS (Israeli Shekel)
- All wallet operations and balances support ILS natively.

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

---

## 📄 License

MIT (or your preferred license)

---

**Enjoy your full-stack, multi-currency wallet!**  
If you have questions or want to contribute, open an issue or pull request.
