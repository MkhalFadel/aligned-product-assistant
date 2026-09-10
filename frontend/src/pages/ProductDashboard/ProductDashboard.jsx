import { useEffect, useRef, useState } from 'react'
import ConfirmModal from '../../components/common/ConfirmModal/ConfirmModal'
import FeedbackMessage from '../../components/common/FeedbackMessage/FeedbackMessage'
import DashboardNav from '../../components/dashboard/DashboardNav/DashboardNav'
import ProductForm from '../../components/products/ProductForm/ProductForm'
import ProductTable from '../../components/products/ProductTable/ProductTable'
import {
   activateProduct,
   createProduct,
   deleteProduct,
   getProducts,
   permanentlyDeleteProduct,
   updateProduct,
} from '../../services/productApi'
import styles from './productDashboard.module.css'

function getErrorMessage(error, fallbackMessage) {
   if (error.message === 'VITE_API_URL is not configured.') {
      return 'Product API URL is not configured. Set VITE_API_URL and restart the frontend.'
   }

   return fallbackMessage
}

function getPermanentDeleteErrorMessage(error) {
   if (error.message.includes('recommendation history')) {
      return 'This product has recommendation history and cannot be permanently deleted. Deactivate it instead.'
   }

   return getErrorMessage(error, 'Failed to permanently delete product. Please try again.')
}

