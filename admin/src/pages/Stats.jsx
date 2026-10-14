import React, { useEffect, useState, useMemo, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  Calendar,
  Filter,
  Printer,
  Download,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  CreditCard,
  MapPin,
  ChevronDown,
  Layers,
  Search,
  Sparkles,
  Eye,
  X,
  FileText,
  Wallet,
} from 'lucide-react'

import { BACKEND_URL } from '../components/constants'
import {
  exportStatsReportToPdf,
  exportStatsReportToExcel,
  exportOrdersToPdf,
  exportAdvancesReportToPdf,
  calculateOrderOriginalPrice,
  formatDate,
  formatDateOnly,
} from '../utils/exportUtils'

const STATUS_CONFIG = {
  'Order Placed': {
    label: 'Order Placed',
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
    border: 'border-amber-500/20',
    bar: 'bg-amber-500',
  },
  'Packing': {
    label: 'Packing',
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    border: 'border-blue-500/20',
    bar: 'bg-blue-500',
  },
  'Shipped': {
    label: 'Shipped',
    bg: 'bg-purple-500/10',
    text: 'text-purple-600',
    border: 'border-purple-500/20',
    bar: 'bg-purple-500',
  },
  'Out for delivery': {
    label: 'Out for delivery',
    bg: 'bg-orange-500/10',
    text: 'text-orange-600',
    border: 'border-orange-500/20',
    bar: 'bg-orange-500',
  },
  'Delivered': {
    label: 'Delivered',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600',
    border: 'border-emerald-500/20',
    bar: 'bg-emerald-500',
  },
}

