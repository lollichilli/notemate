import request from 'supertest';
import express from 'express';
import v1Routes from '../routes/v1';
import { User } from '../models/user.model';
import './setup';

const app = express();
app.use(express.json());
app.use('/api/v1', v1Routes);

describe('Auth Endpoints', () => {
  describe('POST /api/v1/auth/signup', () => {
    it('should create a new user and return token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'TestPass123',
          name: 'Test User'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).toHaveProperty('name', 'Test User');
    });

    it('should reject signup with missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          password: 'TestPass123'
        });

      expect(response.status).toBe(400);
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'TestPass123'
        });

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'TestPass456'
        });

      expect(response.status).toBe(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'TestPass123'
        });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPass123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should reject wrong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPass123'  // ✅ Fixed: Strong but wrong password
        });

      expect(response.status).toBe(401);
    });

    it('should reject non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPass123'
        });

      expect(response.status).toBe(404);
    });
  });
});

describe('Password Validation in Auth', () => {
  describe('POST /api/v1/auth/signup - Password Requirements', () => {
    it('should accept strong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'strong@test.com',
          password: 'MySecure123',
          name: 'Test User'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
    });

    it('should reject password under 8 characters', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'short@test.com',
          password: 'Pass12',
          name: 'Test'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Password does not meet requirements');
      expect(response.body.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'noupper@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'nolower@test.com',
          password: 'PASSWORD123'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'nonum@test.com',
          password: 'Password'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain('Password must contain at least one number');
    });

    it('should reject common weak passwords', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'common@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain('Password is too common. Please choose a stronger password');
    });

    it('should return multiple validation errors for very weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'veryweak@test.com',
          password: 'abc'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(2);
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'notanemail',
          password: 'MySecure123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid email format');
    });

    it('should still allow signup with strong password after weak attempt', async () => {
      // First try weak password
      await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'retry@test.com',
          password: 'weak'
        });

      // Then try with strong password
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'retry@test.com',
          password: 'StrongPass123'
        });

      expect(response.status).toBe(201);
    });

    it('should hash strong passwords before storing', async () => {
      const password = 'MySecure123';
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'hashed@test.com',
          password,
          name: 'Test'
        });

      expect(response.status).toBe(201);

      const user = await User.findOne({ email: 'hashed@test.com' });
      expect(user).toBeTruthy();
      expect(user!.password).not.toBe(password);
      expect(user!.password.length).toBeGreaterThan(20); // bcrypt hash
    });
  });
});

