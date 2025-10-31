# 🏗️ TimeBank Architecture Overview

> **Complete codebase structure and conventions for AI collaboration**

## 🧱 1. Project Overview

### High-Level Summary
TimeBank is a **social time-exchange marketplace** where users exchange services using time credits instead of money. Built with Next.js 14, Express.js, Prisma, PostgreSQL, and Socket.io for real-time features.

### Main Features
- **Rich User Profiles**: Media upload, skills, bio, trust badges
- **Time Request System**: Complete lifecycle management with status tracking
- **Real-time Chat**: Socket.io integration with typing indicators
- **Credit Economy**: Digital wallet with transaction history
- **Smart Discovery**: AI-powered user recommendations and search
- **Reputation System**: 5-star ratings with trust badges
- **Notification System**: In-app and email alerts

### APIs and Purpose
- **Authentication API**: JWT-based user management
- **Profile API**: Rich user profiles with media upload
- **Time Request API**: Request lifecycle management
- **Messaging API**: Real-time chat system
- **Discovery API**: User search and recommendations
- **Transaction API**: Credit wallet and financial tracking
- **Rating API**: User feedback and reputation system

### Major Entities
- **User**: Core user account with credits and reputation
- **Profile**: Rich profile data with skills, media, and preferences
- **TimeRequest**: Time exchange requests with status tracking
- **Message**: Real-time chat messages with threading
- **Transaction**: Credit transfers and financial records
- **Rating**: User feedback and reputation scoring
- **Notification**: In-app and email alerts

### Core Workflows
1. **Signup/Login**: JWT authentication with profile completion
2. **Profile Creation**: Multi-step onboarding with media upload
3. **User Discovery**: Search and recommendation system
4. **Time Exchange**: Request → Accept → Chat → Complete → Rate
5. **Credit Management**: Earn, spend, transfer, and track credits
6. **Real-time Communication**: Live chat with typing indicators

---

## 🗂️ 2. Folder and File Structure

