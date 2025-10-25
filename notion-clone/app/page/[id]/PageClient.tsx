'use client'

import { useState, useEffect } from 'react'
import { Page } from '@/lib/types'
import Editor from '@/components/Editor'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase/client'

interface PageClientProps {
  page: Page
  userId: string
}

export default function PageClient({ page: initialPage, userId }: PageClientProps) {
  const [page, setPage] = useState(initialPage)
  const [title, setTitle] = useState(initialPage.title)
  const [content, setContent] = useState(initialPage.content)
  const [icon, setIcon] = useState(initialPage.icon)
  const supabase = createClient()

  useEffect(() => {
    setPage(initialPage)
    setTitle(initialPage.title)
    setContent(initialPage.content)
    setIcon(initialPage.icon)
  }, [initialPage])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      savePage()
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [title, content, icon])

  async function savePage() {
    await supabase
      .from('pages')
      .update({
        title,
        content,
        icon,
      })
      .eq('id', page.id)
  }

  return (
    <div className="flex h-screen">
      <Sidebar userId={userId} currentPageId={page.id} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-16">
          <div className="mb-4">
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="text-6xl mb-4 bg-transparent border-none outline-none w-20"
              placeholder="📄"
            />
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-4xl font-bold w-full bg-transparent border-none outline-none mb-4"
            placeholder="Untitled"
          />
          <Editor content={content} onChange={setContent} />
        </div>
      </div>
    </div>
  )
}
