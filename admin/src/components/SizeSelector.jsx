import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { card, sectionTitle, label, field, chip } from './styles'

const MIN_SIZE = 20
const MAX_SIZE = 60

const SizeSelector = ({ sizes, selected, onToggle, onAdd }) => {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  // Sort sizes: numbers numerically, text sizes by standard fashion order
  const textOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', 'TU', 'UNIQUE']
  const sorted = [...sizes].sort((a, b) => {
    const numA = parseFloat(a)
    const numB = parseFloat(b)
    const isNumA = !isNaN(numA) && String(numA) === String(a).trim()
    const isNumB = !isNaN(numB) && String(numB) === String(b).trim()

    if (isNumA && isNumB) return numA - numB
    if (isNumA && !isNumB) return 1
    if (!isNumA && isNumB) return -1

    const idxA = textOrder.indexOf(String(a).toUpperCase())
    const idxB = textOrder.indexOf(String(b).toUpperCase())
    if (idxA !== -1 && idxB !== -1) return idxA - idxB
    if (idxA !== -1) return -1
    if (idxB !== -1) return 1
    return String(a).localeCompare(String(b))
  })

  const submit = () => {
    const size = value.trim()
    if (!size) return setError('Please enter a size.')

    // Check if duplicate (case-insensitive)
    if (sizes.some((s) => String(s).toLowerCase() === size.toLowerCase())) {
      return setError('This size already exists.')
    }

    onAdd(size.toUpperCase() === size.toLowerCase() ? size : size.toUpperCase())
    setValue('')
    setError('')
  }

  return (
    <div className={card}>
      <h3 className={sectionTitle}>
        Available Sizes <span className="text-gray-400 font-normal text-xs">(optional)</span>
      </h3>

      <div className="flex flex-wrap gap-2">
        {sorted.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => onToggle(size)}
            className={`min-w-[3rem] h-12 px-2 rounded-xl text-sm font-bold border transition-all duration-200 ${chip(
              selected.includes(size)
            )}`}
          >
            {size}
          </button>
        ))}
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-gray-500 mt-3 font-medium">Selected: {selected.join(', ')}</p>
      )}

      {/* Quick clothing size presets */}
      <div className="mt-4 pt-3 border-t border-black/5">
        <p className="text-xs font-semibold text-gray-500 mb-2">Quick clothing sizes:</p>
        <div className="flex flex-wrap gap-1.5">
          {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map((quickSize) => (
            <button
              key={quickSize}
              type="button"
              onClick={() => {
                if (!sizes.includes(quickSize)) onAdd(quickSize)
                onToggle(quickSize)
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                selected.includes(quickSize)
                  ? 'bg-black text-white border-black shadow-xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-black/50 hover:bg-black/5'
              }`}
            >
              {quickSize}
            </button>
          ))}
        </div>
      </div>

      {/* Add custom size */}
      <div className="mt-4 pt-4 border-t border-black/5">
        <label className={label}>Add custom size or shoe size</label>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submit()
              }
            }}
            placeholder="e.g. XL, M, 42.5, S..."
            className={`${field} ${error ? 'border-red-400 focus:border-red-500' : ''}`}
          />
          <button
            type="button"
            onClick={submit}
            className="flex items-center gap-1.5 px-4 h-12 rounded-xl bg-[#1f1f23] text-white text-sm font-bold hover:bg-black transition-colors flex-shrink-0"
          >
            <Plus size={15} /> Add
          </button>
        </div>
        {error && <p className="text-xs text-red-500 font-medium mt-1.5">{error}</p>}
      </div>
    </div>
  )
}

export default SizeSelector