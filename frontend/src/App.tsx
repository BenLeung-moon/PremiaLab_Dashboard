import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ChatHomePage } from './features/chat'
import { Dashboard } from './features/dashboard'
import { LanguageProvider } from './shared/i18n/LanguageContext'

const queryClient = new QueryClient()

function App() {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* Home route - display chat interface */}
            <Route path="/" element={<ChatHomePage />} />
            
            {/* Dashboard routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/:portfolioId" element={<Dashboard />} />
            
            {/* Redirect other unmatched paths to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </LanguageProvider>
  )
}

export default App 