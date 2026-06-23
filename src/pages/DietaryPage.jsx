import { useEffect, useState } from 'react'
import { X, Leaf } from 'lucide-react'
import { useProfileStore } from '../store/profileStore'
import { useDietaryStore } from '../store/dietaryStore'

const PRESET_FLAGS = [
  'halal', 'kosher', 'vegan', 'vegetarian', 'pescatarian',
  'gluten-free', 'dairy-free', 'nut-free', 'low-FODMAP', 'diabetic-friendly',
]

const FLAG_EMOJI = {
  halal: '☪️', kosher: '✡️', vegan: '🌱', vegetarian: '🥦',
  pescatarian: '🐟', 'gluten-free': '🌾', 'dairy-free': '🥛',
  'nut-free': '🥜', 'low-FODMAP': '🫀', 'diabetic-friendly': '💙',
}

export default function DietaryPage() {
  const { activeProfile } = useProfileStore()
  const { flags, loading, fetchFlags, addFlag, deleteFlag } = useDietaryStore()
  const [adding, setAdding] = useState(null) // flag name being added
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (activeProfile?.id) fetchFlags(activeProfile.id)
  }, [activeProfile?.id])

  const existingFlags = new Set(flags.map((f) => f.flag))

  const handleAdd = async (flag) => {
    setSaving(true)
    await addFlag(activeProfile.id, flag, notes)
    setAdding(null)
    setNotes('')
    setSaving(false)
  }

  const handleDelete = async (flag) => {
    if (!confirm(`Remove "${flag.flag}"?`)) return
    await deleteFlag(flag.id)
  }

  if (!activeProfile) {
    return <div className="p-8 text-sm text-gray-400">No active profile. Go to Profiles to set one.</div>
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Dietary flags</h1>
        <p className="text-sm text-gray-400 mt-0.5">{activeProfile.avatar_emoji} {activeProfile.name}</p>
      </div>

      {/* Active flags */}
      {!loading && flags.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Active</p>
          <div className="flex flex-wrap gap-2">
            {flags.map((f) => (
              <div key={f.id} className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-800 text-sm font-medium px-3 py-1.5 rounded-full">
                <span>{FLAG_EMOJI[f.flag] ?? '🏷️'}</span>
                <span className="capitalize">{f.flag}</span>
                {f.notes && <span className="text-green-500 text-xs">· {f.notes}</span>}
                <button onClick={() => handleDelete(f)} className="ml-1 text-green-400 hover:text-green-700">
                  <X size={13} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add from presets */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Add a flag</p>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_FLAGS.map((flag) => {
            const active = existingFlags.has(flag)
            return (
              <button
                key={flag}
                onClick={() => !active && setAdding(flag)}
                disabled={active}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium text-left transition-colors ${
                  active
                    ? 'border-green-200 bg-green-50 text-green-600 cursor-default'
                    : 'border-gray-100 bg-white hover:border-green-300 hover:bg-green-50 text-gray-700'
                }`}
              >
                <span className="text-lg">{FLAG_EMOJI[flag] ?? '🏷️'}</span>
                <span className="capitalize">{flag}</span>
                {active && <span className="ml-auto text-green-500 text-xs">✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Notes modal */}
      {adding && (
        <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <span>{FLAG_EMOJI[adding] ?? '🏷️'}</span>
              <span className="capitalize">{adding}</span>
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. strictly halal, no exceptions"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setAdding(null); setNotes('') }} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600">
                Cancel
              </button>
              <button
                onClick={() => handleAdd(adding)}
                disabled={saving}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg"
              >
                {saving ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
