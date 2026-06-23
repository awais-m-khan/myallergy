import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { useProfileStore } from '../store/profileStore'
import { useAllergenStore } from '../store/allergenStore'
import { EU_BIG_14, SEVERITY_LEVELS, SEVERITY_STYLES } from '../lib/constants'
import { format, parseISO } from 'date-fns'

function AllergenModal({ allergen, initialValues, onClose, onSave }) {
  const init = allergen ?? initialValues ?? {}
  const [name, setName] = useState(init.name ?? '')
  const [category, setCategory] = useState(init.category ?? '')
  const [severity, setSeverity] = useState(init.severity ?? 'moderate')
  const [diagnosedDate, setDiagnosedDate] = useState(init.diagnosed_date ?? '')
  const [notes, setNotes] = useState(init.notes ?? '')
  const [exceptions, setExceptions] = useState(init.exceptions ?? '')
  const [offTag, setOffTag] = useState(init.off_tag ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    const { error } = await onSave({
      name: name.trim(),
      category: category.trim() || null,
      severity,
      diagnosed_date: diagnosedDate || null,
      notes: notes.trim() || null,
      exceptions: exceptions.trim() || null,
      off_tag: offTag.trim() || null,
    })
    if (error) { setError(error.message); setSaving(false) } else { onClose() }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-semibold text-gray-900">{allergen ? 'Edit allergen' : 'Add allergen'}</h2>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allergen name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Peanuts"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <div className="grid grid-cols-2 gap-2">
              {SEVERITY_LEVELS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border-2 capitalize transition-colors ${
                    severity === s
                      ? 'border-green-500 ' + SEVERITY_STYLES[s].badge
                      : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {SEVERITY_STYLES[s].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diagnosed date <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={diagnosedDate}
              onChange={(e) => setDiagnosedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exceptions <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={exceptions}
              onChange={(e) => setExceptions(e.target.value)}
              placeholder="e.g. tuna is tolerated"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-400 mt-1">Flagged foods will show as a warning instead of unsafe</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional info…"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
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

function SeverityBadge({ severity }) {
  const { badge, label } = SEVERITY_STYLES[severity] ?? {}
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badge}`}>
      {label}
    </span>
  )
}

export default function AllergensPage() {
  const { activeProfile } = useProfileStore()
  const { allergens, loading, fetchAllergens, addAllergen, updateAllergen, deleteAllergen } = useAllergenStore()
  const [modal, setModal] = useState(null)
  const [tab, setTab] = useState('list') // 'list' | 'quickadd'

  useEffect(() => {
    if (activeProfile?.id) fetchAllergens(activeProfile.id)
  }, [activeProfile?.id])

  const existingNames = new Set(allergens.map((a) => a.name.toLowerCase()))

  const handleQuickAdd = (item) => {
    setModal({ prefill: { name: item.name, category: item.category, off_tag: item.off_tag } })
  }

  const handleDelete = async (allergen) => {
    if (!confirm(`Remove "${allergen.name}"?`)) return
    await deleteAllergen(allergen.id)
  }

  if (!activeProfile) {
    return <div className="p-8 text-sm text-gray-400">No active profile. Go to Profiles to set one.</div>
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Allergens</h1>
          <p className="text-sm text-gray-400 mt-0.5">{activeProfile.avatar_emoji} {activeProfile.name}</p>
        </div>
        <button
          onClick={() => setModal({})}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg bg-gray-100 p-1 mb-5">
        <button
          onClick={() => setTab('list')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
        >
          My allergens {allergens.length > 0 && `(${allergens.length})`}
        </button>
        <button
          onClick={() => setTab('quickadd')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === 'quickadd' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
        >
          EU Big 14
        </button>
      </div>

      {/* List tab */}
      {tab === 'list' && (
        <>
          {loading ? (
            <div className="text-sm text-gray-400 py-8 text-center">Loading…</div>
          ) : allergens.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <AlertTriangle size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="font-medium text-gray-600">No allergens added yet</p>
              <p className="text-sm mt-1">Use the EU Big 14 tab for quick setup</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allergens.map((a) => (
                <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{a.name}</span>
                        <SeverityBadge severity={a.severity} />
                      </div>
                      {a.category && <p className="text-xs text-gray-400 mt-0.5">{a.category}</p>}
                      {a.diagnosed_date && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Diagnosed {format(parseISO(a.diagnosed_date), 'd MMM yyyy')}
                        </p>
                      )}
                      {a.exceptions && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          ⚠ Except: {a.exceptions}
                        </span>
                      )}
                      {a.notes && <p className="text-sm text-gray-500 mt-1">{a.notes}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setModal(a)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(a)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Quick add tab */}
      {tab === 'quickadd' && (
        <div className="space-y-2">
          {EU_BIG_14.map((item) => {
            const added = existingNames.has(item.name.toLowerCase())
            return (
              <div key={item.name} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.category}</p>
                </div>
                {added ? (
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Added</span>
                ) : (
                  <button
                    onClick={() => handleQuickAdd(item)}
                    className="text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg"
                  >
                    + Add
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <AllergenModal
          allergen={modal.prefill ? null : (modal.id ? modal : null)}
          initialValues={modal.prefill}
          onClose={() => setModal(null)}
          onSave={(fields) => {
            const data = modal.prefill
              ? { ...modal.prefill, ...fields }
              : fields
            return modal.id
              ? updateAllergen(modal.id, data)
              : addAllergen(activeProfile.id, data)
          }}
        />
      )}
    </div>
  )
}
