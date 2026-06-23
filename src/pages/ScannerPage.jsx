import { useEffect, useRef, useState } from 'react'
import { ScanLine, X, AlertTriangle, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react'
import { BrowserMultiFormatReader } from '@zxing/library'
import { useProfileStore } from '../store/profileStore'
import { useAllergenStore } from '../store/allergenStore'
import { lookupBarcode, assessProduct, getIngredients } from '../lib/openFoodFacts'
import { supabase } from '../lib/supabase'
import { SEVERITY_STYLES } from '../lib/constants'

const RESULT_CONFIG = {
  safe:    { icon: CheckCircle,   bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  label: 'Safe to eat' },
  warning: { icon: AlertCircle,   bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  label: 'May contain traces' },
  unsafe:  { icon: AlertTriangle, bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    label: 'Contains allergens' },
  unknown: { icon: HelpCircle,    bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-600',   label: 'Product not found' },
}

function ResultCard({ product, result, flagged, onClose, onScanAgain }) {
  const cfg = RESULT_CONFIG[result]
  const Icon = cfg.icon
  const ingredients = getIngredients(product)
  const flaggedNames = new Set(flagged.map((f) => f.name.toLowerCase()))

  return (
    <div className={`rounded-2xl border-2 ${cfg.bg} ${cfg.border} p-5 space-y-4`}>
      <div className="flex items-start gap-3">
        <Icon size={24} className={`${cfg.text} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-lg ${cfg.text}`}>{cfg.label}</p>
          {product ? (
            <div className="mt-1">
              {product.image_front_small_url && (
                <img src={product.image_front_small_url} alt="" className="w-16 h-16 object-contain rounded-lg mb-2" />
              )}
              <p className="font-semibold text-gray-900">{product.product_name || 'Unknown product'}</p>
              {product.brands && <p className="text-sm text-gray-500">{product.brands}</p>}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-1">No product data found for this barcode</p>
          )}
        </div>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 shrink-0">
          <X size={18} />
        </button>
      </div>

      {flagged.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Flagged allergens</p>
          {flagged.map((a) => (
            <div key={a.id} className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SEVERITY_STYLES[a.severity]?.badge}`}>
                {a.name}
              </span>
              <span className="text-xs text-gray-400">{a.match === 'traces' ? 'traces / may contain' : 'listed allergen'}</span>
            </div>
          ))}
        </div>
      )}

      {ingredients.length > 0 && (
        <div className="bg-white/70 rounded-xl p-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Ingredients</p>
          <p className="text-xs text-gray-600 leading-relaxed">
            {product.ingredients_text.split(/([,;])/).map((part, i) => {
              const lower = part.toLowerCase().trim()
              const isAllergen = [...flaggedNames].some((n) => lower.includes(n))
              return isAllergen
                ? <mark key={i} className="bg-red-200 text-red-800 rounded px-0.5 not-italic">{part}</mark>
                : <span key={i}>{part}</span>
            })}
          </p>
        </div>
      )}

      <button
        onClick={onScanAgain}
        className="w-full py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        Scan another
      </button>
    </div>
  )
}

export default function ScannerPage() {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const [scanning, setScanning] = useState(false)
  const [manualBarcode, setManualBarcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scanResult, setScanResult] = useState(null) // { product, result, flagged }
  const [cameraError, setCameraError] = useState('')

  const { activeProfile } = useProfileStore()
  const { allergens, fetchAllergens } = useAllergenStore()

  useEffect(() => {
    if (activeProfile?.id) fetchAllergens(activeProfile.id)
  }, [activeProfile?.id])

  const startScanner = async () => {
    setCameraError('')
    setScanResult(null)
    setScanning(true)
    try {
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader
      await reader.decodeFromVideoDevice(null, videoRef.current, async (result, err) => {
        if (result) {
          stopScanner()
          await handleLookup(result.getText())
        }
      })
    } catch (e) {
      setCameraError('Camera access denied or unavailable')
      setScanning(false)
    }
  }

  const stopScanner = () => {
    readerRef.current?.reset()
    setScanning(false)
  }

  useEffect(() => () => readerRef.current?.reset(), [])

  const handleLookup = async (barcode) => {
    setLoading(true)
    setError('')
    try {
      const product = await lookupBarcode(barcode)
      const { result, flagged } = assessProduct(product, allergens)
      setScanResult({ product, result, flagged, barcode })

      if (activeProfile?.id) {
        await supabase.from('scan_history').insert({
          profile_id: activeProfile.id,
          barcode,
          product_name: product?.product_name ?? null,
          brand: product?.brands ?? null,
          image_url: product?.image_front_small_url ?? null,
          result,
          flagged_allergens: flagged,
        })
      }
    } catch {
      setError('Failed to look up product. Check your connection.')
    }
    setLoading(false)
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    if (!manualBarcode.trim()) return
    await handleLookup(manualBarcode.trim())
    setManualBarcode('')
  }

  if (!activeProfile) {
    return <div className="p-8 text-sm text-gray-400">No active profile. Go to Profiles to set one.</div>
  }

  return (
    <div className="p-6 max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Scan food</h1>
        <p className="text-sm text-gray-400 mt-0.5">{activeProfile.avatar_emoji} {activeProfile.name}</p>
      </div>

      {/* Camera viewer */}
      <div className="relative bg-black rounded-2xl overflow-hidden aspect-[4/3]">
        <video ref={videoRef} className="w-full h-full object-cover" />
        {!scanning && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-900/80">
            {cameraError ? (
              <p className="text-sm text-red-400 text-center px-6">{cameraError}</p>
            ) : (
              <ScanLine size={40} className="text-white/40" />
            )}
            <button
              onClick={startScanner}
              className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-xl"
            >
              {cameraError ? 'Try again' : 'Start camera'}
            </button>
          </div>
        )}
        {scanning && (
          <>
            {/* Scan overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-56 border-2 border-green-400 rounded-xl opacity-80" />
            </div>
            <button
              onClick={stopScanner}
              className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
            >
              <X size={16} />
            </button>
            <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-white/70">
              Point at a barcode
            </p>
          </>
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
            <p className="text-white text-sm">Looking up product…</p>
          </div>
        )}
      </div>

      {/* Result */}
      {scanResult && !loading && (
        <ResultCard
          {...scanResult}
          onClose={() => setScanResult(null)}
          onScanAgain={() => { setScanResult(null); startScanner() }}
        />
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {/* Manual entry */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Or enter barcode manually</p>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            placeholder="e.g. 5000159484695"
            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            disabled={loading || !manualBarcode.trim()}
            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg"
          >
            Check
          </button>
        </form>
      </div>
    </div>
  )
}
