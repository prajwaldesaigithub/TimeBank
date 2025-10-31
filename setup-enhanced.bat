@echo off
echo 🚀 Setting up TimeBank Enhanced Features...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version

REM Install root dependencies
echo 📦 Installing root dependencies...
npm install

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
npm install

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd ..\frontend
npm install

REM Go back to root
cd ..

REM Create environment files if they don't exist
echo ⚙️ Setting up environment files...

if not exist "backend\.env" (
    echo 📝 Creating backend\.env from template...
    copy "backend\.env.example" "backend\.env"
    echo ⚠️ Please update backend\.env with your database credentials
)

if not exist "frontend\.env.local" (
    echo 📝 Creating frontend\.env.local from template...
    copy "frontend\.env.example" "frontend\.env.local"
    echo ⚠️ Please update frontend\.env.local with your API URL
)

REM Generate Prisma client
echo 🔧 Generating Prisma client...
cd backend
npx prisma generate

REM Check if database is accessible
echo 🗄️ Checking database connection...
npx prisma db push --accept-data-loss >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Database connection successful
    echo 🔄 Running database migrations...
    npx prisma migrate deploy
) else (
    echo ⚠️ Database connection failed. Please check your DATABASE_URL in backend\.env
    echo You can run the following commands later:
    echo   cd backend
    echo   npx prisma db push
    echo   npx prisma migrate deploy
)

cd ..

echo.
echo 🎉 Setup completed!
echo.
echo 📋 Next steps:
echo 1. Update backend\.env with your database credentials
echo 2. Update frontend\.env.local with your API URL
echo 3. Run 'npm run dev' to start the development servers
echo.
echo 🌐 The application will be available at:
echo   Frontend: http://localhost:3000
echo   Backend: http://localhost:4000
echo.
echo 📚 For more information, see ENHANCED_FEATURES.md
echo.
echo Happy coding! 🚀
pause
