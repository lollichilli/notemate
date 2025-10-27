import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export interface AuthRequest extends Request {
  auth?: {
    id: string;
    [key: string]: any;
  };
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({ error: "missing token" });
  }

  try {
    req.auth = jwt.verify(token, JWT_SECRET) as any;
    next();
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }
}

// Alias for compatibility
export const authenticate = requireAuth;