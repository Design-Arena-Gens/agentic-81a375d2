'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

interface HomeClientProps {
  userId: string
}

export default function HomeClient({ userId }: HomeClientProps) {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    createFirstPage()
  }, [])

  async function createFirstPage() {
    const { data, error } = await supabase
      .from('pages')
      .insert({
        user_id: userId,
        title: 'Getting Started',
        content: '<h1>Welcome to Notion Clone!</h1><p>Start writing your first page...</p>',
      })
      .select()
      .single()

    if (data && !error) {
      router.push(`/page/${data.id}`)
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar userId={userId} />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Creating your first page...</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    </div>
  )
}
