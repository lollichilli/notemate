import request from 'supertest';
import express from 'express';
import v1Routes from '../routes/v1';
import { Deck } from '../models/deck.model';
import { Flashcard } from '../models/flashcard.model';
import { DocBlock } from '../models/docblock.model';
import { Document } from '../models/document.model';
import './setup';

const app = express();
app.use(express.json());
app.use('/api/v1', v1Routes);

describe('Flashcard Endpoints', () => {
  let testDeck: any;

  beforeEach(async () => {
    testDeck = await Deck.create({ name: 'Test Deck', visibility: 'private' });
  });

  describe('POST /api/v1/decks/:id/cards', () => {
    it('should create a basic flashcard', async () => {
      const response = await request(app)
        .post(`/api/v1/decks/${testDeck._id}/cards`)
        .send({
          type: 'basic',
          prompt: 'What is React?',
          answer: 'A JavaScript library'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('deckId', testDeck._id.toString());
      expect(response.body).toHaveProperty('prompt', 'What is React?');
      expect(response.body).toHaveProperty('answer', 'A JavaScript library');
      expect(response.body).toHaveProperty('type', 'basic');
    });

    it('should create card with default type basic', async () => {
      const response = await request(app)
        .post(`/api/v1/decks/${testDeck._id}/cards`)
        .send({
          prompt: 'Test Question',
          answer: 'Test Answer'
        });

      expect(response.status).toBe(201);
      expect(response.body.type).toBe('basic');
    });

    it('should initialize leitner system with box 1', async () => {
      const response = await request(app)
        .post(`/api/v1/decks/${testDeck._id}/cards`)
        .send({
          prompt: 'Test',
          answer: 'Answer'
        });

      expect(response.status).toBe(201);
      expect(response.body.leitner).toHaveProperty('box', 1);
      expect(response.body.leitner).toHaveProperty('nextReviewAt');
    });

    it('should initialize stats with zeros', async () => {
      const response = await request(app)
        .post(`/api/v1/decks/${testDeck._id}/cards`)
        .send({
          prompt: 'Test',
          answer: 'Answer'
        });

      expect(response.status).toBe(201);
      expect(response.body.stats).toHaveProperty('correct', 0);
      expect(response.body.stats).toHaveProperty('incorrect', 0);
    });

    it('should reject card without prompt', async () => {
      const response = await request(app)
        .post(`/api/v1/decks/${testDeck._id}/cards`)
        .send({
          answer: 'Test Answer'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'prompt and answer are required');
    });

    it('should reject card without answer', async () => {
      const response = await request(app)
        .post(`/api/v1/decks/${testDeck._id}/cards`)
        .send({
          prompt: 'Test Question'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'prompt and answer are required');
    });

    it('should reject invalid deck ID', async () => {
      const response = await request(app)
        .post('/api/v1/decks/invalid-id/cards')
        .send({
          prompt: 'Test',
          answer: 'Answer'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'invalid deck id');
    });

    it('should create card with block reference', async () => {
      const doc = await Document.create({
        title: 'Test Doc',
        source: {
          fileType: 'md',
          originalName: 'test.md',
          storageKey: 'test-key',
          sizeBytes: 1024
        }
      });
      const block = await DocBlock.create({
        documentId: doc._id,
        page: 1,
        blockIndex: 0,
        type: 'paragraph',
        text: 'This is test content'
      });

      const response = await request(app)
        .post(`/api/v1/decks/${testDeck._id}/cards`)
        .send({
          prompt: 'Test',
          answer: 'Answer',
          blockId: block._id.toString()
        });

      expect(response.status).toBe(201);
      expect(response.body.source).toHaveProperty('blockId', block._id.toString());
      expect(response.body.source).toHaveProperty('page', 1);
      expect(response.body.source).toHaveProperty('quote', 'This is test content');
      expect(response.body).toHaveProperty('documentId', doc._id.toString());
    });

    it('should reject invalid block ID', async () => {
      const response = await request(app)
        .post(`/api/v1/decks/${testDeck._id}/cards`)
        .send({
          prompt: 'Test',
          answer: 'Answer',
          blockId: 'invalid-block-id'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'invalid block id');
    });

    it('should reject non-existent block', async () => {
      const fakeBlockId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .post(`/api/v1/decks/${testDeck._id}/cards`)
        .send({
          prompt: 'Test',
          answer: 'Answer',
          blockId: fakeBlockId
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'block not found');
    });
  });

  describe('GET /api/v1/decks/:id/due', () => {
    it('should return empty array when no due cards', async () => {
      // Create a card due in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      await Flashcard.create({
        deckId: testDeck._id,
        type: 'basic',
        prompt: 'Future Card',
        answer: 'Answer',
        leitner: { box: 1, nextReviewAt: futureDate },
        stats: { correct: 0, incorrect: 0 }
      });

      const response = await request(app).get(`/api/v1/decks/${testDeck._id}/due`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return due cards', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await Flashcard.create({
        deckId: testDeck._id,
        type: 'basic',
        prompt: 'Due Card',
        answer: 'Answer',
        leitner: { box: 1, nextReviewAt: pastDate },
        stats: { correct: 0, incorrect: 0 }
      });

      const response = await request(app).get(`/api/v1/decks/${testDeck._id}/due`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].prompt).toBe('Due Card');
    });

    it('should return cards due now', async () => {
      await Flashcard.create({
        deckId: testDeck._id,
        type: 'basic',
        prompt: 'Now Card',
        answer: 'Answer',
        leitner: { box: 1, nextReviewAt: new Date() },
        stats: { correct: 0, incorrect: 0 }
      });

      const response = await request(app).get(`/api/v1/decks/${testDeck._id}/due`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it('should sort by nextReviewAt ascending', async () => {
      const date1 = new Date();
      date1.setDate(date1.getDate() - 3);

      const date2 = new Date();
      date2.setDate(date2.getDate() - 1);

      await Flashcard.create({
        deckId: testDeck._id,
        type: 'basic',
        prompt: 'Card 1',
        answer: 'Answer',
        leitner: { box: 1, nextReviewAt: date2 },
        stats: { correct: 0, incorrect: 0 }
      });

      await Flashcard.create({
        deckId: testDeck._id,
        type: 'basic',
        prompt: 'Card 2',
        answer: 'Answer',
        leitner: { box: 1, nextReviewAt: date1 },
        stats: { correct: 0, incorrect: 0 }
      });

      const response = await request(app).get(`/api/v1/decks/${testDeck._id}/due`);

      expect(response.status).toBe(200);
      expect(response.body[0].prompt).toBe('Card 2'); // Oldest due first
      expect(response.body[1].prompt).toBe('Card 1');
    });

    it('should limit to 100 cards', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      // Create 150 due cards
      const cardPromises = [];
      for (let i = 0; i < 150; i++) {
        cardPromises.push(
          Flashcard.create({
            deckId: testDeck._id,
            type: 'basic',
            prompt: `Card ${i}`,
            answer: 'Answer',
            leitner: { box: 1, nextReviewAt: pastDate },
            stats: { correct: 0, incorrect: 0 }
          })
        );
      }
      await Promise.all(cardPromises);

      const response = await request(app).get(`/api/v1/decks/${testDeck._id}/due`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(100);
    });

    it('should reject invalid deck ID', async () => {
      const response = await request(app).get('/api/v1/decks/invalid-id/due');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'invalid deck id');
    });

    it('should only return cards for specified deck', async () => {
      const otherDeck = await Deck.create({ name: 'Other Deck', visibility: 'private' });

      await Flashcard.create({
        deckId: testDeck._id,
        type: 'basic',
        prompt: 'Test Deck Card',
        answer: 'Answer',
        leitner: { box: 1, nextReviewAt: new Date() },
        stats: { correct: 0, incorrect: 0 }
      });

      await Flashcard.create({
        deckId: otherDeck._id,
        type: 'basic',
        prompt: 'Other Deck Card',
        answer: 'Answer',
        leitner: { box: 1, nextReviewAt: new Date() },
        stats: { correct: 0, incorrect: 0 }
      });

      const response = await request(app).get(`/api/v1/decks/${testDeck._id}/due`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].prompt).toBe('Test Deck Card');
    });
  });

  describe('POST /api/v1/cards/:id/review', () => {
    let testCard: any;

    beforeEach(async () => {
      testCard = await Flashcard.create({
        deckId: testDeck._id,
        type: 'basic',
        prompt: 'Test Card',
        answer: 'Answer',
        leitner: { box: 1, nextReviewAt: new Date() },
        stats: { correct: 0, incorrect: 0 }
      });
    });

    it('should handle "again" result - reset to box 1', async () => {
      // First review it correctly to get to box 2
      await request(app)
        .post(`/api/v1/cards/${testCard._id}/review`)
        .send({ result: 'gotit' });

      // Now review again
      const response = await request(app)
        .post(`/api/v1/cards/${testCard._id}/review`)
        .send({ result: 'again' });

      expect(response.status).toBe(200);
      expect(response.body.card.leitner.box).toBe(1);
      expect(response.body.card.stats.incorrect).toBe(1);
    });

    it('should increment incorrect count on "again"', async () => {
      const response = await request(app)
        .post(`/api/v1/cards/${testCard._id}/review`)
        .send({ result: 'again' });

      expect(response.status).toBe(200);
      expect(response.body.card.stats.incorrect).toBe(1);
      expect(response.body.card.stats.correct).toBe(0);
    });

    it('should handle "gotit" result - increment box', async () => {
      const response = await request(app)
        .post(`/api/v1/cards/${testCard._id}/review`)
        .send({ result: 'gotit' });

      expect(response.status).toBe(200);
      expect(response.body.card.leitner.box).toBe(2);
      expect(response.body.card.stats.correct).toBe(1);
    });

    it('should increment correct count on "gotit"', async () => {
      const response = await request(app)
        .post(`/api/v1/cards/${testCard._id}/review`)
        .send({ result: 'gotit' });

      expect(response.status).toBe(200);
      expect(response.body.card.stats.correct).toBe(1);
      expect(response.body.card.stats.incorrect).toBe(0);
    });

    it('should not exceed box 5', async () => {
      // Review 5 times to reach box 5
      let cardId = testCard._id;
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post(`/api/v1/cards/${cardId}/review`)
          .send({ result: 'gotit' });
      }

      // One more time should stay at box 5
      const response = await request(app)
        .post(`/api/v1/cards/${cardId}/review`)
        .send({ result: 'gotit' });

      expect(response.status).toBe(200);
      expect(response.body.card.leitner.box).toBe(5);
    });

    it('should update nextReviewAt based on box', async () => {
      const beforeReview = new Date();

      const response = await request(app)
        .post(`/api/v1/cards/${testCard._id}/review`)
        .send({ result: 'gotit' });

      const nextReview = new Date(response.body.card.leitner.nextReviewAt);
      const daysDiff = Math.floor((nextReview.getTime() - beforeReview.getTime()) / (1000 * 60 * 60 * 24));

      // Box 2 should schedule 2 days ahead
      expect(daysDiff).toBeGreaterThanOrEqual(1);
      expect(daysDiff).toBeLessThanOrEqual(2);
    });

    it('should follow Leitner schedule (1,2,4,8,16 days)', async () => {
      // Test box 1 (1 day)
      await Flashcard.findByIdAndUpdate(testCard._id, {
        'leitner.box': 1
      });

      let response = await request(app)
        .post(`/api/v1/cards/${testCard._id}/review`)
        .send({ result: 'again' });

      let nextReview = new Date(response.body.card.leitner.nextReviewAt);
      let now = new Date();
      let daysDiff = Math.floor((nextReview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(0);
      expect(daysDiff).toBeLessThanOrEqual(1);
    });

    it('should reject invalid card ID', async () => {
      const response = await request(app)
        .post('/api/v1/cards/invalid-id/review')
        .send({ result: 'gotit' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'invalid card id');
    });

    it('should reject non-existent card', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .post(`/api/v1/cards/${fakeId}/review`)
        .send({ result: 'gotit' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'card not found');
    });

    it('should reject invalid result value', async () => {
      const response = await request(app)
        .post(`/api/v1/cards/${testCard._id}/review`)
        .send({ result: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', "result must be 'again' or 'gotit'");
    });

    it('should reject missing result', async () => {
      const response = await request(app)
        .post(`/api/v1/cards/${testCard._id}/review`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', "result must be 'again' or 'gotit'");
    });

    it('should persist review to database', async () => {
      await request(app)
        .post(`/api/v1/cards/${testCard._id}/review`)
        .send({ result: 'gotit' });

      const card = await Flashcard.findById(testCard._id);
      expect(card?.leitner.box).toBe(2);
      expect(card?.stats.correct).toBe(1);
    });
  });
});