export const currency = import.meta.env.VITE_STORE_CURRENCY || 'MAD'

export function formatPrice(n){
  const num = Number(n||0)
  return new Intl.NumberFormat(undefined,{ style:'currency', currency }).format(num)
}

export function calcTotals(items, shipping=0){
  const subtotal = items.reduce((s,i)=> s + i.qty * i.unitPrice, 0)
  const total = subtotal + shipping
  return { subtotal, shipping, total }
}

export function composeWhatsAppMessage({orderCode, customer, items, totals, notes}){
  const lines = []
  lines.push(`Order ID: ${orderCode}`)
  lines.push(`Name: ${customer.name||''} | Phone: ${customer.phone||''} | Email: ${customer.email||''}`)
  lines.push(`Address: ${customer.address||''}`)
  lines.push('Items:')
  items.forEach(i=>{
    const lt = (i.qty * i.unitPrice).toFixed(2)
    lines.push(`- ${i.title} (${i.size||''} / ${i.color||''}) x${i.qty} @ ${i.unitPrice} ${currency} = ${lt}`)
  })
  lines.push(`Subtotal: ${totals.subtotal.toFixed(2)} ${currency}`)
  lines.push(`Shipping: ${totals.shipping.toFixed(2)} ${currency}`)
  lines.push(`TOTAL: ${totals.total.toFixed(2)} ${currency}`)
  lines.push(`Notes: ${notes||''}`)
  return lines.join('\n')
}

export function openWhatsApp(to, message){
  const url = `https://wa.me/${to}?text=${encodeURIComponent(message)}`
  const win = window.open(url, '_blank')
  if(!win){
    window.location.href = `whatsapp://send?phone=${to}&text=${encodeURIComponent(message)}`
  }
}

export function uuid(){
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}
