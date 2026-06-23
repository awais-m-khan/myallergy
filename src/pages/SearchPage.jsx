import { useState } from 'react'
import { Search, AlertTriangle, CheckCircle, AlertCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useProfileStore } from '../store/profileStore'
import { useAllergenStore } from '../store/allergenStore'
import { searchProducts, assessProduct } from '../lib/openFoodFacts'
import { supabase } from '../lib/supabase'
import { SEVERITY_STYLES } from '../lib/constants'
import { useEffect } from 'react'

const RESULT_ICON = {
  safe:    { icon: CheckCircle,   color: 'text-green-500' },
  warning: { icon: AlertCircle,   color: 'text-amber-500' },
  unsafe:  { icon: AlertTriangle, color: 'text-red-500'   },
  unknown: { icon: HelpCircle,    color: 'text-gray-400'  },
}

const RESULT_LABEL = {
  safe: 'Safe', warning: 'May contain traces', unsafe: 'Contains allergens', unknown: 'Unknown',
}

function ProductCard({ product, allergens, profileId }) {
  const [expanded, setExpanded] = useState(false)
  const [saved, setSaved] = useState(false)
  const { result, flagged } = assessProduct(product, allergens)
  const { icon: Icon, color } = RESULT_ICON[result]

  const handleSave = async () => {
    await supabase.from('scan_history').insert({
      profile_id: profileId,
      barcode: product.code ?? null,
      product_name: product.product_name ?? null,
      brand: product.brands ?? null,
      image_url: product.image_front_small_url ?? null,
      result,
      flagged_allergens: flagged,
    })
    setSaved(true)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setExpanded((x) => !x)}>
        {product.image_front_small_url ? (
          <img src={product.image_front_small_url} alt="" className="w-12 h-12 object-contain rounded-lg bg-gray-50 shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-gray-300 text-xl">🛒</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{product.product_name || 'Unknown product'}</p>
          {product.brands && <p className="text-xs text-gray-400 truncate">{product.brands}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Icon size={18} className={color} />
          {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3">
          <p className={`text-sm font-semibold ${RESULT_ICON[result].color}`}>{RESULT_LABEL[result]}</p>

          {flagged.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-400 font-medium">Flagged allergens</p>
              <div className="flex flex-wrap gap-1.5">
                {flagged.map((a) => (
                  <span key={a.id} className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SEVERITY_STYLES[a.severity]?.badge}`}>
                    {a.name} {a.match === 'traces' ? '(traces)' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profileId && (
            <button
              onClick={handleSave}
              disabled={saved}
              className="text-xs font-medium text-green-600 hover:text-green-700 disabled:text-gray-400"
            >
              {saved ? '✓ Saved to history' : '+ Save to history'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  const { activeProfile } = useProfileStore()
  const { allergens, fetchAllergens } = useAllergenStore()

  useEffect(() => {
    if (activeProfile?.id) fetchAllergens(activeProfile.id)
  }, [activeProfile?.id])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setSearched(true)
    try {
      const products = await searchProducts(query.trim())
      setResults(products)
    } catch {
      setError('Search failed. Check your connection.')
    }
    setLoading(false)
  }

  if (!activeProfile) {
    return <div className="p-8 text-sm text-gray-400">No active profile. Go to Profiles to set one.</div>
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Search food</h1>
        <p className="text-sm text-gray-400 mt-0.5">{activeProfile.avatar_emoji} {activeProfile.name}</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by product name…"
          className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center gap-2"
        >
          <Search size={16} />
          <span className="hidden sm:inline">Search</span>
        </button>
      </form>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {loading && (
        <div className="text-center py-12 text-sm text-gray-400">Searching Open Food Facts…</div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">🔍</p>
          <p className="font-medium text-gray-600">No products found</p>
          <p className="text-sm mt-1">Try a different search term</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">{results.length} results for "{query}"</p>
          {results.map((p) => (
            <ProductCard
              key={p.code}
              product={p}
              allergens={allergens}
              profileId={activeProfile?.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
