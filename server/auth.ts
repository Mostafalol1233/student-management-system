import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "center-management-dev-secret-2025";
const JWT_EXPIRES = "7d";

export interface JwtPayload {
  userId: string;
  email: string;
  role: "admin" | "reception" | "teacher" | "accountant";
  name: string;
  teacherId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "غير مصرح — يرجى تسجيل الدخول" });
  }
  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ message: "جلسة منتهية الصلاحية — يرجى إعادة تسجيل الدخول" });
  }
}

export function requireRole(...roles: JwtPayload["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    requireAuth(req, res, () => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "ليس لديك صلاحية الوصول لهذا القسم" });
      }
      next();
    });
  };
}

export const isAdmin = requireRole("admin");
export const isAdminOrAccountant = requireRole("admin", "accountant");
export const isAdminOrTeacher = requireRole("admin", "teacher");
export const isAdminOrReception = requireRole("admin", "reception");

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["*"],
  reception: ["students", "groups", "sessions", "attendance", "finance_read", "dashboard"],
  teacher: ["grades", "sessions", "attendance", "homework", "exams", "dashboard"],
  accountant: ["finance", "reports", "dashboard"],
};

export function canAccess(role: string, section: string): boolean {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes("*") || perms.includes(section);
}
