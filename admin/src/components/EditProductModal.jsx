import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { X, Save, Loader2, Trash2, Plus, Star } from 'lucide-react'

import { useLocalList } from '../hooks/useLocalList'
import { BACKEND_URL, SIZES, COLORS } from './constants'
import { card, sectionTitle, label, field } from './styles'
import ImageUpload from './ImageUpload'
import CategorySubCategorySelector from './CategorySubCategorySelector'
import ColorPicker from './ColorPicker'
import SizeSelector from './SizeSelector'

const EditProductModal = ({ product, token, onClose, onUpdated }) => {
  const [name, setName] = useState(product?.name || '')
  const [description, setDescription] = useState(product?.description || '')
  const [price, setPrice] = useState(product?.price || '')
  const [category, setCategory] = useState(
    Array.isArray(product?.category)
      ? product.category[0] || ''
      : product?.category || ''
  )
  const [subCategory, setSubCategory] = useState(product?.subCategory || '')
  const [popular, setPopular] = useState(Boolean(product?.popular))

  const [selectedSizes, setSelectedSizes] = useState(product?.sizes || [])
  const [selectedColors, setSelectedColors] = useState(product?.colors || [])
  const [existingImages, setExistingImages] = useState(product?.image || [])
  const [newImages, setNewImages] = useState([null, null, null, null])
  const [loading, setLoading] = useState(false)

  // Lists (defaults + custom saved in localStorage)
  const [sizes, addSize] = useLocalList('customSizes', SIZES)
  const [colors, addColor] = useLocalList('customColors', COLORS, (c) => c.name.toLowerCase())

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const toggle = (setter) => (item) =>
    setter((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]))

  const setNewImageAt = (index) => (file) =>
    setNewImages((prev) => prev.map((img, i) => (i === index ? file : img)))

  const removeExistingImage = (imgUrl) => {
    setExistingImages((prev) => prev.filter((url) => url !== imgUrl))
  }

  const handleAddColor = (color) => {
    addColor(color)
    setSelectedColors((prev) => [...prev, color.name])
    toast.success(`Color "${color.name}" added.`)
  }

  const handleAddSize = (size) => {
    addSize(size)
    setSelectedSizes((prev) => [...prev, size])
    toast.success(`Size ${size} added.`)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!category) return toast.error('Please select a category.')
    if (!subCategory) return toast.error('Please select a subcategory.')
    if (existingImages.length === 0 && !newImages.some(Boolean)) {
      return toast.error('Product must have at least one image.')
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('id', product._id)
      formData.append('name', name)
      formData.append('description', description)
      formData.append('price', price)
      formData.append('category', JSON.stringify([category]))
      formData.append('subCategory', subCategory)
      formData.append('sizes', JSON.stringify(selectedSizes))
      formData.append('colors', JSON.stringify(selectedColors))
      formData.append('popular', popular ? 'true' : 'false')
      formData.append('existingImages', JSON.stringify(existingImages))

      newImages.forEach((img, i) => {
        if (img) formData.append(`image${i + 1}`, img)
      })

      const { data } = await axios.post(`${BACKEND_URL}/api/product/update`, formData, {
        headers: { token },
      })

      if (data.success) {
        toast.success('Product updated successfully!')
        if (onUpdated) onUpdated(data.product)
        onClose()
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error('Failed to update product.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-black/5 my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/5 mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-[#1f1f23] tracking-tight">Edit Product</h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Updating <span className="font-bold text-gray-700">{product.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images Section */}
          <div className={card}>
            <h3 className={sectionTitle}>Product Images</h3>
            
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-600 mb-2">Current Photos</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {existingImages.map((url, i) => (
                    <div key={i} className="relative group aspect-square rounded-2xl overflow-hidden border border-black/10 bg-[#efefef]">
                      <img src={url} alt={`Existing ${i + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeExistingImage(url)}
                          className="w-8 h-8 rounded-full bg-white text-[#e63946] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-md"
                          title="Remove image"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add new photos */}
            <div>
              <p className="text-xs font-bold text-gray-600 mb-2">Add New Photos</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {newImages.map((img, i) => (
                  <ImageUpload
                    key={i}
                    img={img}
                    setImg={setNewImageAt(i)}
                    text={`New Photo ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className={`${card} space-y-4`}>
            <h3 className={sectionTitle}>Product Details</h3>
            <div>
              <label className={label}>Product Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={field}
              />
            </div>
            <div>
              <label className={label}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                className={`${field} resize-none`}
              />
            </div>
            <div>
              <label className={label}>Price (TND)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0"
                className={field}
              />
            </div>
          </div>

          {/* Category & Brand */}
          {/* Category & SubCategory */}
          <div className={card}>
            <h3 className={sectionTitle}>Category & Subcategory</h3>
            <CategorySubCategorySelector
              token={token}
              selectedCategory={category}
              onCategoryChange={setCategory}
              subCategory={subCategory}
              onSubCategoryChange={setSubCategory}
            />
          </div>

          {/* Colors */}
          <ColorPicker
            colors={colors}
            selected={selectedColors}
            onToggle={toggle(setSelectedColors)}
            onAdd={handleAddColor}
          />

          {/* Sizes */}
          <SizeSelector
            sizes={sizes}
            selected={selectedSizes}
            onToggle={toggle(setSelectedSizes)}
            onAdd={handleAddSize}
          />

          {/* Popular toggle */}
          <div className={`${card} flex items-center justify-between gap-4`}>
            <div>
              <p className="font-bold text-[#1f1f23] text-sm">Mark as Popular</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Show this product in the Popular section on the frontend.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={popular}
              onClick={() => setPopular(!popular)}
              className={`relative flex-shrink-0 w-12 h-7 rounded-full transition-colors duration-300 cursor-pointer ${
                popular ? 'bg-[#e63946]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
                  popular ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#1f1f23] text-white font-bold py-3.5 rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 text-sm shadow-md disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={16} /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProductModal
