import { create } from 'zustand'

export const useThemeStore = create((set)=>({
  theme: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  toggle: ()=> set(s=>({ theme: s.theme==='dark'?'light':'dark' }))
}))
