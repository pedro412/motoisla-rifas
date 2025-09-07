-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create raffles table
CREATE TABLE raffles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    ticket_price DECIMAL(10,2) NOT NULL CHECK (ticket_price > 0),
    total_tickets INTEGER NOT NULL CHECK (total_tickets > 0),
    winner_ticket_id UUID,
    draw_date TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tickets table
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raffle_id UUID NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'reserved', 'paid')),
    user_id UUID REFERENCES users(id),
    reserved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(raffle_id, number)
);

-- Create orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    tickets TEXT[] NOT NULL, -- Array of ticket IDs
    total DECIMAL(10,2) NOT NULL CHECK (total > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    proof_url TEXT,
    whatsapp_message_sent BOOLEAN DEFAULT FALSE,
    payment_deadline TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint for winner_ticket_id
ALTER TABLE raffles ADD CONSTRAINT fk_winner_ticket 
    FOREIGN KEY (winner_ticket_id) REFERENCES tickets(id);

-- Create indexes for better performance
CREATE INDEX idx_raffles_status ON raffles(status);
CREATE INDEX idx_raffles_dates ON raffles(start_date, end_date);
CREATE INDEX idx_tickets_raffle_id ON tickets(raffle_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_number ON tickets(raffle_id, number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_deadline ON orders(payment_deadline);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_raffles_updated_at BEFORE UPDATE ON raffles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to raffles and tickets
CREATE POLICY "Public can view active raffles" ON raffles
    FOR SELECT USING (status = 'active');

CREATE POLICY "Public can view tickets for active raffles" ON tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM raffles 
            WHERE raffles.id = tickets.raffle_id 
            AND raffles.status = 'active'
        )
    );

-- Create policies for orders (users can only see their own orders)
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create orders" ON orders
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admin policies (will be handled by service role key)
CREATE POLICY "Service role can do everything on raffles" ON raffles
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on tickets" ON tickets
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on orders" ON orders
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on users" ON users
    FOR ALL USING (auth.role() = 'service_role');
