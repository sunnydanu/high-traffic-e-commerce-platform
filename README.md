# 🛒 ecommerce-flash-backend

A scalable backend infrastructure for a high-traffic e-commerce platform, built with microservices using **Node.js**, **Kafka**, **PostgreSQL**, and **Redis**.

> ✅ Supports flash sales, real-time order processing, and resilient architecture.

## 📦 Microservices Overview

| Service           | Description                                               |
|------------------|-----------------------------------------------------------|
| `inventory-service` | Manages product catalog, stock, caching, auth           |
| `order-service`     | Simulates placing orders, emits Kafka events            |
| `event-consumer`    | Consumes order events, updates inventory                |
| `auth-service` (optional) | Issues JWTs to authenticate users and admins |

## ⚙️ Tech Stack

- **Node.js** + **Express** (REST APIs)
- **Kafka (via Kafkajs)** for event-driven communication
- **PostgreSQL** (main database)
- **Redis** (caching layer)
- **Docker Compose** (multi-service orchestration)
- **JWT Auth** for secure endpoints
- **Rate limiting**, **input validation**, and **transaction safety**

## 🚀 Getting Started

### 🔧 Prerequisites

- Docker + Docker Compose
- Node.js (for local service dev)
- Kafka client (optional for manual testing)

### 🔄 Clone & Setup

```bash
git clone https://github.com/yourusername/ecommerce-flash-backend.git
cd ecommerce-flash-backend
cp .env.example .env
```
Update any environment values in .env if needed.

🐳 Start All Services
 ```bash
docker-compose up --build
Services exposed:
```
Inventory: http://localhost:3000

Order: http://localhost:3001

Kafka: localhost:9092

Redis: localhost:6379

PostgreSQL: localhost:5432

Auth :  http://localhost:3002

📚 API Reference
🔐 Auth
If using auth-service:

```http
POST /login
```
Payload:
```json
{
  "username": "admin",
  "password": "admin123"
}
```
Returns:

```json
{ "token": "..." }
```

# 📦 Inventory Service (port 3000)

```http
GET /products?page=1&limit=5&category=Electronics
```
Returns paginated and filtered product list.
##
GET /products/:id
Returns product by ID (cached via Redis).
##
POST /products (Admin only)
Add a product. Requires JWT.
##
PUT /products/:id (Admin only)
Update product details.


DELETE /products/:id (Admin only)
Remove product.
##
PATCH /products/:id/stock
Atomic stock update.

# 🛒 Order Service (port 3001)

POST /orders
Simulates a user placing an order. Emits a Kafka event.

```json

{
  "user_id": "user_123",
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 3, "quantity": 1 }
  ]
}
```
Response:

```json
{
  "message": "Order placed",
  "event": { ... }
}
```
# ⚙️ Kafka Event Flow

Event	Triggered From	Consumed By
order_placed	order-service	event-consumer
stock_updated	(future upgrade)	inventory /  

# 🧪 Load Testing
Use Artillery or k6:

```bash
artillery run load-test.yml
```
# 🧰 Project Structure
```vbnet
ecommerce-flash-backend/
├── apps/
│   ├── inventory-service/
│   ├── order-service/
│   ├── event-consumer/
│   └── auth-service/       
├── docker-compose.yml
├── .env.example
└── README.md
```
# 🛡 Security

- JWT auth with role validation
- Input validation via Joi 
- Redis TTL caching to prevent overload
- Rate-limiting per endpoint/IP
- All DB updates inside transactions

# 🔁 Replay Kafka Events (Optional)

Use the Kafka CLI to replay a past order_placed event:

```bash
docker exec -it kafka kafka-console-producer.sh \
  --broker-list localhost:9092 --topic order_placed
  ```
Paste a saved event like:

```json
{
  "event_type": "order_placed",
  "user_id": "user_001",
  "order_id": "order_999",
  "items": [
    { "product_id": 1, "quantity": 5 }
  ]
}
```
# 🧼 Database Schema
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10,2),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
#### 👉 See init.sql and seed.sql under apps/inventory-service/ for full setup.

# 🧪 Manual Testing (Curl/Postman)

See /postman.json or use the Postman collection provided earlier.

🚀 CI/CD Setup (Coming soon)
You can use:

GitHub Actions → .github/workflows/deploy.yml

Jenkins, GitLab CI for Docker builds + deploys

🧑‍💻 Authors
Sunny Danu — backend system design and implementation