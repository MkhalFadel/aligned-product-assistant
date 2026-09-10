import { useState } from 'react'
import { Link } from 'react-router-dom'
import productFallback from '../../../assets/productFallback.svg'
import { getCategoryLabel, getProductHighlights } from '../productAttributes'
import styles from './productCard.module.css'

function formatPrice(price) {
   if (typeof price !== 'number' || !Number.isFinite(price)) {
      return 'Price unavailable'
   }

   return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
   }).format(price)
}

// Keeps the card layout intact when a catalogue image cannot load.
function ProductCard({ product }) {
   const [hasImageError, setHasImageError] = useState(!product.imageUrl)
   const highlights = getProductHighlights(product)

   return (
      <article className={styles.card}>
         <div className={styles.imageWrap}>
            {hasImageError ? (
               <img className={styles.imageFallback} src={productFallback} alt={`${product.name} image unavailable`} />
            ) : (
               <img
                  className={styles.image}
                  src={product.imageUrl}
                  alt={product.name}
                  onError={() => setHasImageError(true)}
               />
            )}
         </div>

         <div className={styles.content}>
            <p className={styles.category}>{getCategoryLabel(product.category)}</p>
            <h3>{product.name}</h3>
            <p className={styles.price}>{formatPrice(product.price)}</p>
            <p className={styles.description}>{product.description}</p>

            {highlights.length > 0 && (
               <dl className={styles.attributes}>
                  {highlights.map((highlight) => (
                     <div key={highlight.label}>
                        <dt>{highlight.label}</dt>
                        <dd>{highlight.value}</dd>
                     </div>
                  ))}
               </dl>
            )}

            <Link className={styles.detailsLink} to={`/products/${product.id}`}>View details</Link>
         </div>
      </article>
   )
}

export default ProductCard
