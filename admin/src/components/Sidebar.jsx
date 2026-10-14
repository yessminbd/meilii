import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart3,
  PackagePlus,
  List,
  ShoppingBag,
  LogOut,
  ChevronLeft,
  Tag,
  FolderTree,
  Palette,
} from 'lucide-react'

const Sidebar = ({ onLogout }) => {
  const [collapsed, setCollapsed] = useState(false)

  const links = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/add', icon: <PackagePlus size={20} />, label: 'Add Product' },
    { to: '/orders', icon: <ShoppingBag size={20} />, label: 'Orders' },
    { to: '/list', icon: <List size={20} />, label: 'Products' },
    { to: '/categories', icon: <FolderTree size={20} />, label: 'Categories' },
    { to: '/sizes-colors', icon: <Palette size={20} />, label: 'Sizes & Colors' },
    { to: '/promos', icon: <Tag size={20} />, label: 'Promo Codes' },
    { to: '/stats', icon: <BarChart3 size={20} />, label: 'Statistics' },
  ]

  const linkBase =
    'flex items-center gap-3 h-11 rounded-xl text-sm font-semibold transition-all duration-200'

  return (
    <aside
      className={`${
        collapsed ? 'w-[78px]' : 'w-[260px]'
      } sticky top-0 h-screen shrink-0 self-start bg-[#efefef] border-r border-black/5 flex flex-col transition-all duration-300 ease-in-out z-40`}
    >
      {/* Collapse Toggle (inside the sidebar, so it can never be clipped) */}
      <div className={`flex items-center h-14 px-3 shrink-0 ${collapsed ? 'justify-center' : 'justify-end'}`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border border-black/10 hover:scale-110 transition-transform cursor-pointer"
        >
          <ChevronLeft
            size={14}
            className={`text-gray-500 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Navigation (scrolls internally if the screen is too short) */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            title={collapsed ? link.label : undefined}
            className={({ isActive }) =>
              `${linkBase} ${collapsed ? 'justify-center px-0' : 'px-4'} ${
                isActive
                  ? 'bg-white text-[#e63946] shadow-sm'
                  : 'text-gray-600 hover:bg-white/60 hover:text-[#1f1f23]'
              }`
            }
          >
            <span className="flex-shrink-0">{link.icon}</span>
            {!collapsed && <span>{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-black/5">
        <button
          onClick={onLogout}
          title={collapsed ? 'Log out' : undefined}
          className={`${linkBase} w-full bg-[#e63946] text-white hover:bg-[#d62839] shadow-sm ${
            collapsed ? 'justify-center px-0' : 'px-4'
          }`}
        >
          <LogOut size={18} />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar