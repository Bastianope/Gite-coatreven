-- ═══════════════════════════════════════════════════
-- SUPABASE — Gîte du Trégor
-- Copiez-collez ce script dans l'éditeur SQL de Supabase
-- ═══════════════════════════════════════════════════

-- Table des tarifs
CREATE TABLE IF NOT EXISTS prices (
  id       TEXT PRIMARY KEY,
  label    TEXT NOT NULL,
  detail   TEXT,
  amount   INTEGER NOT NULL,
  unit     TEXT DEFAULT 'nuit'
);

-- Données initiales
INSERT INTO prices (id, label, detail, amount, unit) VALUES
  ('basse',   'Basse saison',     'Oct – Avr',           60,  'nuit'),
  ('moyenne', 'Moyenne saison',   'Mai – Juin & Sept',   75,  'nuit'),
  ('haute',   'Haute saison',     'Juil – Août',         95,  'nuit'),
  ('semaine', 'Semaine complète', '7 nuits consécutives', 490, 'semaine')
ON CONFLICT (id) DO NOTHING;

-- Table des réservations
CREATE TABLE IF NOT EXISTS bookings (
  id         BIGSERIAL PRIMARY KEY,
  start      DATE NOT NULL,
  end        DATE NOT NULL,
  note       TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des demandes de contact
CREATE TABLE IF NOT EXISTS contacts (
  id         BIGSERIAL PRIMARY KEY,
  prenom     TEXT,
  nom        TEXT,
  email      TEXT,
  tel        TEXT,
  arrivee    DATE,
  depart     DATE,
  personnes  TEXT,
  animaux    TEXT,
  message    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Politiques RLS (Row Level Security) ──
-- Lecture publique (pour afficher les dispo et tarifs sur le site)
ALTER TABLE prices   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lecture_publique_prices"   ON prices   FOR SELECT USING (true);
CREATE POLICY "lecture_publique_bookings" ON bookings FOR SELECT USING (true);

-- Insertion publique pour les contacts (formulaire visiteurs)
CREATE POLICY "insertion_publique_contacts" ON contacts FOR INSERT WITH CHECK (true);

-- Modifications réservées aux propriétaires authentifiés
-- (via la clé service_role dans l'admin, ou adapter selon votre auth)
CREATE POLICY "modif_prices"   ON prices   FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "modif_bookings" ON bookings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "lecture_contacts" ON contacts FOR SELECT USING (auth.role() = 'authenticated');
