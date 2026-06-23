import { useState, useEffect } from 'react'
import { Search, AlertTriangle, CheckCircle, AlertCircle, HelpCircle, ChevronDown, ChevronUp, Heart } from 'lucide-react'
import { useProfileStore } from '../store/profileStore'
import { useAllergenStore } from '../store/allergenStore'
import { useLikedFoodsStore } from '../store/likedFoodsStore'
import { searchProducts, assessProduct } from '../lib/openFoodFacts'
import { supabase } from '../lib/supabase'
import { SEVERITY_STYLES } from '../lib/constants'
import { getCountry, setCountry, COUNTRIES } from '../lib/settings'

const RESULT_ICON = {
  safe:    { icon: CheckCircle,   color: 'text-green-500' },
  warning: { icon: AlertCircle,   color: 'text-amber-500' },
  unsafe:  { icon: AlertTriangle, color: 'text-red-500'   },
  unknown: { icon: HelpCircle,    color: 'text-gray-400'  },
}

const RESULT_LABEL = {
  safe: 'Safe', warning: 'May contain — check label', unsafe: 'Contains allergens', unknown: 'Unknown',
}

function ProductCard({ product, allergens, profileId, likedIds, onLike }) {
  const [expanded, setExpanded] = useState(false)
  const [saved, setSaved] = useState(false)
  const { result, flagged } = assessProduct(product, allergens)
  const { icon: Icon, color } = RESULT_ICON[result]
  const isLiked = likedIds.has(product.code)

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

  const handleLike = (e) => {
    e.stopPropagation()
    onLike(product, isLiked)
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
          <button onClick={handleLike} className="p-1">
            <Heart size={15} className={isLiked ? 'text-red-400 fill-red-400' : 'text-gray-300'} />
          </button>
          {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3">
          <p className={`text-sm font-semibold ${RESULT_ICON[result].color}`}>{RESULT_LABEL[result]}</p>

          {flagged.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-gray-400 font-medium">Flagged allergens</p>
              {flagged.map((a) => (
                <div key={a.id} className="space-y-0.5">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SEVERITY_STYLES[a.severity]?.badge}`}>
                      {a.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {a.match === 'traces' ? 'traces / may contain' : 'listed allergen'}
                    </span>
                  </div>
                  {a.exceptions && (
                    <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                      ⚠️ Exceptions noted: {a.exceptions} — check the label carefully
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {profileId && (
            <button onClick={handleSave} disabled={saved} className="text-xs font-medium text-green-600 hover:text-green-700 disabled:text-gray-400">
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
  const [country, setCountryState] = useState(getCountry())
  const [showCountryPicker, setShowCountryPicker] = useState(false)

  const { activeProfile } = useProfileStore()
  const { allergens, fetchAllergens } = useAllergenStore()
  const { likedFoods, fetchLikedFoods, addLikedFood, removeLikedFood } = useLikedFoodsStore()

  useEffect(() => {
    if (activeProfile?.id) {
      fetchAllergens(activeProfile.id)
      fetchLikedFoods(activeProfile.id)
    }
  }, [activeProfile?.id])

  const likedIds = new Set(likedFoods.map((f) => f.barcode).filter(Boolean))

  const handleLike = async (product, isLiked) => {
    if (!activeProfile?.id) return
    if (isLiked) {
      const existing = likedFoods.find((f) => f.barcode === product.code)
      if (existing) await removeLikedFood(existing.id)
    } else {
      await addLikedFood(activeProfile.id, {
        name: product.product_name || 'Unknown product',
        brand: product.brands ?? null,
        barcode: product.code ?? null,
        image_url: product.image_front_small_url ?? null,
        off_url: product.code ? `https://world.openfoodfacts.org/product/${product.code}` : null,
      })
    }
  }

  const handleCountryChange = (code) => {
    setCountry(code)
    setCountryState(code)
    setShowCountryPicker(false)
    setResults([])
    setSearched(false)
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setSearched(true)
    try {
      const products = await searchProducts(query.trim(), country)
      setResults(products)
    } catch {
      setError('Search failed. Check your connection.')
    }
    setLoading(false)
  }

  const currentCountry = COUNTRIES.find((c) => c.code === country)

  if (!activeProfile) {
    return <div className="p-8 text-sm text-gray-400">No active profile. Go to Profiles to set one.</div>
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Search food</h1>
          <p className="text-sm text-gray-400 mt-0.5">{activeProfile.avatar_emoji} {activeProfile.name}</p>
        </div>

        {/* Country picker */}
        <div className="relative">
          <button
            onClick={() => setShowCountryPicker((x) => !x)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <span>{currentCountry?.flag}</span>
            <span className="hidden sm:inline">{currentCountry?.label}</span>
            <ChevronDown size={13} className="text-gray-400" />
          </button>
          {showCountryPicker && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => handleCountryChange(c.code)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left hover:bg-gray-50 ${
                    c.code === country ? 'text-green-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  <span>{c.flag}</span> {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
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

      {loading && <div className="text-center py-12 text-sm text-gray-400">Searching Open Food Facts…</div>}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">🔍</p>
          <p className="font-medium text-gray-600">No products found</p>
          <p className="text-sm mt-1">Try switching to 🌍 Worldwide or a different term</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">{results.length} results for "{query}" in {currentCountry?.label}</p>
          {results.map((p) => (
            <ProductCard
              key={p.code}
              product={p}
              allergens={allergens}
              profileId={activeProfile?.id}
              likedIds={likedIds}
              onLike={handleLike}
            />
          ))}
        </div>
      )}
    </div>
  )
}