```
TimeBank/
├── backend/                          # Node.js + Express API
│   ├── src/
│   │   ├── routes/                   # API endpoints
│   │   │   ├── auth-sqlite.ts        # Authentication routes
│   │   │   ├── profiles.ts           # Profile management
│   │   │   ├── timeRequests.ts       # Time request system
│   │   │   ├── messages.ts           # Real-time messaging
│   │   │   ├── discovery.ts          # User search & recommendations
│   │   │   ├── ratings.ts            # Rating & reputation system
│   │   │   ├── transactions.ts       # Credit wallet & transactions
│   │   │   ├── notifications.ts      # Notification system
│   │   │   ├── booking.ts            # Legacy booking system
│   │   │   ├── wallet.ts             # Legacy wallet system
│   │   │   ├── matching.ts           # User matching algorithms
│   │   │   └── recommendations.ts    # Recommendation engine
│   │   ├── lib/                      # Core utilities
│   │   │   ├── prisma.ts             # Database connection
│   │   │   └── socket.ts             # Socket.io server setup
│   │   ├── middleware/               # Express middleware
│   │   │   └── auth.ts               # JWT authentication
│   │   ├── models/                   # Data models (legacy)
│   │   └── server.ts                 # Express server configuration
│   ├── prisma/                       # Database schema & migrations
│   │   ├── schema.prisma             # Prisma schema definition
│   │   └── migrations/               # Database migrations
│   │       ├── 20251008173520_init_timebank_pg/
│   │       └── 20250101000000_enhance_timebank/
│   ├── package.json                  # Backend dependencies
│   ├── tsconfig.json                 # TypeScript configuration
│   └── env.example                   # Environment variables template
├── frontend/                         # Next.js 14 React app
│   ├── src/
│   │   ├── app/                      # App Router pages
│   │   │   ├── components/           # Reusable components
│   │   │   │   ├── BigBangIntro.tsx  # Animated intro component
│   │   │   │   ├── ChatInterface.tsx # Real-time chat component
│   │   │   │   ├── CosmicVideo.tsx   # Video background component
│   │   │   │   └── Header.tsx        # Navigation header
│   │   │   ├── auth/                 # Authentication pages
│   │   │   │   ├── complete-profile/ # Profile completion flow
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── login/            # Login page
│   │   │   │   │   └── page.tsx
│   │   │   │   └── signup/           # Signup page
│   │   │   │       └── page.tsx
│   │   │   ├── dashboard/            # User dashboard
│   │   │   │   ├── layout.tsx        # Dashboard layout
│   │   │   │   └── page.tsx          # Dashboard main page
│   │   │   ├── home/                 # Discovery & recommendations
│   │   │   │   └── page.tsx
│   │   │   ├── users/                # User profile views
│   │   │   │   └── [id]/             # Dynamic user profiles
│   │   │   │       └── page.tsx
│   │   │   ├── profile/              # User's own profile
│   │   │   │   ├── [id]/             # Dynamic profile pages
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx          # Profile management
│   │   │   ├── requests/             # Time request management
│   │   │   │   └── page.tsx
│   │   │   ├── notifications/        # Notification center
│   │   │   │   └── page.tsx
│   │   │   ├── history/              # Transaction history
│   │   │   │   └── page.tsx
│   │   │   ├── directory/            # User directory (legacy)
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx            # Root layout
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── globals.css           # Global styles
│   │   │   └── favicon.ico           # Site icon
│   │   └── hooks/                    # Custom React hooks
│   ├── public/                       # Static assets
│   │   ├── bigbang-intro.mp4         # Intro video (legacy)
│   │   ├── bigbang-audio.mp3         # Intro audio (legacy)
│   │   ├── cosmic-space.mp4          # Background video
│   │   ├── cosmic-space-audio.mp3    # Background audio
│   │   └── *.svg                     # Icon assets
│   ├── package.json                  # Frontend dependencies
│   ├── tailwind.config.ts            # Tailwind CSS configuration
│   ├── tsconfig.json                 # TypeScript configuration
│   └── env.example                   # Environment variables template
├── package.json                      # Root package with scripts
├── docker-compose.yml                # Docker configuration
├── setup-enhanced.bat                # Windows setup script
├── setup-enhanced.sh                 # Linux/Mac setup script
├── ARCHITECTURE_OVERVIEW.md          # This file
├── ENHANCED_FEATURES.md              # Feature documentation
├── IMPLEMENTATION_SUMMARY.md         # Implementation details
└── README.md                         # Project documentation
```

---

## ⚙️ 3. Function and Component Naming Standards

### Backend Conventions
- **Controllers**: `handleSignup`, `handleLogin`, `createTimeRequest`, `updateRequestStatus`
- **Middleware**: `authenticateToken`, `validateRequest`, `rateLimit`
- **Models**: `User`, `Profile`, `TimeRequest`, `Message`, `Transaction`, `Rating`
- **Utilities**: `hashPassword`, `generateJWT`, `sendEmail`, `uploadFile`
- **Routes**: `/api/auth/signup`, `/api/time-requests`, `/api/messages`, `/api/discovery`

### Frontend Conventions
- **Components**: `UserProfileCard`, `TimeRequestForm`, `ChatInterface`, `CreditBalance`
- **Pages**: `CompleteProfilePage`, `UserProfilePage`, `DashboardPage`, `HomePage`
- **Hooks**: `useAuth`, `useSocket`, `useTimeRequests`, `useNotifications`
- **Utilities**: `formatDate`, `validateEmail`, `uploadImage`, `formatCredits`
- **API Calls**: `fetchUserProfile`, `sendTimeRequest`, `createRating`, `buyCredits`

### Database Conventions
- **Models**: PascalCase (`User`, `TimeRequest`, `Message`)
- **Fields**: camelCase (`userId`, `createdAt`, `isComplete`)
- **Enums**: UPPER_SNAKE_CASE (`PENDING`, `ACCEPTED`, `COMPLETED`)
- **Indexes**: Descriptive names (`idx_user_email`, `idx_request_status`)

---

## 🧩 4. Function Descriptions

### Backend Routes

#### `auth-sqlite.ts`
- `handleSignup(req, res)`: Creates new user, hashes password, stores in PostgreSQL, returns JWT
- `handleLogin(req, res)`: Verifies credentials, returns JWT + user profile
- `handleMe(req, res)`: Returns current user profile from JWT token

