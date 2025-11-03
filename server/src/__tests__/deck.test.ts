import request from 'supertest';
import express from 'express';
import v1Routes from '../routes/v1';
import { Deck } from '../models/deck.model';
import { Flashcard } from '../models/flashcard.model';
import './setup';

const app = express();
app.use(express.json());
app.use('/api/v1', v1Routes);

describe('Deck Endpoints', () => {
  describe('GET /api/v1/decks', () => {
    it('should return empty array when no decks', async () => {
      const response = await request(app).get('/api/v1/decks');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return list of decks', async () => {
      await Deck.create({ name: 'Deck 1', visibility: 'private' });
      await Deck.create({ name: 'Deck 2', visibility: 'private' });

      const response = await request(app).get('/api/v1/decks');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('visibility');
    });

    it('should return decks sorted by createdAt desc', async () => {
      const deck1 = await Deck.create({ name: 'First Deck', visibility: 'private' });
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      const deck2 = await Deck.create({ name: 'Second Deck', visibility: 'private' });

      const response = await request(app).get('/api/v1/decks');

      expect(response.status).toBe(200);
      expect(response.body[0].name).toBe('Second Deck'); // Most recent first
      expect(response.body[1].name).toBe('First Deck');
    });

    it('should limit to 50 decks', async () => {
      // Create 60 decks
      const deckPromises = [];
      for (let i = 0; i < 60; i++) {
        deckPromises.push(Deck.create({ name: `Deck ${i}`, visibility: 'private' }));
      }
      await Promise.all(deckPromises);

      const response = await request(app).get('/api/v1/decks');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(50);
    });
  });

  describe('POST /api/v1/decks', () => {
    it('should create a new deck', async () => {
      const response = await request(app)
        .post('/api/v1/decks')
        .send({ name: 'My Test Deck' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('name', 'My Test Deck');
      expect(response.body).toHaveProperty('visibility', 'private');
    });

    it('should reject deck creation without name', async () => {
      const response = await request(app)
        .post('/api/v1/decks')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'name is required');
    });

    it('should reject deck creation with empty name', async () => {
      const response = await request(app)
        .post('/api/v1/decks')
        .send({ name: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'name is required');
    });

    it('should create deck with default visibility private', async () => {
      const response = await request(app)
        .post('/api/v1/decks')
        .send({ name: 'Test Deck' });

      expect(response.status).toBe(201);
      expect(response.body.visibility).toBe('private');
    });

    it('should persist deck to database', async () => {
      const response = await request(app)
        .post('/api/v1/decks')
        .send({ name: 'Persistent Deck' });

      expect(response.status).toBe(201);

      const deck = await Deck.findById(response.body._id);
      expect(deck).toBeTruthy();
      expect(deck?.name).toBe('Persistent Deck');
    });
  });

  describe('GET /api/v1/decks/:id/cards', () => {
    it('should return empty array when deck has no cards', async () => {
      const deck = await Deck.create({ name: 'Empty Deck', visibility: 'private' });

      const response = await request(app).get(`/api/v1/decks/${deck._id}/cards`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return cards for a deck', async () => {
      const deck = await Deck.create({ name: 'Test Deck', visibility: 'private' });
      
      await Flashcard.create({
        deckId: deck._id,
        type: 'basic',
        prompt: 'What is React?',
        answer: 'A JavaScript library',
        leitner: { box: 1, nextReviewAt: new Date() },
        stats: { correct: 0, incorrect: 0 }
      });

      await Flashcard.create({
        deckId: deck._id,
        type: 'basic',
        prompt: 'What is TypeScript?',
        answer: 'A typed superset of JavaScript',
        leitner: { box: 1, nextReviewAt: new Date() },
        stats: { correct: 0, incorrect: 0 }
      });

      const response = await request(app).get(`/api/v1/decks/${deck._id}/cards`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('prompt');
      expect(response.body[0]).toHaveProperty('answer');
      expect(response.body[0]).toHaveProperty('deckId');
    });

    it('should return cards sorted by createdAt desc', async () => {
      const deck = await Deck.create({ name: 'Test Deck', visibility: 'private' });
      
      const card1 = await Flashcard.create({
        deckId: deck._id,
        type: 'basic',
        prompt: 'First Card',
        answer: 'Answer 1',
        leitner: { box: 1, nextReviewAt: new Date() },
        stats: { correct: 0, incorrect: 0 }
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const card2 = await Flashcard.create({
        deckId: deck._id,
        type: 'basic',
        prompt: 'Second Card',
        answer: 'Answer 2',
        leitner: { box: 1, nextReviewAt: new Date() },
        stats: { correct: 0, incorrect: 0 }
      });

      const response = await request(app).get(`/api/v1/decks/${deck._id}/cards`);

      expect(response.status).toBe(200);
      expect(response.body[0].prompt).toBe('Second Card'); // Most recent first
      expect(response.body[1].prompt).toBe('First Card');
    });

    it('should reject invalid deck ID', async () => {
      const response = await request(app).get('/api/v1/decks/invalid-id/cards');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'invalid id');
    });

    it('should return empty array for non-existent deck', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format

      const response = await request(app).get(`/api/v1/decks/${fakeId}/cards`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should only return cards for specified deck', async () => {
      const deck1 = await Deck.create({ name: 'Deck 1', visibility: 'private' });
      const deck2 = await Deck.create({ name: 'Deck 2', visibility: 'private' });
      
      await Flashcard.create({
        deckId: deck1._id,
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

      const response = await request(app).get(`/api/v1/decks/${deck1._id}/cards`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].prompt).toBe('Deck 1 Card');
    });
  });
});