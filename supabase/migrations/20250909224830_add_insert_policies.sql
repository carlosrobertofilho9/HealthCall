CREATE POLICY "Allow insert for authenticated users" ON patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow insert for authenticated users" ON calls FOR INSERT TO authenticated WITH CHECK (true);
