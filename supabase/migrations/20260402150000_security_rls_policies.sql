DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'students'
  ) THEN
    ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS students_self_select ON public.students;
    CREATE POLICY students_self_select
      ON public.students
      FOR SELECT
      USING ("userId" = auth.uid()::text);

    DROP POLICY IF EXISTS students_self_update ON public.students;
    CREATE POLICY students_self_update
      ON public.students
      FOR UPDATE
      USING ("userId" = auth.uid()::text)
      WITH CHECK ("userId" = auth.uid()::text);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'workout_history'
  ) THEN
    ALTER TABLE public.workout_history ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS workout_history_self_access ON public.workout_history;
    CREATE POLICY workout_history_self_access
      ON public.workout_history
      FOR ALL
      USING (
        "studentId" IN (
          SELECT s.id
          FROM public.students AS s
          WHERE s."userId" = auth.uid()::text
        )
      )
      WITH CHECK (
        "studentId" IN (
          SELECT s.id
          FROM public.students AS s
          WHERE s."userId" = auth.uid()::text
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'payments'
  ) THEN
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS payments_self_access ON public.payments;
    CREATE POLICY payments_self_access
      ON public.payments
      FOR ALL
      USING (
        "studentId" IN (
          SELECT s.id
          FROM public.students AS s
          WHERE s."userId" = auth.uid()::text
        )
      )
      WITH CHECK (
        "studentId" IN (
          SELECT s.id
          FROM public.students AS s
          WHERE s."userId" = auth.uid()::text
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'gym_memberships'
  ) THEN
    ALTER TABLE public.gym_memberships ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS gym_memberships_self_access ON public.gym_memberships;
    CREATE POLICY gym_memberships_self_access
      ON public.gym_memberships
      FOR ALL
      USING (
        "studentId" IN (
          SELECT s.id
          FROM public.students AS s
          WHERE s."userId" = auth.uid()::text
        )
      )
      WITH CHECK (
        "studentId" IN (
          SELECT s.id
          FROM public.students AS s
          WHERE s."userId" = auth.uid()::text
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'gyms'
  ) THEN
    ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS gyms_public_read ON public.gyms;
    CREATE POLICY gyms_public_read
      ON public.gyms
      FOR SELECT
      USING (true);

    DROP POLICY IF EXISTS gyms_owner_write ON public.gyms;
    CREATE POLICY gyms_owner_write
      ON public.gyms
      FOR ALL
      USING ("userId" = auth.uid()::text)
      WITH CHECK ("userId" = auth.uid()::text);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'personals'
  ) THEN
    ALTER TABLE public.personals ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS personals_owner_access ON public.personals;
    CREATE POLICY personals_owner_access
      ON public.personals
      FOR ALL
      USING ("userId" = auth.uid()::text)
      WITH CHECK ("userId" = auth.uid()::text);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'audit_logs'
  ) THEN
    ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS audit_logs_insert_only ON public.audit_logs;
    CREATE POLICY audit_logs_insert_only
      ON public.audit_logs
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;
