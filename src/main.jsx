import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ErrorBoundary } from './components/Common/ErrorBoundary.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { AppRouter } from './AppRouter.jsx'

// Debug: Log that app is starting
console.log('═══════════════════════════════════════════════════════════');
console.log('🚀 FOCUSBOARD APP STARTING');
console.log('═══════════════════════════════════════════════════════════');
console.log('📦 Build Information:');
console.log('   Build time:', new Date().toISOString());
console.log('   Environment:', import.meta.env.MODE);
console.log('   Dev mode:', import.meta.env.DEV);
console.log('   Prod mode:', import.meta.env.PROD);
console.log('');
console.log('🔑 Environment Variables:');
const viteVars = Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'));
viteVars.forEach(key => {
  const value = import.meta.env[key];
  // Mask sensitive values
  const displayValue = key.includes('SECRET') || key.includes('KEY') 
    ? (value ? '***' + value.slice(-4) : 'undefined')
    : value;
  console.log(`   ${key}:`, displayValue || '(not set)');
});
console.log('═══════════════════════════════════════════════════════════');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
