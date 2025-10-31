# TimeBank - Time-Based Currency Exchange

A full-stack time-sharing platform with cosmic aesthetics, built with Next.js 14, Node.js, Express, Prisma, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your PostgreSQL credentials
npx prisma generate
npx prisma migrate dev --name init_timebank_pg
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp env.example .env.local
# Edit .env.local with your API URL
npm run dev
```

## 🏗️ Architecture

### Backend (Node.js + Express + Prisma)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT with bcrypt password hashing
- **API**: RESTful endpoints for profiles, bookings, messaging, ledger
- **Models**: User, Profile, Booking, LedgerEntry, MessageThread, Connection, Notification

### Frontend (Next.js 14 + React 18)
- **Styling**: TailwindCSS with cosmic dark theme
- **Components**: shadcn/ui + lucide-react icons
- **Pages**: Dashboard, Directory, Profile, Requests, History, Notifications
- **Theme**: Deep space palette with sacred gold accents

## 📊 Core Features

### User Management
- Sign up/login with JWT authentication
- User profiles with skills, categories, availability
- Follow/unfollow connections

### Time Exchange
- Browse directory of profiles with filters
- Request time from other users
- Accept/decline time requests
- Complete sessions with atomic ledger updates

### Ledger System
- Balance computed from LedgerEntry (EARNED - SPENT)
- Transactional completion prevents double-spend
- Balance validation before spending

### Messaging
- Lightweight chat threads per booking
- Real-time communication between participants

## 🎨 Design System

### Cosmic Theme
- **Colors**: Deep slate backgrounds, yellow/amber accents
- **Typography**: Inter (body) + Orbitron (headings)
- **Icons**: Lucide React with cosmic motifs
- **Animations**: Gentle orbit/pendulum effects

### Components
- Glassmorphism panels with backdrop blur
- Gradient text effects for headings
- Status indicators with color coding
- Responsive grid layouts

## 🔧 API Endpoints

### Authentication
- `POST /auth/signup` - Create account
- `POST /auth/login` - Sign in
- `GET /auth/me` - Get current user

### Profiles
- `GET /profiles` - List profiles with filters
- `GET /profiles/:id` - Get specific profile

### Bookings
- `POST /booking` - Create time request
- `GET /booking` - List user's bookings
- `PATCH /booking/:id/accept` - Accept request
- `PATCH /booking/:id/decline` - Decline request
- `PATCH /booking/:id/cancel` - Cancel booking
- `POST /booking/:id/complete-confirm` - Complete session

### Wallet
- `GET /wallet/balance` - Get current balance
- `GET /wallet/history` - Get transaction history

## 🗄️ Database Schema

### Core Models
```prisma
model User {
  id           String      @id @default(cuid())
  email        String      @unique
  passwordHash String
  name         String
  avatarUrl    String?
  // Relations to Profile, Bookings, LedgerEntry, etc.
}

model Profile {
  id           String   @id @default(cuid())
  userId       String   @unique
  displayName  String
  skills       String[]
  categories   String[]
  availability Json
  // User relation
}

model Booking {
  id          String        @id @default(cuid())
  providerId  String
  receiverId  String
  hours       Decimal       @db.Decimal(4, 2)
  status      BookingStatus @default(PENDING)
  // Relations to User, MessageThread, LedgerEntry
}

model LedgerEntry {
  id           String     @id @default(cuid())
  userId       String
  hours        Decimal    @db.Decimal(10, 2)
  type         LedgerType // EARNED | SPENT
  refBookingId String?
  // Relations to User, Booking
}
```

## 🚦 Status Flow

### Booking States
1. **PENDING** - Initial request created
2. **ACCEPTED** - Provider accepted with optional time slot
3. **DECLINED** - Provider declined
4. **CANCELLED** - Either party cancelled
5. **COMPLETED** - Session finished, ledger updated

### Completion Flow
1. Either party marks session complete
2. Counterparty confirms completion
3. Atomic ledger update: EARNED for provider, SPENT for receiver
4. Balance validation prevents negative balances

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🐳 Docker (Optional)

After local development is stable:

```bash
# Create docker-compose.yml with PostgreSQL
docker-compose up -d
# Run migrations
npx prisma migrate deploy
```

## 📝 Environment Variables

### Backend (.env)
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/timebank
JWT_SECRET=your-super-secret-jwt-key
PORT=4000
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 🎯 Development Workflow

1. **Schema Changes**: Update `prisma/schema.prisma`, run `npx prisma migrate dev`
2. **API Changes**: Update routes in `backend/src/routes/`
3. **Frontend Changes**: Update pages in `frontend/src/app/`
4. **Testing**: Run tests after significant changes
5. **Deployment**: Use Docker for production deployment

## 🔮 Future Enhancements

- Real-time notifications with WebSockets
- Calendar integration for scheduling
- Rating and review system
- Mobile app with React Native
- Advanced search with Elasticsearch
- Payment integration for premium features

---

**Built with ❤️ and cosmic energy** ⭐