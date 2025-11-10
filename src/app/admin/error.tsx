'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  // Log error details to help diagnose client-side exceptions in production
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.error('Admin route error boundary caught:', error)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/5 to-secondary/10 p-6">
      <div className="max-w-xl w-full rounded-lg border border-border/40 bg-card/95 backdrop-blur-sm shadow-sm p-6 text-center space-y-4">
        <h1 className="text-xl font-semibold">Erro ao carregar o painel</h1>
        <p className="text-sm text-muted-foreground">
          Ocorreu uma exceção no cliente ao carregar <code>bingo-admin-web.vercel.app/admin</code>. 
          Tente atualizar a página. Se persistir, verifique as variáveis públicas do Supabase.
        </p>
        {error?.message && (
          <pre className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3 overflow-auto max-h-40">
            {error.message}
          </pre>
        )}
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} className="">Atualizar</Button>
          <a
            href="/admin/login"
            className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Ir para Login
          </a>
        </div>
        <div className="text-xs text-muted-foreground">
          Dica: configure <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no Vercel.
        </div>
      </div>
    </div>
  )
}