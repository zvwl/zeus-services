'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingCart, Gamepad2, Joystick, Star, ArrowLeft } from 'lucide-react'
import './AdminNav.css'

const NAV_ITEMS = [
  { path: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { path: '/admin/orders',    label: 'Orders',    Icon: ShoppingCart },
  { path: '/admin/items',     label: 'Items',     Icon: Gamepad2 },
  { path: '/admin/games',     label: 'Games',     Icon: Joystick },
  { path: '/admin/reviews',   label: 'Reviews',   Icon: Star },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="admin-nav">
      <div className="admin-nav-inner">
        <div className="admin-nav-brand">
          <span className="admin-nav-label">Admin</span>
        </div>
        <div className="admin-nav-links">
          {NAV_ITEMS.map(({ path, label, Icon }) => (
            <Link
              key={path}
              href={path}
              className={`admin-nav-link${pathname === path || (path !== '/admin/dashboard' && pathname.startsWith(path)) ? ' active' : ''}`}
            >
              <Icon size={15} />
              <span>{label}</span>
            </Link>
          ))}
        </div>
        <div className="admin-nav-side">
          <Link href="/" className="admin-nav-back">
            <ArrowLeft size={13} />
            Back to site
          </Link>
        </div>
      </div>
    </nav>
  )
}
