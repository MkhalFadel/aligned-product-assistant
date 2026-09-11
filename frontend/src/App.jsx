import { Navigate, Route, Routes } from 'react-router-dom'
import ConversationDashboard from './pages/ConversationDashboard/ConversationDashboard'
import ConversationDetails from './pages/ConversationDetails/ConversationDetails'
import CustomerChat from './pages/CustomerChat/CustomerChat'
import ConversationReport from './pages/ConversationReport/ConversationReport'
import AssistantSettings from './pages/AssistantSettings/AssistantSettings'
import ProductCatalogue from './pages/ProductCatalogue/ProductCatalogue'
import ProductDashboard from './pages/ProductDashboard/ProductDashboard'
import ProductDetails from './pages/ProductDetails/ProductDetails'

function App() {
   return (
      <Routes>
         <Route path="/" element={<ProductCatalogue />} />
         <Route path="/products/:id" element={<ProductDetails />} />
         <Route path="/chat" element={<CustomerChat />} />
         <Route path="/report/:token" element={<ConversationReport />} />
         <Route path="/dashboard/products" element={<ProductDashboard />} />
         <Route path="/dashboard/conversations" element={<ConversationDashboard />} />
         <Route path="/dashboard/conversations/:id" element={<ConversationDetails />} />
         <Route path="/dashboard/settings" element={<AssistantSettings />} />
         <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
   )
}

export default App
