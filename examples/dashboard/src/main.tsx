import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { scan } from 'react-scan'
import 'virtual:uno.css'
import App from './App'
import './index.css'
import ComponentDevPage from './pages/component-dev'

if (typeof window !== 'undefined') {
  scan({
    enabled: true,
    log: false, // logs render info to console (default: false)
  })
}

// 创建路由
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/component-dev',
    element: <ComponentDevPage />,
  },
])

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />)
