import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useDietaryStore = create((set) => ({
  flags: [],
  loading: true,

  fetchFlags: async (profileId) => {
    if (!profileId) { set({ flags: [], loading: false }); return }
    set({ loading: true })
    const { data } = await supabase
      .from('dietary_flags')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: true })
    set({ flags: data ?? [], loading: false })
  },

  addFlag: async (profileId, flag, notes) => {
    const { data, error } = await supabase
      .from('dietary_flags')
      .insert({ profile_id: profileId, flag, notes: notes || null })
      .select()
      .single()
    if (error || !data) return { error }
    set((s) => ({ flags: [...s.flags, data] }))
    return { error: null }
  },

  deleteFlag: async (id) => {
    const { error } = await supabase.from('dietary_flags').delete().eq('id', id)
    if (error) return { error }
    set((s) => ({ flags: s.flags.filter((f) => f.id !== id) }))
    return { error: null }
  },
}))
