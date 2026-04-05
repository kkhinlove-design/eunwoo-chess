-- 체스 멀티플레이 DB 마이그레이션
-- Supabase SQL Editor에서 실행하세요

CREATE TABLE chess_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  avatar_emoji TEXT DEFAULT '😊',
  games_played INT DEFAULT 0,
  games_won INT DEFAULT 0,
  total_score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chess_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  host_id UUID REFERENCES chess_players(id),
  fen TEXT NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  status TEXT NOT NULL DEFAULT 'waiting',
  host_color TEXT NOT NULL DEFAULT 'w',
  winner_id UUID REFERENCES chess_players(id),
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chess_room_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES chess_rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES chess_players(id),
  color TEXT NOT NULL DEFAULT 'b',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, player_id)
);

ALTER TABLE chess_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE chess_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chess_room_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_chess_players" ON chess_players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_chess_rooms" ON chess_rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_chess_room_players" ON chess_room_players FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE chess_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE chess_room_players;
