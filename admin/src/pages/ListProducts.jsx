import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Trash2, Pencil, Search, PackageSearch, Loader2, Star, X, AlertTriangle } from 'lucide-react'

import { BACKEND_URL, COLORS, CATEGORIES } from '../components/constants'
import { card, field } from '../components/styles'
import EditProductModal from '../components/EditProductModal'

const colorHex = (name) => COLORS.find((c) => c.name === name)?.hex

const normalizeCategories = (cat) => {
  if (!cat) return []
  let items = []

  if (Array.isArray(cat)) {
    items = cat.flatMap((c) => {
      if (typeof c === 'string' && c.startsWith('[') && c.endsWith(']')) {
        try {
          const parsed = JSON.parse(c)
          return Array.isArray(parsed) ? parsed : [c]
        } catch {
          return [c]
        }
      }
      return c !== undefined && c !== null ? [c] : []
    })
  } else if (typeof cat === 'string') {
    const trimmed = cat.trim()
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          items = parsed
        } else {
          items = [trimmed]
        }
      } catch {
        items = [trimmed]
      }
    } else if (trimmed.includes(',')) {
      items = trimmed.split(',')
    } else if (trimmed) {
      items = [trimmed]
    }
  }

  // Deduplicate and canonicalize casing
  const uniqueMap = new Map()
  items.forEach((item) => {
    if (!item) return
    const str = String(item).trim()
    if (!str) return
    const canonical = str.charAt(0).toUpperCase() + str.slice(1)
    const key = canonical.toLowerCase()
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, canonical)
    }
  })

  return Array.from(uniqueMap.values())
}

