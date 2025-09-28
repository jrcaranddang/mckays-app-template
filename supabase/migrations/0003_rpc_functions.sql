-- File: supabase/migrations/0003_rpc_functions.sql
-- Community Q&A Knowledge Base - RPC Functions for Performance

-- Function to get all questions with their vote counts
CREATE OR REPLACE FUNCTION get_all_questions_with_vote_counts()
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_id TEXT,
    title TEXT,
    body TEXT,
    vote_count BIGINT
) 
LANGUAGE SQL
STABLE
AS $$
    SELECT 
        q.id,
        q.created_at,
        q.updated_at,
        q.user_id,
        q.title,
        q.body,
        COALESCE(v.vote_count, 0) as vote_count
    FROM questions q
    LEFT JOIN (
        SELECT 
            question_id,
            COUNT(*) as vote_count
        FROM votes 
        WHERE question_id IS NOT NULL
        GROUP BY question_id
    ) v ON q.id = v.question_id
    ORDER BY q.created_at DESC;
$$;

-- Function to get a single question with its answers and vote counts
CREATE OR REPLACE FUNCTION get_question_with_answers_and_votes(question_uuid UUID)
RETURNS JSON
LANGUAGE SQL
STABLE
AS $$
    SELECT JSON_BUILD_OBJECT(
        'question', JSON_BUILD_OBJECT(
            'id', q.id,
            'created_at', q.created_at,
            'updated_at', q.updated_at,
            'user_id', q.user_id,
            'title', q.title,
            'body', q.body,
            'vote_count', COALESCE(qv.vote_count, 0)
        ),
        'answers', COALESCE(
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'id', a.id,
                    'created_at', a.created_at,
                    'updated_at', a.updated_at,
                    'user_id', a.user_id,
                    'question_id', a.question_id,
                    'body', a.body,
                    'vote_count', COALESCE(av.vote_count, 0)
                )
                ORDER BY a.created_at ASC
            ) FILTER (WHERE a.id IS NOT NULL),
            '[]'::JSON
        )
    )
    FROM questions q
    LEFT JOIN answers a ON q.id = a.question_id
    LEFT JOIN (
        SELECT 
            question_id,
            COUNT(*) as vote_count
        FROM votes 
        WHERE question_id IS NOT NULL
        GROUP BY question_id
    ) qv ON q.id = qv.question_id
    LEFT JOIN (
        SELECT 
            answer_id,
            COUNT(*) as vote_count
        FROM votes 
        WHERE answer_id IS NOT NULL
        GROUP BY answer_id
    ) av ON a.id = av.answer_id
    WHERE q.id = question_uuid
    GROUP BY q.id, q.created_at, q.updated_at, q.user_id, q.title, q.body, qv.vote_count;
$$;

-- Function to get vote counts for multiple items at once
CREATE OR REPLACE FUNCTION get_vote_counts(
    question_ids UUID[] DEFAULT NULL,
    answer_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    item_id UUID,
    item_type TEXT,
    vote_count BIGINT
)
LANGUAGE SQL
STABLE
AS $$
    SELECT 
        question_id as item_id,
        'question' as item_type,
        COUNT(*) as vote_count
    FROM votes 
    WHERE question_id = ANY(question_ids)
    GROUP BY question_id
    
    UNION ALL
    
    SELECT 
        answer_id as item_id,
        'answer' as item_type,
        COUNT(*) as vote_count
    FROM votes 
    WHERE answer_id = ANY(answer_ids)
    GROUP BY answer_id;
$$;