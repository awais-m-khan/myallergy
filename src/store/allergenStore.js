import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAllergenStore = create((set, get) => ({
  allergens: [],
  loading: true,
  profileId: null,

  fetchAllergens: async (profileId) => {
    if (!profileId) { set({ allergens: [], loading: false }); return }
    set({ loading: true, profileId })
    const { data } = await supabase
      .from('allergens')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: true })
    set({ allergens: data ?? [], loading: false })
  },

  addAllergen: async (profileId, fields) => {
    const { data, error } = await supabase
      .from('allergens')
      .insert({ ...fields, profile_id: profileId })
      .select()
      .single()
    if (error || !data) return { error }
    set((s) => ({ allergens: [...s.allergens, data] }))
    return { error: null }
  },

  updateAllergen: async (id, fields) => {
    const { data, error } = await supabase
      .from('allergens')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (error || !data) return { error }
    set((s) => ({ allergens: s.allergens.map((a) => (a.id === id ? data : a)) }))
    return { error: null }
  },

  deleteAllergen: async (id) => {
    const { error } = await supabase.from('allergens').delete().eq('id', id)
    if (error) return { error }
    set((s) => ({ allergens: s.allergens.filter((a) => a.id !== id) }))
    return { error: null }
  },
}))
