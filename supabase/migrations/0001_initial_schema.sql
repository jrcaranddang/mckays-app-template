-- File: supabase/migrations/0001_initial_schema.sql
-- Community Q&A Knowledge Base - Initial Database Schema

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id TEXT NOT NULL, -- The user's ID from Whop
    title TEXT NOT NULL CHECK (char_length(title) > 5),
    body TEXT NOT NULL CHECK (char_length(body) > 10)
);

CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id TEXT NOT NULL, -- The user's ID from Whop
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (char_length(body) > 10)
);

CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id TEXT NOT NULL, -- The user's ID from Whop
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    answer_id UUID REFERENCES answers(id) ON DELETE CASCADE,
    CONSTRAINT one_vote_per_target CHECK ( 
        (question_id IS NULL AND answer_id IS NOT NULL) OR 
        (question_id IS NOT NULL AND answer_id IS NULL) 
    ),
    -- Ensure a user can only vote once per question/answer
    CONSTRAINT unique_user_vote UNIQUE(user_id, question_id, answer_id)
);

-- Create indexes for better performance
CREATE INDEX idx_questions_user_id ON questions(user_id);
CREATE INDEX idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_user_id ON answers(user_id);
CREATE INDEX idx_votes_question_id ON votes(question_id);
CREATE INDEX idx_votes_answer_id ON votes(answer_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_votes_updated_at BEFORE UPDATE ON votes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();