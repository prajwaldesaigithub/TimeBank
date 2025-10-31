"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
// import { connectMongo } from "./lib/mongo";
const auth_sqlite_1 = __importDefault(require("./routes/auth-sqlite"));
const profiles_1 = __importDefault(require("./routes/profiles"));
const wallet_1 = __importDefault(require("./routes/wallet"));
const booking_1 = __importDefault(require("./routes/booking"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const matching_1 = __importDefault(require("./routes/matching"));
const recommendations_1 = __importDefault(require("./routes/recommendations"));
const timeRequests_1 = __importDefault(require("./routes/timeRequests"));
const messages_1 = __importDefault(require("./routes/messages"));
const ratings_1 = __importDefault(require("./routes/ratings"));
const transactions_1 = __importDefault(require("./routes/transactions"));
const discovery_1 = __importDefault(require("./routes/discovery"));
const socket_1 = require("./lib/socket");
dotenv_1.default.config();
// Optionally initialize DBs
// connectMongo();
const app = (0, express_1.default)();
app.disable("x-powered-by");
// Helmet (relaxed CSP for local dev; tighten for prod)
app.use((0, helmet_1.default)({
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
}));
// Basic rate limiting
const limiter = (0, express_rate_limit_1.default)({
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
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.has(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    optionsSuccessStatus: 200,
}));
// Body parsing
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// Env validation (warns only)
function validateEnvironment() {
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
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
    });
});
// API routes (with and without /api for compatibility with the frontend)
app.use("/api/auth", auth_sqlite_1.default);
app.use("/auth", auth_sqlite_1.default);
app.use("/api/wallet", wallet_1.default);
app.use("/wallet", wallet_1.default);
app.use("/api/profiles", profiles_1.default);
app.use("/profiles", profiles_1.default);
app.use("/api/booking", booking_1.default);
app.use("/booking", booking_1.default);
app.use("/api/notifications", notifications_1.default);
app.use("/notifications", notifications_1.default);
app.use("/api/matching", matching_1.default);
app.use("/matching", matching_1.default);
app.use("/api/recommendations", recommendations_1.default);
app.use("/recommendations", recommendations_1.default);
// New enhanced routes
app.use("/api/time-requests", timeRequests_1.default);
app.use("/time-requests", timeRequests_1.default);
app.use("/api/messages", messages_1.default);
app.use("/messages", messages_1.default);
app.use("/api/ratings", ratings_1.default);
app.use("/ratings", ratings_1.default);
app.use("/api/transactions", transactions_1.default);
app.use("/transactions", transactions_1.default);
app.use("/api/discovery", discovery_1.default);
app.use("/discovery", discovery_1.default);
// 404 handler
app.use("*", (_req, res) => {
    res.status(404).json({ error: "Route not found" });
});
// Global error handler
app.use((err, _req, res, _next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});
// Create HTTP server and setup Socket.io
const port = Number(process.env.PORT) || 4000;
const server = (0, http_1.createServer)(app);
// Setup Socket.io
const io = (0, socket_1.setupSocketIO)(server);
// Start server
server.listen(port, () => {
    console.log(`🚀 TimeBank API server listening on port ${port}`);
    console.log(`📋 Health check at http://localhost:${port}/health`);
    console.log(`🔌 Socket.io server ready for real-time connections`);
});
exports.default = app;
//# sourceMappingURL=server.js.map