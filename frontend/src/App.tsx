import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ChatHomePage from './components/ChatHomePage'
import { LanguageProvider } from './i18n/LanguageContext'

const queryClient = new QueryClient()

function App() {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* 首页路由 - 显示聊天界面 */}
            <Route path="/" element={<ChatHomePage />} />
            
            {/* 仪表板路由 - 显示完整分析界面 */}
            <Route 
              path="/dashboard" 
              element={
                <div className="flex h-screen bg-gray-100">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                      <Dashboard />
                    </main>
                  </div>
                </div>
              } 
            />
            
            {/* 重定向其他未匹配路径到首页 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </LanguageProvider>
  )
}

export default App 