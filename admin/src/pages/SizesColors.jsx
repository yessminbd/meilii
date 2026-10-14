import React, { useEffect, useState } from "react"
import { toast } from "react-toastify"
import {
  Palette,
  Ruler,
  Plus,
  Trash2,
  Pencil,
  X,
  Search,
  Loader2,
  AlertTriangle,
  Sparkles,
  Check,
} from "lucide-react"

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"

// ── Tabs ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: "colors", label: "Colors", icon: Palette },
  { key: "sizes", label: "Sizes / Shoe Sizes", icon: Ruler },
]

export default function SizesColors({ token }) {
  const [tab, setTab] = useState("colors")

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#e63946]/10 flex items-center justify-center text-[#e63946]">
            <Palette size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1f1f23]">Sizes & Colors</h1>
            <p className="text-gray-500 text-sm">
              Manage the color palette and size groups available for your products
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                active
                  ? "bg-white text-[#1f1f23] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab panels */}
      {tab === "colors" && <ColorsPanel token={token} />}
      {tab === "sizes" && <SizesPanel token={token} />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// COLORS PANEL
// ══════════════════════════════════════════════════════════════════════════
function ColorsPanel({ token }) {
  const [colors, setColors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Add form
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState("")
  const [newHex, setNewHex] = useState("#e63946")
  const [creating, setCreating] = useState(false)

  // Edit
  const [editColor, setEditColor] = useState(null)
  const [editName, setEditName] = useState("")
  const [editHex, setEditHex] = useState("")
  const [updating, setUpdating] = useState(false)

  // Delete
  const [deleteModal, setDeleteModal] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchColors = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/color/list`)
      const data = await res.json()
      if (data.success) setColors(data.colors || [])
      else toast.error(data.message)
    } catch {
      toast.error("Unable to load colors")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchColors() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return toast.error("Name is required")
    setCreating(true)
    try {
      const res = await fetch(`${backendUrl}/api/color/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", token },
        body: JSON.stringify({ name: newName.trim(), hex: newHex }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Color "${newName}" added!`)
        setShowAdd(false)
        setNewName("")
        setNewHex("#e63946")
        fetchColors()
      } else toast.error(data.message)
    } catch { toast.error("Server error") }
    finally { setCreating(false) }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editName.trim()) return toast.error("Name is required")
    setUpdating(true)
    try {
      const res = await fetch(`${backendUrl}/api/color/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", token },
        body: JSON.stringify({ id: editColor._id, name: editName.trim(), hex: editHex }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Color updated!")
        setEditColor(null)
        fetchColors()
      } else toast.error(data.message)
    } catch { toast.error("Server error") }
    finally { setUpdating(false) }
  }

  const handleDelete = async () => {
    if (!deleteModal) return
    setDeleting(true)
    try {
      const res = await fetch(`${backendUrl}/api/color/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", token },
        body: JSON.stringify({ id: deleteModal._id }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Color "${deleteModal.name}" deleted!`)
        setDeleteModal(null)
        fetchColors()
      } else toast.error(data.message)
    } catch { toast.error("Server error") }
    finally { setDeleting(false) }
  }

  const handleSeed = async () => {
    setCreating(true)
    try {
      const res = await fetch(`${backendUrl}/api/color/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json", token },
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Default colors initialized!")
        fetchColors()
      } else toast.error(data.message)
    } catch { toast.error("Server error") }
    finally { setCreating(false) }
  }

  const filtered = colors.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
        <Loader2 size={36} className="animate-spin text-[#e63946]" />
        <p className="text-sm font-medium">Loading colors...</p>
      </div>
    )
  }

  return (
    <>
      {/* Stats bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search a color..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500">
            <Palette size={14} className="text-[#e63946]" />
            {colors.length} {colors.length === 1 ? "color" : "colors"}
          </span>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#e63946] hover:bg-[#d62839] text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-sm transition-colors cursor-pointer"
          >
            <Plus size={16} /> Add Color
          </button>
        </div>
      </div>

      {/* Colors grid */}
      {colors.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-gray-300 max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#e63946] flex items-center justify-center mx-auto">
            <Palette size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">No colors yet</h3>
            <p className="text-sm text-gray-500 mt-1">
              Create your first color or generate the default palette.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowAdd(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#e63946] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#d62839] transition-colors cursor-pointer"
            >
              <Plus size={16} /> Create a Color
            </button>
            <button
              onClick={handleSeed}
              disabled={creating}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
            >
              <Sparkles size={16} className="text-amber-500" /> Generate default colors
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-black/5">
          <p className="text-gray-500 text-sm">No results for "{search}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((color) => (
            <div
              key={color._id}
              className="bg-white rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col items-center gap-3 group"
            >
              <div
                className="w-14 h-14 rounded-2xl border-2 border-black/10 shadow-inner"
                style={{ background: color.hex }}
              />
              <p className="font-bold text-sm text-gray-900 text-center truncate w-full">{color.name}</p>
              <p className="text-[11px] text-gray-400 font-mono uppercase">{color.hex}</p>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { setEditColor(color); setEditName(color.name); setEditHex(color.hex); }}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setDeleteModal(color)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Color */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-black/5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#e63946]/10 flex items-center justify-center text-[#e63946]">
                  <Palette size={18} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">New Color</h2>
              </div>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Navy, Burgundy, Olive..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newHex}
                    onChange={(e) => setNewHex(e.target.value)}
                    className="w-14 h-14 rounded-xl border border-gray-300 cursor-pointer bg-white p-1"
                  />
                  <input
                    type="text"
                    value={newHex}
                    onChange={(e) => setNewHex(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#e63946] hover:bg-[#d62839] rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-sm">
                  {creating && <Loader2 size={15} className="animate-spin" />}
                  <span>Add</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Color */}
      {editColor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm" onClick={() => setEditColor(null)}>
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-black/5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                  <Pencil size={18} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Edit Color</h2>
              </div>
              <button onClick={() => setEditColor(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={editHex} onChange={(e) => setEditHex(e.target.value)} className="w-14 h-14 rounded-xl border border-gray-300 cursor-pointer bg-white p-1" />
                  <input type="text" value={editHex} onChange={(e) => setEditHex(e.target.value)} className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setEditColor(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={updating} className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#1f1f23] hover:bg-black rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-sm">
                  {updating && <Loader2 size={15} className="animate-spin" />}
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteModal(null)}>
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-black/5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-[#e63946]/10 flex items-center justify-center">
                <AlertTriangle size={20} className="text-[#e63946]" />
              </div>
              <button onClick={() => setDeleteModal(null)} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete this color?</h3>
            <p className="text-sm text-gray-500 mb-6">
              The color <span className="font-semibold text-gray-800">"{deleteModal.name}"</span> will be permanently deleted.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setDeleteModal(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#e63946] hover:bg-[#d62839] rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-sm">
                {deleting && <Loader2 size={15} className="animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// SIZES PANEL  (uses existing sizeType backend)
// ══════════════════════════════════════════════════════════════════════════
function SizesPanel({ token }) {
  const [sizeTypes, setSizeTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Add sizeType
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState("")
  const [newKind, setNewKind] = useState("numeric")
  const [newValuesInput, setNewValuesInput] = useState("")
  const [creating, setCreating] = useState(false)

  // Edit sizeType
  const [editST, setEditST] = useState(null)
  const [editName, setEditName] = useState("")
  const [editKind, setEditKind] = useState("")
  const [updating, setUpdating] = useState(false)

  // Add value inline
  const [quickInputs, setQuickInputs] = useState({})
  const [addingValueId, setAddingValueId] = useState(null)

  // Delete
  const [deleteModal, setDeleteModal] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchSizeTypes = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/sizeType/list`)
      const data = await res.json()
      if (data.success) setSizeTypes(data.sizeTypes || [])
      else toast.error(data.message)
    } catch {
      toast.error("Unable to load sizes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSizeTypes() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return toast.error("Name is required")
    setCreating(true)
    try {
      const values = newValuesInput.split(",").map((v) => v.trim()).filter(Boolean)
      const res = await fetch(`${backendUrl}/api/sizeType/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", token },
        body: JSON.stringify({ name: newName.trim(), kind: newKind, values }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Group "${newName}" created!`)
        setShowAdd(false)
        setNewName("")
        setNewKind("numeric")
        setNewValuesInput("")
        fetchSizeTypes()
      } else toast.error(data.message)
    } catch { toast.error("Server error") }
    finally { setCreating(false) }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editName.trim()) return toast.error("Name is required")
    setUpdating(true)
    try {
      const res = await fetch(`${backendUrl}/api/sizeType/update/${editST._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", token },
        body: JSON.stringify({ name: editName.trim(), kind: editKind }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Group updated!")
        setEditST(null)
        fetchSizeTypes()
      } else toast.error(data.message)
    } catch { toast.error("Server error") }
    finally { setUpdating(false) }
  }

  const handleDelete = async () => {
    if (!deleteModal) return
    setDeleting(true)
    try {
      const res = await fetch(`${backendUrl}/api/sizeType/delete/${deleteModal._id}`, {
        method: "DELETE",
        headers: { token },
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Group "${deleteModal.name}" deleted!`)
        setDeleteModal(null)
        fetchSizeTypes()
      } else toast.error(data.message)
    } catch { toast.error("Server error") }
    finally { setDeleting(false) }
  }

  const handleQuickAddValue = async (stId) => {
    const val = (quickInputs[stId] || "").trim()
    if (!val) return
    setAddingValueId(stId)
    try {
      const res = await fetch(`${backendUrl}/api/sizeType/addValue/${stId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", token },
        body: JSON.stringify({ value: val }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Value "${val}" added!`)
        setQuickInputs((prev) => ({ ...prev, [stId]: "" }))
        fetchSizeTypes()
      } else toast.error(data.message)
    } catch { toast.error("Server error") }
    finally { setAddingValueId(null) }
  }

  const handleRemoveValue = async (stId, val) => {
    try {
      const res = await fetch(`${backendUrl}/api/sizeType/removeValue/${stId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", token },
        body: JSON.stringify({ value: val }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Value "${val}" removed!`)
        fetchSizeTypes()
      } else toast.error(data.message)
    } catch { toast.error("Server error") }
  }

  const handleSeedDefaults = async () => {
    setCreating(true)
    try {
      // Sneakers sizes
      await fetch(`${backendUrl}/api/sizeType/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", token },
        body: JSON.stringify({
          name: "Sneaker Sizes",
          kind: "numeric",
          values: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"],
        }),
      })
      // Clothing sizes
      await fetch(`${backendUrl}/api/sizeType/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", token },
        body: JSON.stringify({
          name: "Clothing Sizes",
          kind: "text",
          values: ["XS", "S", "M", "L", "XL", "XXL"],
        }),
      })
      // Kids sizes
      await fetch(`${backendUrl}/api/sizeType/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", token },
        body: JSON.stringify({
          name: "Kids Shoe Sizes",
          kind: "numeric",
          values: ["20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35"],
        }),
      })
      toast.success("Default size groups created!")
      fetchSizeTypes()
    } catch {
      toast.error("Failed to create default sizes")
    } finally {
      setCreating(false)
    }
  }

  const filtered = sizeTypes.filter((st) =>
    st.name.toLowerCase().includes(search.toLowerCase()) ||
    st.values?.some((v) => v.toLowerCase().includes(search.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
        <Loader2 size={36} className="animate-spin text-[#e63946]" />
        <p className="text-sm font-medium">Loading sizes...</p>
      </div>
    )
  }

  return (
    <>
      {/* Stats bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search a size or group..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500">
            <Ruler size={14} className="text-[#e63946]" />
            {sizeTypes.length} {sizeTypes.length === 1 ? "group" : "groups"}
          </span>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#e63946] hover:bg-[#d62839] text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-sm transition-colors cursor-pointer"
          >
            <Plus size={16} /> New Group
          </button>
        </div>
      </div>

      {/* Size types */}
      {sizeTypes.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-gray-300 max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#e63946] flex items-center justify-center mx-auto">
            <Ruler size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">No size group</h3>
            <p className="text-sm text-gray-500 mt-1">
              Create size groups (sneaker sizes, clothing sizes, etc.)
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowAdd(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#e63946] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#d62839] transition-colors cursor-pointer"
            >
              <Plus size={16} /> Create a Group
            </button>
            <button
              onClick={handleSeedDefaults}
              disabled={creating}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
            >
              <Sparkles size={16} className="text-amber-500" /> Generate default groups
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-black/5">
          <p className="text-gray-500 text-sm">No results for "{search}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((st) => {
            const currentInput = quickInputs[st._id] || ""
            const valueCount = st.values?.length || 0
            return (
              <div key={st._id} className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
                        <Ruler size={16} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-base truncate" title={st.name}>{st.name}</h3>
                        <p className="text-[11px] font-medium text-gray-400">
                          {st.kind === "numeric" ? "Numeric (shoe sizes)" : "Text (S/M/L)"} · {valueCount} {valueCount === 1 ? "value" : "values"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditST(st); setEditName(st.name); setEditKind(st.kind); }}
                        title="Edit"
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteModal(st)}
                        title="Delete"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Values */}
                  <div className="mb-4">
                    <p className="text-[11px] uppercase font-bold text-gray-400 tracking-wider mb-2">Values</p>
                    {(!st.values || st.values.length === 0) ? (
                      <p className="text-xs text-gray-400 italic">No values defined</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {st.values.map((val, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold group hover:bg-red-50 hover:text-red-700 transition-colors">
                            <span>{val}</span>
                            <button
                              onClick={() => handleRemoveValue(st._id, val)}
                              title={`Remove "${val}"`}
                              className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                            >
                              <X size={13} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick add value */}
                <div className="pt-3 border-t border-gray-100">
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleQuickAddValue(st._id); }}
                    className="flex gap-1.5"
                  >
                    <input
                      type="text"
                      value={currentInput}
                      onChange={(e) => setQuickInputs((prev) => ({ ...prev, [st._id]: e.target.value }))}
                      placeholder={st.kind === "numeric" ? "+ Add shoe size (e.g. 42)" : "+ Add size (e.g. XXL)"}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]"
                    />
                    <button
                      type="submit"
                      disabled={!currentInput.trim() || addingValueId === st._id}
                      className="px-3 py-1.5 bg-[#1f1f23] text-white hover:bg-black rounded-xl text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center shrink-0"
                    >
                      {addingValueId === st._id ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal: Add SizeType */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-black/5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#e63946]/10 flex items-center justify-center text-[#e63946]">
                  <Ruler size={18} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">New Size Group</h2>
              </div>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Group name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Sneaker Sizes, Clothing Sizes..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewKind("numeric")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                      newKind === "numeric"
                        ? "bg-[#1f1f23] text-white border-[#1f1f23]"
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
                    }`}
                  >
                    🔢 Numeric (shoe sizes)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewKind("text")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                      newKind === "text"
                        ? "bg-[#1f1f23] text-white border-[#1f1f23]"
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
                    }`}
                  >
                    🔤 Text (S/M/L)
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Initial values (optional)
                </label>
                <input
                  type="text"
                  value={newValuesInput}
                  onChange={(e) => setNewValuesInput(e.target.value)}
                  placeholder={newKind === "numeric" ? "36, 37, 38, 39, 40, 41, 42" : "S, M, L, XL, XXL"}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]"
                />
                <p className="text-[11px] text-gray-400 mt-1">Separate values with commas.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#e63946] hover:bg-[#d62839] rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-sm">
                  {creating && <Loader2 size={15} className="animate-spin" />}
                  <span>Create group</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit SizeType */}
      {editST && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm" onClick={() => setEditST(null)}>
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-black/5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                  <Pencil size={18} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Edit Group</h2>
              </div>
              <button onClick={() => setEditST(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditKind("numeric")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                      editKind === "numeric"
                        ? "bg-[#1f1f23] text-white border-[#1f1f23]"
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
                    }`}
                  >
                    🔢 Numeric
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditKind("text")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                      editKind === "text"
                        ? "bg-[#1f1f23] text-white border-[#1f1f23]"
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
                    }`}
                  >
                    🔤 Text
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setEditST(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={updating} className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#1f1f23] hover:bg-black rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-sm">
                  {updating && <Loader2 size={15} className="animate-spin" />}
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteModal(null)}>
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-black/5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-[#e63946]/10 flex items-center justify-center">
                <AlertTriangle size={20} className="text-[#e63946]" />
              </div>
              <button onClick={() => setDeleteModal(null)} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete this group?</h3>
            <p className="text-sm text-gray-500 mb-6">
              The group <span className="font-semibold text-gray-800">"{deleteModal.name}"</span> and all of its values will be permanently deleted.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setDeleteModal(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#e63946] hover:bg-[#d62839] rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-sm">
                {deleting && <Loader2 size={15} className="animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}