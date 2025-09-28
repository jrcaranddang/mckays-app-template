# Community Q&A Knowledge Base - Setup Guide

This document outlines the complete backend and database setup for the Community Q&A Knowledge Base application.

## Overview

The system provides a complete Q&A platform with the following features:
- Questions with titles and descriptions
- Answers for each question
- Voting system for both questions and answers
- User authentication via Whop SDK
- PostgreSQL database with proper indexing and constraints

## Files Created

### Database Schema (SQL - For Supabase)

#### `supabase/migrations/0001_initial_schema.sql`
- Creates `questions`, `answers`, and `votes` tables
- Includes proper constraints, indexes, and triggers
- Implements foreign key relationships with cascade deletes

#### `supabase/migrations/0002_rls_policies.sql`
- Enables Row Level Security (RLS) on all tables
- Public read access for all content
- User-specific write/update/delete permissions
- Placeholder for admin role policies

#### `supabase/migrations/0003_rpc_functions.sql`
- `get_all_questions_with_vote_counts()`: Optimized function for listing questions
- `get_question_with_answers_and_votes()`: Gets question details with all answers
- `get_vote_counts()`: Utility function for batch vote counting

### Database Schema (Drizzle ORM - For App)

#### `db/schema/questions-schema.ts`
- Drizzle schema for questions table
- TypeScript types: `InsertQuestion`, `SelectQuestion`

#### `db/schema/answers-schema.ts`
- Drizzle schema for answers table
- Foreign key reference to questions with cascade delete
- TypeScript types: `InsertAnswer`, `SelectAnswer`

#### `db/schema/votes-schema.ts`
- Drizzle schema for votes table
- References both questions and answers (nullable)
- TypeScript types: `InsertVote`, `SelectVote`

### TypeScript Types

#### `types/qa-types.ts`
- Extended types with vote counts
- API request/response interfaces
- User vote status types

### Database Actions

#### `actions/db/questions-actions.ts`
- `createQuestionAction()`: Create new questions
- `getQuestionsWithVotesAction()`: List all questions with vote counts
- `getQuestionByIdAction()`: Get single question
- `updateQuestionAction()` & `deleteQuestionAction()`: CRUD operations

#### `actions/db/answers-actions.ts`
- `createAnswerAction()`: Create new answers
- `getAnswersByQuestionIdAction()`: Get answers for a question with vote counts
- `getAnswerByIdAction()`, `updateAnswerAction()`, `deleteAnswerAction()`: CRUD operations

#### `actions/db/votes-actions.ts`
- `toggleVoteAction()`: Toggle votes (create/delete)
- `getUserVoteStatusAction()`: Check if user has voted
- `getVoteCountAction()`: Get vote count for items

#### `actions/db/qa-actions.ts`
- `getQuestionDetailAction()`: Combined function for question + answers + votes

### API Routes

#### `app/api/questions/route.ts`
- `GET /api/questions`: List all questions with vote counts
- `POST /api/questions`: Create new question
- Full validation and error handling

#### `app/api/questions/[id]/route.ts`
- `GET /api/questions/[id]`: Get question with answers and vote counts
- UUID validation and proper error responses

#### `app/api/answers/route.ts`
- `POST /api/answers`: Create new answer
- Validates question existence and user authentication

#### `app/api/vote/route.ts`
- `POST /api/vote`: Toggle vote on question or answer
- Prevents double voting and handles both creation/deletion

### Authentication

#### `lib/whop-auth.ts`
- Mock Whop authentication helper functions
- `getUserIdFromRequest()`: Extract user ID from request
- `getCurrentUserId()` & `getCurrentUser()`: Server-side auth helpers
- Ready for Whop SDK integration

## Database Setup Instructions

### For Supabase Users

1. Run the migration files in order:
   ```sql
   -- Execute supabase/migrations/0001_initial_schema.sql
   -- Execute supabase/migrations/0002_rls_policies.sql
   -- Execute supabase/migrations/0003_rpc_functions.sql
   ```

2. The RLS policies assume Supabase auth. For Whop integration, you'll need to:
   - Create a custom auth function that validates Whop tokens
   - Update RLS policies to use your custom auth function instead of `auth.uid()`

### For Drizzle Users

1. Generate and run migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

2. The database URL should be set in `.env.local`:
   ```
   DATABASE_URL="postgresql://user:password@host:port/database"
   ```

## API Usage Examples

### Create a Question
```typescript
POST /api/questions
Content-Type: application/json
Authorization: Bearer <whop-token>

{
  "title": "How do I implement authentication?",
  "body": "I'm trying to set up user authentication in my app..."
}
```

### Get Questions List
```typescript
GET /api/questions

Response:
{
  "questions": [
    {
      "id": "uuid",
      "title": "Question title",
      "body": "Question body",
      "vote_count": 5,
      "created_at": "2024-01-01T00:00:00Z",
      "user_id": "user123"
    }
  ]
}
```

### Get Question Details
```typescript
GET /api/questions/{id}

Response:
{
  "question": {
    "id": "uuid",
    "title": "Question title",
    "body": "Question body", 
    "vote_count": 5,
    "user_id": "user123"
  },
  "answers": [
    {
      "id": "uuid",
      "body": "Answer body",
      "vote_count": 3,
      "user_id": "user456",
      "created_at": "2024-01-01T01:00:00Z"
    }
  ]
}
```

### Create an Answer
```typescript
POST /api/answers
Content-Type: application/json
Authorization: Bearer <whop-token>

{
  "body": "Here's how you can implement authentication...",
  "question_id": "uuid"
}
```

### Vote on Content
```typescript
POST /api/vote
Content-Type: application/json
Authorization: Bearer <whop-token>

// Vote on a question
{
  "question_id": "uuid"
}

// Vote on an answer
{
  "answer_id": "uuid"
}

Response:
{
  "status": "created" | "deleted",
  "message": "Vote created successfully"
}
```

## Security Features

1. **Row Level Security**: All database operations respect user ownership
2. **Input Validation**: All API endpoints validate input data
3. **Authentication Required**: Write operations require valid authentication
4. **Foreign Key Constraints**: Ensures data integrity
5. **Unique Vote Constraints**: Prevents double voting

## Performance Optimizations

1. **Database Indexes**: Created on frequently queried columns
2. **RPC Functions**: Complex queries run in the database for better performance
3. **Efficient Joins**: Vote counts calculated using optimized SQL
4. **Cascade Deletes**: Automatic cleanup of related data

## Next Steps

1. **Whop Integration**: Replace mock auth functions with actual Whop SDK calls
2. **Frontend Components**: Build React components that consume these APIs
3. **Real-time Updates**: Add WebSocket support for live vote updates
4. **Search**: Implement full-text search for questions and answers
5. **Moderation**: Add admin interfaces for content moderation

## Environment Variables

Add these to your `.env.local`:

```env
DATABASE_URL="postgresql://..."
# Add Whop-specific environment variables when integrating
WHOP_API_KEY="..."
WHOP_WEBHOOK_SECRET="..."
```

The system is now ready for frontend integration and Whop SDK authentication setup!