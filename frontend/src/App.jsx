import { Navigate, Route, Routes } from 'react-router-dom'
import ProductDashboard from './pages/ProductDashboard/ProductDashboard'

function App() {
   return (
      <Routes>
         <Route path="/dashboard/products" element={<ProductDashboard />} />
         <Route path="*" element={<Navigate to="/dashboard/products" replace />} />
      </Routes>
   )
}

export default App
