import ProductStatus from '../ProductStatus/ProductStatus'
import styles from './productTable.module.css'

function formatPrice(price) {
   return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
   }).format(price)
}

// Displays the catalogue as a table that becomes cards on smaller screens.
function ProductTable({
   products,
   onEdit,
   onDeactivate,
   onActivate,
   onPermanentDelete,
   activatingId,
   deactivatingId,
   deletingId,
}) {
   return (
      <div className={styles.tableWrap}>
         <table className={styles.table}>
            <thead>
               <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Category</th>
                  <th scope="col">Price</th>
                  <th scope="col">Status</th>
                  <th scope="col" className={styles.actionsHeading}>Actions</th>
               </tr>
            </thead>
            <tbody>
               {products.map((product) => {
                  const isActionPending = product.id === activatingId
                     || product.id === deactivatingId
                     || product.id === deletingId

                  return (
                     <tr key={product.id}>
                        <td data-label="Product">
                           <div className={styles.productCell}>
                              <img src={product.imageUrl} alt={`${product.name} product image`} className={styles.image} />
                              <div>
                                 <strong>{product.name}</strong>
                                 <p>{product.description}</p>
                              </div>
                           </div>
                        </td>
                        <td data-label="Category">{product.category}</td>
                        <td data-label="Price">{formatPrice(product.price)}</td>
                        <td data-label="Status">
                           <ProductStatus isActive={product.isActive} />
                        </td>
                        <td data-label="Actions">
                           <div className={styles.actions}>
                              <button
                                 type="button"
                                 className={styles.editButton}
                                 onClick={() => onEdit(product)}
                                 disabled={isActionPending}
                              >
                                 Edit
                              </button>
                              {product.isActive && (
                                 <button
                                    type="button"
                                    className={styles.deactivateButton}
                                    onClick={(event) => onDeactivate(product, event.currentTarget)}
                                    disabled={isActionPending}
                                 >
                                    {deactivatingId === product.id ? 'Deactivating...' : 'Deactivate'}
                                 </button>
                              )}
                              {!product.isActive && (
                                 <button
                                    type="button"
                                    className={styles.reactivateButton}
                                    onClick={() => onActivate(product)}
                                    disabled={isActionPending}
                                 >
                                    {activatingId === product.id ? 'Reactivating...' : 'Reactivate'}
                                 </button>
                              )}
                              <button
                                 type="button"
                                 className={styles.deleteButton}
                                 onClick={(event) => onPermanentDelete(product, event.currentTarget)}
                                 disabled={isActionPending}
                                 aria-label={`Permanently delete ${product.name}`}
                              >
                                 {deletingId === product.id ? 'Deleting...' : 'Delete'}
                              </button>
                           </div>
                        </td>
                     </tr>
                  )
               })}
            </tbody>
         </table>
      </div>
   )
}

export default ProductTable
