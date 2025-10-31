import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface JWTPayload {
	userId: string;
	email: string;
}

export interface AuthRequest extends Request {
	user?: JWTPayload;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
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
		
		const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret") as JWTPayload;
		
		// Validate the decoded token structure
		if (!decoded.userId || !decoded.email) {
			res.status(401).json({ error: "Invalid token structure" });
			return;
		}

		req.user = decoded;
		next();
	} catch (err) {
		console.error("Auth middleware error:", err);
		res.status(401).json({ error: "Invalid token" });
	}
};
