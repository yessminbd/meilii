import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// Helper to format date
export const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A'
  const d = new Date(timestamp)
  if (isNaN(d.getTime())) return 'N/A'
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatDateOnly = (timestamp) => {
  if (!timestamp) return 'N/A'
  const d = new Date(timestamp)
  if (isNaN(d.getTime())) return 'N/A'
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// Helper to calculate original price of an order (before discount or base catalog items sum)
export const calculateOrderOriginalPrice = (order) => {
  if (Array.isArray(order?.items) && order.items.length > 0) {
    const sum = order.items.reduce((acc, item) => {
      const p = Number(item.price) || 0
      const q = Number(item.quantity) || 1
      return acc + p * q
    }, 0)
    if (sum > 0) return sum
  }
  const discount = Number(order?.discount) || 0
  const amount = Number(order?.amount) || 0
  return amount + discount
}

// -------------------------------------------------------------
// EXCEL EXPORT HELPERS
// -------------------------------------------------------------

export const exportOrdersToExcel = (orders, filterSummary = {}) => {
  const data = orders.map((order, index) => {
    const customerName = order.address
      ? `${order.address.firstName || ''} ${order.address.lastName || ''}`.trim() || 'Customer'
      : 'Unknown'
    const itemsDescription = Array.isArray(order.items)
      ? order.items
          .map(
            (i) =>
              `${i.name || 'Product'} (Size: ${i.size || '-'}, Qty: ${i.quantity || 1}, Price: ${i.price || 0} TND)`
          )
          .join(' | ')
      : 'No items'
    const totalQty = Array.isArray(order.items)
      ? order.items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0)
      : 0
    const originalPrice = calculateOrderOriginalPrice(order)
    const amount = Number(order.amount) || 0
    const advance = Number(order.advanceAmount) || 0
    const remaining = Math.max(0, amount - advance)

    return {
      '#': index + 1,
      'Order ID': order._id || 'N/A',
      'Date': formatDate(order.date),
      'Customer': customerName,
      'Phone': order.address?.phone || 'N/A',
      'Email': order.address?.email || 'N/A',
      'City / Address': order.address
        ? `${order.address.city || ''}, ${order.address.street || ''} (${order.address.zipcode || ''})`.trim()
        : 'N/A',
      'Ordered Items': itemsDescription,
      'Total Items': totalQty,
      'Original Price (TND)': originalPrice,
      'Total Amount (TND)': amount,
      'Advance (TND)': advance,
      'Advance Paid': order.advancePaid ? 'Yes' : 'No',
      'Remaining Due (TND)': remaining,
      'Payment Method': order.paymentMethod || 'N/A',
      'Payment Status': order.payment ? 'Paid' : 'Pending',
      'Order Status': order.status || 'Pending',
    }
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },   // #
    { wch: 26 },  // ID
    { wch: 18 },  // Date
    { wch: 22 },  // Customer
    { wch: 16 },  // Phone
    { wch: 24 },  // Email
    { wch: 32 },  // Address
    { wch: 45 },  // Items
    { wch: 14 },  // Qty
    { wch: 18 },  // Original Price
    { wch: 18 },  // Amount
    { wch: 16 },  // Advance
    { wch: 14 },  // Advance Paid
    { wch: 18 },  // Remaining Due
    { wch: 16 },  // Method
    { wch: 16 },  // Payment status
    { wch: 18 },  // Status
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Orders')

  const totalAmount = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
  const totalAdvances = orders.reduce((sum, o) => sum + (Number(o.advanceAmount) || 0), 0)
  const metaData = [
    { Property: 'Generated on', Value: formatDate(Date.now()) },
    { Property: 'Total Orders', Value: orders.length },
    { Property: 'Total Revenue', Value: `${totalAmount.toLocaleString('en-US')} TND` },
    { Property: 'Total Advances', Value: `${totalAdvances.toLocaleString('en-US')} TND` },
    { Property: 'Status Filter', Value: filterSummary.status || 'All' },
    { Property: 'Period Filter', Value: filterSummary.period || 'All' },
    { Property: 'Payment Method Filter', Value: filterSummary.paymentMethod || 'All' },
  ]
  const wsMeta = XLSX.utils.json_to_sheet(metaData)
  wsMeta['!cols'] = [{ wch: 25 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Filters Summary')

  const dateStr = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `Meili_Orders_${dateStr}.xlsx`)
}

export const exportProductsToExcel = (products, filterSummary = {}) => {
  const data = products.map((product, index) => {
    const cats = Array.isArray(product.category)
      ? product.category.join(', ')
      : product.category || 'N/A'
    const sizes = Array.isArray(product.sizes)
      ? product.sizes.join(', ')
      : product.sizes || 'N/A'
    const colors = Array.isArray(product.colors)
      ? product.colors.map((c) => (typeof c === 'object' ? c.name : c)).join(', ')
      : 'N/A'

    return {
      '#': index + 1,
      'Product ID': product._id || 'N/A',
      'Product Name': product.name || 'N/A',
      'Brand': product.subCategory || 'N/A',
      'Categories': cats,
      'Price (TND)': Number(product.price) || 0,
      'Sizes': sizes,
      'Colors': colors,
      'Popular': product.popular ? 'Yes' : 'No',
      'Date Added': formatDateOnly(product.date),
      'Description': (product.description || '').slice(0, 100),
    }
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)

  ws['!cols'] = [
    { wch: 5 },   // #
    { wch: 26 },  // ID
    { wch: 30 },  // Name
    { wch: 18 },  // Brand
    { wch: 22 },  // Categories
    { wch: 14 },  // Price
    { wch: 24 },  // Sizes
    { wch: 24 },  // Colors
    { wch: 12 },  // Popular
    { wch: 15 },  // Date
    { wch: 45 },  // Description
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Products')

  const avgPrice = products.length
    ? Math.round(products.reduce((s, p) => s + (Number(p.price) || 0), 0) / products.length)
    : 0
  const metaData = [
    { Property: 'Generated on', Value: formatDate(Date.now()) },
    { Property: 'Total Products', Value: products.length },
    { Property: 'Average Price', Value: `${avgPrice} TND` },
    { Property: 'Brand Filter', Value: filterSummary.brand || 'All' },
    { Property: 'Category Filter', Value: filterSummary.category || 'All' },
  ]
  const wsMeta = XLSX.utils.json_to_sheet(metaData)
  wsMeta['!cols'] = [{ wch: 25 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Filters Summary')

  const dateStr = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `Meili_Products_${dateStr}.xlsx`)
}

export const exportStatsReportToExcel = (statsData, filterSummary = {}) => {
  const wb = XLSX.utils.book_new()

  // 1. KPI Sheet
  const kpiData = [
    { Metric: 'Report Date', Value: formatDate(Date.now()) },
    { Metric: 'Analyzed Period', Value: filterSummary.Period || 'All' },
    { Metric: 'Total Revenue', Value: `${(statsData.revenue || 0).toLocaleString('en-US')} TND` },
    { Metric: 'Total Orders', Value: statsData.totalOrders || 0 },
    { Metric: 'Average Order Value', Value: `${(statsData.avgBasket || 0).toFixed(2)} TND` },
    { Metric: 'Items Sold (Total)', Value: statsData.totalItemsSold || 0 },
    { Metric: 'Delivered Orders', Value: statsData.deliveredOrders || 0 },
    { Metric: 'Delivery Rate', Value: `${statsData.deliveryRate || 0}%` },
  ]
  const wsKpi = XLSX.utils.json_to_sheet(kpiData)
  wsKpi['!cols'] = [{ wch: 30 }, { wch: 25 }]
  XLSX.utils.book_append_sheet(wb, wsKpi, 'Sales KPIs')

  // 2. Status Breakdown
  const statusRows = (statsData.statusBreakdown || []).map((s) => ({
    Status: s.status,
    'Orders Count': s.count,
    'Percentage (%)': `${s.percentage}%`,
    'Estimated Revenue (TND)': s.amount || 0,
  }))
  const wsStatus = XLSX.utils.json_to_sheet(statusRows)
  wsStatus['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 22 }]
  XLSX.utils.book_append_sheet(wb, wsStatus, 'Status Breakdown')

  // 3. Top Products Sold
  const topRows = (statsData.topProducts || []).map((p, idx) => ({
    Rank: idx + 1,
    'Sneaker Name': p.name,
    'Units Sold': p.qty,
    'Generated Revenue (TND)': p.totalRevenue,
  }))
  const wsTop = XLSX.utils.json_to_sheet(topRows)
  wsTop['!cols'] = [{ wch: 8 }, { wch: 35 }, { wch: 18 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, wsTop, 'Top Sneakers')

  const dateStr = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `Meili_Analytics_Report_${dateStr}.xlsx`)
}

// -------------------------------------------------------------
// PDF EXPORT HELPERS (Styled with Měilì Branding)
// -------------------------------------------------------------

const addPdfHeader = (doc, title, subtitle, filterSummary = {}) => {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Top banner
  doc.setFillColor(31, 31, 35) // #1f1f23 Dark Anthracite
  doc.rect(0, 0, pageWidth, 28, 'F')

  // Red accent line
  doc.setFillColor(230, 57, 70) // #e63946 Red
  doc.rect(0, 28, pageWidth, 3, 'F')

  // Brand Name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text('MĚILÌ', 14, 15)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(200, 200, 205)
  doc.text('ADMINISTRATION & ANALYTICS PANEL', 14, 22)

  // Date on the right
  doc.setFontSize(8)
  doc.setTextColor(230, 230, 230)
  const dateText = `Exported on: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
  const dateWidth = doc.getTextWidth(dateText)
  doc.text(dateText, pageWidth - dateWidth - 14, 18)

  // Title section
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(31, 31, 35)
  doc.text(title, 14, 40)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 110)
  doc.text(subtitle, 14, 46)

  // Filters summary tag
  const filterEntries = Object.entries(filterSummary).filter(([, v]) => Boolean(v))
  if (filterEntries.length > 0) {
    const filterText = 'Active Filters: ' + filterEntries.map(([k, v]) => `${k}: ${v}`).join(' | ')
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 130)
    doc.text(filterText, 14, 52)
    return 56
  }

  return 50
}

const addPdfFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.setDrawColor(220, 220, 225)
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12)

    doc.text('Měilì - Confidential Internal Analytics Report', 14, pageHeight - 7)
    const pageStr = `Page ${i} of ${pageCount}`
    const pWidth = doc.getTextWidth(pageStr)
    doc.text(pageStr, pageWidth - pWidth - 14, pageHeight - 7)
  }
}

export const exportOrdersToPdf = (orders, filterSummary = {}, options = {}) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const startY = addPdfHeader(
    doc,
    options.title || 'DETAILED ORDERS REPORT',
    `Filtered list of ${orders.length} recorded order(s).`,
    filterSummary
  )

  const totalAmount = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
  const totalAdvances = orders.reduce((sum, o) => sum + (Number(o.advanceAmount) || 0), 0)
  const avgOrder = orders.length ? (totalAmount / orders.length).toFixed(1) : 0

  // Summary KPI Cards in PDF
  doc.setFillColor(248, 249, 250)
  doc.roundedRect(14, startY, 269, 14, 2, 2, 'F')
  doc.setDrawColor(225, 228, 232)
  doc.roundedRect(14, startY, 269, 14, 2, 2, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(31, 31, 35)
  doc.text(`Total Orders: ${orders.length}`, 20, startY + 9)
  doc.text(`Total Amount: ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} TND`, 80, startY + 9)
  doc.setTextColor(180, 83, 9)
  doc.text(`Total Advances: ${totalAdvances.toLocaleString('en-US', { minimumFractionDigits: 2 })} TND`, 150, startY + 9)
  doc.setTextColor(31, 31, 35)
  doc.text(`Average Order: ${avgOrder} TND`, 220, startY + 9)

  const tableRows = orders.map((o, idx) => {
    const customer = o.address ? `${o.address.firstName || ''} ${o.address.lastName || ''}`.trim() : 'Customer'
    const phone = o.address?.phone || '-'
    const city = o.address?.city || '-'
    const itemsCount = Array.isArray(o.items)
      ? o.items.reduce((s, i) => s + (Number(i.quantity) || 1), 0)
      : 0
    const itemsDetail = Array.isArray(o.items)
      ? o.items.map((i) => `${i.name} (x${i.quantity || 1})`).join(', ')
      : '-'
    const advanceVal = Number(o.advanceAmount) || 0
    const advanceText = advanceVal > 0
      ? `${advanceVal.toFixed(2)} TND ${o.advancePaid ? '(Paid)' : '(Pending)'}`
      : '0.00 TND'

    return [
      idx + 1,
      o._id ? `#${o._id.slice(-6).toUpperCase()}` : '-',
      formatDateOnly(o.date),
      customer,
      phone,
      city,
      itemsCount > 1 ? `${itemsCount} items (${itemsDetail.slice(0, 24)}...)` : itemsDetail.slice(0, 28),
      `${(Number(o.amount) || 0).toFixed(2)} TND`,
      advanceText,
      o.paymentMethod || 'COD',
      o.status || 'Pending',
    ]
  })

  autoTable(doc, {
    startY: startY + 18,
    head: [
      ['#', 'Ref', 'Date', 'Customer', 'Phone', 'City', 'Items', 'Total', 'Advance', 'Payment', 'Status'],
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [31, 31, 35],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [40, 40, 40],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 20 },
      3: { cellWidth: 28 },
      4: { cellWidth: 22 },
      5: { cellWidth: 22 },
      6: { cellWidth: 54 },
      7: { halign: 'right', fontStyle: 'bold', cellWidth: 24 },
      8: { halign: 'right', fontStyle: 'bold', cellWidth: 32, textColor: [180, 83, 9] },
      9: { halign: 'center', cellWidth: 18 },
      10: { halign: 'center', cellWidth: 23 },
    },
    didDrawPage: () => {},
  })

  addPdfFooter(doc)
  const dateStr = new Date().toISOString().slice(0, 10)
  if (options.mode === 'print') {
    doc.autoPrint()
    const blobUrl = doc.output('bloburl')
    window.open(blobUrl, '_blank')
  } else {
    doc.save(`Meili_Orders_${dateStr}.pdf`)
  }
}

/**
 * Imprime / Exporte le document officiel de suivi des avances (Print Avance)
 * Contient un tableau avec : N° Commande, Nom Client, Total, Avance et Prix Original
 */
export const exportAdvancesReportToPdf = (orders, filterSummary = {}, options = {}) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const startY = addPdfHeader(
    doc,
    options.title || 'SUIVI DES AVANCES & PRIX ORIGINAUX (COMMANDES)',
    `Rapport d'audit des acomptes pour ${orders.length} commande(s) filtrée(s).`,
    filterSummary
  )

  const totalAmount = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
  const totalAdvances = orders.reduce((sum, o) => sum + (Number(o.advanceAmount) || 0), 0)
  const totalOriginal = orders.reduce((sum, o) => sum + calculateOrderOriginalPrice(o), 0)
  const totalRemaining = Math.max(0, totalAmount - totalAdvances)
  const withAdvanceCount = orders.filter((o) => (Number(o.advanceAmount) || 0) > 0).length
  const advancePaidCount = orders.filter((o) => o.advancePaid).length

  // KPI Summary box (Landscape A4: 269mm wide)
  doc.setFillColor(248, 249, 250)
  doc.roundedRect(14, startY, 269, 16, 2, 2, 'F')
  doc.setDrawColor(225, 228, 232)
  doc.roundedRect(14, startY, 269, 16, 2, 2, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(31, 31, 35)
  doc.text(`Commandes : ${orders.length} (${withAdvanceCount} avec avance)`, 20, startY + 6.5)
  doc.text(`Prix Original Total : ${totalOriginal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND`, 95, startY + 6.5)
  doc.text(`Total Commandes : ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND`, 185, startY + 6.5)

  doc.setFontSize(8)
  doc.setTextColor(180, 83, 9) // Amber
  doc.text(`Total Avances : ${totalAdvances.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND (${advancePaidCount} payées)`, 20, startY + 12)
  doc.setTextColor(31, 31, 35)
  doc.text(`Reste à Recouvrer : ${totalRemaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND`, 95, startY + 12)
  doc.setTextColor(100, 100, 110)
  doc.text(`Taux d'Avance : ${totalAmount > 0 ? ((totalAdvances / totalAmount) * 100).toFixed(1) : 0}%`, 185, startY + 12)

  const tableRows = orders.map((o, idx) => {
    const customer = o.address ? `${o.address.firstName || ''} ${o.address.lastName || ''}`.trim() : 'Client'
    const phone = o.address?.phone || '-'
    const origPrice = calculateOrderOriginalPrice(o)
    const amount = Number(o.amount) || 0
    const advance = Number(o.advanceAmount) || 0
    const remaining = Math.max(0, amount - advance)
    const advanceStatus = advance > 0 ? (o.advancePaid ? 'Payée' : 'Attente') : '0.00'

    return [
      idx + 1,
      o._id ? `#${o._id.slice(-8).toUpperCase()}` : '-',
      formatDateOnly(o.date),
      customer,
      phone,
      `${origPrice.toFixed(2)} TND`,
      `${amount.toFixed(2)} TND`,
      advance > 0 ? `${advance.toFixed(2)} TND (${advanceStatus})` : '0.00 TND',
      `${remaining.toFixed(2)} TND`,
      o.status || 'Order Placed',
    ]
  })

  // Ligne de totaux en bas
  const footRow = [
    [
      'TOTAL',
      `${orders.length} cdes`,
      '-',
      '-',
      '-',
      `${totalOriginal.toFixed(2)} TND`,
      `${totalAmount.toFixed(2)} TND`,
      `${totalAdvances.toFixed(2)} TND`,
      `${totalRemaining.toFixed(2)} TND`,
      '-',
    ],
  ]

  autoTable(doc, {
    startY: startY + 20,
    head: [
      [
        '#',
        'N° Commande',
        'Date',
        'Nom Client',
        'Téléphone',
        'Prix Original',
        'Total',
        'Avance',
        'Reste à Payer',
        'Statut',
      ],
    ],
    body: tableRows,
    foot: footRow,
    theme: 'grid',
    headStyles: {
      fillColor: [31, 31, 35],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    footStyles: {
      fillColor: [240, 242, 245],
      textColor: [31, 31, 35],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [40, 40, 40],
      cellPadding: 2.2,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 24, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 20 },
      3: { cellWidth: 38, fontStyle: 'bold' },
      4: { cellWidth: 26 },
      5: { halign: 'right', cellWidth: 28 },
      6: { halign: 'right', fontStyle: 'bold', cellWidth: 28 },
      7: { halign: 'right', fontStyle: 'bold', cellWidth: 35, textColor: [180, 83, 9] },
      8: { halign: 'right', fontStyle: 'bold', cellWidth: 30 },
      9: { halign: 'center', cellWidth: 32 },
    },
  })

  addPdfFooter(doc)
  const dateStr = new Date().toISOString().slice(0, 10)
  if (options.mode === 'download') {
    doc.save(`Meili_Suivi_Avances_${dateStr}.pdf`)
  } else {
    doc.autoPrint()
    const blobUrl = doc.output('bloburl')
    window.open(blobUrl, '_blank')
  }
}

export const exportProductsToPdf = (products, filterSummary = {}) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const startY = addPdfHeader(
    doc,
    'PRODUCT CATALOG',
    `Filtered inventory of ${products.length} reference(s).`,
    filterSummary
  )

  const avgPrice = products.length
    ? Math.round(products.reduce((s, p) => s + (Number(p.price) || 0), 0) / products.length)
    : 0

  // Summary box
  doc.setFillColor(248, 249, 250)
  doc.roundedRect(14, startY, 182, 12, 2, 2, 'F')
  doc.setDrawColor(225, 228, 232)
  doc.roundedRect(14, startY, 182, 12, 2, 2, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(31, 31, 35)
  doc.text(`Total References: ${products.length}`, 20, startY + 7.5)
  doc.text(`Average Price: ${avgPrice} TND`, 85, startY + 7.5)
  const popularCount = products.filter((p) => p.popular).length
  doc.text(`Best-Sellers / Popular: ${popularCount}`, 130, startY + 7.5)

  const tableRows = products.map((p, idx) => {
    const cats = Array.isArray(p.category) ? p.category.join(', ') : p.category || '-'
    const sizes = Array.isArray(p.sizes) ? p.sizes.join(', ') : '-'
    return [
      idx + 1,
      p.name || 'Unnamed',
      p.subCategory || '-',
      cats,
      sizes,
      p.popular ? '★ Yes' : 'No',
      `${p.price || 0} TND`,
    ]
  })

  autoTable(doc, {
    startY: startY + 16,
    head: [['#', 'Model Name', 'Brand', 'Category', 'Available Sizes', 'Popular', 'Price']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [31, 31, 35],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [40, 40, 40],
      cellPadding: 2.2,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 46, fontStyle: 'bold' },
      2: { cellWidth: 26 },
      3: { cellWidth: 28 },
      4: { cellWidth: 38 },
      5: { halign: 'center', cellWidth: 16 },
      6: { halign: 'right', fontStyle: 'bold', cellWidth: 20 },
    },
  })

  addPdfFooter(doc)
  const dateStr = new Date().toISOString().slice(0, 10)
  doc.save(`Meili_Products_${dateStr}.pdf`)
}

