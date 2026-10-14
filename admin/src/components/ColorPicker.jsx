import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { card, sectionTitle, label, field, chip } from './styles'

const ColorPicker = ({ colors, selected, onToggle, onAdd }) => {
  const [hex, setHex] = useState('#e63946')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) return setError('Give a name to the color.')
    if (trimmed.length > 20) return setError('Name is too long (20 characters max).')
    if (colors.some((c) => c.name.toLowerCase() === trimmed.toLowerCase()))
      return setError('This color already exists.')

    onAdd({ name: trimmed, hex })
    setName('')
    setError('')
  }

  return (
    <div className={card}>
      <h3 className={sectionTitle}>Available Colors <span className="text-gray-400 font-normal text-xs">(optional)</span></h3>

      {/* Color list */}
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color.name}
            type="button"
            onClick={() => onToggle(color.name)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${chip(
              selected.includes(color.name)
            )}`}
          >
            <span
              className="w-3.5 h-3.5 rounded-full border border-black/20"
              style={{ background: color.hex }}
            />
            {color.name}
          </button>
        ))}
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-gray-500 mt-3 font-medium">Selected: {selected.join(', ')}</p>
      )}

      {/* Add custom color */}
      <div className="mt-5 pt-5 border-t border-black/5">
        <label className={label}>Add a custom color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className="w-12 h-12 rounded-xl border border-gray-300 cursor-pointer bg-white p-1 flex-shrink-0"
            aria-label="Pick a color"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submit()
              }
            }}
            placeholder="Color name (e.g. Navy)"
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

export default ColorPicker