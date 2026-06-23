import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, AlertCircle, HelpCircle, Trash2 } from 'lucide-react'
import { useProfileStore } from '../store/profileStore'
import { supabase } from '../lib/supabase'
import { SEVERITY_STYLES } from '../lib/constants'
import { formatDistanceToNow, parseISO } from 'date-fns'

const RESULT_CONFIG = {
  safe:    { icon: CheckCircle,   color: 'text-green-500',  bg: 'bg-green-50',  label: 'Safe' },
  warning: { icon: AlertCircle,   color: 'text-amber-500',  bg: 'bg-amber-50',  label: 'Traces' },
  unsafe:  { icon: AlertTriangle, color: 'text-red-500',    bg: 'bg-red-50',    label: 'Unsafe' },
  unknown: { icon: HelpCircle,    color: 'text-gray-400',   bg: 'bg-gray-50',   label: 'Unknown' },
}

export default function HistoryPage() {
  const { activeProfile } = useProfileStore()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = async (profileId) => {
    setLoading(true)
    const { data } = await supabase
      .from('scan_history')
      .select('*')
      .eq('profile_id', profileId)
      .order('scanned_at', { ascending: false })
      .limit(50)
    setHistory(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (activeProfile?.id) fetchHistory(activeProfile.id)
  }, [activeProfile?.id])

  const handleDelete = async (id) => {
    await supabase.from('scan_history').delete().eq('id', id)
    setHistory((h) => h.filter((s) => s.id !== id))
  }

  if (!activeProfile) {
    return <div className="p-8 text-sm text-gray-400">No active profile. Go to Profiles to set one.</div>
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Scan history</h1>
          <p className="text-sm text-gray-400 mt-0.5">{activeProfile.avatar_emoji} {activeProfile.name}</p>
        </div>
        {history.length > 0 && (
          <span className="text-xs text-gray-400">{history.length} scan{history.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {loading && <div className="text-sm text-gray-400 py-8 text-center">Loading…</div>}

      {!loading && history.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium text-gray-600">No scans yet</p>
          <p className="text-sm mt-1">Scan or search for food to build up history</p>
        </div>
      )}

      {!loading && history.length > 0 && (
        <div className="space-y-2">
          {history.map((scan) => {
            const cfg = RESULT_CONFIG[scan.result] ?? RESULT_CONFIG.unknown
            const Icon = cfg.icon
            const flagged = scan.flagged_allergens ?? []

            return (
              <div key={scan.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                    <Icon size={18} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {scan.product_name || scan.barcode || 'Unknown product'}
                        </p>
                        {scan.brand && <p className="text-xs text-gray-400 truncate">{scan.brand}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                        <button
                          onClick={() => handleDelete(scan.id)}
                          className="p-1 text-gray-300 hover:text-red-400 ml-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    {flagged.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {flagged.map((a, i) => (
                          <span key={i} className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${SEVERITY_STYLES[a.severity]?.badge ?? 'bg-gray-100 text-gray-600'}`}>
                            {a.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-300 mt-1.5">
                      {formatDistanceToNow(parseISO(scan.scanned_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
