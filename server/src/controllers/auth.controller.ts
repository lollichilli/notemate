import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { validatePassword } from "../utils/passwordValidator";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        message: "Password does not meet requirements",
        errors: passwordValidation.errors
      });
    }

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash password and create user
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    // Generate token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    
    res.status(201).json({ token, user });
  } catch (err: any) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Register failed" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const auth = req.headers.authorization;
    if (!auth) {
      return res.status(401).json({ message: "Missing token" });
    }
    
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}