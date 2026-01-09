import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { getPrisma } from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { sendVerificationEmail } from "../lib/email";
import { validateEmail } from "../lib/emailValidation";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body as { email?: string; password?: string; name?: string };

    if (!email || !password || !name)
      return res.status(400).json({ error: "Missing required fields: email, password, name" });
    
    // Validate email format and check if it's real/valid
    const emailValidation = await validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.reason || "Invalid email address" });
    }
    
    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    if (name.trim().length < 2)
      return res.status(400).json({ error: "Name must be at least 2 characters long" });

    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing)
      return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 12);
    
    // Generate email verification token
    const verificationToken = randomBytes(32).toString("hex");
    
    // Signup bonus credits
    const SIGNUP_BONUS_CREDITS = "20.00";
    
    const user = await prisma.user.create({
      data: { 
        email: email.toLowerCase().trim(), 
        passwordHash, 
        name: name.trim(),
        credits: SIGNUP_BONUS_CREDITS,
        emailVerificationToken: verificationToken,
        isVerified: false
      }
    });

    // Create a basic profile shell
    await prisma.profile.create({
      data: {
        userId: user.id,
        displayName: name.trim(),
        avatarUrl: null,
        bio: null,
        skills: "[]",
        categories: "[]",
        languages: "[]",
        availability: {}
      }
    });

    // Create bonus transaction record
    await prisma.transaction.create({
      data: {
        senderId: user.id,
        receiverId: user.id,
        amount: SIGNUP_BONUS_CREDITS,
        type: 'BONUS',
        status: 'COMPLETED',
        description: 'Welcome bonus credits',
        completedAt: new Date()
      }
    });

    // Create ledger entry for bonus
    await prisma.ledgerEntry.create({
      data: {
        userId: user.id,
        hours: SIGNUP_BONUS_CREDITS,
        type: 'EARNED',
        description: 'Welcome bonus credits'
      }
    });

    // Send verification email (don't block signup if email fails)
    try {
      await sendVerificationEmail(user.email, verificationToken, user.name);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Continue with signup even if email fails
    }

    // Do not issue auth token until email is verified
    return res.status(201).json({ 
      success: true,
      message: "Signup successful. Please verify your email before logging in.",
      requiresVerification: true
    });
  } catch (err: any) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: err?.message || "Signup failed" });
  }
});

// Login endpoint expected by frontend
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: "Missing required fields: email, password" });
    }
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // In development or when explicitly configured, allow login without email verification
    const SKIP_EMAIL_VERIFICATION =
      process.env.SKIP_EMAIL_VERIFICATION === "true" ||
      process.env.NODE_ENV !== "production";

    if (!user.isVerified && !SKIP_EMAIL_VERIFICATION) {
      return res
        .status(403)
        .json({
          error: "Please verify your email before logging in.",
          requiresVerification: true,
        });
    }
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        isVerified: user.isVerified
      },
      requiresVerification: false
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({ error: err?.message || "Login failed" });
  }
});

// Give signup bonus to all existing users (one-time migration)
router.post("/give-signup-bonus-to-all", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const SIGNUP_BONUS_CREDITS = "20.00";
    
    // Get all users who don't have the bonus yet (users with credits less than 20 or exactly 10.00 default)
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { credits: { lt: "20.00" } },
          { credits: "10.00" }
        ]
      }
    });

    let updated = 0;
    
    for (const user of users) {
      const currentCredits = Number(user.credits) || 0;
      // Only give bonus if they have default credits or less than 20
      if (currentCredits <= 10.01) {
        const newCredits = (currentCredits + 20).toFixed(2);
        
        await prisma.$transaction(async (tx) => {
          // Update user credits
          await tx.user.update({
            where: { id: user.id },
            data: { credits: newCredits }
          });

          // Create bonus transaction record
          await tx.transaction.create({
            data: {
              senderId: user.id,
              receiverId: user.id,
              amount: SIGNUP_BONUS_CREDITS,
              type: 'BONUS',
              status: 'COMPLETED',
              description: 'Welcome bonus credits',
              completedAt: new Date()
            }
          });

          // Create ledger entry for bonus
          await tx.ledgerEntry.create({
            data: {
              userId: user.id,
              hours: SIGNUP_BONUS_CREDITS,
              type: 'EARNED',
              description: 'Welcome bonus credits'
            }
          });
        });
        
        updated++;
      }
    }

    return res.json({ 
      success: true, 
      message: `Updated ${updated} users with signup bonus`,
      usersUpdated: updated,
      totalUsers: users.length
    });
  } catch (err: any) {
    console.error("Give signup bonus error:", err);
    return res.status(500).json({ error: err?.message || "Failed to give signup bonus" });
  }
});

// Email verification endpoint
router.get("/verify-email", async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Verification token is required" });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired verification token" });
    }

    // Check if token is older than 24 hours (optional expiration check)
    const tokenAge = Date.now() - new Date(user.createdAt).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (tokenAge > maxAge) {
      return res.status(400).json({ error: "Verification token has expired. Please request a new one." });
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        emailVerificationToken: null,
        emailVerifiedAt: new Date()
      }
    });

    return res.json({ 
      success: true, 
      message: "Email verified successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: true
      }
    });
  } catch (err: any) {
    console.error("Email verification error:", err);
    return res.status(500).json({ error: err?.message || "Email verification failed" });
  }
});

// Resend verification email endpoint
router.post("/resend-verification", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: "Email is already verified" });
    }

    // Generate new verification token
    const verificationToken = randomBytes(32).toString("hex");
    
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: verificationToken }
    });

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken, user.name);
      return res.json({ 
        success: true, 
        message: "Verification email sent successfully" 
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return res.status(500).json({ error: "Failed to send verification email" });
    }
  } catch (err: any) {
    console.error("Resend verification error:", err);
    return res.status(500).json({ error: err?.message || "Failed to resend verification email" });
  }
});

// Session endpoint expected by frontend
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const profile = await prisma.profile.findUnique({ where: { userId } });
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl ?? null,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      profile,
    });
  } catch (err: any) {
    console.error("Me error:", err);
    return res.status(500).json({ error: err?.message || "Failed to fetch session" });
  }
});

export default router;
