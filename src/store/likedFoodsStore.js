import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useLikedFoodsStore = create((set) => ({
  likedFoods: [],
  loading: true,

  fetchLikedFoods: async (profileId) => {
    if (!profileId) { set({ likedFoods: [], loading: false }); return }
    set({ loading: true })
    const { data } = await supabase
      .from('liked_foods')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
    set({ likedFoods: data ?? [], loading: false })
  },

  addLikedFood: async (profileId, food) => {
    const { data, error } = await supabase
      .from('liked_foods')
      .insert({ profile_id: profileId, ...food })
      .select()
      .single()
    if (error || !data) return { error }
    set((s) => ({ likedFoods: [data, ...s.likedFoods] }))
    return { error: null }
  },

  removeLikedFood: async (id) => {
    const { error } = await supabase.from('liked_foods').delete().eq('id', id)
    if (error) return { error }
    set((s) => ({ likedFoods: s.likedFoods.filter((f) => f.id !== id) }))
    return { error: null }
  },
}))
