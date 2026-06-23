import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Variables d\'environnement Supabase manquantes. ' +
    'Vérifie VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Libellés DE pour les corps de métier (utilisé partout dans l'UI — équipe germanophone)
export const TRADE_LABELS = {
  general: 'Allgemein / Maurerarbeiten',
  electricite: 'Elektrik',
  plomberie: 'Sanitär',
  architecte: 'Architektin',
  coordinateur: 'Koordination',
}

export const TRADE_COLORS = {
  general: '#78716c',
  electricite: '#f59e0b',
  plomberie: '#0ea5e9',
  architecte: '#8b5cf6',
  coordinateur: '#2563eb',
}

export const STATUS_LABELS = {
  a_faire: 'Offen',
  en_cours: 'In Arbeit',
  fait: 'Erledigt',
  bloque: 'Blockiert',
}

export const STATUS_COLORS = {
  a_faire: '#8b5cf6',
  en_cours: '#3b82f6',
  fait: '#22c55e',
  bloque: '#ef4444',
}
