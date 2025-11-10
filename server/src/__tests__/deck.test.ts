import request from 'supertest';
import express from 'express';
import { Types } from 'mongoose';
import v1Routes from '../routes/v1';
import { Deck } from '../models/deck.model';
import { Flashcard } from '../models/flashcard.model';
import { createTestUser, authHeader } from './helpers/testHelpers';
import './setup';

const app = express();
app.use(express.json());
app.use('/api/v1', v1Routes);

describe('Deck Endpoints', () => {
  let testUser: { userId: Types.ObjectId; token: string; user: any };

  beforeEach(async () => {
    // Create a test user for authenticated requests
    testUser = await createTestUser('decktest@test.com');
  });

  describe('GET /api/v1/decks', () => {
    it('should return empty array when no decks', async () => {
      const response = await request(app)
        .get('/api/v1/decks')
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return list of user decks', async () => {
      await Deck.create({ 
        name: 'Deck 1', 
        ownerId: testUser.userId,
        visibility: 'private' 
      });
      await Deck.create({ 
        name: 'Deck 2', 
        ownerId: testUser.userId,
        visibility: 'private' 
      });

      const response = await request(app)
        .get('/api/v1/decks')
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('visibility');
    });

    it('should return decks sorted by createdAt desc', async () => {
      await Deck.create({ 
        name: 'First Deck', 
        ownerId: testUser.userId,
        visibility: 'private' 
      });
      await new Promise(resolve => setTimeout(resolve, 10));
      await Deck.create({ 
        name: 'Second Deck', 
        ownerId: testUser.userId,
        visibility: 'private' 
      });

      const response = await request(app)
        .get('/api/v1/decks')
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body[0].name).toBe('Second Deck');
      expect(response.body[1].name).toBe('First Deck');
    });

    it('should limit to 50 decks', async () => {
      const deckPromises = [];
      for (let i = 0; i < 60; i++) {
        deckPromises.push(Deck.create({ 
          name: `Deck ${i}`, 
          ownerId: testUser.userId,
          visibility: 'private' 
        }));
      }
      await Promise.all(deckPromises);

      const response = await request(app)
        .get('/api/v1/decks')
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(50);
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/v1/decks');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/decks', () => {
    it('should create a new deck', async () => {
      const response = await request(app)
        .post('/api/v1/decks')
        .set(authHeader(testUser.token))
        .send({ name: 'My Test Deck' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('name', 'My Test Deck');
      expect(response.body).toHaveProperty('visibility', 'private');
      expect(response.body).toHaveProperty('ownerId', testUser.userId.toString());
    });

    it('should reject deck creation without name', async () => {
      const response = await request(app)
        .post('/api/v1/decks')
        .set(authHeader(testUser.token))
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'name is required');
    });

    it('should reject deck creation with empty name', async () => {
      const response = await request(app)
        .post('/api/v1/decks')
        .set(authHeader(testUser.token))
        .send({ name: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'name is required');
    });

    it('should create deck with default visibility private', async () => {
      const response = await request(app)
        .post('/api/v1/decks')
        .set(authHeader(testUser.token))
        .send({ name: 'Test Deck' });

      expect(response.status).toBe(201);
      expect(response.body.visibility).toBe('private');
    });

    it('should persist deck to database', async () => {
      const response = await request(app)
        .post('/api/v1/decks')
        .set(authHeader(testUser.token))
        .send({ name: 'Persistent Deck' });

      expect(response.status).toBe(201);

      const deck = await Deck.findById(response.body._id);
      expect(deck).toBeTruthy();
      expect(deck?.name).toBe('Persistent Deck');
      expect(deck?.ownerId.toString()).toBe(testUser.userId.toString());
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .post('/api/v1/decks')
        .send({ name: 'Test Deck' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/decks/:id/cards', () => {
    let testDeck: any;

    beforeEach(async () => {
      testDeck = await Deck.create({ 
        name: 'Test Deck', 
        ownerId: testUser.userId,
        visibility: 'private' 
      });
    });

    it('should return empty array when deck has no cards', async () => {
      const response = await request(app)
        .get(`/api/v1/decks/${testDeck._id}/cards`)
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return cards for a deck', async () => {
      await Flashcard.create({
        deckId: testDeck._id,
        type: 'basic',
        prompt: 'What is React?',
        answer: 'A JavaScript library',
        leitner: { box: 1, nextReviewAt: new Date() },
        stats: { correct: 0, incorrect: 0 }
      });

      await Flashcard.create({
        deckId: testDeck._id,
        type: 'basic',
        prompt: 'What is TypeScript?',
        answer: 'A typed superset of JavaScript',
        leitner: { box: 1, nextReviewAt: new Date() },
        stats: { correct: 0, incorrect: 0 }
      });

      const response = await request(app)
        .get(`/api/v1/decks/${testDeck._id}/cards`)
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('prompt');
      expect(response.body[0]).toHaveProperty('answer');
    });

    it('should return cards sorted by createdAt desc', async () => {
      await Flashcard.create({
        deckId: testDeck._id,
        type: 'basic',
        prompt: 'First Card',
        answer: 'Answer 1',
        leitner: { box: 1, nextReviewAt: new Date() },
        stats: { correct: 0, incorrect: 0 }
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await Flashcard.create({
        deckId: testDeck._id,
        type: 'basic',
        prompt: 'Second Card',
        answer: 'Answer 2',
        leitner: { box: 1, nextReviewAt: new Date() },
        stats: { correct: 0, incorrect: 0 }
      });

      const response = await request(app)
        .get(`/api/v1/decks/${testDeck._id}/cards`)
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body[0].prompt).toBe('Second Card');
      expect(response.body[1].prompt).toBe('First Card');
    });

    it('should reject invalid deck ID', async () => {
      const response = await request(app)
        .get('/api/v1/decks/invalid-id/cards')
        .set(authHeader(testUser.token));

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'invalid id');
    });

    it('should return 404 for non-existent or non-owned deck', async () => {
      const fakeId = new Types.ObjectId();

      const response = await request(app)
        .get(`/api/v1/decks/${fakeId}/cards`)
        .set(authHeader(testUser.token));

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'deck not found');
    });

    it('should only return cards for specified deck', async () => {
      const deck2 = await Deck.create({ 
        name: 'Deck 2', 
        ownerId: testUser.userId,
        visibility: 'private' 
      });
      
      await Flashcard.create({
        deckId: testDeck._id,
        type: 'basic',
        prompt: 'Deck 1 Card',
        answer: 'Answer 1',
        leitner: { box: 1, nextReviewAt: new Date() },
        stats: { correct: 0, incorrect: 0 }
      });

      await Flashcard.create({
        deckId: deck2._id,
        type: 'basic',
        prompt: 'Deck 2 Card',
        answer: 'Answer 2',
        leitner: { box: 1, nextReviewAt: new Date() },
        stats: { correct: 0, incorrect: 0 }
      });

      const response = await request(app)
        .get(`/api/v1/decks/${testDeck._id}/cards`)
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].prompt).toBe('Deck 1 Card');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get(`/api/v1/decks/${testDeck._id}/cards`);

      expect(response.status).toBe(401);
    });
  });
});