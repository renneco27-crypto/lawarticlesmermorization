import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getClient(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new Error('Missing Supabase env vars')
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = request.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const supabase = getClient(auth.slice(7))
    const { data: { user }, error: ue } = await supabase.auth.getUser()
    if (ue || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    const { error } = await supabase.from('lex_books').update({ name: body.name.trim() }).eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to rename book' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = request.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const supabase = getClient(auth.slice(7))
    const { data: { user }, error: ue } = await supabase.auth.getUser()
    if (ue || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Delete all articles in this book first
    const { error: artErr } = await supabase.from('lex_articles').delete().eq('book_id', params.id)
    if (artErr) return NextResponse.json({ error: artErr.message }, { status: 500 })

    const { error } = await supabase.from('lex_books').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 })
  }
}
