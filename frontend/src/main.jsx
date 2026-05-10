import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'
import { queryClient } from './lib/queryClient'
import './lib/i18n'

if (new URLSearchParams(window.location.search).has('reset')) {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  </StrictMode>,
)
