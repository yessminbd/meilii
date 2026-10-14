import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import logo from '../assets/logo-meili.png'

const pageTitles = {
  '/': 'Dashboard',
  '/add': 'Add Product',
  '/list': 'Products',
  '/orders': 'Orders',
}

const Navbar = ({ search, setSearch }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const title = pageTitles[location.pathname] || 'Dashboard'

  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearch(val)
    // If user is on dashboard, add, promos, stats etc and starts searching, navigate to /list or /orders
    if (val.trim() && location.pathname !== '/list' && location.pathname !== '/orders') {
      navigate('/list')
    }
  }

  return (
    <header className="h-[76px] bg-[#efefef] border-b border-black/5 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left: logo + Admin below, then page title */}
      <div className="flex items-center gap-5">
        <div className="flex flex-col items-center leading-none">
          <img src={logo} alt="Měilì" className="h-9 w-auto object-contain" />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search products or orders..."
            className="pl-9 pr-8 py-2 bg-white border border-black/10 rounded-full text-xs w-48 focus:w-64 outline-none focus:ring-2 focus:ring-black/10 transition-all duration-300 font-medium text-[#1f1f23] placeholder:text-gray-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar