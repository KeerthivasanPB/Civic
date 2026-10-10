# CivicSync 🏗️ 
**Transforming Public Works through Transparency, Coordination, and Citizen Auditing.**

[![Demo Video](https://img.shields.io/badge/Watch-Demo_Video-red?style=for-the-badge&logo=youtube)](#)(https://drive.google.com/file/d/1uI4r0yuThjPHRXwfkhlV7hTromXnvrzf/view?usp=sharing)
[![Deployment](https://img.shields.io/badge/Live-Deployment-success?style=for-the-badge)](#) (https://civic-chi-two.vercel.app/)
---

## 🚨 The Problem
Every day, residents see roads dug up, drains repaired, and pipelines laid. Yet, there is zero transparency. 
*   **Citizens** have no idea who is digging, why, or when it will end. They cannot plan their commutes and suffer business losses. 
*   **Government Departments** (Water, Telecom, PWD) operate in silos. A newly paved road is often dug up the next day by a different department, wasting crores of taxpayer money.
*   **Accountability** is non-existent. When a contractor abandons a job or leaves behind a mess, citizens have no reliable way to report it and hold the contractor accountable.

---

## 💡 Our Solution: The Tri-Partite System
**CivicSync** is a unified GIS-based coordination platform that solves this through a **3-Way Closed-Loop Accountability System**:

1.  **Top-Down (Government):** Departments upload their planned infrastructure projects.
2.  **Middle-Out (Contractors):** Verified contractors update live operational timelines (Start/End dates).
3.  **Bottom-Up (Citizens):** Residents act as decentralized auditors, verifying ground truth by uploading geotagged photos of stalled or badly finished works.

---

## ✨ Key Innovative Features

### 1. The "Dig Once" Conflict Detection Algorithm 🧠
When Department A applies for a permit to excavate "Main Street" in October, the system automatically scans the database. If Department B has a planned excavation for "Main Street" in November, the system blocks the permit and flags a **"Co-location Opportunity."** This forces departments to share trenches, saving massive amounts of public funds and halving citizen disruption.

### 2. Taxpayer Savings Dashboard 💰
Transparency builds trust. The public homepage features a live counter calculating the estimated taxpayer money saved by the system's "Dig Once" conflict resolutions.

### 3. Citizen Ground-Truth Auditing 📸
If a contractor marks a project as "Completed" in the system to release their government payment, but the road is still a mess, citizens can drop a pin on the public map and upload a photo. This instantly flags the project, ensuring contractors are held accountable before tax money is released.

### 4. Proactive Commute Alerts (WhatsApp Bot) 📱
Instead of forcing users to check a map every day, citizens can receive automated alerts on their phones. Citizens can also report stalled projects directly by sending a geotagged photo to our **WhatsApp Bot**, bypassing the need for a web app.

---

## 🛠️ Technical Implementation & Architecture

### Staggered Regional Polling (Incremental Syncing) 🔄
To prevent abusing the OpenStreetMap Government APIs and to ensure lightning-fast performance, CivicSync utilizes a **Staggered Regional Polling Architecture**. 
* The backend chunks the country into major regional bounding boxes (North, South, East, West).
* Every 60 minutes, a cron job fetches live data for a specific region and incrementally synchronizes it into our high-speed cache.
* This ensures the application never crashes due to external API failures and our database grows continuously richer over time without hitting rate limits.

### Tech Stack
*   **Frontend:** React.js / Next.js, Tailwind CSS
*   **Mapping:** Leaflet & OpenStreetMap (100% Free & Open Source)
*   **Backend:** Node.js / Express (RESTful API)
*   **Database (Hackathon Prototype):** High-speed In-Memory JavaScript Database (similar to Redis cache) for rapid geodata ingestion.
*   **Database (Production):** PostgreSQL with **PostGIS** extension for advanced geospatial querying.
*   **Authentication:** Custom JWT-based Role-Based Access Control (RBAC)
*   **Communications:** `whatsapp-web.js` (Unofficial free WhatsApp API using headless Chrome)

---

## 🚀 Setup Instructions (Local Deployment)

### Prerequisites
*   Node.js (v18+)
*   A smartphone with WhatsApp installed (to scan the bot QR code, if bot is enabled)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/CivicSync.git
   cd CivicSync
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   node index.js
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. **Access the App**
   Open `http://localhost:3000` in your browser.

*Note: For the hackathon demo, the application uses an In-Memory caching database seeded with realistic, geocoded municipal projects to guarantee a flawless presentation, supplemented by the live OpenStreetMap integration.*

---

## ☁️ Deployment Pipeline (Production)

To deploy CivicSync for the judges or production, follow this highly scalable pipeline:

1. **Frontend Hosting (Vercel):** 
   - Connect your GitHub repository to Vercel. 
   - Vercel will automatically detect the Next.js `frontend` folder and deploy your application to a global CDN (e.g., `civicsync.vercel.app`).
2. **Backend Hosting (Render / Railway):** 
   - Connect the repository to Render (Web Service). 
   - Set the Root Directory to `backend` and the Start Command to `node index.js`. This will host your Express API continuously.
3. **Database (Neon / Supabase):** 
   - When migrating from the In-Memory cache to production, provision a serverless Postgres database on Neon or Supabase and enable the `postgis` extension.

---

## 🔮 Feasibility & Future Scope
CivicSync is designed to be highly scalable and adoption-ready:
*   **Smart Escrow Payments (Contractor Accountability):** Integration with government treasuries where a contractor's final payout is managed via an integrated Escrow system. When a contractor marks a job as "Complete," the funds are locked in escrow during a 7-day "Citizen Objection Window." If no validated citizen complaints (photos of bad work) are received, the payment is automatically released. This strictly incentivizes clean, fast completion of public works.
