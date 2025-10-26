import { useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useAuthStore } from '../stores/authStore'

export function useAuth(){
  const setSession = useAuthStore(s=>s.setSession)
  useEffect(()=>{
    let mounted = true
    supabase.auth.getSession().then(({ data })=>{
      if(!mounted) return
      setSession(data.session || null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session)=>{
      setSession(session)
    })
    return ()=>{ mounted = false; sub.subscription.unsubscribe() }
  },[setSession])
}
