-- Criar tabela de jogos
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE
);

-- Criar índices para games
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_created_at ON games(created_at DESC);

-- Políticas RLS para games
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Permitir leitura para usuários anônimos
CREATE POLICY "Allow anonymous read access" ON games
    FOR SELECT USING (true);

-- Permitir todas as operações para usuários autenticados
CREATE POLICY "Allow authenticated full access" ON games
    FOR ALL USING (true);

-- Criar tabela de participantes
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    card_numbers JSONB NOT NULL,
    marked_numbers JSONB DEFAULT '[]',
    bingo_claimed BOOLEAN DEFAULT FALSE,
    is_winner BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para participants
CREATE INDEX idx_participants_game_id ON participants(game_id);
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_participants_joined_at ON participants(joined_at DESC);

-- Políticas RLS para participants
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access" ON participants
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated full access" ON participants
    FOR ALL USING (true);

-- Criar tabela de prêmios
CREATE TABLE prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('line', 'column', 'full-card')),
    name VARCHAR(255) NOT NULL,
    value DECIMAL(10,2) DEFAULT 0,
    description TEXT,
    claimed BOOLEAN DEFAULT FALSE,
    winner_id UUID REFERENCES participants(id)
);

-- Criar índices para prizes
CREATE INDEX idx_prizes_game_id ON prizes(game_id);
CREATE INDEX idx_prizes_type ON prizes(type);

-- Políticas RLS para prizes
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access" ON prizes
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated full access" ON prizes
    FOR ALL USING (true);

-- Criar tabela de números sorteados
CREATE TABLE drawn_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    number INTEGER NOT NULL CHECK (number >= 1 AND number <= 75),
    drawn_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para drawn_numbers
CREATE INDEX idx_drawn_numbers_game_id ON drawn_numbers(game_id);
CREATE INDEX idx_drawn_numbers_drawn_at ON drawn_numbers(drawn_at DESC);
CREATE UNIQUE INDEX idx_drawn_numbers_game_number ON drawn_numbers(game_id, number);

-- Políticas RLS para drawn_numbers
ALTER TABLE drawn_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access" ON drawn_numbers
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated full access" ON drawn_numbers
    FOR ALL USING (true);

-- Criar tabela de declarações de bingo
CREATE TABLE bingo_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    bingo_type VARCHAR(20) NOT NULL CHECK (bingo_type IN ('line', 'column', 'full-card')),
    validated BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_at TIMESTAMP WITH TIME ZONE
);

-- Criar índices para bingo_claims
CREATE INDEX idx_bingo_claims_participant_id ON bingo_claims(participant_id);
CREATE INDEX idx_bingo_claims_game_id ON bingo_claims(game_id);
CREATE INDEX idx_bingo_claims_claimed_at ON bingo_claims(claimed_at DESC);

-- Políticas RLS para bingo_claims
ALTER TABLE bingo_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access" ON bingo_claims
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated full access" ON bingo_claims
    FOR ALL USING (true);

-- Conceder permissões às roles
GRANT SELECT ON games TO anon;
GRANT ALL PRIVILEGES ON games TO authenticated;

GRANT SELECT ON participants TO anon;
GRANT ALL PRIVILEGES ON participants TO authenticated;

GRANT SELECT ON prizes TO anon;
GRANT ALL PRIVILEGES ON prizes TO authenticated;

GRANT SELECT ON drawn_numbers TO anon;
GRANT ALL PRIVILEGES ON drawn_numbers TO authenticated;

GRANT SELECT ON bingo_claims TO anon;
GRANT ALL PRIVILEGES ON bingo_claims TO authenticated;

-- Inserir jogo de exemplo
INSERT INTO games (name, status, settings) VALUES 
('Bingo de Teste', 'waiting', '{"maxParticipants": 50, "autoValidate": false}');

-- Inserir prêmios padrão
INSERT INTO prizes (game_id, type, name, value, description) 
SELECT 
    (SELECT id FROM games WHERE name = 'Bingo de Teste'),
    unnest(ARRAY['line', 'column', 'full-card']),
    unnest(ARRAY['Primeira Linha', 'Primeira Coluna', 'Cartela Cheia']),
    unnest(ARRAY[100.00, 200.00, 500.00]),
    unnest(ARRAY['Prêmio para primeira linha completa', 'Prêmio para primeira coluna completa', 'Prêmio para cartela completa']);