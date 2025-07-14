-- =====================================================
-- MIGRAZIONE SEZIONI - Script SQL per Supabase
-- =====================================================
-- Eseguire questi script in ordine nel SQL Editor di Supabase

-- =====================================================
-- STEP 1: Creare la tabella sezioni
-- =====================================================

CREATE TABLE IF NOT EXISTS sezioni (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descrizione TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 2: Creare trigger per updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_sezioni_updated_at ON sezioni;
CREATE TRIGGER update_sezioni_updated_at 
    BEFORE UPDATE ON sezioni 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 3: Popolare la tabella sezioni con dati esistenti
-- =====================================================

INSERT INTO sezioni (nome, descrizione, created_at, updated_at)
SELECT DISTINCT 
    UPPER(TRIM(sezione)) as nome,
    'Sezione ' || UPPER(TRIM(sezione)) as descrizione,
    NOW() as created_at,
    NOW() as updated_at
FROM garanzie 
WHERE sezione IS NOT NULL 
AND TRIM(sezione) != ''
ON CONFLICT (nome) DO NOTHING;

-- =====================================================
-- STEP 4: Aggiungere colonna sezione_id alla tabella garanzie
-- =====================================================

ALTER TABLE garanzie 
ADD COLUMN IF NOT EXISTS sezione_id INTEGER;

-- =====================================================
-- STEP 5: Aggiornare garanzie con sezione_id
-- =====================================================

UPDATE garanzie 
SET sezione_id = sezioni.id 
FROM sezioni 
WHERE UPPER(TRIM(garanzie.sezione)) = sezioni.nome
AND garanzie.sezione_id IS NULL;

-- =====================================================
-- STEP 6: Verificare la migrazione
-- =====================================================

-- Controllare quante garanzie hanno sezione_id
SELECT 
    COUNT(*) as total_garanzie,
    COUNT(sezione_id) as garanzie_with_sezione_id,
    COUNT(*) - COUNT(sezione_id) as garanzie_without_sezione_id
FROM garanzie;

-- Controllare le sezioni create
SELECT * FROM sezioni ORDER BY nome;

-- Controllare garanzie senza sezione_id (dovrebbero essere 0)
SELECT id, titolo, sezione, sezione_id 
FROM garanzie 
WHERE sezione_id IS NULL;

-- =====================================================
-- STEP 7: Aggiungere foreign key constraint
-- =====================================================

-- Rimuovere il constraint se esiste già (per evitare errori)
ALTER TABLE garanzie DROP CONSTRAINT IF EXISTS fk_garanzie_sezione;

-- Aggiungere il foreign key constraint
ALTER TABLE garanzie 
ADD CONSTRAINT fk_garanzie_sezione 
FOREIGN KEY (sezione_id) REFERENCES sezioni(id);

-- =====================================================
-- STEP 8: Rimuovere la vecchia colonna sezione (OPZIONALE)
-- =====================================================
-- ATTENZIONE: Eseguire solo dopo aver verificato che tutto funzioni correttamente
-- e aver aggiornato il backend per usare sezione_id

-- Verificare prima che tutte le garanzie abbiano sezione_id
-- SELECT COUNT(*) FROM garanzie WHERE sezione_id IS NULL;
-- Se il risultato è 0, allora è sicuro rimuovere la colonna

-- ALTER TABLE garanzie DROP COLUMN IF EXISTS sezione;

-- =====================================================
-- STEP 9: Aggiungere indici per performance (OPZIONALE)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_garanzie_sezione_id ON garanzie(sezione_id);
CREATE INDEX IF NOT EXISTS idx_sezioni_nome ON sezioni(nome);

-- =====================================================
-- STEP 10: Abilitare RLS (Row Level Security) se necessario
-- =====================================================

-- Se il progetto usa RLS, abilitarlo per la tabella sezioni
-- ALTER TABLE sezioni ENABLE ROW LEVEL SECURITY;

-- Creare policy per permettere lettura a tutti
-- CREATE POLICY "Allow read access to sezioni" ON sezioni
--     FOR SELECT USING (true);

-- Creare policy per permettere inserimento/aggiornamento agli utenti autenticati
-- CREATE POLICY "Allow insert/update to authenticated users" ON sezioni
--     FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- QUERY UTILI PER VERIFICARE LA MIGRAZIONE
-- =====================================================

-- Contare garanzie per sezione
SELECT 
    s.nome as sezione_nome,
    COUNT(g.id) as numero_garanzie
FROM sezioni s
LEFT JOIN garanzie g ON s.id = g.sezione_id
GROUP BY s.id, s.nome
ORDER BY numero_garanzie DESC;

-- Verificare integrità referenziale
SELECT 
    g.id,
    g.titolo,
    g.sezione_id,
    s.nome as sezione_nome
FROM garanzie g
LEFT JOIN sezioni s ON g.sezione_id = s.id
WHERE g.sezione_id IS NOT NULL
LIMIT 10;

-- Statistiche finali
SELECT 
    'Sezioni totali' as metric,
    COUNT(*) as value
FROM sezioni
UNION ALL
SELECT 
    'Garanzie totali' as metric,
    COUNT(*) as value
FROM garanzie
UNION ALL
SELECT 
    'Garanzie con sezione_id' as metric,
    COUNT(*) as value
FROM garanzie
WHERE sezione_id IS NOT NULL;