/* ---------- Delete confirmation modal (Single or Bulk) ---------- */
const DeleteModal = ({ product, count, onCancel, onConfirm, deleting }) => {
  useEffect(() => {
    if (!product && !count) return
    const onKey = (e) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [product, count, onCancel])

  if (!product && !count) return null

  const title = product ? 'Delete product?' : `Delete ${count} product${count > 1 ? 's' : ''}?`
  const subtitle = product ? (
    <>
      <span className="font-semibold text-gray-700">{product.name}</span> will be permanently removed from the catalog.
    </>
  ) : (
    <>
      <span className="font-semibold text-gray-700">{count} selected product{count > 1 ? 's' : ''}</span> will be permanently removed from the catalog.
    </>
  )

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-black/5 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-xl bg-[#e63946]/10 flex items-center justify-center">
            <AlertTriangle size={20} className="text-[#e63946]" />
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <h3 className="font-extrabold text-[#1f1f23]">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-3 rounded-xl bg-[#e63946] text-white text-sm font-bold hover:bg-[#d62839] transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={15} />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Page ---------- */
const ListProducts = ({ token, globalSearch }) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('All')
  const [toDelete, setToDelete] = useState(null)
  const [toEdit, setToEdit] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/product/list`)
      if (res.data.success) setProducts(res.data.products)
    } catch {
      toast.error('Failed to load products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/product/remove`,
        { id: toDelete._id },
        { headers: { token } }
      )
      if (res.data.success) {
        toast.success('Product deleted.')
        setProducts((prev) => prev.filter((p) => p._id !== toDelete._id))
        setSelectedIds((prev) => prev.filter((id) => id !== toDelete._id))
        setToDelete(null)
      } else {
        toast.error(res.data.message)
      }
    } catch {
      toast.error('Error deleting product.')
    } finally {
      setDeleting(false)
    }
  }

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return
    setDeleting(true)
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/product/remove`,
        { ids: selectedIds },
        { headers: { token } }
      )
      if (res.data.success) {
        toast.success(res.data.message || `${selectedIds.length} products deleted.`)
        setProducts((prev) => prev.filter((p) => !selectedIds.includes(p._id)))
        setSelectedIds([])
        setShowBulkDeleteModal(false)
      } else {
        toast.error(res.data.message)
      }
    } catch {
      toast.error('Error deleting selected products.')
    } finally {
      setDeleting(false)
    }
  }

  const handleProductUpdated = (updated) => {
    setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))
  }

  const categories = useMemo(() => {
    const unique = new Map()
    products.forEach((p) => {
      normalizeCategories(p.category).forEach((c) => {
        const key = c.toLowerCase()
        if (!unique.has(key)) {
          unique.set(key, c)
        }
      })
    })
    return ['All', ...Array.from(unique.values())]
  }, [products])

  const filtered = useMemo(() => {
    const q = (search || globalSearch || '').trim().toLowerCase()
    return products.filter((p) => {
      const matchSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.subCategory?.toLowerCase().includes(q)
      const pCats = normalizeCategories(p.category)
      const matchCat =
        filterCat === 'All' ||
        pCats.some((c) => c.toLowerCase() === filterCat.toLowerCase())
      return matchSearch && matchCat
    })
  }, [products, search, globalSearch, filterCat])

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const isAllSelected =
    filtered.length > 0 && filtered.every((p) => selectedIds.includes(p._id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const filteredSet = new Set(filtered.map((p) => p._id))
      setSelectedIds((prev) => prev.filter((id) => !filteredSet.has(id)))
    } else {
      const newSet = new Set([...selectedIds, ...filtered.map((p) => p._id)])
      setSelectedIds(Array.from(newSet))
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-7 h-7 animate-spin text-[#e63946]" />
      </div>
    )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#1f1f23] tracking-tight">Products</h2>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            {products.length} product{products.length !== 1 ? 's' : ''} in catalog
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or brand..."
            className={`${field} !pl-10 !py-2.5 !rounded-full`}
          />
        </div>

        <div className="flex items-center gap-1 bg-white border border-black/5 shadow-sm rounded-full p-1 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filterCat === cat
                  ? 'bg-[#1f1f23] text-white shadow-md'
                  : 'text-gray-500 hover:text-[#1f1f23]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk selection action bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-[#1f1f23] text-white px-5 py-3 rounded-2xl mb-4 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded accent-[#e63946] cursor-pointer"
            />
            <span className="text-sm font-bold">
              {selectedIds.length} product{selectedIds.length > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Deselect all
            </button>
            <button
              type="button"
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-4 py-1.5 rounded-xl bg-[#e63946] hover:bg-[#d62839] text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={14} />
              Delete selected ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className={`${card} !p-12 text-center`}>
          <div className="w-14 h-14 rounded-2xl bg-[#efefef] flex items-center justify-center mx-auto mb-3">
            <PackageSearch size={22} className="text-gray-400" />
          </div>
          <p className="text-[#1f1f23] font-bold">No products found</p>
          <p className="text-gray-500 text-sm mt-1">Try changing your search or filter.</p>
        </div>
      ) : (
        <div className={`${card} !p-0 overflow-hidden`}>
          {/* Table header (desktop) */}
          <div className="hidden md:grid grid-cols-[40px_64px_1fr_130px_110px_100px_90px] gap-4 px-5 py-3 border-b border-black/5 bg-[#efefef]/60 items-center">
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-[#e63946] focus:ring-[#e63946] accent-[#e63946] cursor-pointer"
                title="Select all"
              />
            </div>
            {['Image', 'Product', 'Category', 'Sub-Category', 'Price', 'Actions'].map((h) => (
              <span key={h} className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-500">
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {filtered.map((p) => {
            const isSelected = selectedIds.includes(p._id)
            return (
              <div
                key={p._id}
                className={`grid grid-cols-[36px_64px_1fr_75px] md:grid-cols-[40px_64px_1fr_130px_110px_100px_90px] gap-4 px-5 py-3.5 items-center border-b border-black/5 last:border-0 transition-colors ${
                  isSelected ? 'bg-red-50/40' : 'hover:bg-[#efefef]/40'
                }`}
              >
                {/* Checkbox */}
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(p._id)}
                    className="w-4 h-4 rounded border-gray-300 text-[#e63946] focus:ring-[#e63946] accent-[#e63946] cursor-pointer"
                  />
                </div>

                {/* Image */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#efefef] border border-black/5">
                  <img src={p.image?.[0]} alt={p.name} className="w-full h-full object-cover" />
                </div>

                {/* Name + badges */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#1f1f23] text-sm truncate">{p.name}</p>
                    {p.popular && (
                      <Star size={13} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                    )}
                  </div>

                  {/* Mobile info */}
                  <p className="md:hidden text-xs text-gray-500 font-medium mt-0.5">
                    {normalizeCategories(p.category).join(', ') || '—'} · {p.subCategory} ·{' '}
                    <span className="font-bold text-[#1f1f23]">{p.price} TND</span>
                  </p>

                  <div className="flex gap-1.5 mt-1.5 flex-wrap items-center">
                    {(p.colors || []).slice(0, 4).map((c) => (
                      <span
                        key={c}
                        title={c}
                        className="w-3.5 h-3.5 rounded-full border border-black/20"
                        style={{ background: colorHex(c) || '#d1d5db' }}
                      />
                    ))}
                    {(p.colors || []).length > 4 && (
                      <span className="text-[0.65rem] font-semibold text-gray-500">
                        +{p.colors.length - 4}
                      </span>
                    )}
                    {(p.sizes || []).length > 0 && (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-[#e63946]/10 text-[#e63946] text-[0.65rem] font-bold">
                        {p.sizes.length} sizes
                      </span>
                    )}
                  </div>
                </div>

                {/* Desktop columns */}
                <div className="hidden md:flex flex-wrap gap-1 items-center">
                  {normalizeCategories(p.category).length > 0 ? (
                    normalizeCategories(p.category).map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-0.5 rounded-md bg-[#1f1f23]/5 text-[#1f1f23] text-xs font-semibold"
                      >
                        {cat}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 font-semibold">—</span>
                  )}
                </div>
                <span className="hidden md:block text-xs text-gray-600 font-semibold">{p.subCategory}</span>
                <span className="hidden md:block text-sm font-extrabold text-[#1f1f23]">{p.price} TND</span>

                {/* Actions: Edit + Delete */}
                <div className="flex items-center gap-1.5 justify-end">
                  <button
                    type="button"
                    onClick={() => setToEdit(p)}
                    aria-label={`Edit ${p.name}`}
                    title="Edit product"
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-[#1f1f23] text-gray-700 hover:text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(p)}
                    aria-label={`Delete ${p.name}`}
                    title="Delete product"
                    className="w-9 h-9 rounded-xl bg-[#e63946]/10 text-[#e63946] hover:bg-[#e63946] hover:text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {toEdit && (
        <EditProductModal
          product={toEdit}
          token={token}
          onClose={() => setToEdit(null)}
          onUpdated={handleProductUpdated}
        />
      )}

      {/* Single Delete Modal */}
      <DeleteModal
        product={toDelete}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
        deleting={deleting}
      />

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <DeleteModal
          count={selectedIds.length}
          onCancel={() => setShowBulkDeleteModal(false)}
          onConfirm={confirmBulkDelete}
          deleting={deleting}
        />
      )}
    </div>
  )
}

export default ListProducts