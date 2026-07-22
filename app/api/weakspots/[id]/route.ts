import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, getSupabaseClient } from '@/lib/supabaseAdmin'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request)
    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from('lex_weak_spots')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