#### `profiles.ts`
- `getProfile(req, res)`: Retrieves user profile with skills and media
- `updateProfile(req, res)`: Updates profile information and media
- `completeProfile(req, res)`: Completes profile setup after registration
- `uploadMedia(req, res)`: Handles profile picture and intro media upload

#### `timeRequests.ts`
- `createTimeRequest(req, res)`: Creates new time request, deducts credits, sends notification
- `getUserRequests(req, res)`: Returns sent and received requests for user
- `updateRequestStatus(req, res)`: Updates request status (accept/reject/complete)
- `getTimeRequest(req, res)`: Returns specific request with messages

#### `messages.ts`
- `sendMessage(req, res)`: Sends message via Socket.io, stores in database
- `getConversation(req, res)`: Returns message history for time request
- `getConversations(req, res)`: Returns user's conversation list
- `markAsRead(req, res)`: Marks messages as read

#### `discovery.ts`
- `searchUsers(req, res)`: Searches users by name, skills, location with filters
- `getRecommendations(req, res)`: Returns AI-powered user recommendations
- `getPopularSkills(req, res)`: Returns trending skills and categories

#### `ratings.ts`
- `createRating(req, res)`: Creates user rating, updates reputation score
- `getUserRatings(req, res)`: Returns ratings for specific user
- `getReputation(req, res)`: Returns reputation score and trust badge

#### `transactions.ts`
- `getWallet(req, res)`: Returns user's credit balance and stats
- `getTransactionHistory(req, res)`: Returns paginated transaction history
- `buyCredits(req, res)`: Processes credit purchase (mock implementation)
- `transferCredits(req, res)`: Transfers credits between users
- `getTransactionStats(req, res)`: Returns transaction statistics

### Frontend Components

#### `BigBangIntro.tsx`
- `skipIntro()`: Skips intro animation and navigates to home
- `handleManualPlay()`: Manually triggers intro animation
- `toggleMute()`: Toggles audio on/off

#### `ChatInterface.tsx`
- `handleSendMessage()`: Sends message via Socket.io
- `handleTyping()`: Sends typing indicators
- `fetchMessages()`: Loads conversation history
- `scrollToBottom()`: Scrolls to latest message

#### `CompleteProfilePage.tsx`
- `onSubmit()`: Submits completed profile data
- `addSkill()`: Adds skill to user's skill list
- `handleImageUpload()`: Handles profile media upload
- `nextStep()`: Advances to next profile step

#### `UserProfilePage.tsx`
- `fetchUserProfile()`: Loads user profile data
- `handleSendRequest()`: Sends time request to user
- `getBadgeColor()`: Returns trust badge styling

#### `DashboardPage.tsx`
- `fetchDashboardData()`: Loads dashboard statistics and data
- `getStatusColor()`: Returns status badge colors
- `handleUserClick()`: Navigates to user profile

#### `HomePage.tsx`
- `fetchUsers()`: Loads user discovery data
- `fetchRecommendations()`: Loads AI recommendations
- `handleUserClick()`: Navigates to user profile

---

## 🗃️ 5. Database Schema (Prisma + PostgreSQL)

### Core Models

#### User Model
```prisma
model User {
  id           String      @id @default(cuid())
  email        String      @unique
  passwordHash String
  name         String
  avatarUrl    String?
  reputation   Int         @default(0)
  credits      Decimal     @default(10) @db.Decimal(10, 2)
  isVerified   Boolean     @default(false)
  lastActiveAt DateTime?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  // Relations
  profile      Profile?
  sentRequests TimeRequest[] @relation("RequestSender")
  receivedRequests TimeRequest[] @relation("RequestReceiver")
  messages     Message[]   @relation("UserMessages")
  ratings      Rating[]    @relation("RatedUser")
  givenRatings Rating[]    @relation("RatingUser")
  transactions Transaction[]
  notifications Notification[]
}
```

#### Profile Model
```prisma
model Profile {
  id           String   @id @default(cuid())
  userId       String   @unique
  displayName  String
  avatarUrl    String?
  bio          String?
  skills       String[]
  categories   String[]
  availability Json
  location     String?
  ratingAvg    Float?
  totalRatings Int        @default(0)
  introMedia   String?    // URL to intro video/image
  isComplete   Boolean    @default(false)
  timezone     String?
  languages    String[]
  hourlyRate   Decimal?   @db.Decimal(5, 2)

  user         User     @relation(fields: [userId], references: [id])
}
```

