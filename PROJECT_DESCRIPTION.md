# TimeBank - Skill Exchange Platform

## 🚀 Project Overview

**TimeBank** is a revolutionary skill-sharing platform that enables users to exchange knowledge and expertise using a time-based credit system. Instead of traditional monetary transactions, users earn and spend "time credits" to learn new skills from others or teach their own expertise.

## ✨ Key Features

### 💰 Time Credit System
- **Signup Bonus**: New users receive 20.00 time credits upon registration
- **Credit Transactions**: Seamless transfer of credits between users
- **Transaction History**: Complete tracking of all earned and spent credits
- **Wallet Management**: Real-time balance updates and transaction monitoring

### 📚 Skill Exchange
- **Request System**: Users can request time from skilled providers
- **Booking Management**: Accept, decline, or cancel time requests
- **Session Completion**: Mark sessions as complete and process payments
- **Location-Based Learning**: Google Maps integration for setting and viewing learning locations

### 💬 Real-Time Communication
- **Direct Messaging**: Chat with other users instantly
- **Notification System**: Stay updated on requests, messages, and transactions
- **Message Threads**: Organized conversations tied to bookings

### ⭐ Rating & Reputation
- **User Ratings**: Rate users after completed sessions (1-5 stars)
- **Reputation System**: Build trust through completed transactions
- **Rating History**: View ratings received and given

### 🔍 Discovery & Directory
- **User Directory**: Browse and discover skilled users
- **Search & Filter**: Find users by skills, categories, and location
- **Follow System**: Follow users to stay connected
- **Profile Pages**: Comprehensive user profiles with skills and ratings

### 📱 Modern UI/UX
- **Animated Dashboard**: Beautiful floating logo with watch design
- **Responsive Design**: Works seamlessly on all devices
- **Dark Theme**: Eye-friendly dark mode interface
- **Smooth Animations**: Framer Motion powered transitions

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **React Hot Toast** - User notifications
- **Socket.io Client** - Real-time communication
- **Lucide React** - Beautiful icons

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Prisma ORM** - Database management
- **SQLite** - Lightweight database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Socket.io** - Real-time server
- **Zod** - Schema validation

## 📋 Core Workflows

### 1. User Registration & Onboarding
- User signs up with email and password
- Receives 20.00 time credits as welcome bonus
- Completes profile with skills, categories, and location
- Sets up Google Maps location for learning preferences

### 2. Skill Exchange Flow
1. **Discovery**: Browse directory to find skilled users
2. **Request**: Send time request with hours, category, and location
3. **Acceptance**: Provider accepts or declines the request
4. **Session**: Users communicate via messaging
5. **Completion**: Mark session as complete
6. **Transaction**: Receiver pays credits to provider
7. **Rating**: Both users rate each other

### 3. Transaction Process
- Mark booking as complete
- Transaction modal opens automatically
- User confirms credit amount
- Credits transfer from receiver to provider
- Transaction history updated
- Stats (earned/spent) automatically refreshed
- Rating modal appears for feedback

## 🎨 Design Highlights

- **Floating Watch Logo**: Animated TimeBank logo in a watch design that smoothly floats across the dashboard
- **Gradient Backgrounds**: Beautiful purple-to-slate gradients throughout
- **Glass Morphism**: Modern glass-card effects
- **Smooth Animations**: Polished transitions and hover effects
- **Responsive Grid**: Adaptive layouts for all screen sizes

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation with Zod
- CORS protection
- SQL injection prevention via Prisma

## 📊 Database Schema

- **Users**: Authentication and basic info
- **Profiles**: Extended user information (skills, location, ratings)
- **Bookings**: Time request management
- **Transactions**: Credit transfer records
- **Ledger Entries**: Detailed credit history
- **Messages**: Real-time communication
- **Ratings**: User feedback system
- **Notifications**: User alerts
- **Connections**: Follow/follower relationships

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- SQLite (included with Prisma)

### Installation
```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
cd TimeBank
npm install

# Setup database
cd backend
npx prisma migrate dev
npx prisma generate

# Start backend server
npm run dev

# Start frontend (in new terminal)
cd frontend
npm run dev
```

## 📈 Future Enhancements

- Payment gateway integration for credit purchases
- Video call integration for remote sessions
- Advanced search with AI recommendations
- Mobile app (React Native)
- Email notifications
- Dispute resolution system
- Skill verification badges
- Community forums

## 💡 Key Innovations

1. **Time-Based Economy**: Unique credit system based on time rather than money
2. **Location Integration**: Google Maps for setting learning locations
3. **Real-Time Communication**: Socket.io for instant messaging
4. **Seamless Transactions**: One-click payment flow with automatic stats update
5. **Rating System**: Post-transaction rating ensures quality feedback

## 🎯 Use Cases

- **Students**: Learn programming, design, or any skill from experts
- **Professionals**: Share expertise and earn credits
- **Entrepreneurs**: Exchange business knowledge
- **Hobbyists**: Connect with like-minded learners
- **Educators**: Teach and learn in a flexible environment

## 📝 License

[Your License Here]

## 👨‍💻 Author

[Your Name]

---

**Built with ❤️ using Next.js, Express, and modern web technologies**

