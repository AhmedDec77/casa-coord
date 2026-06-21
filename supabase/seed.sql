-- =====================================================================
-- SEED - Données initiales
-- =====================================================================
-- IMPORTANT : les comptes utilisateurs (auth.users) ne se créent PAS
-- par SQL directement de façon fiable pour le mot de passe — utilise
-- le Dashboard Supabase (Authentication > Users > Add user) ou l'API
-- Admin. Pour chaque utilisateur, dans "User Metadata" (raw_user_meta_data)
-- mets un JSON comme ceci AVANT de cliquer "Create user" :
--
-- Danuvvio Crispin :
-- { "full_name": "Danuvvio Crispin", "trade": "general", "is_admin": false }
--
-- Amin (Elektro Schmidtke GmbH) :
-- { "full_name": "Amin - Elektro Schmidtke", "trade": "electricite", "is_admin": false }
--
-- Mehran (Pourhaustechnik) :
-- { "full_name": "Mehran - Pourhaustechnik", "trade": "plomberie", "is_admin": false }
--
-- Barbara Di Gregorio (architecte) :
-- { "full_name": "Barbara Di Gregorio", "trade": "architecte", "is_admin": false }
-- (l'archi voit tout mais n'édite rien -> géré côté UI : pas de bouton edit
--  si trade = 'architecte', sauf ses propres tâches s'il y en a)
--
-- Ahmed Touati (coordinateur, admin) :
-- { "full_name": "Ahmed Touati", "trade": "coordinateur", "is_admin": true }
--
-- Le trigger handle_new_user() (voir schema.sql) crée automatiquement
-- la ligne correspondante dans public.profiles à la création du compte.
-- =====================================================================

-- Une fois les 5 comptes créés via le Dashboard, lance ceci dans le
-- SQL Editor pour créer les deux projets initiaux.
-- Remplace 'COORDINATEUR_USER_ID' par l'UUID réel d'Ahmed (visible dans
-- Authentication > Users après création).

insert into public.projects (name, client_name, address, start_date, end_date, color, created_by)
values
  (
    'CASA Zellner',
    'Maximilian Zellner',
    'à compléter',
    '2026-06-21',
    '2026-08-28',
    '#2563eb',
    'COORDINATEUR_USER_ID'
  ),
  (
    'ElenaFrank',
    'Elena Frank',
    'à compléter',
    null,
    null,
    '#16a34a',
    'COORDINATEUR_USER_ID'
  );
