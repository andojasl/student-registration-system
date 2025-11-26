-- Add group_id column to students table
-- This column will link students to their groups

-- Add the group_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'students'
    AND column_name = 'group_id'
  ) THEN
    ALTER TABLE students ADD COLUMN group_id INTEGER;
  END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'students_groups_fk'
    AND table_name = 'students'
  ) THEN
    ALTER TABLE students
    ADD CONSTRAINT students_groups_fk
    FOREIGN KEY (group_id)
    REFERENCES groups(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Verify the column was added
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'students'
  AND column_name = 'group_id';
