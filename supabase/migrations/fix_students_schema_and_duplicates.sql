-- Migration to fix students table schema and duplicate records
-- Run this in your Supabase SQL Editor

-- Part 1: Handle duplicate student records and their registrations
-- Step 1.1: Transfer registrations from duplicate students to the student we're keeping
WITH ranked_students AS (
  SELECT
    id,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY id DESC
    ) AS rn
  FROM students
  WHERE user_id IS NOT NULL
),
duplicates_to_remove AS (
  SELECT id FROM ranked_students WHERE rn > 1
),
students_to_keep AS (
  SELECT
    user_id,
    MAX(id) as keep_id
  FROM students
  WHERE user_id IS NOT NULL
  GROUP BY user_id
  HAVING COUNT(*) > 1
)
UPDATE registrations r
SET student_id = s.keep_id
FROM students_to_keep s
WHERE r.student_id IN (
  SELECT rs.id
  FROM ranked_students rs
  WHERE rs.user_id = s.user_id
    AND rs.rn > 1
);

-- Step 1.2: Remove duplicate registrations that might have been created
-- (if the kept student already had a registration for the same course)
WITH duplicate_registrations AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY student_id, course_id
      ORDER BY reg_date DESC, id DESC
    ) AS rn
  FROM registrations
)
DELETE FROM registrations
WHERE id IN (
  SELECT id FROM duplicate_registrations WHERE rn > 1
);

-- Step 1.3: Now delete duplicate student records
WITH ranked_students AS (
  SELECT
    id,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY id DESC
    ) AS rn
  FROM students
  WHERE user_id IS NOT NULL
)
DELETE FROM students
WHERE id IN (
  SELECT id FROM ranked_students WHERE rn > 1
);

-- Step 1.4: Handle email duplicates (in case some have NULL user_id)
WITH ranked_by_email AS (
  SELECT
    id,
    email,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY email
      ORDER BY
        CASE WHEN user_id IS NOT NULL THEN 0 ELSE 1 END,
        id DESC
    ) AS rn
  FROM students
),
email_duplicates_to_remove AS (
  SELECT id FROM ranked_by_email WHERE rn > 1
),
email_students_to_keep AS (
  SELECT
    email,
    id as keep_id
  FROM ranked_by_email
  WHERE rn = 1
)
UPDATE registrations r
SET student_id = s.keep_id
FROM email_students_to_keep s, ranked_by_email rb
WHERE r.student_id = rb.id
  AND rb.email = s.email
  AND rb.rn > 1;

-- Remove email duplicates
WITH ranked_by_email AS (
  SELECT
    id,
    email,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY email
      ORDER BY
        CASE WHEN user_id IS NOT NULL THEN 0 ELSE 1 END,
        id DESC
    ) AS rn
  FROM students
)
DELETE FROM students
WHERE id IN (
  SELECT id FROM ranked_by_email WHERE rn > 1
);

-- Part 2: Add group_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'students'
    AND column_name = 'group_id'
  ) THEN
    ALTER TABLE students ADD COLUMN group_id INTEGER;
    RAISE NOTICE 'Added group_id column to students table';
  ELSE
    RAISE NOTICE 'group_id column already exists';
  END IF;
END $$;

-- Part 3: Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'students_groups_fk'
    AND table_name = 'students'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE students
    ADD CONSTRAINT students_groups_fk
    FOREIGN KEY (group_id)
    REFERENCES groups(id)
    ON DELETE SET NULL;
    RAISE NOTICE 'Added foreign key constraint students_groups_fk';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists';
  END IF;
END $$;

-- Part 4: Verification queries
-- Check for remaining duplicates by user_id
SELECT
  user_id,
  COUNT(*) as count,
  ARRAY_AGG(id ORDER BY id) as student_ids
FROM students
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Check for remaining duplicates by email
SELECT
  email,
  COUNT(*) as count,
  ARRAY_AGG(id ORDER BY id) as student_ids
FROM students
GROUP BY email
HAVING COUNT(*) > 1;

-- Verify the group_id column
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'students'
  AND column_name = 'group_id';

-- Verify the foreign key constraint
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'students'
  AND kcu.column_name = 'group_id';
