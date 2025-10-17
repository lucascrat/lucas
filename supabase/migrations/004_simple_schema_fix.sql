-- Primeiro, vamos fazer o title nullable temporariamente para evitar conflitos
ALTER TABLE prizes ALTER COLUMN title DROP NOT NULL;

-- Atualizar registros existentes para ter um title
UPDATE prizes SET title = 'Prêmio' WHERE title IS NULL;

-- Adicionar as colunas necessárias se não existirem
DO $$ 
BEGIN
    -- Adicionar colunas na tabela prizes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prizes' AND column_name = 'type') THEN
        ALTER TABLE prizes ADD COLUMN type VARCHAR(20) CHECK (type IN ('line', 'column', 'full-card'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prizes' AND column_name = 'name') THEN
        ALTER TABLE prizes ADD COLUMN name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prizes' AND column_name = 'value') THEN
        ALTER TABLE prizes ADD COLUMN value DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prizes' AND column_name = 'description') THEN
        ALTER TABLE prizes ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prizes' AND column_name = 'claimed') THEN
        ALTER TABLE prizes ADD COLUMN claimed BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prizes' AND column_name = 'winner_id') THEN
        ALTER TABLE prizes ADD COLUMN winner_id UUID;
    END IF;
END $$;

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
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_claims ENABLE ROW LEVEL SECURITY;

-- Conceder permissões às roles
GRANT SELECT ON participants TO anon;
GRANT ALL PRIVILEGES ON participants TO authenticated;

GRANT SELECT ON bingo_claims TO anon;
GRANT ALL PRIVILEGES ON bingo_claims TO authenticated;

-- Adicionar colunas faltantes na tabela games se não existirem
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'name') THEN
        ALTER TABLE games ADD COLUMN name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'settings') THEN
        ALTER TABLE games ADD COLUMN settings JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'started_at') THEN
        ALTER TABLE games ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'finished_at') THEN
        ALTER TABLE games ADD COLUMN finished_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Atualizar status para incluir os valores corretos
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_status_check;
ALTER TABLE games ADD CONSTRAINT games_status_check CHECK (status IN ('waiting', 'active', 'finished'));

-- Atualizar jogo existente com dados necessários
UPDATE games 
SET name = COALESCE(name, 'Bingo Principal'), 
    settings = COALESCE(settings, '{"maxParticipants": 50, "autoValidate": false}'::jsonb)
WHERE id IS NOT NULL;