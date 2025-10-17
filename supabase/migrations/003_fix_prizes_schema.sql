-- Primeiro, vamos fazer o title nullable temporariamente
ALTER TABLE prizes ALTER COLUMN title DROP NOT NULL;

-- Atualizar registros existentes para ter um title baseado no name se existir
UPDATE prizes SET title = COALESCE(name, 'Prêmio') WHERE title IS NULL;

-- Agora adicionar as colunas necessárias se não existirem
ALTER TABLE prizes 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) CHECK (type IN ('line', 'column', 'full-card')),
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS value DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS claimed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS winner_id UUID;

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

-- Agora adicionar a foreign key para winner_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'prizes_winner_id_fkey'
    ) THEN
        ALTER TABLE prizes ADD CONSTRAINT prizes_winner_id_fkey 
        FOREIGN KEY (winner_id) REFERENCES participants(id);
    END IF;
END $$;

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

-- Criar políticas RLS se não existirem
DO $$ 
BEGIN
    -- Políticas para participants
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'participants' AND policyname = 'participants_anon_read') THEN
        CREATE POLICY participants_anon_read ON participants FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'participants' AND policyname = 'participants_auth_all') THEN
        CREATE POLICY participants_auth_all ON participants FOR ALL USING (true);
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

-- Adicionar colunas faltantes na tabela games se não existirem
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS finished_at TIMESTAMP WITH TIME ZONE;

-- Atualizar status para incluir os valores corretos
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_status_check;
ALTER TABLE games ADD CONSTRAINT games_status_check CHECK (status IN ('waiting', 'active', 'finished'));

-- Atualizar jogo existente com dados necessários
UPDATE games 
SET name = COALESCE(name, 'Bingo Principal'), 
    settings = COALESCE(settings, '{"maxParticipants": 50, "autoValidate": false}'::jsonb)
WHERE id IS NOT NULL;