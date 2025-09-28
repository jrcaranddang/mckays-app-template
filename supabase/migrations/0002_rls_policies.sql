-- File: supabase/migrations/0002_rls_policies.sql
-- Community Q&A Knowledge Base - Row Level Security Policies

-- Enable RLS for all tables
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create Policies for 'questions' table
CREATE POLICY "Allow public read access to questions" 
    ON questions FOR SELECT 
    USING (true);

CREATE POLICY "Allow users to insert their own questions" 
    ON questions FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Allow users to update their own questions" 
    ON questions FOR UPDATE 
    USING (auth.uid()::text = user_id);

CREATE POLICY "Allow users to delete their own questions" 
    ON questions FOR DELETE 
    USING (auth.uid()::text = user_id);

-- TODO: Add policy for admin role to bypass RLS
-- CREATE POLICY "Allow admin full access to questions" 
--     ON questions FOR ALL 
--     USING (auth.jwt() ->> 'role' = 'admin');

-- Create Policies for 'answers' table
CREATE POLICY "Allow public read access to answers" 
    ON answers FOR SELECT 
    USING (true);

CREATE POLICY "Allow users to insert their own answers" 
    ON answers FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Allow users to update their own answers" 
    ON answers FOR UPDATE 
    USING (auth.uid()::text = user_id);

CREATE POLICY "Allow users to delete their own answers" 
    ON answers FOR DELETE 
    USING (auth.uid()::text = user_id);

-- TODO: Add policy for admin role to bypass RLS
-- CREATE POLICY "Allow admin full access to answers" 
--     ON answers FOR ALL 
--     USING (auth.jwt() ->> 'role' = 'admin');

-- Create Policies for 'votes' table
CREATE POLICY "Allow public read access to votes" 
    ON votes FOR SELECT 
    USING (true);

CREATE POLICY "Allow users to insert their own votes" 
    ON votes FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Allow users to delete their own votes" 
    ON votes FOR DELETE 
    USING (auth.uid()::text = user_id);

-- Note: Users should not be able to update votes - they can only create or delete them

-- TODO: Add policy for admin role to bypass RLS
-- CREATE POLICY "Allow admin full access to votes" 
--     ON votes FOR ALL 
--     USING (auth.jwt() ->> 'role' = 'admin');