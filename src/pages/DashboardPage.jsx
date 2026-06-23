import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ScanLine, Search, AlertTriangle, Leaf, ChevronRight, Users, CheckCircle, XCircle } from 'lucide-react'
import { useProfileStore } from '../store/profileStore'
import { useAllergenStore } from '../store/allergenStore'
import { useDietaryStore } from '../store/dietaryStore'
import { SEVERITY_STYLES } from '../lib/constants'
import { getFoodSuggestions } from '../lib/commonFoods'

const SEVERITY_ORDER = ['anaphylactic', 'severe', 'moderate', 'mild']

function Avatar({ profile, size = 'md' }) {
  const dim = size === 'lg' ? 'w-14 h-14 text-4xl' : 'w-10 h-10 text-2xl'
  if (profile.avatar_url) {
    return <img src={profile.avatar_url} alt={profile.name} className={`${dim} rounded-full object-cover shrink-0`} />
  }
  return <span className={`${dim} flex items-center justify-center shrink-0`}>{profile.avatar_emoji}</span>
}

function SeverityBadge({ severity }) {
  const { badge, label } = SEVERITY_STYLES[severity] ?? {}
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${badge}`}>{label}</span>
}

function FamilySummary({ profiles, activeProfile, allergensByProfile, onSwitch }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Family overview</h2>
        <Link to="/profiles" className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-0.5">
          Manage <ChevronRight size={13} />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {profiles.map((p) => {
          const isActive = activeProfile?.id === p.id
          const counts = allergensByProfile[p.id] ?? {}
          const topSeverity = SEVERITY_ORDER.find((s) => counts[s] > 0)
          return (
            <button
              key={p.id}
              onClick={() => onSwitch(p)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors text-center ${
                isActive ? 'border-green-400 bg-green-50' : 'border-gray-100 hover:border-gray-200 bg-white'
              }`}
            >
              <Avatar profile={p} size="md" />
              <div>
                <p className="text-sm font-semibold text-gray-900 truncate max-w-[80px]">{p.name}</p>
                {topSeverity && (
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${SEVERITY_STYLES[topSeverity].badge}`}>
                    {counts[topSeverity]} {SEVERITY_STYLES[topSeverity].label.toLowerCase()}
                  </span>
                )}
                {!topSeverity && (
                  <span className="text-xs text-gray-400">No allergens</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FoodSuggestions({ allergens }) {
  if (allergens.length === 0) return null
  const { safe, unsafe } = getFoodSuggestions(allergens)

  return (
    <div className="space-y-3">
      {safe.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle size={18} className="text-green-500" /> Top 10 safe foods
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {safe.map((f) => (
              <div key={f.name} className="flex items-center gap-1.5 text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                {f.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {unsafe.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <XCircle size={18} className="text-red-400" /> Top 10 to avoid
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {unsafe.map((f) => (
              <div key={f.name} className="flex items-center gap-1.5 text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                {f.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { activeProfile, profiles, setActive, loading: profileLoading } = useProfileStore()
  const { allergens, fetchAllergens } = useAllergenStore()
  const { flags, fetchFlags } = useDietaryStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (activeProfile?.id) {
      fetchAllergens(activeProfile.id)
      fetchFlags(activeProfile.id)
    }
  }, [activeProfile?.id])

  const handleSwitch = async (profile) => {
    await setActive(profile)
  }

  const grouped = SEVERITY_ORDER.reduce((acc, s) => {
    const group = allergens.filter((a) => a.severity === s)
    if (group.length) acc[s] = group
    return acc
  }, {})

  const allergenCountsBySeverity = SEVERITY_ORDER.reduce((acc, s) => {
    acc[s] = allergens.filter((a) => a.severity === s).length
    return acc
  }, {})

  const allergensByProfile = { [activeProfile?.id]: allergenCountsBySeverity }

  const hasAnaphylactic = allergens.some((a) => a.severity === 'anaphylactic')

  if (profileLoading) return <div className="p-8 text-sm text-gray-400">Loading…</div>

  if (!activeProfile) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center py-20">
        <p className="text-5xl mb-4">🌿</p>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Welcome to MyAllergy</h2>
        <p className="text-sm text-gray-500 mb-6">Create a profile to get started</p>
        <Link to="/profiles" className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg">
          <Users size={16} /> Create profile
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">

      {/* Family summary — only when 2+ profiles */}
      {profiles.length > 1 && (
        <FamilySummary
          profiles={profiles}
          activeProfile={activeProfile}
          allergensByProfile={allergensByProfile}
          onSwitch={handleSwitch}
        />
      )}

      {/* Active profile header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
        <Avatar profile={activeProfile} size="lg" />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">{activeProfile.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {allergens.length} allergen{allergens.length !== 1 ? 's' : ''}
            {flags.length > 0 && ` · ${flags.length} dietary flag${flags.length !== 1 ? 's' : ''}`}
          </p>
          {hasAnaphylactic && (
            <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
              <AlertTriangle size={11} /> Anaphylactic risk
            </span>
          )}
        </div>
        {profiles.length > 1 && (
          <Link to="/profiles" className="shrink-0 text-xs text-gray-400 hover:text-gray-700 flex items-center gap-0.5">
            Switch <ChevronRight size={13} />
          </Link>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/scanner" className="bg-green-600 hover:bg-green-700 text-white rounded-2xl p-5 flex flex-col gap-2 transition-colors">
          <ScanLine size={24} />
          <span className="font-semibold">Scan food</span>
          <span className="text-xs text-green-100">Check a barcode</span>
        </Link>
        <Link to="/search" className="bg-white hover:bg-gray-50 border border-gray-100 text-gray-900 rounded-2xl p-5 flex flex-col gap-2 transition-colors">
          <Search size={24} className="text-green-600" />
          <span className="font-semibold">Search food</span>
          <span className="text-xs text-gray-400">By name</span>
        </Link>
      </div>

      {/* Allergens summary */}
      {allergens.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Allergens</h2>
            <Link to="/allergens" className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-0.5">
              Manage <ChevronRight size={13} />
            </Link>
          </div>
          <div className="space-y-3">
            {SEVERITY_ORDER.filter((s) => grouped[s]).map((s) => (
              <div key={s}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{SEVERITY_STYLES[s].label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {grouped[s].map((a) => (
                    <span key={a.id} className={`px-2.5 py-1 rounded-full text-xs font-medium ${SEVERITY_STYLES[s].badge}`}>
                      {a.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dietary flags summary */}
      {flags.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Dietary requirements</h2>
            <Link to="/dietary" className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-0.5">
              Manage <ChevronRight size={13} />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {flags.map((f) => (
              <span key={f.id} className="bg-green-50 border border-green-100 text-green-800 text-xs font-medium px-3 py-1.5 rounded-full capitalize">
                {f.flag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Food suggestions */}
      <FoodSuggestions allergens={allergens} />

      {/* Empty state CTAs */}
      {allergens.length === 0 && (
        <Link to="/allergens" className="block bg-amber-50 border border-amber-100 rounded-2xl p-5 hover:bg-amber-100 transition-colors">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-amber-500 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900 text-sm">No allergens added yet</p>
              <p className="text-xs text-amber-600 mt-0.5">Add allergens to enable food scanning</p>
            </div>
            <ChevronRight size={16} className="text-amber-400 ml-auto shrink-0" />
          </div>
        </Link>
      )}

      {flags.length === 0 && (
        <Link to="/dietary" className="block bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-3">
            <Leaf size={20} className="text-green-500 shrink-0" />
            <div>
              <p className="font-semibold text-gray-700 text-sm">Add dietary requirements</p>
              <p className="text-xs text-gray-400 mt-0.5">Halal, kosher, vegan and more</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 ml-auto shrink-0" />
          </div>
        </Link>
      )}
    </div>
  )
}
