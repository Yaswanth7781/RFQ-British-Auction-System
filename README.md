# RFQ British Auction System

An enterprise-ready procurement reverse-auction platform built on a MERN stack microservices architecture. It allows buyers to publish Requests for Quotation (RFQs) and suppliers to compete dynamically through British Auction style bidding with real-time countdowns and automatic time extensions.

---

## Technical Stack

- **Frontend**: React, Tailwind CSS, Lucide Icons, React Router, Axios, Context API
- **Backend**: Node.js, Express.js (4 autonomous services)
- **Database**: MongoDB, Mongoose ODM
- **Deployment**: Docker, Docker Compose

---

## Project Directory Structure

```
rfq-auction-system/
│
├── auth-service/           # User registry, login & profile (Port 5001)
├── rfq-service/            # RFQ publishing & configuration (Port 5002)
├── bidding-service/        # Bid submission & standings calculations (Port 5003)
├── notification-service/   # Audit logging & user alerts (Port 5004)
├── frontend/               # Single Page Application React (Port 3000)
│
├── docker-compose.yml      # Roots docker orchestrator
└── README.md
```

---

## Port Allocations & Configurations

| Service | Port | Description |
| :--- | :--- | :--- |
| **Frontend** | `3000` | React client console |
| **Auth Service** | `5001` | JWT user registry hub |
| **RFQ Service** | `5002` | RFQ publication endpoint |
| **Bidding Service** | `5003` | Quotations & British auction engine |
| **Notification Service** | `5004` | Audit logging feed |
| **MongoDB (Local)** | `27017` | Local DB container |

---

## Database Schemas (Mongoose)

### 1. User Schema (Auth Collection)
- `name` (String, required)
- `email` (String, required, unique)
- `password` (String, required, select: false)
- `role` (String: `'buyer'` / `'seller'`)

### 2. RFQ Schema (RFQ Collection)
- `rfqName` (String, required)
- `referenceId` (String, required, unique)
- `bidStartTime` (Date, required)
- `bidCloseTime` (Date, required)
- `forcedCloseTime` (Date, required)
- `pickupDate` (Date, required)
- `buyerId` (ObjectId, required)
- `status` (String: `'Active'`, `'Closed'`, `'Force Closed'`)

### 3. AuctionConfig Schema (RFQ Collection)
- `rfqId` (ObjectId, unique, ref: RFQ)
- `triggerWindow` (Number, in minutes)
- `extensionDuration` (Number, in minutes)
- `triggerType` (String: `'Bid Received'`, `'Any Rank Change'`, `'Lowest Bidder Change'`)

### 4. Bid Schema (Bidding Collection)
- `rfqId` (ObjectId, required)
- `sellerId` (ObjectId, required)
- `sellerName` (String, required)
- `freightCharges` (Number, required)
- `originCharges` (Number, required)
- `destinationCharges` (Number, required)
- `totalAmount` (Number, required - auto-calculated)
- `transitTime` (Number, in days)
- `validity` (Date, required)

### 5. Activity Log Schema (Notification Collection)
- `rfqId` (ObjectId, required)
- `actionType` (String: `'Bid Placed'`, `'Extension'`, `'Status Change'`, `'Creation'`)
- `description` (String, required)
- `timestamp` (Date, default: Date.now)

---

## Core British Auction Logic

1. **Price Reduction Rule**: When a supplier submits a bid, it is verified against their own previous submissions. The new total amount (`freight + origin + destination`) must be lower than their current best quote.
2. **Trigger Window Monitoring**: If a valid bid is placed within $X$ minutes (e.g. 5 minutes) of the `bidCloseTime`:
   - **Bid Received**: Extends closing time.
   - **Any Rank Change**: Extends closing time if the sequence order of supplier bids changes.
   - **Lowest Bidder Change (L1)**: Extends closing time if a new L1 bidder takes the lead.
3. **Extensions**: The `bidCloseTime` is incremented by $Y$ minutes (e.g. 5 minutes) but is capped strictly at `forcedCloseTime`. No bids are accepted after `forcedCloseTime`.

---

## REST Endpoints Overview

### Auth Service (`:5001`)
- `POST /api/auth/register` - Create profile
- `POST /api/auth/login` - Get token
- `GET /api/auth/profile` - Verify profile details

### RFQ Service (`:5002`)
- `POST /api/rfq/create` - Create RFQ & Config (Buyer only)
- `GET /api/rfq/list` - Fetch all RFQs (Includes dynamic status checks)
- `GET /api/rfq/:id` - Fetch single RFQ configuration details
- `PUT /api/rfq/:id` - Edit RFQ parameters
- `PUT /api/rfq/internal/extend/:id` - Extend close time (Internal)

### Bidding Service (`:5003`)
- `POST /api/bid/create` - Submit quote & evaluate extensions (Seller only)
- `GET /api/bid/list/:rfqId` - Fetch all quotes (Sorted ascending by total price)
- `GET /api/bid/rank/:rfqId` - Fetch standings rankings (L1, L2, L3)

### Notification Service (`:5004`)
- `POST /api/notifications` - Create user alert
- `GET /api/notifications` - Fetch alerts feed
- `POST /api/notifications/activity` - Log audit log (Internal)
- `GET /api/activity/:rfqId` - Fetch audit feed for RFQ

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) (v18+)
- [MongoDB](https://mongodb.com) (or connection URL)
- [Docker](https://docker.com) & Docker Compose (Optional)

### Option A: Local Run (Separate Consoles)

1. **MongoDB Configuration**:
   Create `.env` files in `auth-service/`, `rfq-service/`, `bidding-service/`, and `notification-service/` setting your `MONGO_URI`. You can use the Atlas MongoDB instance provided or local URI:
   ```env
   MONGO_URI=mongodb+srv://dockerdb:Yash@90325@cluster0.ftbdz40.mongodb.net/rfq_auction_system?appName=Cluster0
   JWT_SECRET=rfq_super_secret_key_123
   ```
2. **Start Services**:
   Run `npm install` and `npm run dev` in each of the 4 backend folders:
   - `auth-service/` (port 5001)
   - `rfq-service/` (port 5002)
   - `bidding-service/` (port 5003)
   - `notification-service/` (port 5004)
3. **Start Frontend**:
   Navigate to `frontend/` and run:
   ```bash
   npm install
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

---

### Option B: Running with Docker Compose

To orchestrate all services along with a local MongoDB instance:

1. In the root directory, run:
   ```bash
   docker-compose up --build
   ```
2. Once the build completes, the services are accessible:
   - Frontend: `http://localhost:3000`
   - Services are exposed locally on ports `5001` - `5004`.
