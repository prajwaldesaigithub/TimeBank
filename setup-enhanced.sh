#!/bin/bash

# TimeBank Enhanced Setup Script
echo "🚀 Setting up TimeBank Enhanced Features..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Go back to root
cd ..

# Check if PostgreSQL is running
echo "🗄️ Checking PostgreSQL connection..."
if ! command -v psql &> /dev/null; then
    echo "⚠️ PostgreSQL is not installed. Please install PostgreSQL 14+ first."
    echo "You can continue with the setup, but you'll need to configure the database later."
else
    echo "✅ PostgreSQL is available"
fi

# Create environment files if they don't exist
echo "⚙️ Setting up environment files..."

if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend/.env from template..."
    cp backend/.env.example backend/.env
    echo "⚠️ Please update backend/.env with your database credentials"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "📝 Creating frontend/.env.local from template..."
    cp frontend/.env.example frontend/.env.local
    echo "⚠️ Please update frontend/.env.local with your API URL"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd backend
npx prisma generate

# Check if database is accessible
echo "🗄️ Checking database connection..."
if npx prisma db push --accept-data-loss 2>/dev/null; then
    echo "✅ Database connection successful"
    echo "🔄 Running database migrations..."
    npx prisma migrate deploy
else
    echo "⚠️ Database connection failed. Please check your DATABASE_URL in backend/.env"
    echo "You can run the following commands later:"
    echo "  cd backend"
    echo "  npx prisma db push"
    echo "  npx prisma migrate deploy"
fi

cd ..

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update backend/.env with your database credentials"
echo "2. Update frontend/.env.local with your API URL"
echo "3. Run 'npm run dev' to start the development servers"
echo ""
echo "🌐 The application will be available at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend: http://localhost:4000"
echo ""
echo "📚 For more information, see ENHANCED_FEATURES.md"
echo ""
echo "Happy coding! 🚀"


