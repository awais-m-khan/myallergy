import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

const AuthPage     = lazy(() => import('./pages/AuthPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ProfilesPage  = lazy(() => import('./pages/ProfilesPage'))
const AllergensPage = lazy(() => import('./pages/AllergensPage'))
const DietaryPage   = lazy(() => import('./pages/DietaryPage'))
const ScannerPage   = lazy(() => import('./pages/ScannerPage'))
const SearchPage    = lazy(() => import('./pages/SearchPage'))
const HistoryPage   = lazy(() => import('./pages/HistoryPage'))
const SharePage     = lazy(() => import('./pages/SharePage'))

function PageLoader() {
  return <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Loading…</div>
}

function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => { init() }, [init])

  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/auth" element={<AuthPage />} />

      <Route path="/"          element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
      <Route path="/profiles"  element={<ProtectedLayout><ProfilesPage /></ProtectedLayout>} />
      <Route path="/allergens" element={<ProtectedLayout><AllergensPage /></ProtectedLayout>} />
      <Route path="/dietary"   element={<ProtectedLayout><DietaryPage /></ProtectedLayout>} />
      <Route path="/scanner"   element={<ProtectedLayout><ScannerPage /></ProtectedLayout>} />
      <Route path="/search"    element={<ProtectedLayout><SearchPage /></ProtectedLayout>} />
      <Route path="/history"   element={<ProtectedLayout><HistoryPage /></ProtectedLayout>} />

      <Route path="/s/:token"  element={<SharePage />} />
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  )
}
