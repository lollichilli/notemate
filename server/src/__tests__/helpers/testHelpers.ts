import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import { User } from '../../models/user.model';

// Must match your middleware's JWT_SECRET exactly!
// From: server/src/middleware/auth.ts
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

/**
 * Create a test user and return their ID and token
 */
export async function createTestUser(email: string, password: string = 'password123'): Promise<{
  userId: Types.ObjectId;
  token: string;
  user: any;
}> {
  const user = await User.create({
    email,
    password, // Will be hashed by the model
    name: email.split('@')[0]
  });

  const userId = user._id as Types.ObjectId;

  const token = jwt.sign(
    { id: userId.toString() },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    userId,
    token,
    user
  };
}

/**
 * Get auth header with token
 */
export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Create multiple test users at once
 */
export async function createTestUsers(count: number): Promise<Array<{
  userId: Types.ObjectId;
  token: string;
  user: any;
}>> {
  const users = [];
  for (let i = 0; i < count; i++) {
    const user = await createTestUser(`user${i}@test.com`);
    users.push(user);
  }
  return users;
}