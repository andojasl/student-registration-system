-- Verification query to check user linkage
-- This will show if user_id in students/lecturers matches their email in auth.users

-- Check students linkage
SELECT
  s.id as student_id,
  s.first_name,
  s.last_name,
  s.email as student_email,
  s.user_id,
  au.email as auth_email,
  CASE
    WHEN s.email = au.email THEN 'MATCH ✓'
    ELSE 'MISMATCH ✗'
  END as status
FROM students s
LEFT JOIN auth.users au ON s.user_id = au.id
ORDER BY s.id;

-- Check lecturers linkage
SELECT
  l.id as lecturer_id,
  l.first_name,
  l.last_name,
  l.email as lecturer_email,
  l.user_id,
  au.email as auth_email,
  CASE
    WHEN l.email = au.email THEN 'MATCH ✓'
    ELSE 'MISMATCH ✗'
  END as status
FROM lecturers l
LEFT JOIN auth.users au ON l.user_id = au.id
ORDER BY l.id;
