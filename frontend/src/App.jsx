import { Navigate, Route, Routes } from 'react-router-dom'
import ConversationDashboard from './pages/ConversationDashboard/ConversationDashboard'
import ConversationDetails from './pages/ConversationDetails/ConversationDetails'
import ProductDashboard from './pages/ProductDashboard/ProductDashboard'

function App() {
   return (
      <Routes>
         <Route path="/dashboard/products" element={<ProductDashboard />} />
         <Route path="/dashboard/conversations" element={<ConversationDashboard />} />
         <Route path="/dashboard/conversations/:id" element={<ConversationDetails />} />
         <Route path="*" element={<Navigate to="/dashboard/products" replace />} />
      </Routes>
   )
}

export default App
