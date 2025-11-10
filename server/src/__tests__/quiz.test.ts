import request from 'supertest';
import express from 'express';
import { Types } from 'mongoose';
import v1Routes from '../routes/v1';
import { quiz } from '../models/quiz.model';
import { quizAttempt } from '../models/quizattempt.model';
import { Document } from '../models/document.model';
import { createTestUser, authHeader } from './helpers/testHelpers';
import './setup';

const app = express();
app.use(express.json());
app.use('/api/v1', v1Routes);

describe('Quiz Endpoints', () => {
  let testUser: { userId: Types.ObjectId; token: string; user: any };
  let testDoc: any;

  beforeEach(async () => {
    testUser = await createTestUser('quiztest@test.com');
    testDoc = await Document.create({
      title: 'Test Doc',
      uploaderId: testUser.userId,
      source: {
        fileType: 'md',
        originalName: 'test.md',
        storageKey: 'key1',
        sizeBytes: 100
      }
    });
  });

  describe('POST /api/v1/quizzes', () => {
    const validQuizData = {
      title: 'Test Quiz',
      questions: [
        {
          type: 'mcq',
          question: 'What is 2+2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: 1,
          points: 1
        },
        {
          type: 'true-false',
          question: 'The sky is blue',
          correctAnswer: 'true',
          points: 1
        }
      ]
    };

    it('should create a quiz', async () => {
      const response = await request(app)
        .post('/api/v1/quizzes')
        .set(authHeader(testUser.token))
        .send({
          ...validQuizData,
          documentId: testDoc._id
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('title', 'Test Quiz');
      expect(response.body.questions).toHaveLength(2);
      expect(response.body).toHaveProperty('totalPoints', 2);
      expect(response.body).toHaveProperty('createdBy', testUser.userId.toString());
    });

    it('should calculate total points correctly', async () => {
      const response = await request(app)
        .post('/api/v1/quizzes')
        .set(authHeader(testUser.token))
        .send({
          title: 'Points Quiz',
          documentId: testDoc._id,
          questions: [
            {
              type: 'mcq',
              question: 'Q1',
              options: ['a', 'b'],
              correctAnswer: 0,
              points: 5
            },
            {
              type: 'mcq',
              question: 'Q2',
              options: ['a', 'b'],
              correctAnswer: 0,
              points: 3
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.totalPoints).toBe(8);
    });

    it('should set default points to 1 if not provided', async () => {
      const response = await request(app)
        .post('/api/v1/quizzes')
        .set(authHeader(testUser.token))
        .send({
          title: 'Default Points Quiz',
          documentId: testDoc._id,
          questions: [
            {
              type: 'true-false',
              question: 'Test question',
              correctAnswer: 'true'
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.totalPoints).toBe(1);
    });

    it('should reject quiz without title', async () => {
      const response = await request(app)
        .post('/api/v1/quizzes')
        .set(authHeader(testUser.token))
        .send({
          documentId: testDoc._id,
          questions: []
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Missing required fields');
    });

    it('should reject quiz without documentId', async () => {
      const response = await request(app)
        .post('/api/v1/quizzes')
        .set(authHeader(testUser.token))
        .send({
          title: 'Test',
          questions: []
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Missing required fields');
    });

    it('should reject quiz without questions', async () => {
      const response = await request(app)
        .post('/api/v1/quizzes')
        .set(authHeader(testUser.token))
        .send({
          title: 'Test',
          documentId: testDoc._id
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Missing required fields');
    });

    it('should reject invalid documentId', async () => {
      const response = await request(app)
        .post('/api/v1/quizzes')
        .set(authHeader(testUser.token))
        .send({
          ...validQuizData,
          documentId: 'invalid-id'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid document ID');
    });

    it('should reject non-existent document', async () => {
      const fakeId = new Types.ObjectId();

      const response = await request(app)
        .post('/api/v1/quizzes')
        .set(authHeader(testUser.token))
        .send({
          ...validQuizData,
          documentId: fakeId
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Document not found');
    });

    it('should store optional timeLimit', async () => {
      const response = await request(app)
        .post('/api/v1/quizzes')
        .set(authHeader(testUser.token))
        .send({
          ...validQuizData,
          documentId: testDoc._id,
          timeLimit: 30
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('timeLimit', 30);
    });

    it('should store optional tags', async () => {
      const response = await request(app)
        .post('/api/v1/quizzes')
        .set(authHeader(testUser.token))
        .send({
          ...validQuizData,
          documentId: testDoc._id,
          tags: ['javascript', 'basics']
        });

      expect(response.status).toBe(201);
      expect(response.body.tags).toEqual(['javascript', 'basics']);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .post('/api/v1/quizzes')
        .send({
          ...validQuizData,
          documentId: testDoc._id
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/quizzes', () => {
    it('should return empty array when no quizzes', async () => {
      const response = await request(app)
        .get('/api/v1/quizzes')
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return list of quizzes', async () => {
      await quiz.create({
        title: 'Quiz 1',
        documentId: testDoc._id,
        createdBy: testUser.userId,
        questions: [],
        totalPoints: 0
      });

      await quiz.create({
        title: 'Quiz 2',
        documentId: testDoc._id,
        createdBy: testUser.userId,
        questions: [],
        totalPoints: 0
      });

      const response = await request(app)
        .get('/api/v1/quizzes')
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('should sort by createdAt desc', async () => {
      await quiz.create({
        title: 'First Quiz',
        documentId: testDoc._id,
        createdBy: testUser.userId,
        questions: [],
        totalPoints: 0
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await quiz.create({
        title: 'Second Quiz',
        documentId: testDoc._id,
        createdBy: testUser.userId,
        questions: [],
        totalPoints: 0
      });

      const response = await request(app)
        .get('/api/v1/quizzes')
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body[0].title).toBe('Second Quiz');
      expect(response.body[1].title).toBe('First Quiz');
    });

    it('should limit to 50 quizzes', async () => {
      const quizPromises = [];
      for (let i = 0; i < 60; i++) {
        quizPromises.push(
          quiz.create({
            title: `Quiz ${i}`,
            documentId: testDoc._id,
            createdBy: testUser.userId,
            questions: [],
            totalPoints: 0
          })
        );
      }
      await Promise.all(quizPromises);

      const response = await request(app)
        .get('/api/v1/quizzes')
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(50);
    });

    it('should filter by documentId', async () => {
      const otherDoc = await Document.create({
        title: 'Other Doc',
        uploaderId: testUser.userId,
        source: {
          fileType: 'md',
          originalName: 'other.md',
          storageKey: 'key2',
          sizeBytes: 100
        }
      });

      await quiz.create({
        title: 'Quiz for testDoc',
        documentId: testDoc._id,
        createdBy: testUser.userId,
        questions: [],
        totalPoints: 0
      });

      await quiz.create({
        title: 'Quiz for otherDoc',
        documentId: otherDoc._id,
        createdBy: testUser.userId,
        questions: [],
        totalPoints: 0
      });

      const response = await request(app)
        .get(`/api/v1/quizzes?documentId=${testDoc._id}`)
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Quiz for testDoc');
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/v1/quizzes');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/quizzes/:id', () => {
    it('should return quiz by ID', async () => {
      const testQuiz = await quiz.create({
        title: 'Test Quiz',
        documentId: testDoc._id,
        createdBy: testUser.userId,
        questions: [{
          type: 'mcq',
          question: 'What is 2+2?',
          options: ['3', '4', '5'],
          correctAnswer: 1
        }],
        totalPoints: 1
      });

      const response = await request(app)
        .get(`/api/v1/quizzes/${testQuiz._id}`)
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id', testQuiz._id.toString());
      expect(response.body).toHaveProperty('title', 'Test Quiz');
      expect(response.body.questions).toHaveLength(1);
    });

    it('should reject invalid ID', async () => {
      const response = await request(app)
        .get('/api/v1/quizzes/invalid-id')
        .set(authHeader(testUser.token));

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid quiz ID');
    });

    it('should return 404 for non-existent quiz', async () => {
      const fakeId = new Types.ObjectId();

      const response = await request(app)
        .get(`/api/v1/quizzes/${fakeId}`)
        .set(authHeader(testUser.token));

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Quiz not found');
    });

    it('should reject request without token', async () => {
      const testQuiz = await quiz.create({
        title: 'Test Quiz',
        documentId: testDoc._id,
        createdBy: testUser.userId,
        questions: [],
        totalPoints: 0
      });

      const response = await request(app).get(`/api/v1/quizzes/${testQuiz._id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/quizzes/:id/attempt', () => {
    let testQuiz: any;

    beforeEach(async () => {
      testQuiz = await quiz.create({
        title: 'Test Quiz',
        documentId: testDoc._id,
        createdBy: testUser.userId,
        questions: [
          {
            type: 'mcq',
            question: 'What is 2+2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: 1,
            points: 2
          },
          {
            type: 'true-false',
            question: 'The sky is blue',
            correctAnswer: 'true',
            points: 1
          },
          {
            type: 'short-answer',
            question: 'What is the capital of France?',
            correctAnswer: 'Paris',
            points: 1
          }
        ],
        totalPoints: 4
      });
    });

    it('should submit quiz attempt and calculate score', async () => {
      const response = await request(app)
        .post(`/api/v1/quizzes/${testQuiz._id}/attempt`)
        .set(authHeader(testUser.token))
        .send({
          answers: [
            { questionIndex: 0, userAnswer: 1 },
            { questionIndex: 1, userAnswer: 'true' },
            { questionIndex: 2, userAnswer: 'Paris' }
          ],
          timeSpent: 120
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('score', 4);
      expect(response.body).toHaveProperty('totalPoints', 4);
      expect(response.body).toHaveProperty('percentage', 100);
    });

    it('should grade MCQ questions correctly', async () => {
      const response = await request(app)
        .post(`/api/v1/quizzes/${testQuiz._id}/attempt`)
        .set(authHeader(testUser.token))
        .send({
          answers: [
            { questionIndex: 0, userAnswer: 1 },
            { questionIndex: 1, userAnswer: 'false' },
            { questionIndex: 2, userAnswer: 'London' }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.answers[0].isCorrect).toBe(true);
      expect(response.body.answers[0].pointsEarned).toBe(2);
    });

    it('should grade true/false questions correctly', async () => {
      const response = await request(app)
        .post(`/api/v1/quizzes/${testQuiz._id}/attempt`)
        .set(authHeader(testUser.token))
        .send({
          answers: [
            { questionIndex: 0, userAnswer: 0 },
            { questionIndex: 1, userAnswer: 'TRUE' },
            { questionIndex: 2, userAnswer: 'Paris' }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.answers[1].isCorrect).toBe(true);
      expect(response.body.answers[1].pointsEarned).toBe(1);
    });

    it('should grade short-answer questions correctly', async () => {
      const response = await request(app)
        .post(`/api/v1/quizzes/${testQuiz._id}/attempt`)
        .set(authHeader(testUser.token))
        .send({
          answers: [
            { questionIndex: 0, userAnswer: 0 },
            { questionIndex: 1, userAnswer: 'false' },
            { questionIndex: 2, userAnswer: 'paris' }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.answers[2].isCorrect).toBe(true);
      expect(response.body.answers[2].pointsEarned).toBe(1);
    });

    it('should calculate partial score', async () => {
      const response = await request(app)
        .post(`/api/v1/quizzes/${testQuiz._id}/attempt`)
        .set(authHeader(testUser.token))
        .send({
          answers: [
            { questionIndex: 0, userAnswer: 1 },
            { questionIndex: 1, userAnswer: 'false' },
            { questionIndex: 2, userAnswer: 'London' }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.score).toBe(2);
      expect(response.body.percentage).toBe(50);
    });

    it('should calculate zero score for all wrong answers', async () => {
      const response = await request(app)
        .post(`/api/v1/quizzes/${testQuiz._id}/attempt`)
        .set(authHeader(testUser.token))
        .send({
          answers: [
            { questionIndex: 0, userAnswer: 0 },
            { questionIndex: 1, userAnswer: 'false' },
            { questionIndex: 2, userAnswer: 'London' }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.score).toBe(0);
      expect(response.body.percentage).toBe(0);
    });

    it('should store timeSpent', async () => {
      const response = await request(app)
        .post(`/api/v1/quizzes/${testQuiz._id}/attempt`)
        .set(authHeader(testUser.token))
        .send({
          answers: [{ questionIndex: 0, userAnswer: 1 }],
          timeSpent: 180
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('timeSpent', 180);
    });

    it('should store completedAt timestamp', async () => {
      const response = await request(app)
        .post(`/api/v1/quizzes/${testQuiz._id}/attempt`)
        .set(authHeader(testUser.token))
        .send({
          answers: [{ questionIndex: 0, userAnswer: 1 }]
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('completedAt');
      expect(new Date(response.body.completedAt)).toBeInstanceOf(Date);
    });

    it('should reject invalid quiz ID', async () => {
      const response = await request(app)
        .post('/api/v1/quizzes/invalid-id/attempt')
        .set(authHeader(testUser.token))
        .send({
          answers: []
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid quiz ID');
    });

    it('should reject non-existent quiz', async () => {
      const fakeId = new Types.ObjectId();

      const response = await request(app)
        .post(`/api/v1/quizzes/${fakeId}/attempt`)
        .set(authHeader(testUser.token))
        .send({
          answers: []
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Quiz not found');
    });

    it('should reject missing answers array', async () => {
      const response = await request(app)
        .post(`/api/v1/quizzes/${testQuiz._id}/attempt`)
        .set(authHeader(testUser.token))
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Answers array is required');
    });

    it('should handle out-of-range question index', async () => {
      const response = await request(app)
        .post(`/api/v1/quizzes/${testQuiz._id}/attempt`)
        .set(authHeader(testUser.token))
        .send({
          answers: [
            { questionIndex: 999, userAnswer: 'test' }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.answers[0].isCorrect).toBe(false);
      expect(response.body.answers[0].pointsEarned).toBe(0);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .post(`/api/v1/quizzes/${testQuiz._id}/attempt`)
        .send({
          answers: []
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/quizzes/:id/attempts', () => {
    let testQuiz: any;

    beforeEach(async () => {
      testQuiz = await quiz.create({
        title: 'Test Quiz',
        documentId: testDoc._id,
        createdBy: testUser.userId,
        questions: [],
        totalPoints: 10
      });
    });

    it('should return empty array when no attempts', async () => {
      const response = await request(app)
        .get(`/api/v1/quizzes/${testQuiz._id}/attempts`)
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return quiz attempts', async () => {
      await quizAttempt.create({
        quizId: testQuiz._id,
        userId: testUser.userId,
        answers: [],
        score: 8,
        totalPoints: 10,
        percentage: 80,
        completedAt: new Date()
      });

      await quizAttempt.create({
        quizId: testQuiz._id,
        userId: testUser.userId,
        answers: [],
        score: 6,
        totalPoints: 10,
        percentage: 60,
        completedAt: new Date()
      });

      const response = await request(app)
        .get(`/api/v1/quizzes/${testQuiz._id}/attempts`)
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('should sort by createdAt desc', async () => {
      await quizAttempt.create({
        quizId: testQuiz._id,
        userId: testUser.userId,
        answers: [],
        score: 5,
        totalPoints: 10,
        percentage: 50,
        completedAt: new Date()
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await quizAttempt.create({
        quizId: testQuiz._id,
        userId: testUser.userId,
        answers: [],
        score: 7,
        totalPoints: 10,
        percentage: 70,
        completedAt: new Date()
      });

      const response = await request(app)
        .get(`/api/v1/quizzes/${testQuiz._id}/attempts`)
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body[0].score).toBe(7);
      expect(response.body[1].score).toBe(5);
    });

    it('should limit to 50 attempts', async () => {
      const attemptPromises = [];
      for (let i = 0; i < 60; i++) {
        attemptPromises.push(
          quizAttempt.create({
            quizId: testQuiz._id,
            userId: testUser.userId,
            answers: [],
            score: i,
            totalPoints: 10,
            percentage: (i / 10) * 100,
            completedAt: new Date()
          })
        );
      }
      await Promise.all(attemptPromises);

      const response = await request(app)
        .get(`/api/v1/quizzes/${testQuiz._id}/attempts`)
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(50);
    });

    it('should only return attempts for specified quiz', async () => {
      const otherQuiz = await quiz.create({
        title: 'Other Quiz',
        documentId: testDoc._id,
        createdBy: testUser.userId,
        questions: [],
        totalPoints: 10
      });

      await quizAttempt.create({
        quizId: testQuiz._id,
        userId: testUser.userId,
        answers: [],
        score: 8,
        totalPoints: 10,
        percentage: 80,
        completedAt: new Date()
      });

      await quizAttempt.create({
        quizId: otherQuiz._id,
        userId: testUser.userId,
        answers: [],
        score: 6,
        totalPoints: 10,
        percentage: 60,
        completedAt: new Date()
      });

      const response = await request(app)
        .get(`/api/v1/quizzes/${testQuiz._id}/attempts`)
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].score).toBe(8);
    });

    it('should reject invalid quiz ID', async () => {
      const response = await request(app)
        .get('/api/v1/quizzes/invalid-id/attempts')
        .set(authHeader(testUser.token));

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid quiz ID');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get(`/api/v1/quizzes/${testQuiz._id}/attempts`);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/quizzes/:id', () => {
    it('should delete quiz', async () => {
      const testQuiz = await quiz.create({
        title: 'Quiz to Delete',
        documentId: testDoc._id,
        createdBy: testUser.userId,
        questions: [],
        totalPoints: 0
      });

      const response = await request(app)
        .delete(`/api/v1/quizzes/${testQuiz._id}`)
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Quiz deleted successfully');

      const deletedQuiz = await quiz.findById(testQuiz._id);
      expect(deletedQuiz).toBeNull();
    });

    it('should delete associated attempts', async () => {
      const testQuiz = await quiz.create({
        title: 'Quiz to Delete',
        documentId: testDoc._id,
        createdBy: testUser.userId,
        questions: [],
        totalPoints: 10
      });

      await quizAttempt.create({
        quizId: testQuiz._id,
        userId: testUser.userId,
        answers: [],
        score: 8,
        totalPoints: 10,
        percentage: 80,
        completedAt: new Date()
      });

      await request(app)
        .delete(`/api/v1/quizzes/${testQuiz._id}`)
        .set(authHeader(testUser.token));

      const attempts = await quizAttempt.find({ quizId: testQuiz._id });
      expect(attempts).toHaveLength(0);
    });

    it('should reject invalid ID', async () => {
      const response = await request(app)
        .delete('/api/v1/quizzes/invalid-id')
        .set(authHeader(testUser.token));

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid quiz ID');
    });

    it('should return 404 for non-existent quiz', async () => {
      const fakeId = new Types.ObjectId();

      const response = await request(app)
        .delete(`/api/v1/quizzes/${fakeId}`)
        .set(authHeader(testUser.token));

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Quiz not found');
    });

    it('should reject request without token', async () => {
      const testQuiz = await quiz.create({
        title: 'Quiz to Delete',
        documentId: testDoc._id,
        createdBy: testUser.userId,
        questions: [],
        totalPoints: 0
      });

      const response = await request(app)
        .delete(`/api/v1/quizzes/${testQuiz._id}`);

      expect(response.status).toBe(401);
    });
  });
});