#### TimeRequest Model
```prisma
model TimeRequest {
  id          String            @id @default(cuid())
  senderId    String
  receiverId  String
  title       String
  description String
  duration    Decimal           @db.Decimal(4, 2) // hours
  proposedDate DateTime?
  status      TimeRequestStatus @default(PENDING)
  credits     Decimal           @db.Decimal(10, 2)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  acceptedAt  DateTime?
  completedAt DateTime?

  sender      User              @relation("RequestSender", fields: [senderId], references: [id])
  receiver    User              @relation("RequestReceiver", fields: [receiverId], references: [id])
  messages    Message[]         @relation("TimeRequestMessages")

  @@index([senderId])
  @@index([receiverId])
  @@index([status])
}
```

#### Message Model
```prisma
model Message {
  id         String    @id @default(cuid())
  threadId   String?
  senderId   String
  receiverId String?
  content    String
  messageType String   @default("TEXT") // TEXT, IMAGE, FILE, SYSTEM
  requestId  String?   // For TimeRequest messages
  createdAt  DateTime  @default(now())
  readAt     DateTime?

  thread     MessageThread? @relation(fields: [threadId], references: [id])
  sender     User          @relation("UserMessages", fields: [senderId], references: [id])
  request    TimeRequest?  @relation("TimeRequestMessages", fields: [requestId], references: [id])

  @@index([threadId])
  @@index([senderId])
  @@index([requestId])
}
```

#### Transaction Model
```prisma
model Transaction {
  id          String            @id @default(cuid())
  senderId    String
  receiverId  String?
  amount      Decimal           @db.Decimal(10, 2)
  type        TransactionType
  status      TransactionStatus @default(PENDING)
  description String?
  referenceId String?           // bookingId or requestId
  createdAt   DateTime          @default(now())
  completedAt DateTime?

  sender      User              @relation(fields: [senderId], references: [id])
  receiver    User?             @relation(fields: [receiverId], references: [id])

  @@index([senderId])
  @@index([receiverId])
  @@index([type])
  @@index([status])
}
```

#### Rating Model
```prisma
model Rating {
  id          String    @id @default(cuid())
  raterId     String
  ratedId     String
  bookingId   String?
  score       Int       // 1-5 stars
  comment     String?
  createdAt   DateTime  @default(now())

  rater       User      @relation("RatingUser", fields: [raterId], references: [id])
  rated       User      @relation("RatedUser", fields: [ratedId], references: [id])

  @@unique([raterId, ratedId, bookingId])
  @@index([ratedId])
}
```

### Enums
```prisma
enum TimeRequestStatus {
  PENDING
  ACCEPTED
  REJECTED
  COMPLETED
  CANCELLED
}

enum TransactionType {
  EARNED
  SPENT
  TRANSFER
  REFUND
  BONUS
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
  CANCELLED
}
```

---

## 🎨 6. Frontend UI Layout

### Page Structure

#### `/auth/complete-profile` → Profile Completion Flow
- Multi-step form with validation
- Skills selection with tags
- Media upload (profile picture, intro video)
- Location and timezone selection
- Languages and hourly rate

#### `/dashboard` → Enhanced Dashboard
- Credit balance card
- Recent time requests
- Message notifications
- Quick stats (reputation, rating, completed)
- Tabbed interface (Overview, Requests, Messages, Wallet, Notifications, Settings)

#### `/home` → Discovery & Recommendations
- Search bar with filters
- Skills filter tags
- User cards with trust badges
- Recommendation section
- Quick stats (active users, hours exchanged, average rating)

#### `/users/[id]` → User Profile View
- Profile header with avatar and trust badge
- Bio and skills display
- Rating and reputation stats
- "Request Time" button
- Intro media player
- Quick actions (message, calendar, reviews)

#### `/profile` → User's Own Profile
- Editable profile information
- Media management
- Skills and preferences
- Availability settings
- Privacy controls

