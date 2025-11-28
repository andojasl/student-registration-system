-- =====================================================
-- Add Schedule System Tables
-- Enables timetable functionality for courses
-- =====================================================

-- -------------------------------------------------
-- Table: rooms
-- Stores physical and virtual classroom spaces
-- -------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'rooms'
  ) THEN
    CREATE TABLE rooms (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      building VARCHAR(100),
      capacity INTEGER,
      room_type VARCHAR(50) DEFAULT 'classroom',
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Index for building-based queries
    CREATE INDEX idx_rooms_building ON rooms(building);

    RAISE NOTICE 'Created table: rooms';
  END IF;
END $$;

-- -------------------------------------------------
-- Table: time_slots (optional reference data)
-- Pre-defined time periods for easier scheduling
-- -------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'time_slots'
  ) THEN
    CREATE TABLE time_slots (
      id SERIAL PRIMARY KEY,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      label VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT valid_time_range CHECK (end_time > start_time)
    );

    -- Unique index prevents duplicate time ranges
    CREATE UNIQUE INDEX idx_time_slots_range ON time_slots(start_time, end_time);

    RAISE NOTICE 'Created table: time_slots';
  END IF;
END $$;

-- -------------------------------------------------
-- Table: class_schedules (CORE TABLE)
-- Weekly recurring class schedules
-- -------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'class_schedules'
  ) THEN
    CREATE TABLE class_schedules (
      id SERIAL PRIMARY KEY,
      course_id INTEGER NOT NULL,
      room_id INTEGER,
      day_of_week INTEGER NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      semester_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT valid_day CHECK (day_of_week BETWEEN 1 AND 7),
      CONSTRAINT valid_time_range CHECK (end_time > start_time)
    );

    RAISE NOTICE 'Created table: class_schedules';
  END IF;
END $$;

-- Add foreign keys for class_schedules
DO $$
BEGIN
  -- FK: course_id -> courses
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'class_schedules_courses_fk'
  ) THEN
    ALTER TABLE class_schedules
      ADD CONSTRAINT class_schedules_courses_fk
      FOREIGN KEY (course_id)
      REFERENCES courses(id)
      ON DELETE CASCADE;
    RAISE NOTICE 'Added FK: class_schedules_courses_fk';
  END IF;

  -- FK: room_id -> rooms
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'class_schedules_rooms_fk'
  ) THEN
    ALTER TABLE class_schedules
      ADD CONSTRAINT class_schedules_rooms_fk
      FOREIGN KEY (room_id)
      REFERENCES rooms(id)
      ON DELETE SET NULL;
    RAISE NOTICE 'Added FK: class_schedules_rooms_fk';
  END IF;

  -- FK: semester_id -> semesters
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'class_schedules_semesters_fk'
  ) THEN
    ALTER TABLE class_schedules
      ADD CONSTRAINT class_schedules_semesters_fk
      FOREIGN KEY (semester_id)
      REFERENCES semesters(id)
      ON DELETE CASCADE;
    RAISE NOTICE 'Added FK: class_schedules_semesters_fk';
  END IF;
END $$;

-- Add indexes for class_schedules
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_schedules_course'
  ) THEN
    CREATE INDEX idx_schedules_course ON class_schedules(course_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_schedules_room'
  ) THEN
    CREATE INDEX idx_schedules_room ON class_schedules(room_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_schedules_day_time'
  ) THEN
    CREATE INDEX idx_schedules_day_time ON class_schedules(day_of_week, start_time, end_time);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_schedules_semester'
  ) THEN
    CREATE INDEX idx_schedules_semester ON class_schedules(semester_id);
  END IF;
END $$;

-- -------------------------------------------------
-- Table: schedule_exceptions (OPTIONAL)
-- One-off schedule changes (cancellations, room changes)
-- -------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'schedule_exceptions'
  ) THEN
    CREATE TABLE schedule_exceptions (
      id SERIAL PRIMARY KEY,
      schedule_id INTEGER NOT NULL,
      exception_date DATE NOT NULL,
      is_cancelled BOOLEAN DEFAULT FALSE,
      new_room_id INTEGER,
      new_start_time TIME,
      new_end_time TIME,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    RAISE NOTICE 'Created table: schedule_exceptions';
  END IF;
END $$;

-- Add foreign keys for schedule_exceptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'schedule_exceptions_class_schedules_fk'
  ) THEN
    ALTER TABLE schedule_exceptions
      ADD CONSTRAINT schedule_exceptions_class_schedules_fk
      FOREIGN KEY (schedule_id)
      REFERENCES class_schedules(id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'schedule_exceptions_rooms_fk'
  ) THEN
    ALTER TABLE schedule_exceptions
      ADD CONSTRAINT schedule_exceptions_rooms_fk
      FOREIGN KEY (new_room_id)
      REFERENCES rooms(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Add indexes for schedule_exceptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_exceptions_schedule'
  ) THEN
    CREATE INDEX idx_exceptions_schedule ON schedule_exceptions(schedule_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_exceptions_date'
  ) THEN
    CREATE INDEX idx_exceptions_date ON schedule_exceptions(exception_date);
  END IF;
END $$;

-- =====================================================
-- SEED DATA
-- =====================================================

-- Seed rooms (if not already populated)
INSERT INTO rooms (name, building, capacity, room_type)
SELECT * FROM (VALUES
  ('Room 101', 'Main Building', 30, 'classroom'),
  ('Room 102', 'Main Building', 30, 'classroom'),
  ('Room 201', 'Main Building', 25, 'classroom'),
  ('Lab A', 'Science Block', 25, 'lab'),
  ('Lab B', 'Science Block', 20, 'lab'),
  ('Lecture Hall 1', 'Academic Center', 100, 'lecture_hall'),
  ('Lecture Hall 2', 'Academic Center', 80, 'lecture_hall'),
  ('Virtual Room 1', NULL, 999, 'virtual'),
  ('Virtual Room 2', NULL, 999, 'virtual')
) AS seed(name, building, capacity, room_type)
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE name = seed.name);

-- Seed time slots (if not already populated)
INSERT INTO time_slots (start_time, end_time, label)
SELECT * FROM (VALUES
  ('08:00'::TIME, '09:30'::TIME, 'Period 1'),
  ('10:00'::TIME, '11:30'::TIME, 'Period 2'),
  ('12:00'::TIME, '13:30'::TIME, 'Period 3'),
  ('14:00'::TIME, '15:30'::TIME, 'Period 4'),
  ('16:00'::TIME, '17:30'::TIME, 'Period 5'),
  ('18:00'::TIME, '19:30'::TIME, 'Evening 1'),
  ('20:00'::TIME, '21:30'::TIME, 'Evening 2')
) AS seed(start_time, end_time, label)
WHERE NOT EXISTS (
  SELECT 1 FROM time_slots
  WHERE start_time = seed.start_time
  AND end_time = seed.end_time
);

-- Verification query
SELECT
  'Migration completed successfully' AS status,
  (SELECT COUNT(*) FROM rooms) AS rooms_count,
  (SELECT COUNT(*) FROM time_slots) AS time_slots_count,
  (SELECT COUNT(*) FROM class_schedules) AS schedules_count;
