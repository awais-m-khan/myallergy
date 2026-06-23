import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useProfileStore = create((set, get) => ({
  profiles: [],
  activeProfile: null,
  loading: true,

  fetchProfiles: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })

    if (error || !data) { set({ loading: false }); return }

    const active = data.find((p) => p.is_default) ?? data[0] ?? null
    set({ profiles: data, activeProfile: active, loading: false })
  },

  setActive: async (profile) => {
    const { profiles } = get()
    // update is_default in DB — unset all, then set chosen
    await supabase.from('profiles').update({ is_default: false }).in('id', profiles.map((p) => p.id))
    await supabase.from('profiles').update({ is_default: true }).eq('id', profile.id)
    set({
      activeProfile: profile,
      profiles: profiles.map((p) => ({ ...p, is_default: p.id === profile.id })),
    })
  },

  createProfile: async (fields) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { profiles } = get()
    const isFirst = profiles.length === 0

    const { data, error } = await supabase
      .from('profiles')
      .insert({ ...fields, user_id: user.id, is_default: isFirst })
      .select()
      .single()

    if (error || !data) return { error }

    set((s) => ({
      profiles: [...s.profiles, data],
      activeProfile: isFirst ? data : s.activeProfile,
    }))
    return { error: null }
  },

  updateProfile: async (id, fields) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(fields)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) return { error }

    set((s) => ({
      profiles: s.profiles.map((p) => (p.id === id ? data : p)),
      activeProfile: s.activeProfile?.id === id ? data : s.activeProfile,
    }))
    return { error: null }
  },

  deleteProfile: async (id) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (error) return { error }

    set((s) => {
      const remaining = s.profiles.filter((p) => p.id !== id)
      const active = s.activeProfile?.id === id ? (remaining[0] ?? null) : s.activeProfile
      return { profiles: remaining, activeProfile: active }
    })
    return { error: null }
  },
}))