#### `/messages` → Chat Interface
- Conversation list
- Real-time chat with typing indicators
- Message history
- File upload support
- Read receipts

#### `/requests` → Time Request Management
- Sent requests list
- Received requests list
- Status tracking
- Request details and actions

#### `/notifications` → Notification Center
- In-app notifications
- Email preferences
- Notification history
- Mark as read functionality

### Component Hierarchy

```
DashboardPage
├── Navbar
│   ├── Logo
│   ├── Navigation Links
│   ├── NotificationBell
│   └── UserMenu
├── StatsCards
│   ├── CreditCard
│   ├── ReputationCard
│   ├── RatingCard
│   └── CompletedCard
├── Sidebar
│   ├── TabNavigation
│   └── QuickActions
└── MainContent
    ├── OverviewTab
    │   ├── RecentRequests
    │   └── RecentMessages
    ├── RequestsTab
    │   ├── RequestList
    │   └── RequestActions
    ├── MessagesTab
    │   ├── ConversationList
    │   └── ChatInterface
    ├── WalletTab
    │   ├── BalanceDisplay
    │   ├── TransactionHistory
    │   └── BuyCredits
    ├── NotificationsTab
    │   └── NotificationList
    └── SettingsTab
        └── UserPreferences
```

---

## 🔌 7. API Routes Summary

### Authentication Routes
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Profile Routes
- `GET /api/profiles/:id` - Get user profile
- `PUT /api/profiles/:id` - Update profile
- `POST /api/profiles/complete` - Complete profile setup
- `POST /api/profiles/upload` - Upload profile media

### Time Request Routes
- `POST /api/time-requests` - Create time request
- `GET /api/time-requests/user/:id` - Get user requests
- `PATCH /api/time-requests/:id/status` - Update request status
- `GET /api/time-requests/:id` - Get specific request

### Message Routes
- `POST /api/messages` - Send message
- `GET /api/messages/conversation/:id` - Get conversation
- `GET /api/messages/conversations` - Get user conversations
- `PATCH /api/messages/:id/read` - Mark as read

### Discovery Routes
- `GET /api/discovery/search` - Search users
- `GET /api/discovery/recommendations` - Get recommendations
- `GET /api/discovery/skills` - Get popular skills

### Rating Routes
- `POST /api/ratings` - Create rating
- `GET /api/ratings/user/:id` - Get user ratings
- `GET /api/ratings/user/:id/reputation` - Get reputation

### Transaction Routes
- `GET /api/transactions/wallet` - Get wallet info
- `GET /api/transactions/history` - Get transaction history
- `POST /api/transactions/buy-credits` - Buy credits
- `POST /api/transactions/transfer` - Transfer credits
- `GET /api/transactions/stats` - Get statistics

