CREATE TABLE public.patient_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  initials TEXT NOT NULL,
  care_team_name TEXT NOT NULL,
  care_team_specialty TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT 'One connected healthcare experience — from care to clarity.',
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.patient_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_profiles TO authenticated;
GRANT ALL ON public.patient_profiles TO service_role;
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view demo patient profiles" ON public.patient_profiles FOR SELECT TO anon, authenticated USING (is_demo = true);

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_profile_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  appointment_type TEXT NOT NULL,
  specialty TEXT NOT NULL,
  clinician_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming',
  notes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.appointments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view demo appointments" ON public.appointments FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.patient_profiles p WHERE p.id = patient_profile_id AND p.is_demo = true));

CREATE TABLE public.health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_profile_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  unit TEXT,
  trend TEXT NOT NULL,
  status TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.health_metrics TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_metrics TO authenticated;
GRANT ALL ON public.health_metrics TO service_role;
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view demo health metrics" ON public.health_metrics FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.patient_profiles p WHERE p.id = patient_profile_id AND p.is_demo = true));

CREATE TABLE public.lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_profile_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  result_value TEXT NOT NULL,
  result_unit TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lab_results TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_results TO authenticated;
GRANT ALL ON public.lab_results TO service_role;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view demo lab results" ON public.lab_results FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.patient_profiles p WHERE p.id = patient_profile_id AND p.is_demo = true));

CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_profile_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  schedule TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.medications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medications TO authenticated;
GRANT ALL ON public.medications TO service_role;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view demo medications" ON public.medications FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.patient_profiles p WHERE p.id = patient_profile_id AND p.is_demo = true));

CREATE TABLE public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_profile_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  event_title TEXT NOT NULL,
  event_date TEXT NOT NULL,
  detail TEXT NOT NULL,
  accent TEXT NOT NULL DEFAULT 'teal',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.activity_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_events TO authenticated;
GRANT ALL ON public.activity_events TO service_role;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view demo activity" ON public.activity_events FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.patient_profiles p WHERE p.id = patient_profile_id AND p.is_demo = true));

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'lab_technician', 'patient')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.patient_profiles (id, display_name, initials, care_team_name, care_team_specialty, is_demo)
VALUES ('11111111-1111-4111-8111-111111111111', 'Elena Vasquez', 'EV', 'Dr. Maya Alvarez', 'Primary care', true);

INSERT INTO public.appointments (patient_profile_id, appointment_date, start_time, end_time, appointment_type, specialty, clinician_name, status, notes)
VALUES ('11111111-1111-4111-8111-111111111111', '2026-06-14', '10:00 AM', '10:30 AM', 'Video visit', 'Cardiology follow-up', 'Dr. Maya Alvarez', 'upcoming', ARRAY['Bring BP log', 'Bring medication list']);

INSERT INTO public.health_metrics (patient_profile_id, label, value, unit, trend, status, sort_order)
VALUES
('11111111-1111-4111-8111-111111111111', 'Blood pressure', '118/76', NULL, 'Normal range', 'good', 1),
('11111111-1111-4111-8111-111111111111', 'Resting heart rate', '62', 'bpm', 'Stable', 'good', 2),
('11111111-1111-4111-8111-111111111111', 'Weight', '152', 'lb', '−4 lb / 30d', 'neutral', 3),
('11111111-1111-4111-8111-111111111111', 'Sleep', '7h 20m', NULL, 'On target', 'good', 4);

INSERT INTO public.lab_results (patient_profile_id, test_name, result_value, result_unit, status)
VALUES
('11111111-1111-4111-8111-111111111111', 'Hemoglobin A1c', '5.6', '%', 'Normal'),
('11111111-1111-4111-8111-111111111111', 'Total cholesterol', '212', 'mg/dL', 'Review'),
('11111111-1111-4111-8111-111111111111', 'Vitamin D', '31', 'ng/mL', 'Pending');

INSERT INTO public.medications (patient_profile_id, medication_name, dosage, schedule, note)
VALUES
('11111111-1111-4111-8111-111111111111', 'Metformin', '500 mg', '1/day', 'Next dose today · 8 PM'),
('11111111-1111-4111-8111-111111111111', 'Atorvastatin', '10 mg', '1/day', 'Refill in 4 days');

INSERT INTO public.activity_events (patient_profile_id, event_title, event_date, detail, accent, sort_order)
VALUES
('11111111-1111-4111-8111-111111111111', 'Telehealth visit · completed', 'Jun 10', 'Dr. Alvarez', 'teal', 1),
('11111111-1111-4111-8111-111111111111', 'Lab panel reviewed', 'Jun 11', '14 results', 'cobalt', 2),
('11111111-1111-4111-8111-111111111111', 'Prescription filled', 'Jun 9', 'Metformin', 'amber', 3),
('11111111-1111-4111-8111-111111111111', 'Vitals logged', 'Jun 8', 'Home reading', 'line', 4);