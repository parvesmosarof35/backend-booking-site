# Restaurant Table Reservation & Ordering Platform — Backend API

Production-ready NestJS backend for Restaurant & Hotel Table Reservation, Floor Plan Layout, Online Food Ordering, CMS, and Admin Control Panel.

## Features
- **Authentication & Roles**: JWT Access + Refresh Tokens with rotation, seeded Superadmin user (`SUPER_ADMIN_EMAIL`), and `RolesGuard` (`superadmin`, `admin`, `staff`).
- **Table & Floor Plan Management**: Real-time table status tracking, 2D coordinates for canvas drag-and-drop floor plan builder.
- **Shifts & Slots Engine**: Custom shifts, slot generator with configurable interval (30/60 min) and capacity safeguards.
- **Table Booking Engine**: Smallest fitting table auto-assignment, 5-minute TTL hold to prevent double bookings, Nodemailer confirmation emails, and Socket.io broadcasts.
- **Online Ordering & Dynamic Checkout**: Validates real prices server-side, supports COD-only toggle mode (`PaymentSettings`) and manual mobile banking (bKash/Nagad/Rocket/Bank) with transaction references.
- **CMS & Rich Content**: About Us, Privacy Policy, Terms & Conditions, and drag-and-drop reorderable FAQ.
- **Analytics Engine**: Incrementing counters for top 10 items + daily 30-day time-series data for Recharts dashboards.
- **Media Uploads**: Direct Cloudinary integration with secure URL return.
- **Swagger Documentation**: Interactive API testing available at `/api/docs`.

## Environment Setup
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

## Running Locally
```bash
# Install dependencies
npm install

# Run in development mode
npm run start:dev

# Build production bundle
npm run build

# Start production server
npm run start:prod
```

## Docker Deployment
```bash
docker build -t restaurant-backend .
docker run -p 5017:5017 --env-file .env restaurant-backend
```
