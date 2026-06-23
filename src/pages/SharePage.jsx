import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertTriangle, Printer } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { SEVERITY_STYLES } from '../lib/constants'

const SEVERITY_ORDER = ['anaphylactic', 'severe', 'moderate', 'mild']

const FLAG_EMOJI = {
  halal: '☪️', kosher: '✡️', vegan: '🌱', vegetarian: '🥦',
  pescatarian: '🐟', 'gluten-free': '🌾', 'dairy-free': '🥛',
  'nut-free': '🥜', 'low-FODMAP': '🫀', 'diabetic-friendly': '💙',
}

export default function SharePage() {
  const { token } = useParams()
  const [profile, setProfile] = useState(null)
  const [allergens, setAllergens] = useState([])
  const [dietary, setDietary] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('share_token', token)
        .eq('share_enabled', true)
        .single()

      if (!p) { setNotFound(true); setLoading(false); return }

      const [{ data: a }, { data: d }] = await Promise.all([
        supabase.from('allergens').select('*').eq('profile_id', p.id).order('created_at'),
        supabase.from('dietary_flags').select('*').eq('profile_id', p.id).order('created_at'),
      ])

      setProfile(p)
      setAllergens(a ?? [])
      setDietary(d ?? [])
      setLoading(false)
    }
    load()
  }, [token])

  const grouped = SEVERITY_ORDER.reduce((acc, s) => {
    const group = allergens.filter((a) => a.severity === s)
    if (group.length) acc[s] = group
    return acc
  }, {})

  const hasAnaphylactic = allergens.some((a) => a.severity === 'anaphylactic')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">
        Loading…
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-5xl mb-4">🔒</p>
          <h1 className="text-lg font-bold text-gray-900">Profile not found</h1>
          <p className="text-sm text-gray-500 mt-2">This link may have expired or sharing has been turned off.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-6 py-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 ring-2 ring-orange-100 text-lg shadow-sm">🌿</span>
            <span className="font-bold"><span className="text-gray-900">My</span><span className="text-green-600">Allergy</span></span>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <Printer size={15} /> Print
          </button>
        </div>

        {/* Profile */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <span className="text-6xl">{profile.avatar_emoji}</span>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">{profile.name}</h1>
          {profile.dob && (
            <p className="text-sm text-gray-400 mt-1">
              b. {new Date(profile.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
          {hasAnaphylactic && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full">
              <AlertTriangle size={16} className="text-red-500" />
              <span className="text-sm font-bold text-red-700">Anaphylactic risk — carries EpiPen</span>
            </div>
          )}
        </div>

        {/* Allergens */}
        {allergens.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-4">Allergens</h2>
            <div className="space-y-4">
              {SEVERITY_ORDER.filter((s) => grouped[s]).map((s) => (
                <div key={s}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    {SEVERITY_STYLES[s].label}
                  </p>
                  <div className="space-y-2">
                    {grouped[s].map((a) => (
                      <div key={a.id} className="flex items-start gap-3">
                        <span className={`mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${SEVERITY_STYLES[s].badge}`}>
                          {a.name}
                        </span>
                        {a.notes && <p className="text-sm text-gray-500">{a.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dietary flags */}
        {dietary.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-4">Dietary requirements</h2>
            <div className="flex flex-wrap gap-2">
              {dietary.map((f) => (
                <div key={f.id} className="flex items-center gap-1.5 bg-green-50 border border-green-100 text-green-800 px-3 py-1.5 rounded-full">
                  <span>{FLAG_EMOJI[f.flag] ?? '🏷️'}</span>
                  <span className="text-sm font-medium capitalize">{f.flag}</span>
                  {f.notes && <span className="text-xs text-green-500">· {f.notes}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {allergens.length === 0 && dietary.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">No allergens or dietary flags recorded.</div>
        )}

        <p className="text-center text-xs text-gray-300 pb-4">
          Shared via MyAllergy · For my Moina &amp; Haneeni Koilja 🌸
        </p>
      </div>
    </div>
  )
}
