import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Deck } from '../models/deck.model';
import { Document } from '../models/document.model';
import { quiz } from '../models/quiz.model';
import { User } from '../models/user.model';

dotenv.config();

async function migrate() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('🔄 Starting user isolation migration...\n');

  // Get or create a default user for existing data
  let defaultUser = await User.findOne({ email: 'default@notemate.app' });
  
  if (!defaultUser) {
    console.log('📝 Creating default user...');
    defaultUser = await User.create({
      email: 'default@notemate.app',
      password: '$2b$10$YourHashedPasswordHere', // bcrypt hash of "change-me-123"
      name: 'Default User (Legacy Data)'
    });
    console.log('✅ Created default user with ID:', defaultUser._id);
  } else {
    console.log('✅ Found existing default user:', defaultUser._id);
  }

  console.log('\n📦 Migrating resources...\n');

  // Update Decks with null ownerId
  const decksBefore = await Deck.countDocuments({ ownerId: null });
  console.log(`📊 Decks needing migration: ${decksBefore}`);
  
  if (decksBefore > 0) {
    const decksResult = await Deck.updateMany(
      { ownerId: null },
      { $set: { ownerId: defaultUser._id } }
    );
    console.log(`✅ Updated ${decksResult.modifiedCount} decks`);
  }

  // Update Documents with null uploaderId
  const docsBefore = await Document.countDocuments({ uploaderId: null });
  console.log(`📊 Documents needing migration: ${docsBefore}`);
  
  if (docsBefore > 0) {
    const docsResult = await Document.updateMany(
      { uploaderId: null },
      { $set: { uploaderId: defaultUser._id } }
    );
    console.log(`✅ Updated ${docsResult.modifiedCount} documents`);
  }

  // Update Quizzes with null createdBy
  const quizzesBefore = await quiz.countDocuments({ createdBy: null });
  console.log(`📊 Quizzes needing migration: ${quizzesBefore}`);
  
  if (quizzesBefore > 0) {
    const quizzesResult = await quiz.updateMany(
      { createdBy: null },
      { $set: { createdBy: defaultUser._id } }
    );
    console.log(`✅ Updated ${quizzesResult.modifiedCount} quizzes`);
  }

  // Verify migration
  console.log('\n🔍 Verifying migration...\n');
  
  const decksNull = await Deck.countDocuments({ ownerId: null });
  const docsNull = await Document.countDocuments({ uploaderId: null });
  const quizzesNull = await quiz.countDocuments({ createdBy: null });

  console.log(`📊 Remaining null values:`);
  console.log(`   Decks: ${decksNull}`);
  console.log(`   Documents: ${docsNull}`);
  console.log(`   Quizzes: ${quizzesNull}`);

  if (decksNull === 0 && docsNull === 0 && quizzesNull === 0) {
    console.log('\n🎉 Migration completed successfully!');
  } else {
    console.log('\n⚠️  Warning: Some null values remain');
  }

  console.log('\n📝 Summary:');
  console.log(`   Default User ID: ${defaultUser._id}`);
  console.log(`   Default User Email: ${defaultUser.email}`);
  console.log(`   Decks Migrated: ${decksBefore}`);
  console.log(`   Documents Migrated: ${docsBefore}`);
  console.log(`   Quizzes Migrated: ${quizzesBefore}`);
  
  if (decksBefore > 0 || docsBefore > 0 || quizzesBefore > 0) {
    console.log('\n⚠️  IMPORTANT:');
    console.log('   All existing data has been assigned to: default@notemate.app');
    console.log('   Login with this account to access legacy data');
    console.log('   Or reassign data to specific users manually if needed');
  }
  
  await mongoose.disconnect();
  console.log('\n✅ Database connection closed');
}

migrate()
  .then(() => {
    console.log('\n✨ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });