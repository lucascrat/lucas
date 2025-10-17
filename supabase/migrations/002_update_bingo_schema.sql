-- Adicionar colunas faltantes na tabela games
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS finished_at TIMESTAMP WITH TIME ZONE;

-- Atualizar status para incluir os valores corretos
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_status_check;
ALTER TABLE games ADD CONSTRAINT games_status_check CHECK (status IN ('waiting', 'active', 'finished'));

-- Atualizar status padrão
ALTER TABLE games ALTER COLUMN status SET DEFAULT 'waiting';

-- Criar tabela de participantes se não existir
CREATE TABLE IF NOT EXISTS participants (
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

-- Criar índices para participants se não existirem
CREATE INDEX IF NOT EXISTS idx_participants_game_id ON participants(game_id);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_joined_at ON participants(joined_at DESC);

-- Atualizar tabela prizes para incluir colunas necessárias
ALTER TABLE prizes 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) CHECK (type IN ('line', 'column', 'full-card')),
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS value DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS claimed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES participants(id);

-- Criar tabela de declarações de bingo se não existir
CREATE TABLE IF NOT EXISTS bingo_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    bingo_type VARCHAR(20) NOT NULL CHECK (bingo_type IN ('line', 'column', 'full-card')),
    validated BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_at TIMESTAMP WITH TIME ZONE
);

-- Criar índices para bingo_claims se não existirem
CREATE INDEX IF NOT EXISTS idx_bingo_claims_participant_id ON bingo_claims(participant_id);
CREATE INDEX IF NOT EXISTS idx_bingo_claims_game_id ON bingo_claims(game_id);
CREATE INDEX IF NOT EXISTS idx_bingo_claims_claimed_at ON bingo_claims(claimed_at DESC);

-- Habilitar RLS para todas as tabelas
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawn_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_claims ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS se não existirem
DO $$ 
BEGIN
    -- Políticas para games
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'games' AND policyname = 'games_anon_read') THEN
        CREATE POLICY games_anon_read ON games FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'games' AND policyname = 'games_auth_all') THEN
        CREATE POLICY games_auth_all ON games FOR ALL USING (true);
    END IF;

    -- Políticas para participants
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'participants' AND policyname = 'participants_anon_read') THEN
        CREATE POLICY participants_anon_read ON participants FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'participants' AND policyname = 'participants_auth_all') THEN
        CREATE POLICY participants_auth_all ON participants FOR ALL USING (true);
    END IF;

    -- Políticas para prizes
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prizes' AND policyname = 'prizes_anon_read') THEN
        CREATE POLICY prizes_anon_read ON prizes FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prizes' AND policyname = 'prizes_auth_all') THEN
        CREATE POLICY prizes_auth_all ON prizes FOR ALL USING (true);
    END IF;

    -- Políticas para drawn_numbers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'drawn_numbers' AND policyname = 'drawn_numbers_anon_read') THEN
        CREATE POLICY drawn_numbers_anon_read ON drawn_numbers FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'drawn_numbers' AND policyname = 'drawn_numbers_auth_all') THEN
        CREATE POLICY drawn_numbers_auth_all ON drawn_numbers FOR ALL USING (true);
    END IF;

    -- Políticas para bingo_claims
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bingo_claims' AND policyname = 'bingo_claims_anon_read') THEN
        CREATE POLICY bingo_claims_anon_read ON bingo_claims FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bingo_claims' AND policyname = 'bingo_claims_auth_all') THEN
        CREATE POLICY bingo_claims_auth_all ON bingo_claims FOR ALL USING (true);
    END IF;
END $$;

-- Conceder permissões às roles
GRANT SELECT ON participants TO anon;
GRANT ALL PRIVILEGES ON participants TO authenticated;

GRANT SELECT ON bingo_claims TO anon;
GRANT ALL PRIVILEGES ON bingo_claims TO authenticated;

-- Atualizar jogo existente com dados necessários
UPDATE games 
SET name = 'Bingo Principal', 
    settings = '{"maxParticipants": 50, "autoValidate": false}'::jsonb
WHERE name IS NULL OR name = '';

-- Inserir prêmios padrão se não existirem
INSERT INTO prizes (game_id, type, name, value, description) 
SELECT 
    g.id,
    unnest(ARRAY['line', 'column', 'full-card']),
    unnest(ARRAY['Primeira Linha', 'Primeira Coluna', 'Cartela Cheia']),
    unnest(ARRAY[100.00, 200.00, 500.00]),
    unnest(ARRAY['Prêmio para primeira linha completa', 'Prêmio para primeira coluna completa', 'Prêmio para cartela completa'])
FROM games g
WHERE NOT EXISTS (
    SELECT 1 FROM prizes p WHERE p.game_id = g.id AND p.type IS NOT NULL
)
LIMIT 1;