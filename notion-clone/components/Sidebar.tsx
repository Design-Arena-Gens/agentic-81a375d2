'use client'

import { useState, useEffect } from 'react'
import { Plus, ChevronRight, ChevronDown, FileText, Trash2, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Page, PageTreeItem } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  userId: string
  currentPageId?: string
}

export default function Sidebar({ userId, currentPageId }: SidebarProps) {
  const [pages, setPages] = useState<PageTreeItem[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadPages()

    const channel = supabase
      .channel('pages-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'pages', filter: `user_id=eq.${userId}` },
        () => {
          loadPages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  async function loadPages() {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('position', { ascending: true })

    if (data && !error) {
      setPages(buildTree(data))
    }
  }

  function buildTree(pages: Page[]): PageTreeItem[] {
    const pageMap = new Map<string, PageTreeItem>()
    const roots: PageTreeItem[] = []

    pages.forEach(page => {
      pageMap.set(page.id, { ...page, children: [] })
    })

    pages.forEach(page => {
      const item = pageMap.get(page.id)!
      if (page.parent_id) {
        const parent = pageMap.get(page.parent_id)
        if (parent) {
          parent.children.push(item)
        }
      } else {
        roots.push(item)
      }
    })

    return roots
  }

  async function createNewPage(parentId: string | null = null) {
    const { data, error } = await supabase
      .from('pages')
      .insert({
        user_id: userId,
        parent_id: parentId,
        title: 'Untitled',
        content: '',
      })
      .select()
      .single()

    if (data && !error) {
      router.push(`/page/${data.id}`)
    }
  }

  async function deletePage(id: string) {
    await supabase.from('pages').delete().eq('id', id)
    if (currentPageId === id) {
      router.push('/')
    }
  }

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function renderPageTree(items: PageTreeItem[], depth = 0) {
    return items.map(item => {
      const isExpanded = expandedIds.has(item.id)
      const hasChildren = item.children.length > 0
      const isActive = item.id === currentPageId

      return (
        <div key={item.id}>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 cursor-pointer group ${
              isActive ? 'bg-gray-100' : ''
            }`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {hasChildren && (
              <button
                onClick={() => toggleExpand(item.id)}
                className="hover:bg-gray-200 rounded p-0.5"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
            <div
              onClick={() => router.push(`/page/${item.id}`)}
              className="flex-1 flex items-center gap-2 min-w-0"
            >
              <span>{item.icon}</span>
              <span className="truncate text-sm">{item.title}</span>
            </div>
            <div className="hidden group-hover:flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  createNewPage(item.id)
                }}
                className="hover:bg-gray-200 rounded p-1"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deletePage(item.id)
                }}
                className="hover:bg-gray-200 rounded p-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div>{renderPageTree(item.children, depth + 1)}</div>
          )}
        </div>
      )
    })
  }

  return (
    <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-200">
        <h1 className="font-bold text-lg">Notion Clone</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <button
          onClick={() => createNewPage()}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-100 text-sm mb-2"
        >
          <Plus className="w-4 h-4" />
          New Page
        </button>
        {renderPageTree(pages)}
      </div>
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-100 text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
