-- Create settings table for configurable application options
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_settings_updated_at 
  BEFORE UPDATE ON settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO settings (key, value, description, category) VALUES
  ('reservation_timeout_minutes', '15', 'Number of minutes customers have to complete payment', 'orders'),
  ('max_tickets_per_order', '10', 'Maximum number of tickets a customer can buy in one order', 'orders'),
  ('whatsapp_number', '5551234567', 'WhatsApp number for payment confirmations', 'contact'),
  ('bank_info', '{
    "bank_name": "BBVA Bancomer",
    "account_holder": "Moto Isla Raffle",
    "account_number": "0123456789",
    "clabe": "012345678901234567"
  }', 'Bank account information for transfers', 'payments'),
  ('site_maintenance', 'false', 'Enable maintenance mode', 'system'),
  ('auto_cleanup_enabled', 'true', 'Enable automatic cleanup of expired tickets', 'system')
ON CONFLICT (key) DO NOTHING;

-- Add RLS policies
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access to settings" ON settings
  FOR SELECT USING (true);

-- Allow admin users to update settings (we'll implement admin auth later)
CREATE POLICY "Allow admin update access to settings" ON settings
  FOR UPDATE USING (true);

CREATE POLICY "Allow admin insert access to settings" ON settings
  FOR INSERT WITH CHECK (true);
