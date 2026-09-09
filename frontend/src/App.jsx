import { Navigate, Route, Routes } from 'react-router-dom'
import ConversationDashboard from './pages/ConversationDashboard/ConversationDashboard'
import ConversationDetails from './pages/ConversationDetails/ConversationDetails'
import CustomerChat from './pages/CustomerChat/CustomerChat'
import ConversationReport from './pages/ConversationReport/ConversationReport'
import ProductCatalogue from './pages/ProductCatalogue/ProductCatalogue'
import ProductDashboard from './pages/ProductDashboard/ProductDashboard'

function App() {
   return (
      <Routes>
         <Route path="/" element={<ProductCatalogue />} />
         <Route path="/chat" element={<CustomerChat />} />
         <Route path="/report/:token" element={<ConversationReport />} />
         <Route path="/dashboard/products" element={<ProductDashboard />} />
         <Route path="/dashboard/conversations" element={<ConversationDashboard />} />
         <Route path="/dashboard/conversations/:id" element={<ConversationDetails />} />
         <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
   )
}

export default App
