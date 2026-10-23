# Expense Tracker

A MERN stack web application where users register, log in and record their daily expenses, then see how much they spend in each category and month.

Capstone project for the ICTAK Full Stack Development course.

- **Live site:** [add hosted project link]
- **API health check:** [add API URL]/api/health

## Features

- Register, log in, log out; stays logged in after a page refresh
- Add, edit and delete your own expenses (title, amount, category, date, note)
- Filter by category and month, with pagination
- Dashboard with total spent and a bar for each category
- Loading, empty and error states on every screen; responsive layout
- Each user can see and change only their own data

## Tech stack

| Part | Technology |
| --- | --- |
| Front end | React 18, Vite, React Router |
| Back end | Node.js, Express |
| Database | MongoDB with Mongoose |
| Security | bcryptjs, JSON Web Tokens, helmet, express-rate-limit, CORS allow-list |

## Project structure

```
expense-tracker/
  client/            React application
    src/pages        Login, Register, Dashboard, ExpenseForm
    src/components   Navbar, ProtectedRoute
    src/context      AuthContext (logged-in user)
    src/services     api.js (all calls to the backend)
  server/            Express API
    src/routes       URL and method mapping
    src/controllers  request handling
    src/models       Mongoose schemas (User, Expense)
    src/middleware   auth, error handling
    src/utils        input validation
    tests            automated API tests
```

## Run it locally

You need Node.js (LTS) and a MongoDB database (a free MongoDB Atlas cluster works, or a local MongoDB).

**1. API**

```bash
cd server
npm install
cp .env.example .env      # then fill in the values
npm run dev               # http://localhost:5000
```

**2. Client** (in a second terminal)

```bash
cd client
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:5000/api
npm run dev               # http://localhost:5173
```

## Environment variables

Only the names are listed here. Real values go in `.env` files, which are not in Git.

| File | Variable | Meaning |
| --- | --- | --- |
| server/.env | PORT | Port the API listens on (default 5000) |
| server/.env | MONGODB_URI | MongoDB connection string |
| server/.env | JWT_SECRET | Long random text used to sign login tokens |
| server/.env | JWT_EXPIRES_IN | Token lifetime, for example `1d` |
| server/.env | CLIENT_ORIGIN | Front end address allowed by CORS (comma separated for more than one) |
| client/.env | VITE_API_URL | API address, for example `http://localhost:5000/api` |

## API

All routes start with `/api` and use JSON. Routes marked "token" need the header `Authorization: Bearer <token>`.

| Method and path | Purpose | Token |
| --- | --- | --- |
| POST /api/auth/register | Create an account | No |
| POST /api/auth/login | Log in | No |
| GET /api/auth/me | Current user | Yes |
| POST /api/expenses | Add an expense | Yes |
| GET /api/expenses | List own expenses (`page`, `limit`, `category`, `month`) | Yes |
| GET /api/expenses/summary | Total and totals per category | Yes |
| GET /api/expenses/:id | Get one expense | Yes |
| PUT /api/expenses/:id | Update an expense | Yes |
| DELETE /api/expenses/:id | Delete an expense | Yes |

Errors return `{ "message": "..." }` with a suitable status code (400, 401, 404, 409, 500).

## Tests

The API has automated tests (Node's built-in test runner). They need a test database:

```bash
cd server
MONGODB_URI=mongodb://127.0.0.1:27017/expense_test JWT_SECRET=test npm test
```

They check validation, register and login, NoSQL injection, protected routes, pagination, the summary totals, and that one user cannot reach another user's expenses.

## Deployment

The app is deployed in three parts. Check each provider's current free-tier limits before you start.

1. **Database - MongoDB Atlas:** create a cluster and a database user, allow network access, copy the connection string.
2. **API - Render (Web Service):** root directory `server`, build command `npm install`, start command `npm start`. Set `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN` and `CLIENT_ORIGIN` in the dashboard.
3. **Client - Vercel:** root directory `client`, framework Vite. Set `VITE_API_URL` to `https://<your-api-address>/api`. The included `vercel.json` makes page refreshes work on routes like `/expenses/new`.
4. Go back to the API settings and set `CLIENT_ORIGIN` to the live client address, then redeploy the API.

## Screenshots

Add images of the main screens here (login, register, dashboard, add expense, edit expense, mobile view).

## Known limitations and future work

- One user role only; no admin
- No password reset or email verification
- Automated tests cover the API only; the React screens are tested manually
- Free hosting may be slow to wake up after being idle
- Ideas for later: budgets with alerts, charts over time, CSV export
