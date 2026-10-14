import React, { useState, useEffect } from 'react'
import { Plus, FolderTree, Tag, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { label, field } from './styles'
import { BACKEND_URL } from './constants'
import { toast } from 'react-toastify'

const CategorySubCategorySelector = ({
  token,
  selectedCategory,
  onCategoryChange,
  subCategory,
  onSubCategoryChange,
}) => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddSub, setShowAddSub] = useState(false)
  const [newSubName, setNewSubName] = useState('')

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/category/list`)
      const data = await res.json()
      if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories)
        // If no category is selected yet and we have categories, select the first
        if (!selectedCategory && data.categories.length > 0) {
          const firstCat = data.categories[0]
          onCategoryChange(firstCat.name)
          if (firstCat.subCategories?.length > 0 && !subCategory) {
            onSubCategoryChange(firstCat.subCategories[0])
          }
        }
      }
    } catch (err) {
      console.error('Failed to load categories', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Find the currently active category object
  const currentCategoryObj = categories.find(
    (c) => c.name.toLowerCase() === (selectedCategory || '').toLowerCase()
  )

  const availableSubs = currentCategoryObj?.subCategories || []

  // When category changes, if subCategory is not in the new availableSubs, update it
  const handleCategorySelect = (catName) => {
    onCategoryChange(catName)
    const targetCat = categories.find((c) => c.name === catName)
    if (targetCat?.subCategories?.length > 0) {
      onSubCategoryChange(targetCat.subCategories[0])
    } else {
      onSubCategoryChange('')
    }
  }

  const handleAddSubCategory = async (e) => {
    e.preventDefault()
    if (!newSubName.trim() || !currentCategoryObj) return

    try {
      const res = await fetch(`${BACKEND_URL}/api/category/subcategory/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token,
        },
        body: JSON.stringify({
          id: currentCategoryObj._id,
          subCategory: newSubName.trim(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Sous-catégorie "${newSubName.trim()}" ajoutée !`)
        onSubCategoryChange(newSubName.trim())
        setNewSubName('')
        setShowAddSub(false)
        fetchCategories()
      } else {
        toast.error(data.message || 'Erreur lors de l\'ajout')
      }
    } catch {
      toast.error('Erreur serveur')
    }
  }

  return (
    <div className="space-y-4">
      {/* Category Selection */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={`${label} !mb-0 flex items-center gap-1.5`}>
            <FolderTree size={15} className="text-[#e63946]" />
            Category *
          </label>
          <Link
            to="/categories"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs font-bold text-[#e63946] hover:underline"
          >
            <Plus size={13} /> Manage Categories <ExternalLink size={11} />
          </Link>
        </div>

        {loading ? (
          <div className="text-xs text-gray-400 py-2">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
            <span>No category configured yet.</span>
            <Link
              to="/categories"
              className="font-bold underline text-[#e63946]"
            >
              Create Categories
            </Link>
          </div>
        ) : (
          <select
            value={selectedCategory || ''}
            onChange={(e) => handleCategorySelect(e.target.value)}
            className={field}
            required
          >
            <option value="" disabled>Select a category</option>
            {categories.map((c) => (
              <option key={c._id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* SubCategory Selection */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={`${label} !mb-0 flex items-center gap-1.5`}>
            <Tag size={15} className="text-[#e63946]" />
            Subcategory *
          </label>
          {currentCategoryObj && (
            <button
              type="button"
              onClick={() => setShowAddSub(!showAddSub)}
              className="flex items-center gap-1 text-xs font-bold text-[#e63946] hover:underline cursor-pointer"
            >
              <Plus size={13} /> {showAddSub ? 'Cancel' : '+ New Subcategory'}
            </button>
          )}
        </div>

        {showAddSub && (
          <div className="mb-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex gap-2">
            <input
              type="text"
              value={newSubName}
              onChange={(e) => setNewSubName(e.target.value)}
              placeholder={`Add to "${currentCategoryObj?.name}"...`}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:border-[#e63946]"
            />
            <button
              type="button"
              onClick={handleAddSubCategory}
              disabled={!newSubName.trim()}
              className="px-3 py-1.5 bg-[#e63946] text-white rounded-lg text-xs font-bold hover:bg-[#d62839] disabled:opacity-50"
            >
              Add
            </button>
          </div>
        )}

        {availableSubs.length === 0 ? (
          <div className="space-y-1">
            <input
              type="text"
              value={subCategory || ''}
              onChange={(e) => onSubCategoryChange(e.target.value)}
              placeholder="e.g. Running, Lifestyle..."
              className={field}
              required
            />
            <p className="text-[11px] text-gray-400">
              No saved subcategories for {selectedCategory}. Type one directly or add one via the button above.
            </p>
          </div>
        ) : (
          <select
            value={subCategory || ''}
            onChange={(e) => onSubCategoryChange(e.target.value)}
            className={field}
            required
          >
            <option value="" disabled>Select a subcategory</option>
            {availableSubs.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}

export default CategorySubCategorySelector
