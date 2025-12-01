import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    id: string;
    [key: string]: any;
  };
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
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // ✅ Set both req.auth (for backward compatibility) and req.user (for new routes)
    req.auth = decoded;
    req.user = {
      _id: decoded.id,
      id: decoded.id,
      ...decoded
    };
    
    next();
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }
}

// Alias for compatibility
export const authenticate = requireAuth;