import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    let body: { password: string }
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    if (!body.password) return NextResponse.json({ error: 'Password required' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    const supabase = createClient(url, key)

    const { data, error } = await supabase.from('lex_admin').select('password_hash, salt').eq('id', 1).single()
    if (error || !data) return NextResponse.json({ error: 'Admin not configured' }, { status: 500 })

    const hash = crypto.scryptSync(body.password, data.salt, 64).toString('hex')
    if (hash !== data.password_hash) return NextResponse.json({ error: 'Wrong password' }, { status: 401 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