### Notification Routes
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/preferences` - Update preferences

---

## 🧠 8. Dependencies and Versions

### Backend Dependencies
```json
{
  "@prisma/client": "^6.17.0",        // Database ORM
  "bcrypt": "^5.1.1",                 // Password hashing
  "cors": "^2.8.5",                   // Cross-origin requests
  "dotenv": "^16.4.5",                // Environment variables
  "express": "^4.21.1",               // Web framework
  "express-rate-limit": "^8.1.0",     // API rate limiting
  "helmet": "^8.1.0",                 // Security headers
  "jsonwebtoken": "^9.0.2",           // JWT authentication
  "mongoose": "^8.18.1",              // MongoDB ODM (legacy)
  "zod": "^3.23.8",                   // Schema validation
  "socket.io": "^4.8.1",              // Real-time communication
  "multer": "^1.4.5-lts.1",           // File upload handling
  "cloudinary": "^2.5.0",             // Media storage
  "nodemailer": "^6.9.15",            // Email service
  "uuid": "^10.0.0"                   // UUID generation
}
```

### Frontend Dependencies
```json
{
  "@heroicons/react": "^2.1.5",       // Icon library
  "framer-motion": "^11.11.9",        // Animation library
  "lucide-react": "^0.545.0",         // Icon library
  "next": "14.2.5",                   // React framework
  "react": "^18.3.1",                 // UI library
  "react-dom": "^18.3.1",             // React DOM
  "socket.io-client": "^4.8.1",       // Real-time client
  "react-hook-form": "^7.53.2",       // Form handling
  "react-dropzone": "^14.2.10",       // File upload
  "date-fns": "^4.1.0",               // Date utilities
  "react-hot-toast": "^2.4.1",        // Toast notifications
  "zustand": "^5.0.2",                // State management
  "clsx": "^2.1.1",                   // CSS class utilities
  "tailwind-merge": "^2.5.4"          // Tailwind utilities
}
```

### Development Dependencies
```json
{
  "typescript": "^5.9.2",             // Type checking
  "eslint": "^9.35.0",                // Code linting
  "prisma": "^6.17.0",                // Database toolkit
  "ts-node-dev": "^2.0.0",            // Development server
  "tailwindcss": "^3.4.10",           // CSS framework
  "autoprefixer": "^10.4.20",         // CSS autoprefixer
  "postcss": "^8.4.41"                // CSS processor
}
```

---

## 🧩 9. Future Scalability Notes

### AI-Based Recommendations
- **Location**: `backend/src/lib/recommendationEngine.ts`
- **Implementation**: Machine learning models for user matching
- **Data Sources**: User behavior, ratings, skills, location
- **Integration**: Extend `discovery.ts` routes with ML endpoints

### Redis Caching Layer
- **Location**: `backend/src/lib/cache.ts`
- **Implementation**: Redis for session storage and API caching
- **Use Cases**: User sessions, search results, recommendations
- **Integration**: Middleware for cache-first API responses

### WebSocket Enhancements
- **Location**: `backend/src/lib/socket.ts`
- **Implementation**: Enhanced real-time features
- **Features**: Video calls, screen sharing, live notifications
- **Integration**: Extend Socket.io events and rooms

### Role-Based Access Control (RBAC)
- **Location**: `backend/src/middleware/rbac.ts`
- **Implementation**: User roles and permissions system
- **Roles**: Admin, Moderator, Verified User, Basic User
- **Integration**: Middleware for route protection

### Microservices Architecture
- **Services**: Auth, Profile, Messaging, Discovery, Transactions
- **Communication**: API Gateway with service discovery
- **Database**: Service-specific databases with event sourcing
- **Deployment**: Docker containers with Kubernetes orchestration

### Advanced Analytics
- **Location**: `backend/src/lib/analytics.ts`
- **Implementation**: User behavior tracking and insights
- **Metrics**: Engagement, conversion, retention, revenue
- **Integration**: Dashboard with real-time analytics

### Payment Integration
- **Location**: `backend/src/lib/payment.ts`
- **Implementation**: Stripe/PayPal for credit purchases
- **Features**: Subscription plans, premium features, escrow
- **Integration**: Extend transaction system with real payments

### Mobile App Support
- **Location**: `mobile/` (new directory)
- **Implementation**: React Native with shared API
- **Features**: Push notifications, offline support, native features
- **Integration**: API versioning for mobile compatibility

---

## 🚀 10. Development Guidelines

### Code Style
- **TypeScript**: Strict mode enabled, full type coverage
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Consistent code formatting
- **Naming**: Descriptive, consistent naming conventions

### Testing Strategy
- **Unit Tests**: Jest for backend, React Testing Library for frontend
- **Integration Tests**: API endpoint testing with Supertest
- **E2E Tests**: Playwright for user journey testing
- **Coverage**: Minimum 80% code coverage

### Security Practices
- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control
- **Input Validation**: Zod schemas for all inputs
- **Rate Limiting**: API protection against abuse
- **CORS**: Configured for production domains

### Performance Optimization
- **Database**: Proper indexing and query optimization
- **Caching**: Redis for frequently accessed data
- **CDN**: Static asset delivery
- **Bundle Splitting**: Code splitting for optimal loading
- **Image Optimization**: Next.js Image component with WebP

### Deployment
- **Environment**: Docker containers for consistency
- **Database**: PostgreSQL with connection pooling
- **Monitoring**: Application performance monitoring
- **Logging**: Structured logging with correlation IDs
- **Backup**: Automated database backups

---

**This architecture overview serves as the complete blueprint for TimeBank development and AI collaboration. All naming conventions, patterns, and structures are documented for seamless extension and maintenance.**
