import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import './index.css'; 

import { AuthProvider } from '@/contexts/AuthContext'; 
import { useAuth } from '@/contexts/useAuth';
import { routeTree } from './routeTree.gen'

const router = createRouter({ 
  routeTree,
  context: {
    auth: undefined! //
    
  }
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// 2. Создаем промежуточный компонент
export function App() {
  const auth = useAuth(); 
  return <RouterProvider router={router} context={{ auth }} />
}

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>,
  )
}