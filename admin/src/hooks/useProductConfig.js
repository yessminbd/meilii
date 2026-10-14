import { useState, useEffect } from 'react'
import { BACKEND_URL, BRANDS, SIZES, COLORS } from '../components/constants'

/**
 * Loads dynamic brands, sizes, and colors from the backend /api/product/config
 * endpoint (which aggregates values from existing products).
 *
 * Falls back to the static defaults in constants.js if the request fails
 * (e.g. no products yet, or network error).
 *
 * Supports adding custom entries that are merged on top of the server list.
 */
export const useProductConfig = () => {
  const [serverBrands, setServerBrands] = useState(BRANDS)
  const [serverSizes, setServerSizes] = useState(SIZES)
  const [serverColors, setServerColors] = useState(COLORS)
  const [loading, setLoading] = useState(true)

  // Extra entries added during the session (not persisted to backend)
  const [customBrands, setCustomBrands] = useState([])
  const [customSizes, setCustomSizes] = useState([])
  const [customColors, setCustomColors] = useState([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${BACKEND_URL}/api/product/config`)
        const data = await res.json()
        if (data.success) {
          // Brands: server returns strings; fill gaps with BRANDS defaults
          const serverBrandSet = new Set(data.brands)
          const mergedBrands = [
            ...data.brands,
            ...BRANDS.filter((b) => !serverBrandSet.has(b)),
          ]
          setServerBrands(mergedBrands)

          // Sizes: server returns strings; merge with default SIZES list
          const serverSizeSet = new Set(data.sizes)
          const textOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', 'TU', 'UNIQUE']
          const mergedSizes = [
            ...SIZES.filter((s) => !serverSizeSet.has(s)),
            ...data.sizes,
          ].sort((a, b) => {
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
          setServerSizes(mergedSizes)

          // Colors: server returns only names (strings). Build COLORS-like objects.
          const defaultColorMap = Object.fromEntries(
            COLORS.map((c) => [c.name.toLowerCase(), c])
          )
          const serverColorObjects = data.colors.map((name) =>
            defaultColorMap[name.toLowerCase()] || { name, hex: '#9ca3af' }
          )
          const serverColorNames = new Set(data.colors.map((n) => n.toLowerCase()))
          const extraDefaults = COLORS.filter(
            (c) => !serverColorNames.has(c.name.toLowerCase())
          )
          setServerColors([...serverColorObjects, ...extraDefaults])
        }
      } catch {
        // Keep static defaults on error
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Deduplicated merge of server + custom entries
  const brandSet = new Set(serverBrands)
  const brands = [
    ...serverBrands,
    ...customBrands.filter((b) => !brandSet.has(b)),
  ]

  const sizeSet = new Set(serverSizes)
  const sizes = [
    ...serverSizes,
    ...customSizes.filter((s) => !sizeSet.has(s)),
  ].sort((a, b) => parseFloat(a) - parseFloat(b))

  const colorNameSet = new Set(serverColors.map((c) => c.name.toLowerCase()))
  const colors = [
    ...serverColors,
    ...customColors.filter((c) => !colorNameSet.has(c.name.toLowerCase())),
  ]

  const addBrand = (name) => {
    if (!brandSet.has(name)) setCustomBrands((prev) => [...prev, name])
  }
  const addSize = (size) => {
    if (!sizeSet.has(size)) setCustomSizes((prev) => [...prev, size])
  }
  const addColor = (color) => {
    if (!colorNameSet.has(color.name.toLowerCase()))
      setCustomColors((prev) => [...prev, color])
  }

  return { brands, sizes, colors, addBrand, addSize, addColor, loading }
}
