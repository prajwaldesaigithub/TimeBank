"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ error: "No token provided" });
            return;
        }
        const token = authHeader.substring(7); // Remove "Bearer " prefix
        if (!process.env.JWT_SECRET) {
            console.warn("JWT_SECRET not set, using dev_secret");
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "dev_secret");
        // Validate the decoded token structure
        if (!decoded.userId || !decoded.email) {
            res.status(401).json({ error: "Invalid token structure" });
            return;
        }
        req.user = decoded;
        next();
    }
    catch (err) {
        console.error("Auth middleware error:", err);
        res.status(401).json({ error: "Invalid token" });
    }
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=auth.js.map