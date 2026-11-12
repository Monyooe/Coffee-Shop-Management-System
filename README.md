# Coffee Shop Management System

## 1. Project Description

The Coffee Shop Management System is a web-based application designed to help manage coffee shop operations.

The system provides a backend REST API for managing menu items, customer orders, prices, order statuses and daily sales summaries.

It uses Redis as a cloud-based NoSQL database to store menu and order information.

## 2. Technologies Used

- **Node.js** – JavaScript runtime.
- **Express.js** – Backend web framework.
- **Redis (Upstash)** – Cloud NoSQL database.
- **REST API** – Communication between application components.
- **JWT (JSON Web Token)** – Staff authentication.
- **CORS** – Cross-origin resource sharing.
- **dotenv** – Environment variable management.
- **Git and GitHub** – Version control and source code hosting.
- **Render** – Backend cloud deployment.

## 3. Project Structure

```text
Coffee-Shop-Management-System/
│
├── backend/
│   ├── middleware/
│   │   └── auth.js
│   │
│   ├── routes/
│   │   ├── menu.js
│   │   └── orders.js
│   │
│   ├── database.js
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

## 4. Installation Instructions

### Requirements

- Node.js
- npm
- Git
- Upstash Redis account

### Clone the repository

```bash
git clone https://github.com/Monyooe/Coffee-Shop-Management-System.git
```

### Enter the backend directory

```bash
cd Coffee-Shop-Management-System/backend
```

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env` file inside the backend folder using `.env.example` as a guide.

Add the following variables:

```env
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
JWT_SECRET=your_secret_key
STAFF_USERNAME=admin
STAFF_PASSWORD=your_staff_password
PORT=5000
```

Replace the placeholder values with your own credentials.

**Never upload your actual `.env` file or database credentials to GitHub.**

### Start the backend

For development:

```bash
npm run dev
```

For normal operation:

```bash
npm start
```

The local backend runs on:

`http://localhost:5000`

## 5. Database Configuration

The application uses Upstash Redis as its cloud NoSQL database.

Redis stores data using unique keys and JSON values.

Examples of stored keys include:

- `menu:ids` – Stores menu item identifiers.
- `menu:<id>` – Stores individual menu item records.
- `orders:ids` – Stores order identifiers.
- `orders:<id>` – Stores individual order records.

Database credentials are configured using environment variables.

## 6. REST API Endpoints

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Checks API and database connection |

### Menu Management

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/menu` | Retrieve all menu items | Public |
| GET | `/api/menu/:id` | Retrieve a menu item | Public |
| POST | `/api/menu` | Add a menu item | Staff |
| PUT | `/api/menu/:id` | Update a menu item | Staff |
| DELETE | `/api/menu/:id` | Delete a menu item | Staff |

### Order Management

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/orders` | Retrieve all orders | Staff |
| GET | `/api/orders/:id` | Retrieve an order | Staff |
| POST | `/api/orders` | Place a customer order | Public |
| PATCH | `/api/orders/:id/status` | Update order status | Staff |

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/staff/login` | Staff login and JWT generation |

Staff-only endpoints require a valid JWT bearer token.

## 7. Order Statuses

Orders can have the following statuses:

1. Pending
2. Preparing
3. Ready
4. Collected

The staff authentication system protects menu management and order administration operations.

## 8. Live Deployment

**GitHub Repository:**

https://github.com/Monyooe/Coffee-Shop-Management-System

**Live Backend:**

https://coffee-shop-management-system-qzq2.onrender.com

**Health Check:**

https://coffee-shop-management-system-qzq2.onrender.com/api/health

**Menu API:**

https://coffee-shop-management-system-qzq2.onrender.com/api/menu

## 9. Staff Login Instructions

Staff members must authenticate through:

`POST /api/staff/login`

The login credentials are configured through the following environment variables:

- `STAFF_USERNAME`
- `STAFF_PASSWORD`

A successful login returns a JWT token.

The token must be included in the Authorization header when accessing protected endpoints:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

Actual passwords and tokens must never be included in this documentation.

## 10. Testing

The backend has been tested for:

- API health checks.
- Database connectivity.
- Retrieving menu items.
- Adding menu items.
- Updating menu items.
- Deleting menu items.
- Placing customer orders.
- Retrieving orders.
- Updating order statuses.
- Staff authentication.
- Invalid request validation.
- Unauthorized access protection.
- Database persistence after server restart.

## 11. Deployment

The backend is deployed using Render.

The application connects to Upstash Redis through environment variables configured in the Render dashboard.

The GitHub repository is connected to Render for deployment from the `main` branch.

## 12. Security

- Environment variables are used for sensitive credentials.
- `.env` is excluded from Git using `.gitignore`.
- JWT authentication protects staff operations.
- Input validation is implemented for menu items and customer orders.
- API error handling is included.