// Coordinates product loading and catalogue mutations for the dashboard.
function ProductDashboard() {
   const [products, setProducts] = useState([])
   const [isLoading, setIsLoading] = useState(true)
   const [feedback, setFeedback] = useState(null)
   const [formMode, setFormMode] = useState('')
   const [selectedProduct, setSelectedProduct] = useState(null)
   const [isSaving, setIsSaving] = useState(false)
   const [activatingId, setActivatingId] = useState('')
   const [deactivatingId, setDeactivatingId] = useState('')
   const [deletingId, setDeletingId] = useState('')
   const [confirmation, setConfirmation] = useState(null)
   const actionTriggerRef = useRef(null)

   const isConfirmationLoading = confirmation?.type === 'deactivate'
      ? deactivatingId === confirmation.product.id
      : confirmation?.type === 'delete' && deletingId === confirmation.product.id

   const confirmationContent = confirmation?.type === 'deactivate'
      ?  {
            title: 'Deactivate product',
            message: `Deactivate "${confirmation.product.name}"? This product will no longer be available for customer recommendations. You can reactivate it later.`,
            confirmText: 'Deactivate',
            variant: 'normal',
         }
      :  {
            title: 'Delete product permanently',
            message: confirmation ? `Permanently delete "${confirmation.product.name}"? This will permanently delete the product and cannot be undone. Products with recommendation history cannot be permanently deleted.` : '',
            confirmText: 'Delete permanently',
            variant: 'danger',
         }

   useEffect(() => {
      let isCurrent = true

      async function loadProducts() {
         try {
            const nextProducts = await getProducts()

            if (isCurrent) {
               setProducts(nextProducts)
            }
         } catch (error) {
            if (isCurrent) {
               setFeedback({
                  variant: 'error',
                  message: getErrorMessage(error, 'Failed to load products. Please try again.'),
               })
            }
         } finally {
            if (isCurrent) {
               setIsLoading(false)
            }
         }
      }

      loadProducts()

      return () => {
         isCurrent = false
      }
   }, [])

   function openCreateForm() {
      setFeedback(null)
      setSelectedProduct(null)
      setFormMode('create')
   }

   function openEditForm(product) {
      setFeedback(null)
      setSelectedProduct(product)
      setFormMode('edit')
   }

   function closeForm() {
      if (isSaving) {
         return
      }

      setFormMode('')
      setSelectedProduct(null)
   }

   // Updates local state after a mutation so the page does not need a reload.
   async function handleProductSubmit(productData) {
      setFeedback(null)
      setIsSaving(true)

      try {
         if (formMode === 'edit') {
            const updatedProduct = await updateProduct(selectedProduct.id, productData)

            setProducts((current) => current.map((product) => product.id === updatedProduct.id ? updatedProduct : product))
            setFeedback({ variant: 'success', message: 'Product updated successfully.' })
         } else {
            const createdProduct = await createProduct(productData)

            setProducts((current) => [createdProduct, ...current])
            setFeedback({ variant: 'success', message: 'Product created successfully.' })
         }

         setFormMode('')
         setSelectedProduct(null)
      } catch (error) {
         const fallbackMessage = formMode === 'edit'
            ? 'Failed to update product. Please try again.'
            : 'Failed to create product. Please try again.'

         setFeedback({ variant: 'error', message: getErrorMessage(error, fallbackMessage) })
      } finally {
         setIsSaving(false)
      }
   }

   function handleDeactivate(product, triggerElement) {
      actionTriggerRef.current = triggerElement
      setFeedback(null)
      setConfirmation({ type: 'deactivate', product })
   }

   function handlePermanentDelete(product, triggerElement) {
      actionTriggerRef.current = triggerElement
      setFeedback(null)
      setConfirmation({ type: 'delete', product })
   }

   function closeConfirmation() {
      if (isConfirmationLoading) {
         return
      }

      setConfirmation(null)
   }

   // Applies the selected confirmed action without changing local state on failure.
   async function handleConfirmation() {
      if (!confirmation || isConfirmationLoading) {
         return
      }

      const { product } = confirmation

      if (confirmation.type === 'deactivate') {
         setDeactivatingId(product.id)

         try {
            const deactivatedProduct = await deleteProduct(product.id)

            setProducts((current) => current.map((item) => item.id === deactivatedProduct.id ? deactivatedProduct : item))
            setConfirmation(null)
            setFeedback({ variant: 'success', message: 'Product deactivated successfully.' })
         } catch (error) {
            setConfirmation(null)
            setFeedback({
               variant: 'error',
               message: getErrorMessage(error, 'Failed to deactivate product. Please try again.'),
            })
         } finally {
            setDeactivatingId('')
         }

         return
      }

      setDeletingId(product.id)

      try {
         await permanentlyDeleteProduct(product.id)

         setProducts((current) => current.filter((item) => item.id !== product.id))
         setConfirmation(null)
         setFeedback({ variant: 'success', message: 'Product deleted successfully.' })
      } catch (error) {
         setConfirmation(null)
         setFeedback({ variant: 'error', message: getPermanentDeleteErrorMessage(error) })
      } finally {
         setDeletingId('')
      }
   }

   async function handleActivate(product) {
      setFeedback(null)
      setActivatingId(product.id)

      try {
         const activatedProduct = await activateProduct(product.id)

         setProducts((current) => current.map((item) => item.id === activatedProduct.id ? activatedProduct : item))
         setFeedback({ variant: 'success', message: 'Product reactivated successfully.' })
      } catch (error) {
         setFeedback({
            variant: 'error',
            message: getErrorMessage(error, 'Failed to reactivate product. Please try again.'),
         })
      } finally {
         setActivatingId('')
      }
   }

   return (
      <main className={styles.page}>
         <div className={styles.content}>
            <DashboardNav />
            <header className={styles.header}>
               <div>
                  <p className={styles.eyebrow}>Catalogue management</p>
                  <h1>Products</h1>
                  <p className={styles.description}>Manage the products available for recommendations and keep your catalogue current.</p>
               </div>
               <button type="button" className={styles.addButton} onClick={openCreateForm}>Add product</button>
            </header>

            <FeedbackMessage message={feedback?.message} variant={feedback?.variant} />

            {formMode && (
               <section
                  className={styles.formCard}
                  aria-label={formMode === 'edit' ? 'Edit product form' : 'Add product form'}
               >
                  <ProductForm
                     key={`${formMode}-${selectedProduct?.id || 'new'}`}
                     mode={formMode}
                     product={selectedProduct}
                     isSaving={isSaving}
                     onCancel={closeForm}
                     onSubmit={handleProductSubmit}
                  />
               </section>
            )}

            <section className={styles.listCard} aria-label="Product catalogue">
               {isLoading && <p className={styles.loading}>Loading products...</p>}
               {!isLoading && products.length === 0 && (
                  <div className={styles.emptyState}>
                     <h2>No products yet</h2>
                     <p>Add your first catalogue item to make it available for future recommendations.</p>
                     <button type="button" className={styles.addButton} onClick={openCreateForm}>Add product</button>
                  </div>
               )}
               {!isLoading && products.length > 0 && (
                  <ProductTable
                     products={products}
                     onEdit={openEditForm}
                     onDeactivate={handleDeactivate}
                     onActivate={handleActivate}
                     onPermanentDelete={handlePermanentDelete}
                     activatingId={activatingId}
                     deactivatingId={deactivatingId}
                     deletingId={deletingId}
                  />
               )}
            </section>
         </div>
         <ConfirmModal
            isOpen={Boolean(confirmation)}
            title={confirmationContent.title}
            message={confirmationContent.message}
            confirmText={confirmationContent.confirmText}
            cancelText="Cancel"
            variant={confirmationContent.variant}
            isLoading={isConfirmationLoading}
            onConfirm={handleConfirmation}
            onCancel={closeConfirmation}
            returnFocusRef={actionTriggerRef}
         />
      </main>
   )
}

export default ProductDashboard
