import { createClient } from '@supabase/supabase-js'

// Hardcoded values for production deployment
const supabaseUrl = 'https://yubztvbrgrldfueelxfh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1Ynp0dmJyZ3JsZGZ1ZWVseGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MDYwNzgsImV4cCI6MjA3NTI4MjA3OH0.2TrL_0LARjlNSctImwGMht7-hYxMNNSuhnGfLJMySU4'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1Ynp0dmJyZ3JsZGZ1ZWVseGZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTcwNjA3OCwiZXhwIjoyMDc1MjgyMDc4fQ.NgCeYS2PMZG6n8NWy_jYqCRloI4ode0mWar8qUm93TU'

// Client for frontend (anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for backend (service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database types
export interface Game {
  id: string
  name: string
  status: 'waiting' | 'active' | 'finished'
  settings: Record<string, unknown>
  created_at: string
  started_at?: string
  finished_at?: string
}

export interface Participant {
  id: string
  game_id: string
  name: string
  email: string
  card_numbers: number[][]
  marked_numbers: number[]
  bingo_claimed: boolean
  is_winner: boolean
  joined_at: string
}

export interface Prize {
  id: string
  game_id: string
  type: 'line' | 'column' | 'full-card'
  name: string
  value: number
  description: string
  claimed: boolean
  winner_id?: string
}

export interface DrawnNumber {
  id: string
  game_id: string
  number: number
  drawn_at: string
}

export interface BingoClaim {
  id: string
  participant_id: string
  game_id: string
  bingo_type: 'line' | 'column' | 'full-card'
  validated: boolean
  claimed_at: string
  validated_at?: string
}

export interface BingoEvent {
  type: 'number-drawn' | 'bingo-claimed' | 'bingo-validated' | 'game-ended' | 'participant-joined'
  gameId: string
  data: Record<string, unknown>
  timestamp: string
}