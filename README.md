# Expense Tracker Backend API

A Node.js and MongoDB backend API for the Expense Tracker application built with Express.js.

## Features

- User authentication (Register/Login with JWT)
- Create, read, update, and delete expenses
- Filter expenses by month, year, and category
- Expense statistics and summaries
- Theme preference management
- Password encryption with bcryptjs

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your settings:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense-tracker
NODE_ENV=development
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

## Running the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)
- `PUT /api/auth/theme` - Update user theme (requires auth)

### Expenses
- `GET /api/expenses` - Get all expenses (requires auth)
- `GET /api/expenses/:id` - Get a specific expense (requires auth)
- `POST /api/expenses` - Create a new expense (requires auth)
- `PUT /api/expenses/:id` - Update an expense (requires auth)
- `DELETE /api/expenses/:id` - Delete an expense (requires auth)
- `GET /api/expenses/stats/summary` - Get expense statistics (requires auth)

## Project Structure

```
backend/
├── config/
│   └── db.js              # MongoDB connection setup
├── models/
│   ├── User.js            # User schema
│   └── Expense.js         # Expense schema
├── controllers/
│   ├── authController.js  # Authentication logic
│   └── expenseController.js # Expense logic
├── routes/
│   ├── authRoutes.js      # Auth endpoints
│   └── expenseRoutes.js   # Expense endpoints
├── middleware/
│   └── auth.js            # JWT authentication middleware
├── server.js              # Main server file
├── package.json           # Dependencies
├── .env.example           # Environment variables template
└── .gitignore             # Git ignore file
```

## MongoDB Connection

Make sure MongoDB is running before starting the server. You can:

1. **Local MongoDB**: Ensure MongoDB service is running on `mongodb://localhost:27017`
2. **MongoDB Atlas**: Use your connection string in `.env` file

Example MongoDB Atlas connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense-tracker?retryWrites=true&w=majority
```

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - JWT token expiration time
- `CLIENT_URL` - Frontend client URL for CORS

## Frontend Integration

The frontend should connect to the backend at `http://localhost:5000` (or your production URL).

Update your frontend API calls:
```javascript
const API_URL = 'http://localhost:5000/api';

// Authentication
await fetch(`${API_URL}/auth/register`, { /* ... */ });
await fetch(`${API_URL}/auth/login`, { /* ... */ });

// Expenses
await fetch(`${API_URL}/expenses`, { /* ... */ });
```

## Adding Authorization Header

Include the JWT token in all authenticated requests:
```javascript
const token = localStorage.getItem('authToken');
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

await fetch(`${API_URL}/expenses`, {
  method: 'GET',
  headers: headers
});
```

## License

ISC
