// server.ts
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
// import { connectMongo } from "./lib/mongo";
import authRoutes from "./routes/auth-sqlite";
import profilesRoutes from "./routes/profiles";
import walletRoutes from "./routes/wallet";
import bookingRoutes from "./routes/booking";
import notificationsRoutes from "./routes/notifications";
import matchingRoutes from "./routes/matching";
import recommendationsRoutes from "./routes/recommendations";
import timeRequestRoutes from "./routes/timeRequests";
import messageRoutes from "./routes/messages";
import ratingRoutes from "./routes/ratings";
import transactionRoutes from "./routes/transactions";
import discoveryRoutes from "./routes/discovery";
import { setupSocketIO } from "./lib/socket";

dotenv.config();

// Optionally initialize DBs
// connectMongo();

const app = express();
app.disable("x-powered-by");

// Helmet (relaxed CSP for local dev; tighten for prod)
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production"
      ? {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'"],
            imgSrc: ["'self'", "data:"],
            fontSrc: ["'self'", "data:"],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
  })
);

// Basic rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS
const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3003",
  "http://localhost:3004",
  "http://localhost:3005",
]);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Env validation (warns only)
function validateEnvironment(): void {
  const requiredEnvVars = ["MONGO_URL", "DATABASE_URL"];
  const missing = requiredEnvVars.filter((k) => !process.env[k]);
  if (missing.length) {
    console.warn(`Missing environment variables: ${missing.join(", ")}`);
    console.warn("Some features may not work correctly");
  }
  if (!process.env.JWT_SECRET) {
    console.warn("JWT_SECRET not set, using dev_secret (not recommended for production)");
  }
}
validateEnvironment();

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// API routes (with and without /api for compatibility with the frontend)
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

app.use("/api/wallet", walletRoutes);
app.use("/wallet", walletRoutes);

app.use("/api/profiles", profilesRoutes);
app.use("/profiles", profilesRoutes);

app.use("/api/booking", bookingRoutes);
app.use("/booking", bookingRoutes);

app.use("/api/notifications", notificationsRoutes);
app.use("/notifications", notificationsRoutes);

app.use("/api/matching", matchingRoutes);
app.use("/matching", matchingRoutes);

app.use("/api/recommendations", recommendationsRoutes);
app.use("/recommendations", recommendationsRoutes);

// New enhanced routes
app.use("/api/time-requests", timeRequestRoutes);
app.use("/time-requests", timeRequestRoutes);

app.use("/api/messages", messageRoutes);
app.use("/messages", messageRoutes);

app.use("/api/ratings", ratingRoutes);
app.use("/ratings", ratingRoutes);

app.use("/api/transactions", transactionRoutes);
app.use("/transactions", transactionRoutes);

app.use("/api/discovery", discoveryRoutes);
app.use("/discovery", discoveryRoutes);

// 404 handler
app.use("*", (_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Create HTTP server and setup Socket.io
const port = Number(process.env.PORT) || 4000;
const server = createServer(app);

// Setup Socket.io
const io = setupSocketIO(server);

// Start server
server.listen(port, () => {
  console.log(`🚀 TimeBank API server listening on port ${port}`);
  console.log(`📋 Health check at http://localhost:${port}/health`);
  console.log(`🔌 Socket.io server ready for real-time connections`);
});

export default app;



