-- Add customer information fields to orders table
ALTER TABLE orders 
ADD COLUMN customer_name VARCHAR(255),
ADD COLUMN customer_phone VARCHAR(20),
ADD COLUMN customer_email VARCHAR(255),
ADD COLUMN raffle_id UUID REFERENCES raffles(id);

-- Update the total column name to match API expectations
ALTER TABLE orders RENAME COLUMN total TO total_amount;

-- Add index for raffle_id
CREATE INDEX idx_orders_raffle_id ON orders(raffle_id);

-- Make customer_name and customer_phone required for new orders
ALTER TABLE orders ALTER COLUMN customer_name SET NOT NULL;
ALTER TABLE orders ALTER COLUMN customer_phone SET NOT NULL;
