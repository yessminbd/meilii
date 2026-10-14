import React, { useEffect, useState, useMemo, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import {
  Package,
  MapPin,
  CreditCard,
  Calendar,
  ChevronDown,
  Search,
  User,
  Phone,
  Mail,
  Truck,
  CheckCircle2,
  Clock,
  X,
  Copy,
  Check,
  ShoppingBag,
  Wallet,
  RotateCw,
  Printer,
  ChevronRight,
  Tag,
  AlertCircle,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react'

import { BACKEND_URL } from '../components/constants'

/* ---------- Status Configuration ---------- */
const STATUS_CONFIG = {
  'Order Placed': {
    label: 'Awaiting Advance',
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
    border: 'border-amber-500/20',
    dot: 'bg-amber-500',
    step: 1,
    next: 'Packing',
  },
  'Packing': {
    label: 'Packing',
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    border: 'border-blue-500/20',
    dot: 'bg-blue-500',
    step: 2,
    next: 'Shipped',
  },
  'Shipped': {
    label: 'Shipped',
    bg: 'bg-purple-500/10',
    text: 'text-purple-600',
    border: 'border-purple-500/20',
    dot: 'bg-purple-500',
    step: 3,
    next: 'Out for delivery',
  },
  'Out for delivery': {
    label: 'Out for delivery',
    bg: 'bg-orange-500/10',
    text: 'text-orange-600',
    border: 'border-orange-500/20',
    dot: 'bg-orange-500',
    step: 4,
    next: 'Delivered',
  },
  'Delivered': {
    label: 'Delivered',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-500',
    step: 5,
    next: null,
  },
}

const ALL_STATUSES = Object.keys(STATUS_CONFIG)

const getStatusConfig = (status) => {
  if (!status) return STATUS_CONFIG['Order Placed']
  if (STATUS_CONFIG[status]) return STATUS_CONFIG[status]
  const lower = status.toLowerCase()
  if (lower.includes('emballage') || lower.includes('packing')) return STATUS_CONFIG['Packing']
  if (lower.includes('shipped') || lower.includes('expédié')) return STATUS_CONFIG['Shipped']
  if (lower.includes('delivery') || lower.includes('livraison')) return STATUS_CONFIG['Out for delivery']
  if (lower.includes('delivered') || lower.includes('livré')) return STATUS_CONFIG['Delivered']
  return {
    label: status,
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
    step: 1,
    next: 'Packing',
  }
}

/* ---------- Order Details Modal ---------- */
const OrderModal = ({ order, onClose, onUpdateStatus, onUpdateAdvance }) => {
  useEffect(() => {
    const handleKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!order) return null
  const sc = getStatusConfig(order.status)

  const steps = [
    { key: 'Order Placed', label: 'Ordered', step: 1, icon: ShoppingBag },
    { key: 'Packing', label: 'Packing', step: 2, icon: Package },
    { key: 'Shipped', label: 'Shipped', step: 3, icon: Truck },
    { key: 'Out for delivery', label: 'On Route', step: 4, icon: Clock },
    { key: 'Delivered', label: 'Delivered', step: 5, icon: CheckCircle2 },
  ]

  const currentStep = sc.step || 1

  return (
    <div
      className="print-receipt-modal fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="print-receipt-card w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-black/5 my-8 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-black/5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                Order #{order._id.slice(-8).toUpperCase()}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                {order.status}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-[#1f1f23] mt-1">Order Details & Receipt</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Placed on {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="no-print w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Timeline stepper avec Icônes */}
        <div className="py-4 border-b border-black/5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Delivery Progression</p>
          <div className="relative flex items-center justify-between px-2">
            <div className="absolute left-6 right-6 top-4 h-1 bg-gray-100 -translate-y-1/2 z-0" />
            <div
              className="absolute left-6 top-4 h-1 bg-[#1f1f23] -translate-y-1/2 transition-all duration-500 z-0"
              style={{ width: `calc(${((currentStep - 1) / (steps.length - 1)) * 100}% - 12px)` }}
            />
            {steps.map((s) => {
              const done = s.step <= currentStep
              const isCurrent = s.step === currentStep
              const StepIcon = s.icon
              return (
                <div key={s.key} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs ${
                      isCurrent
                        ? 'bg-[#e63946] text-white ring-4 ring-[#e63946]/20'
                        : done
                        ? 'bg-[#1f1f23] text-white'
                        : 'bg-white border-2 border-gray-200 text-gray-400'
                    }`}
                  >
                    <StepIcon size={14} />
                  </div>
                  <span className={`text-[0.65rem] mt-1 font-bold whitespace-nowrap ${isCurrent ? 'text-[#e63946]' : done ? 'text-[#1f1f23]' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Customer & Address grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 border-b border-black/5 text-sm">
          <div className="bg-[#efefef]/50 p-3.5 rounded-2xl border border-black/5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User size={13} /> Customer
            </p>
            <p className="font-extrabold text-[#1f1f23] text-sm">{order.address?.firstName} {order.address?.lastName}</p>
            {order.address?.phone && (
              <p className="text-xs text-gray-600 font-semibold mt-1 flex items-center gap-1">
                <Phone size={12} className="text-gray-400" />
                <a href={`tel:${order.address.phone}`} className="hover:underline">{order.address.phone}</a>
              </p>
            )}
            {order.address?.email && (
              <p className="text-xs text-gray-600 mt-1 flex items-center gap-1 truncate">
                <Mail size={12} className="text-gray-400" />
                <a href={`mailto:${order.address.email}`} className="hover:underline">{order.address.email}</a>
              </p>
            )}
          </div>

          <div className="bg-[#efefef]/50 p-3.5 rounded-2xl border border-black/5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MapPin size={13} /> Shipping Address
            </p>
            <p className="font-bold text-[#1f1f23] text-xs leading-relaxed">
              {order.address?.street && <span>{order.address.street}<br /></span>}
              {order.address?.city && <span>{order.address.city}, </span>}
              {order.address?.state && <span>{order.address.state} </span>}
              {order.address?.zipCode && <span>({order.address.zipCode})<br /></span>}
              <span className="text-gray-600 font-semibold">{order.address?.country || 'Tunisia'}</span>
            </p>
          </div>
        </div>

        {/* Itemized List */}
        <div className="py-4 border-b border-black/5">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">
            Articles ({order.items?.length || 0})
          </p>
          <div className="space-y-2.5">
            {order.items?.map((item, idx) => {
              const imgUrl = Array.isArray(item.image) ? item.image[0] : item.image
              return (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50/50 border border-gray-100">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#efefef] border border-black/5 flex-shrink-0">
                    {imgUrl ? (
                      <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package size={18} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#1f1f23] text-sm truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {item.size && (
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[0.65rem] font-bold">
                          Size {item.size}
                        </span>
                      )}
                      {item.color && (
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[0.65rem] font-semibold">
                          {item.color}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-gray-400">×{item.quantity}</span>
                    </div>
                  </div>
                  <p className="font-extrabold text-[#1f1f23] text-sm whitespace-nowrap">
                    {item.price * item.quantity} TND
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="py-3 space-y-1.5 text-sm">
          {order.promoCode && (
            <div className="flex justify-between text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">
              <span className="flex items-center gap-1">
                <Tag size={13} /> Promo Applied ({order.promoCode})
              </span>
              <span>-{order.discount || 0} TND</span>
            </div>
          )}
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Payment Method</span>
            <span className="font-bold text-[#1f1f23] uppercase">{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Payment Status</span>
            <span className={`px-2 py-0.5 rounded-full font-bold ${order.payment ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {order.payment ? 'Paid' : 'Unpaid / On Delivery'}
            </span>
          </div>
          {/* Advance / Down Payment Management Section */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-amber-800 flex items-center gap-1.5">
                <Wallet size={14} className="text-amber-600" /> Advance Management
              </span>
              <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${
                order.advancePaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
              }`}>
                {order.advancePaid ? 'Advance Received' : 'Awaiting Advance'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded-xl border border-amber-100">
                <p className="text-[0.68rem] text-gray-500 font-medium">Advance Paid:</p>
                <p className="text-sm font-black text-amber-700 mt-0.5">{order.advanceAmount || 0} TND</p>
              </div>
              <div className="bg-white p-2 rounded-xl border border-amber-100">
                <p className="text-[0.68rem] text-gray-500 font-medium">Due upon delivery:</p>
                <p className="text-sm font-black text-gray-800 mt-0.5">
                  {order.remainingAmount !== undefined ? order.remainingAmount : Math.max(0, (order.amount || 0) - (order.advanceAmount || 0))} TND
                </p>
              </div>
            </div>

            {/* Quick advance form */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const val = e.target.advanceInput.value
                if (onUpdateAdvance) {
                  onUpdateAdvance(order._id, val, true)
                }
              }}
              className="flex items-center gap-2 pt-1"
            >
              <input
                name="advanceInput"
                type="number"
                step="any"
                min="0"
                defaultValue={order.advanceAmount || ''}
                placeholder="Advance amount (TND)"
                className="flex-1 bg-white border border-amber-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Check size={13} /> Confirm Advance
              </button>
            </form>
          </div>

          <div className="flex justify-between items-baseline pt-2.5 border-t border-black/5">
            <span className="font-bold text-[#1f1f23]">Total Order</span>
            <span className="text-xl font-black text-[#1f1f23] tracking-tight">{order.amount} TND</span>
          </div>
        </div>

        {/* Actions Footer */}
        {sc.next && (
          <div className="no-print flex justify-end gap-2 mt-4 pt-3 border-t border-black/5">
            <button
              type="button"
              onClick={() => {
                onUpdateStatus(order._id, sc.next)
                onClose()
              }}
              className="px-5 py-2.5 rounded-xl bg-[#1f1f23] text-white text-xs font-bold hover:bg-black transition-all flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
            >
              Advance to {sc.next} <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Main Component ---------- */
const Orders = ({ token, globalSearch }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [copiedId, setCopiedId] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [printingOrder, setPrintingOrder] = useState(null)

  const handlePrint = (order) => {
    setPrintingOrder(order)
    setTimeout(() => {
      window.print()
      setPrintingOrder(null)
    }, 150)
  }

  const fetchOrders = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true)
    try {
      const res = await axios.post(`${BACKEND_URL}/api/order/list`, {}, { headers: { token } })
      if (res.data.success) {
        setOrders(res.data.orders.reverse())
      }
    } catch {
      toast.error('Failed to load orders.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const updateStatus = async (orderId, status) => {
    try {
      await axios.post(`${BACKEND_URL}/api/order/status`, { orderId, status }, { headers: { token } })
      setOrders((prev) =>
        prev.map((o) => {
          if (o._id !== orderId) return o
          // Si livré → paiement automatiquement validé
          return { ...o, status, payment: status === 'Delivered' ? true : o.payment }
        })
      )
      toast.success(`Order updated to "${status}".`)
    } catch {
      toast.error('Error updating order status.')
    }
  }

  const updateAdvance = async (orderId, advanceAmount, advancePaid = true) => {
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/order/advance`,
        { orderId, advanceAmount, advancePaid },
        { headers: { token } }
      )
      if (res.data.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, ...res.data.order } : o))
        )
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder((prev) => ({ ...prev, ...res.data.order }))
        }
        toast.success("Advance recorded and order confirmed!")
      } else {
        toast.error(res.data.message)
      }
    } catch {
      toast.error("Error updating advance payment.")
    }
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.info('Copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Quick stats calculation
  const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + (o.amount || 0), 0), [orders])
  const deliveredCount = useMemo(() => orders.filter((o) => o.status === 'Delivered').length, [orders])
  const pendingCount = useMemo(
    () => orders.filter((o) => o.status === 'Order Placed' || o.status === 'Packing').length,
    [orders]
  )

  // Status counts for tabs
  const statusCounts = useMemo(() => {
    const counts = { All: orders.length }
    ALL_STATUSES.forEach((s) => {
      counts[s] = orders.filter((o) => o.status === s).length
    })
    return counts
  }, [orders])

  // Filtered & Sorted orders
  const filteredOrders = useMemo(() => {
    const q = (search || globalSearch || '').trim().toLowerCase()
    let list = orders.filter((o) => {
      const matchSearch =
        !q ||
        o._id.toLowerCase().includes(q) ||
        `${o.address?.firstName || ''} ${o.address?.lastName || ''}`.toLowerCase().includes(q) ||
        (o.address?.phone && o.address.phone.toLowerCase().includes(q)) ||
        (o.address?.city && o.address.city.toLowerCase().includes(q)) ||
        (o.items && o.items.some((i) => i.name?.toLowerCase().includes(q)))

      const matchStatus = filterStatus === 'All' || o.status === filterStatus
      return matchSearch && matchStatus
    })

    // Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === 'newest') return (b.date || 0) - (a.date || 0)
      if (sortBy === 'oldest') return (a.date || 0) - (b.date || 0)
      if (sortBy === 'amount-high') return (b.amount || 0) - (a.amount || 0)
      if (sortBy === 'amount-low') return (a.amount || 0) - (b.amount || 0)
      return 0
    })

    return list
  }, [orders, search, globalSearch, filterStatus, sortBy])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[65vh] gap-3">
        <RotateCw className="w-8 h-8 animate-spin text-[#e63946]" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Orders...</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1f1f23] tracking-tight">Orders</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#1f1f23]/5 text-[#1f1f23] text-xs font-bold">
              {orders.length} Total
            </span>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 font-medium">
            Track shipments, update order progress and customer deliveries in real time.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-white border border-black/5 hover:border-black/20 text-gray-700 text-xs font-bold shadow-xs flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            title="Print Orders"
          >
            <Printer size={14} className="text-gray-500" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl bg-white border border-black/5 hover:border-black/20 text-gray-700 text-xs font-bold shadow-xs flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <RotateCw size={14} className={refreshing ? 'animate-spin text-[#e63946]' : ''} />
            {refreshing ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-black/5 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-wider text-gray-400">Total Revenue</p>
            <h3 className="text-xl sm:text-2xl font-black text-[#1f1f23] mt-1">
              {totalRevenue.toLocaleString()} <span className="text-xs font-bold text-gray-500">TND</span>
            </h3>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Wallet size={20} />
          </div>
        </div>

        {/* Total Orders */}
        <div
          onClick={() => setFilterStatus('All')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-xs flex items-center justify-between hover:shadow-md transition-all cursor-pointer ${
            filterStatus === 'All' ? 'border-[#1f1f23] ring-2 ring-[#1f1f23]/10' : 'border-black/5'
          }`}
        >
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-wider text-gray-400">Total Orders</p>
            <h3 className="text-xl sm:text-2xl font-black text-[#1f1f23] mt-1">{orders.length}</h3>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
            <ShoppingBag size={20} />
          </div>
        </div>

        {/* Pending Orders */}
        <div
          onClick={() => setFilterStatus('Order Placed')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-xs flex items-center justify-between hover:shadow-md transition-all cursor-pointer ${
            filterStatus === 'Order Placed' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-black/5'
          }`}
        >
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <span>Pending Action</span>
              {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-amber-600 mt-1">{pendingCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <Clock size={20} />
          </div>
        </div>

        {/* Delivered Orders */}
        <div
          onClick={() => setFilterStatus('Delivered')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-xs flex items-center justify-between hover:shadow-md transition-all cursor-pointer ${
            filterStatus === 'Delivered' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-black/5'
          }`}
        >
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-wider text-gray-400">Delivered</p>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{deliveredCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white rounded-2xl border border-black/5 p-3 sm:p-4 shadow-xs space-y-3">
        {/* Top Controls: Search + Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-lg">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer, order #, phone, city, sneaker..."
              className="w-full bg-[#efefef]/50 border border-black/5 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm font-medium text-[#1f1f23] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1f1f23]/10 focus:border-black/20 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <ArrowUpDown size={14} className="text-gray-400 hidden sm:block" />
            <span className="text-xs font-bold text-gray-500 hidden sm:block">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#efefef]/50 border border-black/5 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#1f1f23]/10 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount-high">Highest Amount</option>
              <option value="amount-low">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Status Pill Tabs with counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar border-t border-black/5">
          {['All', ...ALL_STATUSES].map((s) => {
            const count = statusCounts[s] || 0
            const active = filterStatus === s
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? 'bg-[#1f1f23] text-white shadow-sm'
                    : 'bg-[#efefef]/60 text-gray-600 hover:bg-[#efefef] hover:text-[#1f1f23]'
                }`}
              >
                <span>{s}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[0.65rem] font-extrabold ${
                    active ? 'bg-white/20 text-white' : 'bg-black/5 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-black/5 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#efefef] flex items-center justify-center mx-auto mb-3 text-gray-400">
            <Package size={28} />
          </div>
          <h3 className="text-lg font-extrabold text-[#1f1f23]">No orders found</h3>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
            {search || filterStatus !== 'All'
              ? 'No matching orders found. Try adjusting your search query or status filter.'
              : 'There are currently no orders placed in the store.'}
          </p>
          {(search || filterStatus !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setFilterStatus('All')
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-[#1f1f23] text-white text-xs font-bold shadow-sm hover:bg-black transition-all cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const sc = getStatusConfig(order.status)
            const dateStr = new Date(order.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
            const timeStr = new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

            return (
              <div
                key={order._id}
                className="bg-white rounded-3xl border border-black/5 shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="bg-[#efefef]/40 px-5 sm:px-6 py-3.5 border-b border-black/5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Copyable Order ID */}
                    <button
                      type="button"
                      onClick={() => copyToClipboard(order._id, order._id)}
                      title="Click to copy Order ID"
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-black/5 hover:border-black/20 text-[0.7rem] font-mono font-bold text-gray-700 transition-colors shadow-2xs cursor-pointer group"
                    >
                      <span>#{order._id.slice(-8).toUpperCase()}</span>
                      {copiedId === order._id ? (
                        <Check size={12} className="text-emerald-600" />
                      ) : (
                        <Copy size={11} className="text-gray-400 group-hover:text-gray-700" />
                      )}
                    </button>

                    {/* Date */}
                    <div className="flex items-center gap-1 text-gray-400 text-xs font-medium">
                      <Calendar size={13} />
                      <span>{dateStr}</span>
                      <span className="text-gray-300">•</span>
                      <span>{timeStr}</span>
                    </div>

                    {/* Payment badge */}
                    <span className="px-2 py-0.5 rounded-md bg-white border border-black/5 text-[0.68rem] font-bold uppercase text-gray-600 flex items-center gap-1">
                      <CreditCard size={11} className="text-gray-400" />
                      {order.paymentMethod}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${
                        order.payment
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}
                    >
                      {order.payment ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-[0.7rem] font-bold text-gray-400 uppercase tracking-wider hidden sm:inline">
                      Status:
                    </span>
                    <div className="relative inline-block">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order._id, e.target.value)}
                        className={`appearance-none pl-7 pr-8 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/10 ${sc.bg} ${sc.text} ${sc.border}`}
                      >
                        {ALL_STATUSES.map((s) => (
                          <option key={s} value={s} className="bg-white text-gray-800">
                            {s}
                          </option>
                        ))}
                      </select>
                      <span
                        className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${sc.dot}`}
                      />
                      <ChevronDown
                        size={13}
                        className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${sc.text}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Order Main Content: 2-column on desktop */}
                <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                  {/* Left Column: Sneaker Items Visual Preview */}
                  <div className="space-y-3">
                    <p className="text-[0.68rem] font-extrabold uppercase tracking-wider text-gray-400">
                      Ordered Sneakers ({order.items?.length || 0})
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {order.items?.map((item, idx) => {
                        const imgUrl = Array.isArray(item.image) ? item.image[0] : item.image
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 rounded-2xl bg-[#efefef]/30 border border-black/5 hover:bg-[#efefef]/60 transition-colors"
                          >
                            {/* Product Thumbnail */}
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-black/5 flex-shrink-0 relative">
                              {imgUrl ? (
                                <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <Package size={20} />
                                </div>
                              )}
                              <span className="absolute bottom-1 right-1 bg-black/75 text-white font-extrabold text-[0.6rem] px-1 rounded-sm">
                                ×{item.quantity}
                              </span>
                            </div>

                            {/* Details */}
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-xs text-[#1f1f23] truncate" title={item.name}>
                                {item.name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {item.size && (
                                  <span className="px-1.5 py-0.5 rounded bg-white text-gray-700 text-[0.65rem] font-bold border border-black/5">
                                    Size {item.size}
                                  </span>
                                )}
                                {item.color && (
                                  <span className="px-1.5 py-0.5 rounded bg-white text-gray-600 text-[0.65rem] font-medium border border-black/5">
                                    {item.color}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-extrabold text-[#1f1f23] mt-1">
                                {item.price ? `${item.price * item.quantity} TND` : ''}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Right Column: Customer Info & Delivery Details Card */}
                  <div className="bg-[#efefef]/30 rounded-2xl p-4 border border-black/5 space-y-3.5">
                    {/* Customer Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-black/5">
                      <div className="w-10 h-10 rounded-full bg-[#1f1f23] text-white flex items-center justify-center font-black text-sm shadow-xs">
                        {order.address?.firstName?.charAt(0) || 'U'}
                        {order.address?.lastName?.charAt(0) || ''}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-[#1f1f23] text-sm truncate">
                          {order.address?.firstName} {order.address?.lastName}
                        </p>
                        <p className="text-[0.7rem] text-gray-500 font-medium">Customer</p>
                      </div>
                    </div>

                    {/* Contact info */}
                    <div className="space-y-1.5 text-xs text-gray-600">
                      {order.address?.phone && (
                        <div className="flex items-center justify-between group">
                          <span className="flex items-center gap-2 text-gray-500">
                            <Phone size={13} className="text-gray-400" />
                            <a href={`tel:${order.address.phone}`} className="font-bold text-gray-800 hover:underline">
                              {order.address.phone}
                            </a>
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(order.address.phone, `phone-${order._id}`)}
                            title="Copy Phone"
                            className="p-1 rounded text-gray-400 hover:text-gray-700 cursor-pointer"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      )}

                      {order.address?.email && (
                        <div className="flex items-center gap-2 text-gray-500 truncate">
                          <Mail size={13} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate">{order.address.email}</span>
                        </div>
                      )}

                      <div className="flex items-start gap-2 text-gray-500 pt-1">
                        <MapPin size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-[0.72rem] leading-relaxed text-gray-700 font-medium">
                          {order.address?.street && `${order.address.street}, `}
                          {order.address?.city && `${order.address.city}, `}
                          {order.address?.country || 'Tunisia'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Summary & Quick Actions */}
                <div className="bg-white px-5 sm:px-6 py-3.5 border-t border-black/5 flex flex-wrap items-center justify-between gap-4">
                  {/* Total price info */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total:</span>
                    <span className="text-xl sm:text-2xl font-black text-[#1f1f23] tracking-tight">
                      {order.amount} TND
                    </span>
                    {order.promoCode && (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[0.65rem] font-bold border border-emerald-200">
                        {order.promoCode} (-{order.discount || 0} TND)
                      </span>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Advance badge info */}
                    <div className="text-right mr-1">
                      {order.advancePaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                          <Check size={12} /> Advance: {order.advanceAmount} DT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                          <Clock size={12} /> Awaiting Advance
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      Details / Advance
                    </button>

                    {sc.next && (
                      <button
                        type="button"
                        onClick={() => updateStatus(order._id, sc.next)}
                        className="px-4 py-2 rounded-xl bg-[#1f1f23] hover:bg-black text-white text-xs font-bold shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        Advance to {sc.next}
                        <ChevronRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateStatus}
          onUpdateAdvance={updateAdvance}
        />
      )}

      {/* Hidden printable receipt for printing directly from Orders page */}
      {printingOrder && (
        <div className="print-receipt-modal hidden print:block">
          <div className="print-receipt-card bg-white p-6 rounded-2xl border border-gray-200 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-gray-200">
              <div>
                <h1 className="text-xl font-black tracking-tight text-gray-900">MĚILÌ</h1>
                <p className="text-[11px] text-gray-500 font-semibold">Official Order Receipt</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-gray-600">
                    Order #{printingOrder._id.slice(-8).toUpperCase()}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 font-bold text-gray-800">
                    {printingOrder.status}
                  </span>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500 font-medium">
                <p>{new Date(printingOrder.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                <p>{new Date(printingOrder.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            {/* Customer & Shipping */}
            <div className="grid grid-cols-2 gap-4 py-3 border-b border-gray-200 text-xs">
              <div>
                <p className="font-bold text-gray-400 uppercase text-[10px] tracking-wider mb-1">Customer</p>
                <p className="font-bold text-gray-900">{printingOrder.address?.firstName} {printingOrder.address?.lastName}</p>
                {printingOrder.address?.phone && <p className="text-gray-600 font-medium">Tel: {printingOrder.address.phone}</p>}
                {printingOrder.address?.email && <p className="text-gray-600 font-medium">{printingOrder.address.email}</p>}
              </div>
              <div>
                <p className="font-bold text-gray-400 uppercase text-[10px] tracking-wider mb-1">Delivery Address</p>
                <p className="font-semibold text-gray-800">
                  {printingOrder.address?.street && `${printingOrder.address.street}, `}
                  {printingOrder.address?.city && `${printingOrder.address.city} `}
                  {printingOrder.address?.zipCode && `(${printingOrder.address.zipCode})`}
                </p>
                <p className="text-gray-600 font-medium">{printingOrder.address?.country || 'Tunisia'}</p>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="py-3 border-b border-gray-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 uppercase text-[10px]">
                    <th className="text-left pb-1 font-bold">Item</th>
                    <th className="text-center pb-1 font-bold">Size</th>
                    <th className="text-center pb-1 font-bold">Qty</th>
                    <th className="text-right pb-1 font-bold">Price</th>
                    <th className="text-right pb-1 font-bold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {printingOrder.items?.map((item, idx) => (
                    <tr key={idx} className="py-1.5">
                      <td className="py-1.5 font-bold text-gray-900">{item.name}</td>
                      <td className="py-1.5 text-center text-gray-600 font-semibold">{item.size || '-'}</td>
                      <td className="py-1.5 text-center text-gray-600 font-semibold">×{item.quantity}</td>
                      <td className="py-1.5 text-right text-gray-600">{item.price} TND</td>
                      <td className="py-1.5 text-right font-bold text-gray-900">{item.price * item.quantity} TND</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total breakdown */}
            <div className="pt-3 space-y-1 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Payment Method</span>
                <span className="font-bold text-gray-900 uppercase">{printingOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Payment Status</span>
                <span className="font-bold text-gray-900">{printingOrder.payment ? 'Paid' : 'Cash on Delivery'}</span>
              </div>
              {printingOrder.promoCode && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount ({printingOrder.promoCode})</span>
                  <span>-{printingOrder.discount || 0} TND</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-gray-200 text-sm">
                <span className="font-black text-gray-900">Total Amount</span>
                <span className="text-lg font-black text-gray-900">{printingOrder.amount} TND</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-2 border-t border-dashed border-gray-300 text-center text-[10px] text-gray-400 font-medium">
              Thank you for shopping with Měilì!
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders
