-- ====================================
-- CHANGE EXPERIENCE DATES TO TEXT
-- ====================================
-- This migration changes start_date and end_date in experiences table
-- from DATE type to TEXT type for more flexibility (e.g., "2020-01", "Present")

-- Step 1: Add new TEXT columns
ALTER TABLE experiences 
ADD COLUMN start_date_text TEXT,
ADD COLUMN end_date_text TEXT;

-- Step 2: Migrate existing data (convert DATE to TEXT format YYYY-MM-DD)
UPDATE experiences 
SET start_date_text = start_date::TEXT 
WHERE start_date IS NOT NULL;

UPDATE experiences 
SET end_date_text = end_date::TEXT 
WHERE end_date IS NOT NULL;

-- Step 3: Drop old DATE columns
ALTER TABLE experiences 
DROP COLUMN start_date,
DROP COLUMN end_date;

-- Step 4: Rename new columns to original names
ALTER TABLE experiences 
RENAME COLUMN start_date_text TO start_date;

ALTER TABLE experiences 
RENAME COLUMN end_date_text TO end_date;

-- Step 5: Make start_date NOT NULL (as it was before)
ALTER TABLE experiences 
ALTER COLUMN start_date SET NOT NULL;

-- ====================================
-- COMMENTS
-- ====================================
COMMENT ON COLUMN experiences.start_date IS 'Start date as text (flexible format: YYYY-MM-DD, YYYY-MM, or YYYY)';
COMMENT ON COLUMN experiences.end_date IS 'End date as text (flexible format: YYYY-MM-DD, YYYY-MM, YYYY, or "Present")';
