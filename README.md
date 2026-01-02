# ⏰ TimeBank - Time-Based Currency Exchange Platform

<div align="center">

![TimeBank Logo](https://img.shields.io/badge/TimeBank-v1.0.0-gold?style=for-the-badge&logo=clock&logoColor=white)

**Where Time Becomes Currency - Exchange Skills, Earn Credits, Build Community**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey?style=flat-square&logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.17-2D3748?style=flat-square&logo=prisma)](https://prisma.io/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite)](https://sqlite.org/)

[Demo](#demo) • [Features](#features) • [Tech Stack](#tech-stack) • [Installation](#installation) • [Architecture](#architecture)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

**TimeBank** is a full-stack time-banking application that enables users to exchange skills and services using time as currency. Built with modern web technologies, it features a stunning cosmic-themed UI and comprehensive functionality for managing time-based transactions.

### Why TimeBank?

- 🤝 **Community-Driven**: Build meaningful connections by exchanging skills
- ⏱️ **Fair Exchange**: Every hour is valued equally, regardless of the service
- 💰 **Time Credits**: Earn credits by helping others, spend them when you need help
- 🌐 **Local & Global**: Connect with people in your area or across the world
- 📊 **Transparent**: Complete transaction history and reputation system

---

## ✨ Features

### 🔐 Authentication & Authorization
- Secure JWT-based authentication
- Password hashing with bcrypt
- Protected routes and middleware
- Session management

### 👤 User Profiles
- Comprehensive profile creation
- Skills and categories listing
- Availability calendar
- Profile picture upload
- Bio and introduction video
- Rating and reputation system

### 🔍 Discovery & Directory
- Browse all user profiles
- Advanced search and filtering
- Filter by skills, location, and availability
- Responsive grid layout

### 📅 Booking System
- Send time requests to other users
- Accept/decline incoming requests
- Schedule time slots
- Status tracking (Pending, Accepted, Declined, Completed, Cancelled)
- Completion confirmation flow

### 💬 Messaging
- Real-time chat for each booking
- Message threads tied to bookings
- Notification system
- Unread message indicators

### 💰 Wallet & Ledger
- Time credit balance tracking
- Transaction history (earned/spent)
- Atomic transaction processing
- Detailed transaction records

### 🤝 Connections
- Follow/unfollow users
- Connection management
- Network building

### 🎨 Cosmic UI/UX
- Glassmorphism design
- Space-themed animations
- Responsive mobile-first design
- Smooth transitions and effects
- Accessible keyboard navigation

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14.2 (React 18.3)
- **Language**: TypeScript 5
- **Styling**: TailwindCSS 3.4, Custom CSS
- **State Management**: Zustand
- **Forms**: React Hook Form
- **HTTP Client**: Fetch API
- **Icons**: Lucide React, Heroicons
- **Animations**: Framer Motion
- **Notifications**: React Hot Toast

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js 4.21
- **Language**: TypeScript 5
- **ORM**: Prisma 6.17
- **Database**: SQLite (Development) / PostgreSQL (Production-ready)
- **Authentication**: JWT, bcrypt
- **Validation**: Zod
- **File Upload**: Multer
- **Real-time**: Socket.io (ready for messaging)
- **Security**: Helmet, CORS, Express Rate Limit

### DevOps & Tools
- **Version Control**: Git
- **Package Manager**: npm
- **Process Manager**: Concurrently
- **Linting**: ESLint
- **Type Checking**: TypeScript Compiler

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                     │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Next.js 14 Frontend (Port 3000)         │   │
│  │  • React Components                              │   │
│  │  • Zustand State Management                      │   │
│  │  • TailwindCSS Styling                          │   │
│  │  • Client-side Routing                          │   │
│  └─────────────────────┬───────────────────────────┘   │
└────────────────────────┼─────────────────────────────────┘
                         │
                    HTTP/REST API
                         │
┌────────────────────────▼─────────────────────────────────┐
│              Express.js Backend (Port 4000)              │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │              API Routes & Controllers            │   │
│  │  • /auth      • /profiles   • /booking          │   │
│  │  • /wallet    • /messages   • /connections      │   │
│  └───────────────────┬─────────────────────────────┘   │
│                      │                                   │
│  ┌───────────────────▼─────────────────────────────┐   │
│  │           Middleware & Services                  │   │
│  │  • JWT Authentication                            │   │
│  │  • Request Validation                            │   │
│  │  • Error Handling                               │   │
│  └───────────────────┬─────────────────────────────┘   │
│                      │                                   │
│  ┌───────────────────▼─────────────────────────────┐   │
│  │              Prisma ORM Layer                    │   │
│  │  • Type-safe database queries                    │   │
│  │  • Migration management                          │   │
│  │  • Schema validation                            │   │
│  └───────────────────┬─────────────────────────────┘   │
└────────────────────────┼─────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │  SQLite Database │
              │  • Users         │
              │  • Profiles      │
              │  • Bookings      │
              │  • Ledger        │
              │  • Messages      │
              └──────────────────┘
```

### Data Flow

1. **User Authentication**: JWT tokens stored in localStorage
2. **API Requests**: Authenticated requests with Bearer token
3. **Database Operations**: Prisma ORM handles all database interactions
4. **Response**: JSON data sent back to frontend
5. **State Management**: Zustand stores updated in React components

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: Latest version

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/prajwaldesaigithub/TimeBank.git
   cd TimeBank
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install

   # Return to root
   cd ..
   ```

3. **Set up environment variables**

   **Backend** (`backend/.env`):
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   PORT=4000
   NODE_ENV=development
   ```

   **Frontend** (`frontend/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

4. **Initialize the database**
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev --name init
   cd ..
   ```

5. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

### Quick Test

1. Open http://localhost:3000
2. Click "Get Started" to sign up
3. Create your profile
4. Browse the directory and start exchanging time!

---

## 📁 Project Structure

```
TimeBank/
├── backend/                      # Node.js + Express API
│   ├── src/
│   │   ├── routes/              # API route handlers
│   │   │   ├── auth-sqlite.ts   # Authentication endpoints
│   │   │   ├── profiles.ts      # User profile management
│   │   │   ├── booking.ts       # Booking system
│   │   │   ├── wallet.ts        # Wallet & ledger
│   │   │   ├── discovery.ts     # Profile discovery
│   │   │   ├── timeRequests.ts  # Time request management
│   │   │   └── connections.ts   # Connection system
│   │   ├── middleware/          # Express middleware
│   │   │   └── authMiddleware.ts # JWT verification
│   │   ├── lib/                 # Utilities
│   │   │   └── parseProfile.ts  # Profile parsing helpers
│   │   └── server.ts            # Express app setup
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   ├── migrations/          # Database migrations
│   │   └── dev.db              # SQLite database (dev)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                     # Next.js React application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/      # Reusable React components
│   │   │   │   ├── LandingHero.tsx
│   │   │   │   ├── ChatInterface.tsx
│   │   │   │   └── ...
│   │   │   ├── auth/            # Authentication pages
│   │   │   │   ├── login/
│   │   │   │   ├── signup/
│   │   │   │   └── complete-profile/
│   │   │   ├── dashboard/       # User dashboard
│   │   │   ├── directory/       # Profile directory
│   │   │   ├── profile/         # User profiles
│   │   │   ├── requests/        # Booking requests
│   │   │   ├── history/         # Transaction history
│   │   │   ├── notifications/   # Notifications page
│   │   │   ├── layout.tsx       # Root layout
│   │   │   ├── page.tsx         # Landing page
│   │   │   └── globals.css      # Global styles
│   │   └── lib/                 # Utility functions
│   │       ├── api.ts           # API client
│   │       └── utils.ts         # Helper functions
│   ├── public/                  # Static assets
│   ├── package.json
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── .gitignore                    # Git ignore rules
├── package.json                  # Root package scripts
├── docker-compose.yml            # Docker configuration
├── README.md                     # This file
├── LICENSE                       # MIT License
└── CONTRIBUTING.md               # Contribution guidelines
```

---

## 📡 API Documentation

### Authentication Endpoints

#### Sign Up
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <jwt_token>
```

### Profile Endpoints

#### Get All Profiles
```http
GET /profiles?search=developer&skills=JavaScript&category=Technology
Authorization: Bearer <jwt_token>
```

#### Get Profile by ID
```http
GET /profiles/:userId
Authorization: Bearer <jwt_token>
```

#### Update Profile
```http
PUT /profiles
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "displayName": "John Doe",
  "bio": "Full-stack developer",
  "skills": ["JavaScript", "TypeScript", "React"],
  "categories": ["Technology", "Education"],
  "availability": {
    "monday": ["09:00-17:00"],
    "tuesday": ["09:00-17:00"]
  }
}
```

### Booking Endpoints

#### Create Booking Request
```http
POST /booking
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "providerId": "user_id",
  "hours": "2.5",
  "category": "Technology",
  "note": "Need help with React",
  "startAt": "2024-01-15T10:00:00Z"
}
```

#### Get User Bookings
```http
GET /booking
Authorization: Bearer <jwt_token>
```

#### Accept Booking
```http
PATCH /booking/:bookingId/accept
Authorization: Bearer <jwt_token>
```

#### Complete Booking
```http
POST /booking/:bookingId/complete-confirm
Authorization: Bearer <jwt_token>
```

### Wallet Endpoints

#### Get Balance
```http
GET /wallet/balance
Authorization: Bearer <jwt_token>
```

#### Get Transaction History
```http
GET /wallet/history
Authorization: Bearer <jwt_token>
```

---

## 🗄️ Database Schema

### Core Models

#### User
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  name          String
  avatarUrl     String?
  reputation    Int      @default(0)
  credits       String   @default("10.00")
  isVerified    Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

#### Profile
```prisma
model Profile {
  id           String   @id @default(cuid())
  userId       String   @unique
  displayName  String
  bio          String?
  skills       String   @default("[]")
  categories   String   @default("[]")
  availability Json
  ratingAvg    Float?
  totalRatings Int      @default(0)
}
```

#### Booking
```prisma
model Booking {
  id          String        @id @default(cuid())
  providerId  String
  receiverId  String
  hours       String
  category    String
  status      BookingStatus @default(PENDING)
  startAt     DateTime?
  createdAt   DateTime      @default(now())
}
```

#### LedgerEntry
```prisma
model LedgerEntry {
  id           String     @id @default(cuid())
  userId       String
  hours        String
  type         LedgerType
  description  String?
  refBookingId String?
  createdAt    DateTime   @default(now())
}
```

### Relationships

```
User ──┬── Profile (1:1)
       ├── Bookings (1:N) - as provider
       ├── Bookings (1:N) - as receiver
       ├── LedgerEntries (1:N)
       ├── Messages (1:N)
       ├── Connections (1:N) - followers
       ├── Connections (1:N) - following
       └── Notifications (1:N)

Booking ──┬── MessageThread (1:1)
          ├── LedgerEntries (1:N)
          └── Dispute (1:1)

MessageThread ── Messages (1:N)
```

---

## 📸 Screenshots

### Landing Page
*Cosmic-themed hero section with feature showcase*

### Dashboard
*User balance, pending requests, and activity feed*

### Directory
*Browse and search user profiles*

### Profile Page
*Detailed user profile with skills, ratings, and availability*

### Booking Flow
*Request, accept, and complete time sessions*

### Transaction History
*Complete ledger of earned and spent time credits*

> **Note**: Add actual screenshots to `/docs/screenshots/` directory

---

## 🎯 Key Highlights for Placement

### Technical Skills Demonstrated
- ✅ **Full-Stack Development**: End-to-end application architecture
- ✅ **Modern Tech Stack**: React, Next.js, Node.js, TypeScript, Prisma
- ✅ **Database Design**: Complex relational schema with proper indexing
- ✅ **Authentication & Security**: JWT, bcrypt, protected routes
- ✅ **RESTful API**: Well-structured API with proper HTTP methods
- ✅ **State Management**: Zustand for efficient client-state
- ✅ **Responsive Design**: Mobile-first, accessible UI
- ✅ **Real-time Features**: WebSocket-ready architecture
- ✅ **Version Control**: Git workflow with proper commits

### Business Logic
- 💡 Time-based transaction system
- 💡 Reputation and rating mechanism
- 💡 Booking workflow with state management
- 💡 Double-entry ledger for accurate accounting
- 💡 Connection and network building

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Prajwal Desai**

- GitHub: [@prajwaldesaigithub](https://github.com/prajwaldesaigithub)
- LinkedIn: [https://www.linkedin.com/in/prajwal-desai-3697ba257]
- Email: beingprajwaldesai@gmail.com

---

## 🙏 Acknowledgments

- Inspired by community time-banking initiatives
- Built with modern open-source technologies
- Cosmic design inspired by space exploration

---

## 📞 Support

If you have any questions or need help getting started:

- 📧 Email: your.email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/prajwaldesaigithub/TimeBank/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/prajwaldesaigithub/TimeBank/discussions)

---

<div align="center">

**Built with ❤️ and cosmic energy** ⭐

*TimeBank - Where every hour has value, every skill matters, and every connection counts.*

[![Star this repo](https://img.shields.io/github/stars/prajwaldesaigithub/TimeBank?style=social)](https://github.com/prajwaldesaigithub/TimeBank)

</div>
