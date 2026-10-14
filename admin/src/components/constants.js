export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

// Business-logic constants — never change at runtime
export const CATEGORIES = ['Women', 'Men', 'Kids']

// ──────────────────────────────────────────────────────────────────────────────
// Fallback defaults used by useProductConfig when the backend is unreachable
// or when no products exist yet.  Do NOT import these directly in pages —
// use useProductConfig() instead.
// ──────────────────────────────────────────────────────────────────────────────
export const BRANDS = ['Adidas', 'Nike', 'Puma', 'New Balance', 'Reebok', 'Jordan', 'Vans', 'Converse']
export const SIZES = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL',
  '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'
]
export const COLORS = [
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'White', hex: '#f5f5f5' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Grey', hex: '#9ca3af' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Brown', hex: '#a16207' },
]