-- Add phone field to lecturers table
ALTER TABLE public.lecturers
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT '';

-- Update the column to allow empty strings but not null
ALTER TABLE public.lecturers
ALTER COLUMN phone SET DEFAULT '';
