-- Supabase table schema for Slay the Spire runs
-- Run this SQL in your Supabase SQL Editor

-- Create the runs table
CREATE TABLE IF NOT EXISTS runs (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Unique identifier combining play_id + timestamp for extra uniqueness
    -- This prevents duplicates even if play_id somehow repeats
    run_identifier TEXT UNIQUE NOT NULL,

    -- Original game identifiers
    play_id TEXT NOT NULL,
    seed_played TEXT,
    seed_source_timestamp BIGINT,

    -- User identification (for future multi-user support)
    user_id TEXT DEFAULT 'default_user',

    -- Basic run info
    character TEXT NOT NULL,
    floor_reached INTEGER NOT NULL,
    victory BOOLEAN NOT NULL DEFAULT false,
    score INTEGER DEFAULT 0,
    ascension_level INTEGER DEFAULT 0,
    is_ascension_mode BOOLEAN DEFAULT false,
    is_daily BOOLEAN DEFAULT false,

    -- Timing information
    playtime INTEGER, -- in seconds
    timestamp BIGINT, -- Unix timestamp from game
    local_time TEXT, -- Local time string from game (e.g., "20240926223052")

    -- Stats
    gold INTEGER,
    max_hp_final INTEGER,
    current_hp_final INTEGER,
    deck_size INTEGER,
    relic_count INTEGER,
    cards_picked INTEGER,
    campfire_rested INTEGER,
    campfire_upgraded INTEGER,
    items_purged_count INTEGER,

    -- Game metadata
    killed_by TEXT,
    neow_bonus TEXT,
    neow_cost TEXT,
    chose_neow_reward BOOLEAN,

    -- Complete data storage
    raw_data JSONB NOT NULL, -- Store the complete run JSON

    -- Metadata
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_runs_user_id ON runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_character ON runs(character);
CREATE INDEX IF NOT EXISTS idx_runs_victory ON runs(victory);
CREATE INDEX IF NOT EXISTS idx_runs_ascension ON runs(ascension_level);
CREATE INDEX IF NOT EXISTS idx_runs_timestamp ON runs(timestamp);
CREATE INDEX IF NOT EXISTS idx_runs_play_id ON runs(play_id);
CREATE INDEX IF NOT EXISTS idx_runs_uploaded_at ON runs(uploaded_at);

-- Create index for JSONB queries (useful for filtering by nested data)
CREATE INDEX IF NOT EXISTS idx_runs_raw_data ON runs USING GIN (raw_data);

-- Enable Row Level Security (RLS)
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (you can restrict this later per user)
CREATE POLICY "Allow all operations for authenticated users" ON runs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- For anonymous access (if you want to allow unauthenticated uploads)
CREATE POLICY "Allow anonymous read access" ON runs
    FOR SELECT
    USING (true);

CREATE POLICY "Allow anonymous insert" ON runs
    FOR INSERT
    WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_runs_updated_at
    BEFORE UPDATE ON runs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view for summary statistics (optional, useful for dashboards)
CREATE OR REPLACE VIEW run_stats AS
SELECT
    user_id,
    character,
    COUNT(*) as total_runs,
    SUM(CASE WHEN victory THEN 1 ELSE 0 END) as victories,
    ROUND(AVG(CASE WHEN victory THEN 100.0 ELSE 0 END), 2) as win_rate,
    ROUND(AVG(floor_reached), 2) as avg_floor,
    MAX(score) as highest_score,
    ROUND(AVG(score), 2) as avg_score
FROM runs
GROUP BY user_id, character;
