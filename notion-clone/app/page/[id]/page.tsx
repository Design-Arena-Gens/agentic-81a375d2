import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageClient from './PageClient'

export default async function PageView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('id', id)
    .single()

  if (!page || page.user_id !== user.id) {
    redirect('/')
  }

  return <PageClient page={page} userId={user.id} />
}
