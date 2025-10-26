import { calcTotals } from '../src/lib/utils'

test('calcTotals computes subtotal and total', ()=>{
  const items = [
    { qty:2, unitPrice:100 },
    { qty:1, unitPrice:50 }
  ]
  const { subtotal, shipping, total } = calcTotals(items, 20)
  expect(subtotal).toBe(250)
  expect(shipping).toBe(20)
  expect(total).toBe(270)
})