const PERIOD_OPTIONS = [
  { value: 'all', label: 'All dates' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7days', label: 'Last 7 days' },
  { value: '30days', label: 'Last 30 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'this_year', label: 'This year' },
  { value: 'custom', label: 'Custom' },
]

export default function Stats({ token }) {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filters state
  const [period, setPeriod] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all')
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [selectedCity, setSelectedCity] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Chart metric toggle: revenue | orders
  const [chartMetric, setChartMetric] = useState('revenue')

  // Print & Export modal state
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [pdfIncludeOrders, setPdfIncludeOrders] = useState(true)
  const [pdfCustomTitle, setPdfCustomTitle] = useState('Business Activity Report')

  // Table pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Selected order preview modal
  const [previewOrder, setPreviewOrder] = useState(null)

  // Fetch orders and products
  const fetchData = useCallback(
    async (silent = false) => {
      silent ? setRefreshing(true) : setLoading(true)
      try {
        const [oRes, pRes] = await Promise.all([
          axios.post(`${BACKEND_URL}/api/order/list`, {}, { headers: { token } }),
          axios.get(`${BACKEND_URL}/api/product/list`),
        ])

        if (oRes.data.success) {
          setOrders(oRes.data.orders || [])
        }
        if (pRes.data.success) {
          setProducts(pRes.data.products || [])
        }
      } catch (err) {
        console.error(err)
        toast.error('Error while loading statistics.')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [token]
  )

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Extract available brands and cities dynamically
  const availableBrands = useMemo(() => {
    const brandsSet = new Set()
    products.forEach((p) => {
      if (p.subCategory) brandsSet.add(p.subCategory.trim())
    })
    orders.forEach((o) => {
      if (Array.isArray(o.items)) {
        o.items.forEach((item) => {
          if (item.subCategory) brandsSet.add(item.subCategory.trim())
        })
      }
    })
    return Array.from(brandsSet).sort()
  }, [products, orders])

  const availableCities = useMemo(() => {
    const citiesSet = new Set()
    orders.forEach((o) => {
      if (o.address?.city) {
        const clean = o.address.city.trim()
        if (clean) citiesSet.add(clean)
      }
    })
    return Array.from(citiesSet).sort()
  }, [orders])

  // Reset all filters
  const handleResetFilters = () => {
    setPeriod('all')
    setCustomStartDate('')
    setCustomEndDate('')
    setSelectedStatus('all')
    setSelectedPaymentMethod('all')
    setSelectedPaymentStatus('all')
    setSelectedBrand('all')
    setSelectedCity('all')
    setSearchQuery('')
    setCurrentPage(1)
    toast.info('Filters reset')
  }

  // Active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (period !== 'all') count++
    if (selectedStatus !== 'all') count++
    if (selectedPaymentMethod !== 'all') count++
    if (selectedPaymentStatus !== 'all') count++
    if (selectedBrand !== 'all') count++
    if (selectedCity !== 'all') count++
    if (searchQuery.trim() !== '') count++
    return count
  }, [
    period,
    selectedStatus,
    selectedPaymentMethod,
    selectedPaymentStatus,
    selectedBrand,
    selectedCity,
    searchQuery,
  ])

  // Filter orders
  const filteredOrders = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime()
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime()
    const yearStart = new Date(now.getFullYear(), 0, 1).getTime()

    return orders.filter((order) => {
      const orderDate = Number(order.date) || 0

      // 1. Period filter
      if (period === 'today' && orderDate < todayStart) return false
      if (period === 'yesterday' && (orderDate < yesterdayStart || orderDate >= todayStart))
        return false
      if (period === '7days' && orderDate < sevenDaysAgo) return false
      if (period === '30days' && orderDate < thirtyDaysAgo) return false
      if (period === 'this_month' && orderDate < monthStart) return false
      if (period === 'last_month' && (orderDate < lastMonthStart || orderDate > lastMonthEnd))
        return false
      if (period === 'this_year' && orderDate < yearStart) return false

      if (period === 'custom') {
        if (customStartDate) {
          const start = new Date(customStartDate).setHours(0, 0, 0, 0)
          if (orderDate < start) return false
        }
        if (customEndDate) {
          const end = new Date(customEndDate).setHours(23, 59, 59, 999)
          if (orderDate > end) return false
        }
      }

      // 2. Status filter
      if (selectedStatus !== 'all' && order.status !== selectedStatus) {
        return false
      }

      // 3. Payment Method filter
      if (
        selectedPaymentMethod !== 'all' &&
        order.paymentMethod?.toLowerCase() !== selectedPaymentMethod.toLowerCase()
      ) {
        return false
      }

      // 4. Payment status filter
      if (selectedPaymentStatus === 'paid' && !order.payment) return false
      if (selectedPaymentStatus === 'unpaid' && order.payment) return false

      // 5. Brand filter
      if (selectedBrand !== 'all') {
        const hasBrand =
          Array.isArray(order.items) &&
          order.items.some((item) => {
            const b = item.subCategory || ''
            const n = item.name || ''
            return (
              b.toLowerCase() === selectedBrand.toLowerCase() ||
              n.toLowerCase().includes(selectedBrand.toLowerCase())
            )
          })
        if (!hasBrand) return false
      }

      // 6. City filter
      if (selectedCity !== 'all') {
        const city = order.address?.city || ''
        if (city.toLowerCase().trim() !== selectedCity.toLowerCase().trim()) {
          return false
        }
      }

      // 7. Search query filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim()
        const orderId = (order._id || '').toLowerCase()
        const client = `${order.address?.firstName || ''} ${order.address?.lastName || ''}`.toLowerCase()
        const phone = (order.address?.phone || '').toLowerCase()
        const city = (order.address?.city || '').toLowerCase()
        const items = Array.isArray(order.items)
          ? order.items.map((i) => i.name || '').join(' ').toLowerCase()
          : ''

        if (
          !orderId.includes(q) &&
          !client.includes(q) &&
          !phone.includes(q) &&
          !city.includes(q) &&
          !items.includes(q)
        ) {
          return false
        }
      }

      return true
    })
  }, [
    orders,
    period,
    customStartDate,
    customEndDate,
    selectedStatus,
    selectedPaymentMethod,
    selectedPaymentStatus,
    selectedBrand,
    selectedCity,
    searchQuery,
  ])

  // Reset page when filtered data changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredOrders.length])

  // Calculated Stats Data
  const statsCalculations = useMemo(() => {
    const totalOrders = filteredOrders.length
    const revenue = filteredOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
    const avgBasket = totalOrders > 0 ? revenue / totalOrders : 0

    let totalItemsSold = 0
    const productSalesMap = {}
    const brandSalesMap = {}
    const citySalesMap = {}
    const customerSet = new Set()

    filteredOrders.forEach((o) => {
      // Customer count
      const custKey = o.address?.email || o.address?.phone || o.userId || o._id
      if (custKey) customerSet.add(custKey)

      // City map
      const city = o.address?.city?.trim() || 'Unknown'
      citySalesMap[city] = (citySalesMap[city] || 0) + 1

      // Items calculation
      if (Array.isArray(o.items)) {
        o.items.forEach((item) => {
          const qty = Number(item.quantity) || 1
          const price = Number(item.price) || 0
          totalItemsSold += qty

          // By Product
          const pName = item.name || 'Unnamed product'
          if (!productSalesMap[pName]) {
            productSalesMap[pName] = {
              name: pName,
              qty: 0,
              totalRevenue: 0,
              image: Array.isArray(item.image) ? item.image[0] : item.image,
              brand: item.subCategory || 'Sneakers',
            }
          }
          productSalesMap[pName].qty += qty
          productSalesMap[pName].totalRevenue += price * qty

          // By Brand
          const brand = item.subCategory || 'Other'
          brandSalesMap[brand] = (brandSalesMap[brand] || 0) + qty
        })
      }
    })

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.qty - a.qty || b.totalRevenue - a.totalRevenue)
      .slice(0, 8)

    // Status breakdown
    const statusBreakdown = Object.keys(STATUS_CONFIG).map((st) => {
      const matchOrders = filteredOrders.filter((o) => o.status === st)
      const count = matchOrders.length
      const amount = matchOrders.reduce((s, o) => s + (Number(o.amount) || 0), 0)
      const percentage = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0
      return { status: st, count, amount, percentage }
    })

    const deliveredOrders = filteredOrders.filter((o) => o.status === 'Delivered').length
    const deliveryRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0

    // Payment methods
    const codOrders = filteredOrders.filter((o) => o.paymentMethod?.toUpperCase() === 'COD').length
    const onlineOrders = totalOrders - codOrders

    return {
      revenue,
      totalOrders,
      avgBasket,
      totalItemsSold,
      deliveredOrders,
      deliveryRate,
      uniqueCustomers: customerSet.size,
      statusBreakdown,
      topProducts,
      codOrders,
      onlineOrders,
      citySalesMap,
    }
  }, [filteredOrders])

  // Timeline / Chart aggregation (groups by day or by month depending on period)
  const timelineData = useMemo(() => {
    if (!filteredOrders.length) return []

    // Sort ascending by date
    const sorted = [...filteredOrders].sort((a, b) => (a.date || 0) - (b.date || 0))
    const firstDate = Number(sorted[0]?.date) || Date.now()
    const lastDate = Number(sorted[sorted.length - 1]?.date) || Date.now()
    const diffDays = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24))

    const isDaily = diffDays <= 45

    const map = {}
    sorted.forEach((order) => {
      const d = new Date(order.date || Date.now())
      const key = isDaily
        ? d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
        : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

      if (!map[key]) {
        map[key] = { label: key, revenue: 0, orders: 0, rawDate: order.date }
      }
      map[key].revenue += Number(order.amount) || 0
      map[key].orders += 1
    })

    return Object.values(map)
  }, [filteredOrders])

  // Max value for timeline scaling
  const maxChartValue = useMemo(() => {
    if (!timelineData.length) return 1
    return Math.max(...timelineData.map((d) => (chartMetric === 'revenue' ? d.revenue : d.orders))) || 1
  }, [timelineData, chartMetric])

  // Pagination for table
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredOrders.slice(start, start + itemsPerPage)
  }, [filteredOrders, currentPage])

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1

  // Filter summary human description for PDF & exports
  const filterSummary = useMemo(() => {
    const summary = {}

    if (period === 'all') summary['Period'] = 'All dates'
    else if (period === 'today') summary['Period'] = 'Today'
    else if (period === 'yesterday') summary['Period'] = 'Yesterday'
    else if (period === '7days') summary['Period'] = 'Last 7 days'
    else if (period === '30days') summary['Period'] = 'Last 30 days'
    else if (period === 'this_month') summary['Period'] = 'This month'
    else if (period === 'last_month') summary['Period'] = 'Last month'
    else if (period === 'this_year') summary['Period'] = 'This year'
    else if (period === 'custom') {
      summary['Period'] = `From ${customStartDate || 'start'} to ${customEndDate || 'end'}`
    }

    if (selectedStatus !== 'all') summary['Status'] = selectedStatus
    if (selectedPaymentMethod !== 'all') summary['Payment'] = selectedPaymentMethod
    if (selectedPaymentStatus !== 'all') {
      summary['Settlement'] = selectedPaymentStatus === 'paid' ? 'Paid' : 'Pending'
    }
    if (selectedBrand !== 'all') summary['Brand'] = selectedBrand
    if (selectedCity !== 'all') summary['City'] = selectedCity
    if (searchQuery.trim() !== '') summary['Search'] = searchQuery.trim()

    return summary
  }, [
    period,
    customStartDate,
    customEndDate,
    selectedStatus,
    selectedPaymentMethod,
    selectedPaymentStatus,
    selectedBrand,
    selectedCity,
    searchQuery,
  ])

  // Handlers for PDF and Excel
  const handlePrintPdf = () => {
    try {
      exportStatsReportToPdf(statsCalculations, filterSummary, {
        mode: 'print',
        title: pdfCustomTitle || 'SALES SUMMARY & ANALYTICS',
        includeOrdersList: pdfIncludeOrders,
        orders: filteredOrders,
      })
      setShowPrintModal(false)
      toast.success('PDF report printing started')
    } catch (e) {
      console.error(e)
      toast.error('Error while generating the PDF for printing')
    }
  }

  const handleDownloadPdf = () => {
    try {
      const dateStr = new Date().toISOString().slice(0, 10)
      const periodLabel = period.replace('_', '')
      exportStatsReportToPdf(statsCalculations, filterSummary, {
        mode: 'download',
        title: pdfCustomTitle || 'SALES SUMMARY & ANALYTICS',
        includeOrdersList: pdfIncludeOrders,
        orders: filteredOrders,
        filename: `Meili_Stats_${periodLabel}_${dateStr}.pdf`,
      })
      setShowPrintModal(false)
      toast.success('PDF report downloaded successfully')
    } catch (e) {
      console.error(e)
      toast.error('Error while downloading the PDF')
    }
  }

  const handleExportExcel = () => {
    try {
      exportStatsReportToExcel(statsCalculations, filterSummary)
      toast.success('Excel report generated successfully')
    } catch (e) {
      console.error(e)
      toast.error('Error while exporting to Excel')
    }
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 animate-pulse space-y-6">
        <div className="h-10 w-72 bg-black/5 rounded-xl" />
        <div className="h-28 bg-black/5 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-black/5 rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-black/5 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & GLOBAL ACTIONS
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#e63946]/10 flex items-center justify-center text-[#e63946]">
              <BarChart3 size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1f1f23] tracking-tight">
                Statistics & Reports
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                Real-time filterable analysis of sales, orders and average order value
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl  hover:shadow-md border border-gray-200 text-xs font-bold text-gray-700  transition disabled:opacity-60 cursor-pointer"
            title="Refresh data"
          >
            <RotateCcw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold transition cursor-pointer"
            title="Export to Excel"
          >
            <FileSpreadsheet size={15} />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1f1f23] text-white text-xs font-bold hover:bg-black transition shadow-sm cursor-pointer"
            title="Print and PDF options"
          >
            <Printer size={15} className="text-[#e63946]" />
            <span>Print / PDF</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#e63946] text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. FILTER CONTROL PANEL
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-[#e63946]" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-900">
              Filter Settings & Selection
            </h2>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#e63946]/10 text-[#e63946] border border-[#e63946]/20">
                {activeFiltersCount} active
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium">
              <strong className="text-gray-900 font-bold">{filteredOrders.length}</strong> order
              {filteredOrders.length !== 1 ? 's' : ''} found
            </span>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-[#e63946] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <X size={13} />
                Reset all
              </button>
            )}
          </div>
        </div>

        {/* Quick Period Buttons */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
            Time Period
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PERIOD_OPTIONS.map((opt) => {
              const active = period === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${active
                    ? 'bg-[#e63946] text-white shadow-sm shadow-[#e63946]/25'
                    : ' text-gray-600'
                    }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom date range if 'custom' is active */}
        {period === 'custom' && (
          <div className="p-4  rounded-2xl border border-dashed border-gray-300 flex flex-wrap items-center gap-4 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" />
              <span className="text-xs font-bold text-gray-700">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-xs font-medium focus:outline-none focus:border-[#e63946]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-xs font-medium focus:outline-none focus:border-[#e63946]"
              />
            </div>
          </div>
        )}

        {/* Detailed Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* Order Status */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Order Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200  text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#e63946] focus:bg-white transition"
            >
              <option value="all">All statuses</option>
              {Object.keys(STATUS_CONFIG).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Payment Method
            </label>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200  text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#e63946] focus:bg-white transition"
            >
              <option value="all">All methods</option>
              <option value="COD">Cash on delivery (COD)</option>
              <option value="Stripe">Online (Stripe / Card)</option>
            </select>
          </div>

          {/* Settlement */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Payment Status
            </label>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#e63946] focus:bg-white transition"
            >
              <option value="all">All payment statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Pending / Unpaid</option>
            </select>
          </div>

          {/* Brand */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Sneaker Brand
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#e63946] focus:bg-white transition"
            >
              <option value="all">All brands</option>
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Delivery City
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200  text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#e63946] focus:bg-white transition"
            >
              <option value="all">All cities</option>
              {availableCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>    
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. STATS CARDS (KPIS)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={17} />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2 tracking-tight">
            {statsCalculations.revenue.toLocaleString('en-US')}{' '}
            <span className="text-xs font-bold text-gray-400">TND</span>
          </p>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">Total filtered revenue</p>
        </div>

        {/* Orders Count */}
        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Orders
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag size={17} />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2 tracking-tight">
            {statsCalculations.totalOrders}
          </p>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">Orders placed</p>
        </div>

        {/* Average Basket */}
        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Avg. Order Value
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp size={17} />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2 tracking-tight">
            {statsCalculations.avgBasket.toFixed(1)}{' '}
            <span className="text-xs font-bold text-gray-400">TND</span>
          </p>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">Per order</p>
        </div>

        {/* Items Sold */}
        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Pairs Sold
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package size={17} />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2 tracking-tight">
            {statsCalculations.totalItemsSold}
          </p>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">Sneakers shipped</p>
        </div>

        {/* Delivery Rate */}
        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Delivery Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={17} />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2 tracking-tight">
            {statsCalculations.deliveryRate}%
          </p>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">
            {statsCalculations.deliveredOrders} successfully delivered
          </p>
        </div>

        {/* Unique Customers */}
        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Unique Customers
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Sparkles size={17} />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2 tracking-tight">
            {statsCalculations.uniqueCustomers}
          </p>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">Distinct buyers</p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. CHARTS & ANALYTICS VISUALIZATIONS
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Chart (Col-span 2) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-black/5 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-extrabold text-[#1f1f23]">
                Sales Over Time
              </h3>
              <p className="text-xs text-gray-500">
                Visualization based on the period and active filters
              </p>
            </div>
            <div className="flex items-center p-1 rounded-xl">
              <button
                onClick={() => setChartMetric('revenue')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${chartMetric === 'revenue'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                Revenue (TND)
              </button>
              <button
                onClick={() => setChartMetric('orders')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${chartMetric === 'orders'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                Volume (Orders)
              </button>
            </div>
          </div>

          {timelineData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-sm">
              <ShoppingBag size={32} className="mb-2 opacity-40" />
              <span>No sales in the filtered period</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Interactive Bar Chart Visualization */}
              <div className="h-60 flex items-end gap-2 sm:gap-3 pt-6 pb-2 overflow-x-auto">
                {timelineData.map((d, idx) => {
                  const val = chartMetric === 'revenue' ? d.revenue : d.orders
                  const pct = Math.max(Math.round((val / maxChartValue) * 100), 6)
                  return (
                    <div
                      key={idx}
                      className="flex-1 min-w-[32px] max-w-[56px] flex flex-col items-center gap-2 group relative cursor-pointer"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] font-bold py-1 px-2 rounded-lg whitespace-nowrap z-20 pointer-events-none shadow-lg">
                        {d.label}: {chartMetric === 'revenue' ? `${d.revenue} TND` : `${d.orders} orders`}
                      </div>

                      {/* Bar */}
                      <div className="w-full  rounded-t-xl overflow-hidden flex flex-col justify-end h-44">
                        <div
                          style={{ height: `${pct}%` }}
                          className={`w-full rounded-t-xl transition-all duration-500 group-hover:brightness-95 ${chartMetric === 'revenue' ? 'bg-[#e63946]' : 'bg-[#1f1f23]'
                            }`}
                        />
                      </div>

                      {/* Label */}
                      <span className="text-[10px] font-bold text-gray-500 truncate w-full text-center">
                        {d.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Chart footer legend */}
              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-3 border-t border-black/5">
                <span className="font-medium">
                  {timelineData.length} activity point{timelineData.length !== 1 ? 's' : ''}
                </span>
                <span className="font-bold text-gray-900">
                  Total:{' '}
                  {chartMetric === 'revenue'
                    ? `${statsCalculations.revenue.toLocaleString('en-US')} TND`
                    : `${statsCalculations.totalOrders} orders`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Status Breakdown & Payment Methods (Col-span 1) */}
        <div className="space-y-6">
          {/* Status Breakdown Card */}
          <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm">
            <h3 className="text-base font-extrabold text-[#1f1f23] mb-4">
              Breakdown by Status
            </h3>
            <div className="space-y-3.5">
              {statsCalculations.statusBreakdown.map((s) => {
                const conf = STATUS_CONFIG[s.status] || {
                  label: s.status,
                  bar: 'bg-gray-400',
                  text: 'text-gray-600',
                }
                return (
                  <div key={s.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">{s.status}</span>
                      <span className="font-bold text-gray-900">
                        {s.count}{' '}
                        <span className="text-[10px] font-medium text-gray-400">
                          ({s.percentage}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${conf.bar} transition-all duration-500`}
                        style={{ width: `${s.percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-[#1f1f23] mb-3">
              Payment Methods
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 hover:shadow-md rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold uppercase text-gray-400">
                  On Delivery (COD)
                </span>
                <p className="text-lg font-black text-gray-900 mt-1">
                  {statsCalculations.codOrders}
                </p>
                <p className="text-[10px] text-gray-500 font-medium">
                  {statsCalculations.totalOrders > 0
                    ? Math.round((statsCalculations.codOrders / statsCalculations.totalOrders) * 100)
                    : 0}
                  % of sales
                </p>
              </div>

              <div className="p-3.5 hover:shadow-md rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold uppercase text-gray-400">
                  Online / Card
                </span>
                <p className="text-lg font-black text-gray-900 mt-1">
                  {statsCalculations.onlineOrders}
                </p>
                <p className="text-[10px] text-gray-500 font-medium">
                  {statsCalculations.totalOrders > 0
                    ? Math.round(
                      (statsCalculations.onlineOrders / statsCalculations.totalOrders) * 100
                    )
                    : 0}
                  % of sales
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. TOP PRODUCTS SOLD IN FILTER
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-extrabold text-[#1f1f23]">
              Top Selling Models
            </h3>
            <p className="text-xs text-gray-500">
              Ranked by volume of pairs ordered
            </p>
          </div>
          <span className="text-xs font-bold text-gray-400">
            {statsCalculations.topProducts.length} reference
            {statsCalculations.topProducts.length !== 1 ? 's' : ''}
          </span>
        </div>

        {statsCalculations.topProducts.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No products sold matching the selected criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCalculations.topProducts.map((p, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-gray-100 hover:shadow-md transition flex items-center gap-3.5"
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 text-xs font-extrabold flex items-center justify-center text-gray-700 flex-shrink-0 shadow-xs">
                  #{idx + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 truncate" title={p.name}>
                    {p.name}
                  </p>
                  <span className="text-[10px] font-semibold text-[#e63946] uppercase">
                    {p.brand}
                  </span>
                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span className="font-extrabold text-gray-700">
                      {p.qty} pair{p.qty !== 1 ? 's' : ''}
                    </span>
                    <span className="font-bold text-emerald-600">
                      {p.totalRevenue.toLocaleString('en-US')} TND
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. DETAILED FILTERED ORDERS TABLE
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-[#1f1f23]">
              Filtered Orders List
            </h3>
            <p className="text-xs text-gray-500">
              Showing {paginatedOrders.length} of {filteredOrders.length} order(s)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPdfIncludeOrders(true)
                setShowPrintModal(true)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:shadow-md text-gray-700  text-xs font-bold transition cursor-pointer"
            >
              <Printer size={13} />
              Print this list
            </button>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No orders match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className=" border-b border-black/5 text-[11px] font-extrabold uppercase text-gray-500 tracking-wider">
                  <th className="py-3.5 px-5">Ref / Date</th>
                  <th className="py-3.5 px-5">Customer</th>
                  <th className="py-3.5 px-5">City</th>
                  <th className="py-3.5 px-5">Items</th>
                  <th className="py-3.5 px-5 text-right">Amount</th>
                  <th className="py-3.5 px-5 text-center">Payment</th>
                  <th className="py-3.5 px-5 text-center">Status</th>
                  <th className="py-3.5 px-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {paginatedOrders.map((order) => {
                  const conf = STATUS_CONFIG[order.status] || {
                    label: order.status,
                    bg: 'bg-white',
                    text: 'text-gray-700',
                    border: 'border-gray-200',
                  }
                  const itemsCount = Array.isArray(order.items)
                    ? order.items.reduce((s, i) => s + (Number(i.quantity) || 1), 0)
                    : 0

                  return (
                    <tr key={order._id} className="hover:shadow-md transition-colors">
                      <td className="py-3.5 px-5 font-mono">
                        <span className="font-bold text-gray-900">
                          #{order._id?.slice(-6).toUpperCase()}
                        </span>
                        <div className="text-[10px] text-gray-400 font-sans">
                          {formatDateOnly(order.date)}
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        <p className="font-bold text-gray-900">
                          {order.address?.firstName} {order.address?.lastName}
                        </p>
                        <p className="text-[10px] text-gray-400">{order.address?.phone || '-'}</p>
                      </td>

                      <td className="py-3.5 px-5 font-medium text-gray-700">
                        {order.address?.city || '-'}
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="font-bold text-gray-800">
                          {itemsCount} pair{itemsCount !== 1 ? 's' : ''}
                        </span>
                        <p className="text-[10px] text-gray-400 truncate max-w-[200px]">
                          {Array.isArray(order.items)
                            ? order.items.map((i) => i.name).join(', ')
                            : '-'}
                        </p>
                      </td>

                      <td className="py-3.5 px-5 text-right font-black text-gray-900">
                        {order.amount} TND
                      </td>

                      <td className="py-3.5 px-5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${order.payment
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                        >
                          {order.payment ? 'Paid' : 'Pending'}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${conf.bg} ${conf.text} ${conf.border}`}
                        >
                          {order.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={() => setPreviewOrder(order)}
                          className="p-1.5 rounded-xl hover:shadow-md hover:bg-[#e63946] hover:text-white transition text-gray-600 cursor-pointer"
                          title="Quick preview"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-black/5 flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-gray-200 font-bold text-gray-700 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-gray-200 font-bold text-gray-700 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          7. PRINT / PDF MODAL
          ───────────────────────────────────────────────────────────── */}
      {showPrintModal && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowPrintModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-black/5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-black/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#e63946]/10 flex items-center justify-center text-[#e63946]">
                  <Printer size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Print & PDF Export</h3>
                  <p className="text-xs text-gray-500">
                    Document setup with the selected filters
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content & Options */}
            <div className="py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Report Title
                </label>
                <input
                  type="text"
                  value={pdfCustomTitle}
                  onChange={(e) => setPdfCustomTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#e63946]"
                />
              </div>

              {/* Summary of applied filters */}
              <div className="p-3.5  rounded-2xl border border-gray-100 text-xs space-y-1.5">
                <span className="font-bold text-gray-900 uppercase text-[10px] tracking-wider block">
                  Active Filters Included in the Report:
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Object.entries(filterSummary).map(([k, v]) => (
                    <span
                      key={k}
                      className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[11px] text-gray-700 font-medium"
                    >
                      <strong>{k}:</strong> {v}
                    </span>
                  ))}
                </div>
              </div>

              {/* Checkboxes for options */}
              <div className="space-y-2.5 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={pdfIncludeOrders}
                    onChange={(e) => setPdfIncludeOrders(e.target.checked)}
                    className="w-4 h-4 rounded text-[#e63946] focus:ring-[#e63946] cursor-pointer"
                  />
                  <span>
                    Include the detailed table of {filteredOrders.length} order(s) on page 2
                  </span>
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-black/5 flex flex-col sm:flex-row items-center justify-end gap-2.5">
              <button
                onClick={() => setShowPrintModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-gray-700 text-xs font-bold  transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleDownloadPdf}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1f1f23] px-4 py-2.5 rounded-xl  text-white text-xs font-bold hover:bg-black transition cursor-pointer shadow-sm"
              >
                <Download size={14} />
                <span>Download PDF</span>
              </button>

              <button
                onClick={handlePrintPdf}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#e63946] text-white text-xs font-bold hover:bg-[#d62839] transition cursor-pointer shadow-md shadow-[#e63946]/20"
              >
                <Printer size={14} />
                <span>Start Printing</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          8. QUICK ORDER PREVIEW MODAL
          ───────────────────────────────────────────────────────────── */}
      {previewOrder && (
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setPreviewOrder(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-black/5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-black/5">
              <div>
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">
                  Order #{previewOrder._id?.slice(-8).toUpperCase()}
                </span>
                <h3 className="text-base font-extrabold text-gray-900 mt-0.5">Order Details</h3>
              </div>
              <button
                onClick={() => setPreviewOrder(null)}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl">
                <div>
                  <span className="text-gray-400 font-bold text-[10px] uppercase">Customer</span>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {previewOrder.address?.firstName} {previewOrder.address?.lastName}
                  </p>
                  <p className="text-gray-500 text-[11px]">{previewOrder.address?.phone || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-bold text-[10px] uppercase">Address</span>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {previewOrder.address?.city || '-'}
                  </p>
                  <p className="text-gray-500 text-[11px]">{previewOrder.address?.street || '-'}</p>
                </div>
              </div>

              <div>
                <span className="text-gray-400 font-bold text-[10px] uppercase block mb-2">
                  Ordered Items
                </span>
                <div className="space-y-2">
                  {Array.isArray(previewOrder.items) &&
                    previewOrder.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100"
                      >
                        <div>
                          <p className="font-bold text-gray-900">{item.name}</p>
                          <p className="text-[10px] text-gray-500">
                            Size: {item.size || '-'} · Qty: {item.quantity || 1}
                          </p>
                        </div>
                        <span className="font-extrabold text-gray-900">
                          {(item.price || 0) * (item.quantity || 1)} TND
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-black/5 font-extrabold">
                <span className="text-gray-700">Order Total:</span>
                <span className="text-base text-[#e63946]">{previewOrder.amount} TND</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}