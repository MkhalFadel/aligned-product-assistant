import styles from './productStatus.module.css'

// Shows the current product state with a consistent visual label.
function ProductStatus({ isActive }) {
   return (
      <span className={isActive ? styles.active : styles.inactive} role="status">
         {isActive ? 'Active' : 'Inactive'}
      </span>
   )
}

export default ProductStatus
