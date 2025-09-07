-- Seed data for development and testing

-- Insert a sample raffle
INSERT INTO raffles (
    id,
    title,
    description,
    image_url,
    start_date,
    end_date,
    ticket_price,
    total_tickets,
    status
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Casco AGV Pista GP RR - Edición Limitada',
    'Participa por este increíble casco AGV Pista GP RR en edición limitada. Utilizado por los mejores pilotos de MotoGP. Incluye certificación FIM y tecnología de punta para máxima protección.',
    '/images/agv-helmet.jpg',
    NOW(),
    NOW() + INTERVAL '30 days',
    50.00,
    500,
    'active'
);

-- Generate tickets for the raffle (1-500)
INSERT INTO tickets (raffle_id, number, status)
SELECT 
    '550e8400-e29b-41d4-a716-446655440000',
    generate_series(1, 500),
    'free';

-- Insert some sample reserved and paid tickets for testing
UPDATE tickets 
SET 
    status = 'reserved',
    reserved_at = NOW(),
    expires_at = NOW() + INTERVAL '30 minutes'
WHERE raffle_id = '550e8400-e29b-41d4-a716-446655440000' 
AND number IN (7, 13, 42, 77, 123);

UPDATE tickets 
SET 
    status = 'paid',
    paid_at = NOW()
WHERE raffle_id = '550e8400-e29b-41d4-a716-446655440000' 
AND number IN (1, 25, 50, 100, 150, 200, 250, 300, 350, 400);

-- Insert a sample user
INSERT INTO users (
    id,
    name,
    phone,
    email
) VALUES (
    '660e8400-e29b-41d4-a716-446655440000',
    'Juan Pérez',
    '5551234567',
    'juan@example.com'
);

-- Insert a sample order
INSERT INTO orders (
    id,
    user_id,
    tickets,
    total_amount,
    status,
    proof_url,
    whatsapp_message_sent,
    payment_deadline,
    customer_name,
    customer_phone,
    customer_email,
    raffle_id
) VALUES (
    '770e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000',
    ARRAY[(SELECT id::text FROM tickets WHERE raffle_id = '550e8400-e29b-41d4-a716-446655440000' AND number = 1)],
    50.00,
    'paid',
    'https://example.com/proof.jpg',
    true,
    NOW() + INTERVAL '24 hours',
    'Juan Pérez',
    '5551234567',
    'juan@example.com',
    '550e8400-e29b-41d4-a716-446655440000'
);
