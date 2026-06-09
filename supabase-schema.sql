-- Run this in Supabase SQL Editor to set up the database
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Homes table (one per "organizer" / shared link)
CREATE TABLE homes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  total_budget NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rooms table (belongs to a home, has its own budget)
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  budget NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Items table (belongs to a room)
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'furniture',
  estimated_price NUMERIC(12, 2) DEFAULT 0,
  vendor_links JSONB DEFAULT '[]',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'planned',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_rooms_home_id ON rooms(home_id);
CREATE INDEX idx_items_room_id ON items(room_id);

-- Enable realtime (optional, for future use)
ALTER PUBLICATION supabase_realtime ADD TABLE homes;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE items;

-- Row Level Security (open access - anyone can read/write by knowing the home ID)
ALTER TABLE homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth required, public access)
CREATE POLICY "Allow all on homes" ON homes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on items" ON items FOR ALL USING (true) WITH CHECK (true);

-- Grant table privileges to the roles used by public client keys.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON homes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON rooms TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON items TO anon, authenticated;
