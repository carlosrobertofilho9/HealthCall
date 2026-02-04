-- Add patient_phone column to appointments table
ALTER TABLE appointments 
ADD COLUMN patient_phone TEXT;

-- Comment on column
COMMENT ON COLUMN appointments.patient_phone IS 'Telefone do paciente para contato via WhatsApp';
