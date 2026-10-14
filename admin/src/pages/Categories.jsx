import React, { useEffect, useState } from "react"
import { toast } from "react-toastify"
import {
  FolderTree,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Search,
  Tag,
  Layers,
  Sparkles,
  Loader2,
  AlertTriangle
} from "lucide-react"

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"

export default function Categories({ token }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Add category modal / form state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newSubCategoriesInput, setNewSubCategoriesInput] = useState("")
  const [creating, setCreating] = useState(false)

  // Edit category modal
  const [editCategory, setEditCategory] = useState(null)
  const [editCategoryName, setEditCategoryName] = useState("")
  const [updating, setUpdating] = useState(false)

  // Quick subcategory add state per category ID: { [catId]: string }
  const [quickSubInputs, setQuickSubInputs] = useState({})
  const [addingSubId, setAddingSubId] = useState(null)

  // Delete modal state
  const [deleteCatModal, setDeleteCatModal] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/category/list`)
      const data = await res.json()
      if (data.success) {
        setCategories(data.categories || [])
      } else {
        toast.error(data.message || "Failed to load categories")
      }
    } catch (err) {
      console.error(err)
      toast.error("Unable to contact server")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Add new category
  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCategoryName.trim()) {
      return toast.error("Category name is required")
    }

    setCreating(true)
    try {
      const subs = newSubCategoriesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)

      const res = await fetch(`${backendUrl}/api/category/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token,
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          subCategories: subs,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Category "${newCategoryName}" added successfully!`)
        setShowAddModal(false)
        setNewCategoryName("")
        setNewSubCategoriesInput("")
        fetchCategories()
      } else {
        toast.error(data.message || "Failed to add category")
      }
    } catch {
      toast.error("Server error while creating category")
    } finally {
      setCreating(false)
    }
  }

  // Update category name
  const handleUpdateCategory = async (e) => {
    e.preventDefault()
    if (!editCategoryName.trim()) {
      return toast.error("Category name cannot be empty")
    }

    setUpdating(true)
    try {
      const res = await fetch(`${backendUrl}/api/category/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token,
        },
        body: JSON.stringify({
          id: editCategory._id,
          name: editCategoryName.trim(),
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success("Category updated!")
        setEditCategory(null)
        setEditCategoryName("")
        fetchCategories()
      } else {
        toast.error(data.message || "Failed to update category")
      }
    } catch {
      toast.error("Server error")
    } finally {
      setUpdating(false)
    }
  }

  // Delete category
  const handleConfirmDelete = async () => {
    if (!deleteCatModal) return
    setDeleting(true)
    try {
      const res = await fetch(`${backendUrl}/api/category/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token,
        },
        body: JSON.stringify({ id: deleteCatModal._id }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Category "${deleteCatModal.name}" deleted!`)
        setDeleteCatModal(null)
        fetchCategories()
      } else {
        toast.error(data.message || "Failed to delete category")
      }
    } catch {
      toast.error("Server error")
    } finally {
      setDeleting(false)
    }
  }

  // Quick add subcategory
  const handleQuickAddSub = async (catId) => {
    const subName = (quickSubInputs[catId] || "").trim()
    if (!subName) return

    setAddingSubId(catId)
    try {
      const res = await fetch(`${backendUrl}/api/category/subcategory/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token,
        },
        body: JSON.stringify({
          id: catId,
          subCategory: subName,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Subcategory "${subName}" added!`)
        setQuickSubInputs((prev) => ({ ...prev, [catId]: "" }))
        fetchCategories()
      } else {
        toast.error(data.message || "Failed to add subcategory")
      }
    } catch {
      toast.error("Server error")
    } finally {
      setAddingSubId(null)
    }
  }

  // Remove subcategory
  const handleRemoveSub = async (catId, subName) => {
    try {
      const res = await fetch(`${backendUrl}/api/category/subcategory/remove`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token,
        },
        body: JSON.stringify({
          id: catId,
          subCategory: subName,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Subcategory "${subName}" removed!`)
        fetchCategories()
      } else {
        toast.error(data.message || "Failed to remove subcategory")
      }
    } catch {
      toast.error("Server error")
    }
  }

  // Seed default starter categories if list is empty
  const handleSeedDefaults = async () => {
    const defaults = [
      { name: "Sneakers", subCategories: ["Running", "Lifestyle", "Basketball", "Skate", "Retro"] },
      { name: "Clothing", subCategories: ["T-Shirts", "Sweats & Hoodies", "Pants", "Jackets"] },
      { name: "Accessories", subCategories: ["Caps", "Socks", "Bags & Backpacks", "Laces & Care"] },
    ]

    setCreating(true)
    try {
      for (const item of defaults) {
        await fetch(`${backendUrl}/api/category/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json", token },
          body: JSON.stringify(item),
        })
      }
      toast.success("Default categories initialized successfully!")
      fetchCategories()
    } catch {
      toast.error("Error initializing default categories")
    } finally {
      setCreating(false)
    }
  }

  // Filtered categories by search
  const filteredCategories = categories.filter((c) => {
    const q = search.toLowerCase()
    const matchesName = c.name.toLowerCase().includes(q)
    const matchesSub = c.subCategories?.some((s) => s.toLowerCase().includes(q))
    return matchesName || matchesSub
  })

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#e63946]/10 flex items-center justify-center text-[#e63946]">
              <FolderTree size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1f1f23]">Category Management</h1>
              <p className="text-gray-500 text-sm">
                Organize your parent categories and subcategories for products
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#e63946] hover:bg-[#d62839] text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-colors cursor-pointer"
          >
            <Plus size={18} />
            <span>New Category</span>
          </button>
        </div>
      </div>

      {/* Stats & Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search a category or subcategory..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 self-end sm:self-auto">
          <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg">
            <Layers size={14} className="text-[#e63946]" />
            {categories.length} Category{categories.length > 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg">
            <Tag size={14} className="text-gray-600" />
            {categories.reduce((acc, c) => acc + (c.subCategories?.length || 0), 0)} Subcategories
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <Loader2 size={36} className="animate-spin text-[#e63946]" />
          <p className="text-sm font-medium">Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-gray-300 max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#e63946] flex items-center justify-center mx-auto">
            <FolderTree size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">No categories found</h3>
            <p className="text-sm text-gray-500 mt-1">
              Start by creating your first category or generate default templates in one click.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#e63946] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#d62839] transition-colors"
            >
              <Plus size={16} />
              <span>Create a Category</span>
            </button>
            <button
              onClick={handleSeedDefaults}
              disabled={creating}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              <Sparkles size={16} className="text-amber-500" />
              <span>Generate Default Categories</span>
            </button>
          </div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-black/5">
          <p className="text-gray-500 text-sm">No results matching "{search}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCategories.map((category) => {
            const subs = category.subCategories || []
            const currentSubInput = quickSubInputs[category._id] || ""

            return (
              <div
                key={category._id}
                className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Category Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
                        <FolderTree size={16} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-base truncate" title={category.name}>
                          {category.name}
                        </h3>
                        <p className="text-[11px] font-medium text-gray-400">
                          {subs.length} subcategor{subs.length > 1 ? "ies" : "y"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditCategory(category)
                          setEditCategoryName(category.name)
                        }}
                        title="Edit category"
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteCatModal(category)}
                        title="Delete category"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories tags */}
                  <div className="mb-4">
                    <p className="text-[11px] uppercase font-bold text-gray-400 tracking-wider mb-2">
                      Subcategories
                    </p>

                    {subs.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No subcategory linked</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {subs.map((sub, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold group hover:bg-red-50 hover:text-red-700 transition-colors"
                          >
                            <span>{sub}</span>
                            <button
                              onClick={() => handleRemoveSub(category._id, sub)}
                              title={`Supprimer "${sub}"`}
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

                {/* Quick Add Subcategory Input */}
                <div className="pt-3 border-t border-gray-100">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleQuickAddSub(category._id)
                    }}
                    className="flex gap-1.5"
                  >
                    <input
                      type="text"
                      value={currentSubInput}
                      onChange={(e) =>
                        setQuickSubInputs((prev) => ({
                          ...prev,
                          [category._id]: e.target.value,
                        }))
                      }
                      placeholder="+ Add subcategory..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]"
                    />
                    <button
                      type="submit"
                      disabled={!currentSubInput.trim() || addingSubId === category._id}
                      className="px-3 py-1.5 bg-[#1f1f23] text-white hover:bg-black rounded-xl text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center shrink-0"
                    >
                      {addingSubId === category._id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Plus size={13} />
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal: Add New Category */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-black/5 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#e63946]/10 flex items-center justify-center text-[#e63946]">
                  <FolderTree size={18} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">New Category</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Sneakers, Clothing, Accessories..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Initial Subcategories (optional)
                </label>
                <input
                  type="text"
                  value={newSubCategoriesInput}
                  onChange={(e) => setNewSubCategoriesInput(e.target.value)}
                  placeholder="Separate with commas: Running, Lifestyle, Basketball"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  You can also add more at any time after creation.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#e63946] hover:bg-[#d62839] rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {creating && <Loader2 size={15} className="animate-spin" />}
                  <span>Create Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Category */}
      {editCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setEditCategory(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-black/5 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                  <Pencil size={18} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Edit Category</h2>
              </div>
              <button
                onClick={() => setEditCategory(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  New Name *
                </label>
                <input
                  type="text"
                  required
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditCategory(null)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#1f1f23] hover:bg-black rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {updating && <Loader2 size={15} className="animate-spin" />}
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {deleteCatModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setDeleteCatModal(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-black/5 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-[#e63946]/10 flex items-center justify-center">
                <AlertTriangle size={20} className="text-[#e63946]" />
              </div>
              <button
                onClick={() => setDeleteCatModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete this category?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Category <span className="font-semibold text-gray-800">"{deleteCatModal.name}"</span> and all its subcategories will be permanently deleted.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteCatModal(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#e63946] hover:bg-[#d62839] rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {deleting && <Loader2 size={15} className="animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
