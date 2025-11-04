CREATE OR REPLACE FUNCTION get_next_ficha_number()
RETURNS INT AS $$
DECLARE
    next_number INT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(name FROM 'Ficha (\d+)') AS INT)), 0) + 1
    INTO next_number
    FROM patients
    WHERE name ~ '^Ficha \d+$'
    AND created_at >= DATE_TRUNC('day', NOW());

    RETURN next_number;
END;
$$ LANGUAGE plpgsql;
