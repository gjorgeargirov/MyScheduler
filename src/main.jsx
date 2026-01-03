import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AIKanbanScheduler from './App.jsx'
import { ErrorBoundary } from './components/Common/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AIKanbanScheduler />
    </ErrorBoundary>
  </StrictMode>,
)