export const exportStatsReportToPdf = (statsData, filterSummary = {}, options = {}) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const startY = addPdfHeader(
    doc,
    options.title || 'SALES SUMMARY & ANALYTICS',
    'Business activity report - Měilì',
    filterSummary
  )

  // Main KPI Box
  const kpiY = startY + 2
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(14, kpiY, 182, 32, 3, 3, 'F')
  doc.setDrawColor(220, 224, 230)
  doc.roundedRect(14, kpiY, 182, 32, 3, 3, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 110)
  doc.text('TOTAL REVENUE', 22, kpiY + 8)
  doc.text('TOTAL ORDERS', 75, kpiY + 8)
  doc.text('AVERAGE ORDER VALUE', 130, kpiY + 8)

  doc.setFontSize(14)
  doc.setTextColor(230, 57, 70) // Red brand color
  doc.text(`${(statsData.revenue || 0).toLocaleString('en-US')} TND`, 22, kpiY + 17)

  doc.setTextColor(31, 31, 35)
  doc.text(`${statsData.totalOrders || 0}`, 75, kpiY + 17)
  doc.text(`${(statsData.avgBasket || 0).toFixed(2)} TND`, 130, kpiY + 17)

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(110, 110, 120)
  doc.text(`Items sold: ${statsData.totalItemsSold || 0}`, 22, kpiY + 26)
  doc.text(`Delivered orders: ${statsData.deliveredOrders || 0}`, 75, kpiY + 26)
  doc.text(`Delivery rate: ${statsData.deliveryRate || 0}%`, 130, kpiY + 26)

  // Section 1: Orders by status
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(31, 31, 35)
  doc.text('1. Orders Breakdown by Status', 14, kpiY + 42)

  const statusRows = (statsData.statusBreakdown || []).map((s) => [
    s.status,
    s.count,
    `${s.percentage}%`,
    `${(s.amount || 0).toLocaleString('en-US')} TND`,
  ])

  autoTable(doc, {
    startY: kpiY + 46,
    head: [['Status', 'Orders', 'Share', 'Estimated Volume (TND)']],
    body: statusRows.length > 0 ? statusRows : [['-', 'No orders', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [31, 31, 35],
      textColor: [255, 255, 255],
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { halign: 'center', cellWidth: 35 },
      2: { halign: 'center', cellWidth: 35 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 62 },
    },
  })

  // Section 2: Top Selling Products
  const lastY = doc.lastAutoTable ? doc.lastAutoTable.finalY : kpiY + 95
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(31, 31, 35)
  doc.text('2. Top Selling Products', 14, lastY + 12)

  const topRows = (statsData.topProducts || []).map((p, idx) => [
    `#${idx + 1}`,
    p.name,
    p.qty,
    `${(p.totalRevenue || 0).toLocaleString('en-US')} TND`,
  ])

  autoTable(doc, {
    startY: lastY + 16,
    head: [['Rank', 'Model', 'Units Sold', 'Generated Revenue']],
    body: topRows.length > 0 ? topRows : [['-', 'No sales recorded', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [230, 57, 70],
      textColor: [255, 255, 255],
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15, fontStyle: 'bold' },
      1: { cellWidth: 80, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 40 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 47 },
    },
  })

  // Section 3: Filtered Orders Detail (if requested or available)
  if (options.includeOrdersList && Array.isArray(options.orders) && options.orders.length > 0) {
    doc.addPage('a4', 'portrait')
    const page2Y = addPdfHeader(
      doc,
      '3. FILTERED ORDERS DETAILS',
      `${options.orders.length} order(s) listed`,
      filterSummary
    )

    const ordersTableRows = options.orders.map((o, idx) => {
      const customer = o.address ? `${o.address.firstName || ''} ${o.address.lastName || ''}`.trim() : 'Customer'
      const city = o.address?.city || '-'
      const itemsCount = Array.isArray(o.items)
        ? o.items.reduce((s, i) => s + (Number(i.quantity) || 1), 0)
        : 0
      const itemsSummary = Array.isArray(o.items)
        ? o.items.map((i) => `${i.name} (x${i.quantity || 1})`).join(', ')
        : '-'
      const advanceVal = Number(o.advanceAmount) || 0

      return [
        idx + 1,
        o._id ? `#${o._id.slice(-6).toUpperCase()}` : '-',
        formatDateOnly(o.date),
        customer,
        city,
        itemsCount > 1 ? `${itemsCount} items (${itemsSummary.slice(0, 18)}...)` : itemsSummary.slice(0, 20),
        `${(Number(o.amount) || 0).toFixed(2)} TND`,
        advanceVal > 0 ? `${advanceVal.toFixed(2)} TND` : '0.00 TND',
        o.status || 'Pending',
      ]
    })

    autoTable(doc, {
      startY: page2Y + 4,
      head: [['#', 'Ref', 'Date', 'Customer', 'City', 'Items', 'Total', 'Avance', 'Status']],
      body: ordersTableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [31, 31, 35],
        textColor: [255, 255, 255],
        fontSize: 8,
        halign: 'center',
      },
      bodyStyles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
        2: { halign: 'center', cellWidth: 18 },
        3: { cellWidth: 28 },
        4: { cellWidth: 20 },
        5: { cellWidth: 38 },
        6: { halign: 'right', fontStyle: 'bold', cellWidth: 18 },
        7: { halign: 'right', fontStyle: 'bold', cellWidth: 18, textColor: [180, 83, 9] },
        8: { halign: 'center', cellWidth: 18 },
      },
    })
  }

  addPdfFooter(doc)
  const dateStr = new Date().toISOString().slice(0, 10)
  const filename = options.filename || `Meili_Stats_Summary_${dateStr}.pdf`

  if (options.mode === 'print') {
    doc.autoPrint()
    const blobUrl = doc.output('bloburl')
    window.open(blobUrl, '_blank')
  } else {
    doc.save(filename)
  }
}