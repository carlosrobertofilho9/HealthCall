CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  created_at timestamptz DEFAULT now(),
  status text
);

CREATE TABLE calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id),
  created_at timestamptz DEFAULT now(),
  location text
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users" ON patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON calls FOR SELECT TO authenticated USING (true);
