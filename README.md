# FeatureFlow - Project & Architecture Documentation

## 1. Project Overview
**FeatureFlow** is a distributed, real-time feature flag management system and client SDK. It allows developers to toggle features, manage rollouts, and track real-time usage analytics without redeploying code. 

Built with an emphasis on event-driven architecture and distributed systems principles, it achieves 0ms local evaluation latency while maintaining real-time synchronization across connected clients.

## 2. Technology Stack
* **Backend Interface:** Node.js, Express.js
* **Client SDK:** React, Context API, Server-Sent Events (SSE)
* **Database:** PostgreSQL (Supabase)
* **Cache & Message Broker:** Redis (Upstash)
* **Admin Dashboard:** Next.js, Recharts, Tailwind CSS
* **Deployment:** Render/Railway (Backend - SSE optimized), Vercel (Dashboard)

## 3. Core System Architecture

### 3.1. The Rules Engine & Cache-Aside Implementation
To prevent database bottlenecks during traffic spikes, the system employs a highly optimized Cache-Aside pattern with Cache Stampede prevention.
* **Read Path:** The backend checks Redis first. On a cache miss, it acquires an exclusive Redis Lock (`NX`, `EX`) before querying PostgreSQL.
* **Concurrency Control:** Secondary requests poll the cache while the locked worker queries the DB, preventing connection pool exhaustion.

### 3.2. Real-Time Streaming (SSE & Pub/Sub)
Updates are broadcasted instantly to all connected clients using a combination of Redis Pub/Sub and Server-Sent Events (SSE).
* **Admin Toggle:** When a flag is toggled, the cache is invalidated, and the new ruleset is published to a Redis channel (`project_updates:<id>`).
* **SSE Bridge:** A dedicated Redis Subscriber connection listens for updates and pushes them down the open HTTP streams to connected React clients.

### 3.3. The Analytics Loop (Zero-Latency Tracking)
Feature evaluation happens entirely in browser memory (0ms latency), but usage metrics are securely tracked and synchronized.
* **Client Buffer:** The React SDK batches flag evaluations in memory.
* **Async Flush:** Every 10 seconds, the SDK flushes the buffer to the `/track` endpoint.
* **Redis Queue:** The API pushes events into a Redis List (`LPUSH`) and immediately returns a `202 Accepted`.
* **Background Worker:** A background process drains the Redis queue every 15 seconds, aggregates the counts, and performs a bulk Upsert (`ON CONFLICT`) into PostgreSQL.

## 4. Database Schema Structure

### `feature_flags`
* `id` (UUID, Primary Key)
* `project_id` (UUID, Foreign Key)
* `name` (String, Unique per project)
* `status` (Boolean)
* `created_at` (Timestamp)

### `targeting_rules`
* `id` (UUID, Primary Key)
* `flag_id` (UUID, Foreign Key)
* `attribute` (String - e.g., 'email', 'plan')
* `operator` (String - e.g., 'EQUALS', 'IN')
* `value` (JSON/String)
* `rollout_percentage` (Integer)

### `usage_logs`
* `flag_id` (UUID, Foreign Key)
* `evaluation_date` (Date)
* `status` (Boolean)
* `count` (Integer)
* **Constraint:** `UNIQUE (flag_id, evaluation_date, status)`

## 5. Deployment Strategy
* **Database & Cache:** Supabase (PostgreSQL) and Upstash (Redis) provide remote, serverless data persistence.
* **Backend (Express):** Hosted on Render or Railway. These platforms support long-running Docker containers necessary to keep Server-Sent Events (SSE) connections open without aggressive timeouts.
* **Frontend (Next.js Dashboard):** Deployed to Vercel for Edge caching and seamless CI/CD integration.
* **NPM SDK:** The React SDK is compiled and distributed as an NPM package for integration into consumer applications.

## 6. Future Scope & Enhancements
* **Advanced User Segmentation:** Evaluating targeting rules based on geographic location, subscription tiers, or specific user IDs.
* **A/B Testing Analytics:** Correlating specific feature flag states with conversion metrics and user journey success rates.
* **Multi-Environment Support:** Creating isol
