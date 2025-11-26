-- Fix user_id linkage for students
-- This will update the user_id to match the correct auth user based on email
UPDATE students s
SET user_id = au.id
FROM auth.users au
WHERE s.email = au.email
  AND (s.user_id IS NULL OR s.user_id != au.id);

-- Fix user_id linkage for lecturers
-- This will update the user_id to match the correct auth user based on email
UPDATE lecturers l
SET user_id = au.id
FROM auth.users au
WHERE l.email = au.email
  AND (l.user_id IS NULL OR l.user_id != au.id);

-- Verify the fix
SELECT 'Students fixed:' as message, COUNT(*) as count
FROM students s
INNER JOIN auth.users au ON s.user_id = au.id
WHERE s.email = au.email;

SELECT 'Lecturers fixed:' as message, COUNT(*) as count
FROM lecturers l
INNER JOIN auth.users au ON l.user_id = au.id
WHERE l.email = au.email;
