import request from 'supertest';
import express from 'express';
import { Types } from 'mongoose';
import v1Routes from '../routes/v1';
import { Document } from '../models/document.model';
import { DocBlock } from '../models/docblock.model';
import { createTestUser, authHeader } from './helpers/testHelpers';
import './setup';

const app = express();
app.use(express.json());
app.use('/api/v1', v1Routes);

describe('Document Endpoints', () => {
  let testUser: { userId: Types.ObjectId; token: string; user: any };

  beforeEach(async () => {
    testUser = await createTestUser('doctest@test.com');
  });

  describe('GET /api/v1/documents', () => {
    it('should return empty array when no documents', async () => {
      const response = await request(app)
        .get('/api/v1/documents')
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return list of documents', async () => {
      await Document.create({
        title: 'Doc 1',
        uploaderId: testUser.userId,
        source: {
          fileType: 'md',
          originalName: 'doc1.md',
          storageKey: 'key1',
          sizeBytes: 100
        }
      });

      await Document.create({
        title: 'Doc 2',
        uploaderId: testUser.userId,
        source: {
          fileType: 'pdf',
          originalName: 'doc2.pdf',
          storageKey: 'key2',
          sizeBytes: 200
        }
      });

      const response = await request(app)
        .get('/api/v1/documents')
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('source');
    });

    it('should return documents sorted by createdAt desc', async () => {
      await Document.create({
        title: 'First Doc',
        uploaderId: testUser.userId,
        source: {
          fileType: 'md',
          originalName: 'first.md',
          storageKey: 'key1',
          sizeBytes: 100
        }
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await Document.create({
        title: 'Second Doc',
        uploaderId: testUser.userId,
        source: {
          fileType: 'md',
          originalName: 'second.md',
          storageKey: 'key2',
          sizeBytes: 100
        }
      });

      const response = await request(app)
        .get('/api/v1/documents')
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body[0].title).toBe('Second Doc');
      expect(response.body[1].title).toBe('First Doc');
    });

    it('should limit to 50 documents', async () => {
      const docPromises = [];
      for (let i = 0; i < 60; i++) {
        docPromises.push(
          Document.create({
            title: `Doc ${i}`,
            uploaderId: testUser.userId,
            source: {
              fileType: 'md',
              originalName: `doc${i}.md`,
              storageKey: `key${i}`,
              sizeBytes: 100
            }
          })
        );
      }
      await Promise.all(docPromises);

      const response = await request(app)
        .get('/api/v1/documents')
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(50);
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/v1/documents');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/documents', () => {
    it('should create a new document', async () => {
      const response = await request(app)
        .post('/api/v1/documents')
        .set(authHeader(testUser.token))
        .send({ title: 'My Test Document' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('title', 'My Test Document');
      expect(response.body.source).toHaveProperty('fileType', 'md');
      expect(response.body.parse).toHaveProperty('status', 'pending');
      expect(response.body).toHaveProperty('uploaderId', testUser.userId.toString());
    });

    it('should reject document without title', async () => {
      const response = await request(app)
        .post('/api/v1/documents')
        .set(authHeader(testUser.token))
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'title is required');
    });

    it('should reject document with empty title', async () => {
      const response = await request(app)
        .post('/api/v1/documents')
        .set(authHeader(testUser.token))
        .send({ title: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'title is required');
    });

    it('should set default values', async () => {
      const response = await request(app)
        .post('/api/v1/documents')
        .set(authHeader(testUser.token))
        .send({ title: 'Test Doc' });

      expect(response.status).toBe(201);
      expect(response.body.source.fileType).toBe('md');
      expect(response.body.source.sizeBytes).toBe(0);
      expect(response.body.tags).toEqual([]);
      expect(response.body.uploaderId).toBe(testUser.userId.toString());
    });

    it('should generate storage key with timestamp', async () => {
      const response = await request(app)
        .post('/api/v1/documents')
        .set(authHeader(testUser.token))
        .send({ title: 'Test Doc' });

      expect(response.status).toBe(201);
      expect(response.body.source.storageKey).toMatch(/^inline\/\d+$/);
    });

    it('should persist document to database', async () => {
      const response = await request(app)
        .post('/api/v1/documents')
        .set(authHeader(testUser.token))
        .send({ title: 'Persistent Doc' });

      expect(response.status).toBe(201);

      const doc = await Document.findById(response.body._id);
      expect(doc).toBeTruthy();
      expect(doc?.title).toBe('Persistent Doc');
      expect(doc?.uploaderId.toString()).toBe(testUser.userId.toString());
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .post('/api/v1/documents')
        .send({ title: 'Test Doc' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/documents/:id/parse-md', () => {
    let testDoc: any;

    beforeEach(async () => {
      testDoc = await Document.create({
        title: 'Test Doc',
        uploaderId: testUser.userId,
        source: {
          fileType: 'md',
          originalName: 'test.md',
          storageKey: 'key1',
          sizeBytes: 0
        }
      });
    });

    it('should parse markdown and create blocks', async () => {
      const markdown = '# Heading\n\nThis is a paragraph.';

      const response = await request(app)
        .post(`/api/v1/documents/${testDoc._id}/parse-md`)
        .set(authHeader(testUser.token))
        .send({ markdown });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ok', true);
      expect(response.body).toHaveProperty('blocksCreated', 2);
    });

    it('should create heading blocks', async () => {
      const markdown = '# Main Heading\n\n## Sub Heading';

      await request(app)
        .post(`/api/v1/documents/${testDoc._id}/parse-md`)
        .set(authHeader(testUser.token))
        .send({ markdown });

      const blocks = await DocBlock.find({ documentId: testDoc._id });
      expect(blocks).toHaveLength(2);
      expect(blocks[0].type).toBe('heading');
      expect(blocks[0].text).toBe('Main Heading');
      expect(blocks[1].type).toBe('heading');
      expect(blocks[1].text).toBe('Sub Heading');
    });

    it('should create paragraph blocks', async () => {
      const markdown = 'This is paragraph one.\n\nThis is paragraph two.';

      await request(app)
        .post(`/api/v1/documents/${testDoc._id}/parse-md`)
        .set(authHeader(testUser.token))
        .send({ markdown });

      const blocks = await DocBlock.find({ documentId: testDoc._id });
      expect(blocks).toHaveLength(2);
      expect(blocks[0].type).toBe('paragraph');
      expect(blocks[1].type).toBe('paragraph');
    });

    it('should create list blocks', async () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3';

      await request(app)
        .post(`/api/v1/documents/${testDoc._id}/parse-md`)
        .set(authHeader(testUser.token))
        .send({ markdown });

      const blocks = await DocBlock.find({ documentId: testDoc._id });
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('list');
      expect(blocks[0].text).toContain('Item 1');
      expect(blocks[0].text).toContain('Item 2');
    });

    it('should handle mixed content', async () => {
      const markdown = '# Title\n\nParagraph text.\n\n- List item\n- Another item';

      await request(app)
        .post(`/api/v1/documents/${testDoc._id}/parse-md`)
        .set(authHeader(testUser.token))
        .send({ markdown });

      const blocks = await DocBlock.find({ documentId: testDoc._id });
      expect(blocks).toHaveLength(3);
      expect(blocks[0].type).toBe('heading');
      expect(blocks[1].type).toBe('paragraph');
      expect(blocks[2].type).toBe('list');
    });

    it('should update document parse status', async () => {
      const markdown = '# Test';

      await request(app)
        .post(`/api/v1/documents/${testDoc._id}/parse-md`)
        .set(authHeader(testUser.token))
        .send({ markdown });

      const doc = await Document.findById(testDoc._id);
      expect(doc?.parse.status).toBe('done');
      expect(doc?.parse.engine).toBe('markdown-basic');
    });

    it('should store raw text in document', async () => {
      const markdown = '# Test Content';

      await request(app)
        .post(`/api/v1/documents/${testDoc._id}/parse-md`)
        .set(authHeader(testUser.token))
        .send({ markdown });

      const doc = await Document.findById(testDoc._id);
      expect((doc?.source as any).rawText).toBe(markdown);
    });

    it('should update document size', async () => {
      const markdown = '# Test Content That Has Some Length';

      await request(app)
        .post(`/api/v1/documents/${testDoc._id}/parse-md`)
        .set(authHeader(testUser.token))
        .send({ markdown });

      const doc = await Document.findById(testDoc._id);
      expect(doc?.source.sizeBytes).toBe(markdown.length);
    });

    it('should delete existing blocks before creating new ones', async () => {
      await DocBlock.create({
        documentId: testDoc._id,
        page: 1,
        blockIndex: 0,
        type: 'paragraph',
        text: 'Old content'
      });

      const markdown = '# New Content';

      await request(app)
        .post(`/api/v1/documents/${testDoc._id}/parse-md`)
        .set(authHeader(testUser.token))
        .send({ markdown });

      const blocks = await DocBlock.find({ documentId: testDoc._id });
      expect(blocks).toHaveLength(1);
      expect(blocks[0].text).toBe('New Content');
    });

    it('should reject invalid document ID', async () => {
      const response = await request(app)
        .post('/api/v1/documents/invalid-id/parse-md')
        .set(authHeader(testUser.token))
        .send({ markdown: '# Test' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'invalid id');
    });

    it('should reject non-existent document', async () => {
      const fakeId = new Types.ObjectId();

      const response = await request(app)
        .post(`/api/v1/documents/${fakeId}/parse-md`)
        .set(authHeader(testUser.token))
        .send({ markdown: '# Test' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'document not found');
    });

    it('should reject missing markdown', async () => {
      const response = await request(app)
        .post(`/api/v1/documents/${testDoc._id}/parse-md`)
        .set(authHeader(testUser.token))
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'markdown (string) is required');
    });

    it('should reject empty markdown', async () => {
      const response = await request(app)
        .post(`/api/v1/documents/${testDoc._id}/parse-md`)
        .set(authHeader(testUser.token))
        .send({ markdown: '   ' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'markdown (string) is required');
    });

    it('should reject whitespace-only markdown', async () => {
      const response = await request(app)
        .post(`/api/v1/documents/${testDoc._id}/parse-md`)
        .set(authHeader(testUser.token))
        .send({ markdown: '\n\n\n' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'markdown (string) is required');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .post(`/api/v1/documents/${testDoc._id}/parse-md`)
        .send({ markdown: '# Test' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/documents/:id', () => {
    it('should return document by ID', async () => {
      const doc = await Document.create({
        title: 'Test Doc',
        uploaderId: testUser.userId,
        source: {
          fileType: 'md',
          originalName: 'test.md',
          storageKey: 'key1',
          sizeBytes: 100
        }
      });

      const response = await request(app)
        .get(`/api/v1/documents/${doc._id}`)
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id', doc._id.toString());
      expect(response.body).toHaveProperty('title', 'Test Doc');
    });

    it('should reject invalid ID', async () => {
      const response = await request(app)
        .get('/api/v1/documents/invalid-id')
        .set(authHeader(testUser.token));

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'invalid id');
    });

    it('should return 404 for non-existent document', async () => {
      const fakeId = new Types.ObjectId();

      const response = await request(app)
        .get(`/api/v1/documents/${fakeId}`)
        .set(authHeader(testUser.token));

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'document not found');
    });

    it('should reject request without token', async () => {
      const doc = await Document.create({
        title: 'Test Doc',
        uploaderId: testUser.userId,
        source: {
          fileType: 'md',
          originalName: 'test.md',
          storageKey: 'key1',
          sizeBytes: 100
        }
      });

      const response = await request(app).get(`/api/v1/documents/${doc._id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/documents/:id/blocks', () => {
    let testDoc: any;

    beforeEach(async () => {
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

    it('should return empty array when no blocks', async () => {
      const response = await request(app)
        .get(`/api/v1/documents/${testDoc._id}/blocks`)
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return blocks for document', async () => {
      await DocBlock.create({
        documentId: testDoc._id,
        page: 1,
        blockIndex: 0,
        type: 'heading',
        text: 'Heading'
      });

      await DocBlock.create({
        documentId: testDoc._id,
        page: 1,
        blockIndex: 1,
        type: 'paragraph',
        text: 'Paragraph'
      });

      const response = await request(app)
        .get(`/api/v1/documents/${testDoc._id}/blocks`)
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].text).toBe('Heading');
      expect(response.body[1].text).toBe('Paragraph');
    });

    it('should sort blocks by page and blockIndex', async () => {
      await DocBlock.create({
        documentId: testDoc._id,
        page: 2,
        blockIndex: 0,
        type: 'paragraph',
        text: 'Page 2 Block 0'
      });

      await DocBlock.create({
        documentId: testDoc._id,
        page: 1,
        blockIndex: 1,
        type: 'paragraph',
        text: 'Page 1 Block 1'
      });

      await DocBlock.create({
        documentId: testDoc._id,
        page: 1,
        blockIndex: 0,
        type: 'paragraph',
        text: 'Page 1 Block 0'
      });

      const response = await request(app)
        .get(`/api/v1/documents/${testDoc._id}/blocks`)
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body[0].text).toBe('Page 1 Block 0');
      expect(response.body[1].text).toBe('Page 1 Block 1');
      expect(response.body[2].text).toBe('Page 2 Block 0');
    });

    it('should only return blocks for specified document', async () => {
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

      await DocBlock.create({
        documentId: testDoc._id,
        page: 1,
        blockIndex: 0,
        type: 'paragraph',
        text: 'Test Doc Block'
      });

      await DocBlock.create({
        documentId: otherDoc._id,
        page: 1,
        blockIndex: 0,
        type: 'paragraph',
        text: 'Other Doc Block'
      });

      const response = await request(app)
        .get(`/api/v1/documents/${testDoc._id}/blocks`)
        .set(authHeader(testUser.token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].text).toBe('Test Doc Block');
    });

    it('should reject invalid ID', async () => {
      const response = await request(app)
        .get('/api/v1/documents/invalid-id/blocks')
        .set(authHeader(testUser.token));

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'invalid id');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get(`/api/v1/documents/${testDoc._id}/blocks`);

      expect(response.status).toBe(401);
    });
  });
});