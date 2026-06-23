import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Check, Link2, Copy, CheckCheck, Camera, LogOut } from 'lucide-react'
import { useProfileStore } from '../store/profileStore'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'

const EMOJIS = ['🙂','😊','🧒','👦','👧','🧑','👨','👩','🧓','👴','👵','🧑‍🍼','👶','🐣','🌱']

function Avatar({ profile, size = 'md' }) {
  const dim = size === 'lg' ? 'w-16 h-16 text-4xl' : size === 'sm' ? 'w-9 h-9 text-xl' : 'w-12 h-12 text-3xl'
  if (profile.avatar_url) {
    return <img src={profile.avatar_url} alt={profile.name} className={`${dim} rounded-full object-cover shrink-0`} />
  }
  return <span className={`${dim} flex items-center justify-center shrink-0`}>{profile.avatar_emoji}</span>
}

function ProfileModal({ profile, onClose, onSave }) {
  const [name, setName] = useState(profile?.name ?? '')
  const [dob, setDob] = useState(profile?.dob ?? '')
  const [emoji, setEmoji] = useState(profile?.avatar_emoji ?? '🙂')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url ?? null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    const { error } = await onSave({
      name: name.trim(),
      dob: dob || null,
      avatar_emoji: emoji,
      avatarFile,
    })
    if (error) { setError(error.message); setSaving(false) } else { onClose() }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-semibold text-gray-900">{profile ? 'Edit profile' : 'Add profile'}</h2>
        </div>

        <div className="p-5 space-y-5">
          {/* Photo upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt="preview" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-4xl border-2 border-gray-200">
                  {emoji}
                </div>
              )}
              <button
                onClick={() => fileRef.current.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-md"
              >
                <Camera size={13} className="text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
            <p className="text-xs text-gray-400">Tap camera to add a photo</p>
          </div>

          {/* Emoji (shown if no photo) */}
          {!avatarPreview && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Or pick an emoji avatar</label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`w-9 h-9 text-xl rounded-lg flex items-center justify-center border-2 transition-colors ${
                      emoji === e ? 'border-green-500 bg-green-50' : 'border-transparent hover:bg-gray-100'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of birth <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <div className="p-5 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProfilesPage() {
  const { profiles, activeProfile, fetchProfiles, setActive, createProfile, updateProfile, uploadAvatar, deleteProfile, loading } = useProfileStore()
  const signOut = useAuthStore((s) => s.signOut)
  const [modal, setModal] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [copied, setCopied] = useState(null)
  const [togglingShare, setTogglingShare] = useState(null)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth', { replace: true })
  }

  const handleToggleShare = async (profile) => {
    setTogglingShare(profile.id)
    await updateProfile(profile.id, { share_enabled: !profile.share_enabled })
    setTogglingShare(null)
  }

  const handleCopyLink = (profile) => {
    const url = `${window.location.origin}/s/${profile.share_token}`
    navigator.clipboard.writeText(url)
    setCopied(profile.id)
    setTimeout(() => setCopied(null), 2000)
  }

  useEffect(() => { fetchProfiles() }, [])

  const handleSetActive = async (profile) => {
    await setActive(profile)
    navigate('/')
  }

  const handleDelete = async (profile) => {
    if (!confirm(`Delete "${profile.name}"? This will also remove their allergens and scan history.`)) return
    setDeleting(profile.id)
    await deleteProfile(profile.id)
    setDeleting(null)
  }

  const handleSave = async (existingProfile, { avatarFile, ...fields }) => {
    const { data: { user } } = await supabase.auth.getUser()

    if (existingProfile) {
      let avatarUrl = existingProfile.avatar_url
      if (avatarFile) {
        const { url, error } = await uploadAvatar(user.id, existingProfile.id, avatarFile)
        if (error) return { error }
        avatarUrl = url
      }
      return updateProfile(existingProfile.id, { ...fields, avatar_url: avatarUrl })
    } else {
      const { error, data } = await createProfile(fields)
      if (error) return { error }
      // upload avatar after profile is created so we have the ID
      if (avatarFile && data) {
        const { url } = await uploadAvatar(user.id, data.id, avatarFile)
        if (url) await updateProfile(data.id, { avatar_url: url })
      }
      return { error: null }
    }
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">Loading profiles…</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Profiles</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModal('add')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg"
          >
            <Plus size={16} /> Add profile
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🌿</p>
          <p className="font-medium text-gray-600">No profiles yet</p>
          <p className="text-sm mt-1">Add a profile to get started</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {profiles.map((profile) => {
            const isActive = activeProfile?.id === profile.id
            return (
              <div
                key={profile.id}
                className={`relative bg-white rounded-2xl border-2 p-4 transition-colors ${
                  isActive ? 'border-green-400' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                {isActive && (
                  <span className="absolute top-3 right-3 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check size={11} strokeWidth={3} /> Active
                  </span>
                )}

                <button className="flex items-center gap-3 w-full text-left" onClick={() => handleSetActive(profile)}>
                  <Avatar profile={profile} size="md" />
                  <div>
                    <p className="font-semibold text-gray-900">{profile.name}</p>
                    {profile.dob && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        b. {new Date(profile.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </button>

                {/* Share toggle */}
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Link2 size={13} />
                      <span>Shareable link</span>
                    </div>
                    <button
                      onClick={() => handleToggleShare(profile)}
                      disabled={togglingShare === profile.id}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
                        profile.share_enabled ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                        profile.share_enabled ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  {profile.share_enabled && (
                    <div className="flex items-center gap-2 bg-green-50 rounded-lg px-2.5 py-1.5">
                      <p className="text-xs text-green-700 font-mono truncate flex-1">
                        /s/{profile.share_token.slice(0, 8)}…
                      </p>
                      <button onClick={() => handleCopyLink(profile)} className="shrink-0 text-green-600 hover:text-green-800">
                        {copied === profile.id ? <CheckCheck size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-2">
                  <button onClick={() => setModal(profile)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Pencil size={13} /> Edit
                  </button>
                  {profiles.length > 1 && (
                    <button
                      onClick={() => handleDelete(profile)}
                      disabled={deleting === profile.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal === 'add' && (
        <ProfileModal onClose={() => setModal(null)} onSave={(fields) => handleSave(null, fields)} />
      )}
      {modal && modal !== 'add' && (
        <ProfileModal profile={modal} onClose={() => setModal(null)} onSave={(fields) => handleSave(modal, fields)} />
      )}
    </div>
  )
}
