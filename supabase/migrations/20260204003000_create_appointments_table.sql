-- Tabela de marcações para PSF (Estratégia de Saúde da Família)
-- Cada registro representa uma marcação em um slot específico de um dia

CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Data da marcação (YYYY-MM-DD)
  scheduled_date date NOT NULL,
  -- Número do slot (1-30 para segunda, 1-15 para terça)
  slot_number integer NOT NULL CHECK (slot_number >= 1 AND slot_number <= 30),
  -- Dados do paciente
  patient_name text NOT NULL,
  -- Documento: CPF ou Cartão SUS
  document_type text NOT NULL CHECK (document_type IN ('CPF', 'CARTAO_SUS')),
  document_value text NOT NULL,
  -- ACS (Agente Comunitário de Saúde) responsável
  acs_name text NOT NULL,
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Garante unicidade: não pode haver dois pacientes no mesmo slot no mesmo dia
  CONSTRAINT unique_slot_per_day UNIQUE (scheduled_date, slot_number)
);

-- Habilita RLS (Row Level Security)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para usuários autenticados
CREATE POLICY "Allow read access to authenticated users" 
  ON appointments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert access to authenticated users" 
  ON appointments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update access to authenticated users" 
  ON appointments FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow delete access to authenticated users" 
  ON appointments FOR DELETE TO authenticated USING (true);

-- Índices para melhorar performance de consultas
CREATE INDEX idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX idx_appointments_slot_number ON appointments(slot_number);
CREATE INDEX idx_appointments_acs ON appointments(acs_name);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER appointments_updated_at_trigger
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointments_updated_at();

-- Comentários na tabela
COMMENT ON TABLE appointments IS 'Tabela de marcações do PSF com grade fixa de slots por dia da semana';
COMMENT ON COLUMN appointments.scheduled_date IS 'Data agendada para a consulta';
COMMENT ON COLUMN appointments.slot_number IS 'Número do slot na grade fixa do dia';
COMMENT ON COLUMN appointments.patient_name IS 'Nome completo do paciente';
COMMENT ON COLUMN appointments.document_type IS 'Tipo do documento: CPF ou CARTAO_SUS';
COMMENT ON COLUMN appointments.document_value IS 'Valor do documento';
COMMENT ON COLUMN appointments.acs_name IS 'Nome do Agente Comunitário de Saúde responsável';
