-- Add max_tickets_per_user field to raffles table
ALTER TABLE raffles ADD COLUMN max_tickets_per_user INTEGER DEFAULT 10 CHECK (max_tickets_per_user > 0);

-- Update existing raffles to have a default value
UPDATE raffles SET max_tickets_per_user = 10 WHERE max_tickets_per_user IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE raffles ALTER COLUMN max_tickets_per_user SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN raffles.max_tickets_per_user IS 'Maximum number of tickets a single user can purchase for this raffle';
