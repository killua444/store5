import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'

export const useAuthStore = create((set,get)=>({
  session: null,
  profile: null,
  setSession: (session)=>{
    set({ session })
    if(session){ get().fetchProfile() } else { set({ profile:null }) }
  },
  fetchProfile: async ()=>{
    const { data: { user } } = await supabase.auth.getUser()
    if(!user) return set({ profile:null })
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if(!error) set({ profile: data })
  },
  signIn: (email, password)=> supabase.auth.signInWithPassword({ email, password }),
  signUp: (email, password)=> supabase.auth.signUp({ email, password }),
  signOut: ()=> supabase.auth.signOut(),
}))
