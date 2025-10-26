import { create } from 'zustand'

const persistKey = 'haruki_admin_auth_v1'
const initial = (() => {
  if (typeof window === 'undefined') return { authorized: false, email: null }
  try {
    return JSON.parse(window.localStorage.getItem(persistKey) || '{}')
  } catch (error) {
    console.error('Failed to parse admin auth cache', error)
    return { authorized: false, email: null }
  }
})()

const credentials = {
  email: 'shadow@me',
  password: 'shadow2002@',
}

export const useAdminAuth = create((set) => ({
  authorized: Boolean(initial.authorized),
  email: initial.email || null,
  login: ({ email, password }) => {
    const isValid = email === credentials.email && password === credentials.password
    if (isValid) {
      persist({ authorized: true, email })
      set({ authorized: true, email })
      return { success: true }
    }
    return { success: false, message: 'Invalid admin credentials' }
  },
  logout: () => {
    persist({ authorized: false, email: null })
    set({ authorized: false, email: null })
  },
}))

function persist(state){
  if (typeof window === 'undefined') return
  window.localStorage.setItem(persistKey, JSON.stringify(state))
}
