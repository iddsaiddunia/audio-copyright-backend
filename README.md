# Audio Copyright Backend v2.5

## Overview
This backend provides a robust API for audio copyright management, user/artist verification, blockchain wallet generation, and integration with audio fingerprinting and verification services. Built with TypeScript, Express, Sequelize, and Ethers.js, it supports role-based access control and secure workflows for admins, content managers, technical staff, and artists.

---

## User Roles
- **super admin**: Full access to all admin features, including user management and audit logs.
- **technical admin**: Can manage users, verify artists, and access technical endpoints.
- **content admin**: Can approve/verify artists, manage content, and assign roles.
- **financial admin**: Can approve/verify artists, manage content, and assign roles.
- **artist**: Can register, submit works, and receive blockchain wallet addresses upon verification.
- **lincensee**: Can register, submit works, and receive blockchain wallet addresses upon verification.

---

## API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new user (admin or artist)
- `POST /api/auth/login` — Login and receive JWT token

### User Management
- `GET /api/users` — List all users (admin only)
- `GET /api/users/:id` — Get user profile
- `POST /api/users` — Create a new user (admin only)
- `PUT /api/users/:id` — Update user profile
- `DELETE /api/users/:id` — Delete a user (cannot delete super admin)

### User Status & Verification
- `PUT /api/users/:id/status` — Update user status (active, inactive, etc.)
- `PUT /api/users/:id/verify` — Verify an artist and generate Ethereum wallet address if not present

### Track Management
- `POST /api/tracks/upload` — Upload a new audio track (verified artist only)
- `GET /api/tracks/my` — List all tracks uploaded by the current artist (artist only)
- `GET /api/tracks/pending` — List all tracks pending approval (content admin only)
- `POST /api/tracks/:id/approve` — Approve a pending track (content admin only)
- `POST /api/tracks/:id/reject` — Reject a pending track (content admin only)
- `GET /api/tracks/:id` — Get details for a specific track (authenticated)

### Payment Management
- `POST /api/payments/create` — Create a new payment for copyright registration (artist only)
- `POST /api/payments/transfer/create` — Create a payment for copyright transfer (artist only)
- `POST /api/payments/licensing/create` — Create a payment for licensing (artist only, requires `amount`)
- `GET /api/payments/pending` — List all pending payments (financial admin only)
- `POST /api/payments/:id/approve` — Approve a pending payment (financial admin only)
- `POST /api/payments/:id/reject` — Reject a pending payment (financial admin only)

### Transfer & Licensing
- `POST /api/transfer/:trackId/transfer` — Transfer copyright ownership to a new owner (requires approved transfer payment)
- `POST /api/licensing/:trackId/issue` — Issue a license for a track (requires approved licensing payment, provide licenseeId, terms, duration)

### Blockchain Integration
- `GET /api/tracks/:id/copyright/check` — Check if a track's fingerprint is already copyrighted on-chain (authenticated)
- `POST /api/tracks/:id/publish` — Publish a track's copyright to the blockchain (technical/super admin only; requires approved track and fingerprint)
- Upon artist verification, an Ethereum wallet address is generated (using Ethers.js) and stored in the `walletAddress` field of the user. The private key is **never stored** in the database; it is delivered securely to the artist.

### Audio Copyright & Fingerprinting (Integration)
- The backend integrates with a dedicated audio fingerprinting microservice for:
  - Audio fingerprint generation
  - Duplicate detection
  - Similarity matching

---

## Database Model (User)
- `id`: User ID
- `firstName`, `lastName`, `email`, `phoneNumber`, `idNumber`
- `role`: 'super', 'technical', 'content', 'artist', licensee
- `adminType`: 'super', 'technical', 'content' (if admin)
- `status`: User status (e.g., active, inactive)
- `isVerified`: Boolean, true if artist is verified
- `walletAddress`: Ethereum address (generated on verification)

---

## Security & Audit
- JWT authentication for all protected routes
- Role-based access control middleware
- Audit logging for user/admin actions
- No private keys are stored in the database

---

## Setup
1. Install dependencies: `npm install`
2. Configure your database and environment variables in `.env`
3. Run the backend: `npm run dev`

---

## Roadmap / Next Steps
- Add automated tests for endpoints
- Expand documentation for audio fingerprinting endpoints
- Enhance secure delivery of wallet private keys to artists
- Improve error handling and validation

---

## Contact
For questions or contributions, please contact the project maintainer.
