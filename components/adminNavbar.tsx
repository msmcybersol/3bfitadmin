// components/adminNavbar.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabaseClient'

export default function AdminNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const loadRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
      setIsAdmin(data?.role === 'admin')
    }

    loadRole()
  }, [])

  if (pathname === '/login') return null

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b bg-white px-6 py-4">
      <div className="flex items-center gap-6">
        <Link href="/" className={pathname === '/' ? 'font-semibold text-blue-600' : 'text-gray-600 hover:text-black'}>Dashboard</Link>
        <Link href="/submissions" className={pathname.startsWith('/submissions') ? 'font-semibold text-blue-600' : 'text-gray-600 hover:text-black'}>Feedback Submissions</Link>
        {isAdmin &&
          <Link href="/revenuecat" className={pathname.startsWith('/revenuecat') ? 'font-semibold text-blue-600' : 'text-gray-600 hover:text-black'}>RevenueCat</Link>
        }
      </div>
      <button onClick={handleLogout} className="text-sm font-medium text-gray-600 hover:text-red-600">Logout</button>
    </nav>
  )
}