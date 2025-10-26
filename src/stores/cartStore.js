import { create } from 'zustand'

const persistKey = 'haruki_cart_v1'
const initial = JSON.parse(localStorage.getItem(persistKey)||'{}')

export const useCartStore = create((set,get)=>({
  items: initial.items || [],
  promo: initial.promo || null,
  shipping: initial.shipping ?? 20,
  wishlist: initial.wishlist || [],
  add: (item)=> set(state=>{
    const idx = state.items.findIndex(i=> i.productId===item.productId && i.variantId===item.variantId)
    const items = [...state.items]
    if(idx>=0){ items[idx] = { ...items[idx], qty: items[idx].qty + item.qty } }
    else items.push(item)
    persist({ ...state, items })
    return { items }
  }),
  updateQty: (index, qty)=> set(state=>{
    const items = [...state.items]
    items[index] = { ...items[index], qty }
    persist({ ...state, items })
    return { items }
  }),
  remove: (index)=> set(state=>{
    const items = state.items.filter((_,i)=> i!==index)
    persist({ ...state, items })
    return { items }
  }),
  clear: ()=> set(state=>{ persist({ ...state, items:[] }); return { items:[] } }),
  toggleWishlist: (productId)=> set(state=>{
    const setW = new Set(state.wishlist)
    if(setW.has(productId)) setW.delete(productId); else setW.add(productId)
    const wishlist = Array.from(setW)
    persist({ ...state, wishlist })
    return { wishlist }
  }),
  setPromo: (code)=> set(state=>{ const promo = code==='HARUKI10'?{code, pct:10}:null; persist({ ...state, promo }); return { promo } }),
  setShipping: (val)=> set(state=>{ const shipping = Number(val)||0; persist({ ...state, shipping }); return { shipping } }),
}))

function persist(state){
  localStorage.setItem(persistKey, JSON.stringify({ items: state.items, wishlist: state.wishlist, promo: state.promo, shipping: state.shipping }))
}
