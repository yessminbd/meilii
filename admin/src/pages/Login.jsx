import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import sneaker1 from '../assets/login-square.svg'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post(`${BACKEND_URL}/api/user/login`, { email, password })
      if (res.data.success && res.data.role === 'admin') {
        setToken(res.data.token)
        localStorage.setItem('adminToken', res.data.token)
        toast.success('Welcome back, Admin!')
      } else if (res.data.success) {
        toast.error('Admin access only.')
      } else {
        toast.error(res.data.message)
      }
    } catch {
      toast.error('Server connection error.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-900 transition-all bg-white'
  const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-600'

  return (
    <div className="min-h-screen bg-[#efefef] flex">

      {/* ── LEFT: Sneaker Showcase ── */}
      <div className="hidden lg:flex flex-1 relative bg-[#1f1f23] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1f1f23] via-[#1f1f23] to-[#1a1a2e]" />
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#e63946]/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#e63946]/15 blur-3xl" />

        <img
          src={sneaker1}
          alt="Měilì"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f1f23] via-[#1f1f23]/40 to-transparent" />

        <div className="absolute bottom-10 left-10 right-10 z-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-xs font-semibold tracking-widest uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-[#e63946] animate-pulse" />
            Admin Panel
          </div>
          <h2 className="text-3xl font-black text-white leading-tight">
            Manage<br />
            <span className="text-[#e63946]">Your Store.</span>
          </h2>
          <p className="text-white/50 text-sm mt-2">
            Orders, products and customers — all in one place.
          </p>
        </div>
      </div>

      {/* ── RIGHT: Form ── */}
      <div className="flex-1 lg:max-w-[480px] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          <div className="mb-8">
            <h1 className="text-3xl font-black text-[#1f1f23] tracking-tight">
              Admin Access 🔐
            </h1>
            <p className="text-gray-600 text-sm mt-2">
              Log in to manage Měilì.
            </p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Username</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Username"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-[#e63946] text-white font-bold py-3.5 rounded-xl hover:bg-[#d62839] transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Please wait...
                </>
              ) : (
                'Log In'
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-xs mt-8 font-medium">
            © {new Date().getFullYear()} Měilì — All rights reserved
          </p>

          <div className="lg:hidden mt-8 rounded-2xl overflow-hidden h-44 w-full">
            <img src={sneaker1} alt="Měilì" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login