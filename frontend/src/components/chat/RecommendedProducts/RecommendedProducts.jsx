import { useState } from 'react'
import styles from './recommendedProducts.module.css'

function formatPrice(price) {
   return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
   }).format(price)
}

function RecommendedProductImage({ product }) {
   const [hasImageError, setHasImageError] = useState(!product.imageUrl)

   if (hasImageError) {
      return <div className={styles.imageFallback} role="img" aria-label={`${product.name} image unavailable`}>Image unavailable</div>
   }

   return (
      <img
         className={styles.image}
         src={product.imageUrl}
         alt={product.name}
         onError={() => setHasImageError(true)}
      />
   )
}

function RecommendedProducts({ recommendations }) {
   if (recommendations.length === 0) {
      return null
   }

   return (
      <section className={styles.section} aria-label="Recommended products">
         <h3>Recommended for you</h3>
         <ul className={styles.list}>
            {recommendations.map((recommendation) => (
               <li key={recommendation.id} className={styles.card}>
                  <div className={styles.imageWrap}>
                     <RecommendedProductImage product={recommendation.product} />
                  </div>
                  <div className={styles.content}>
                     <strong>{recommendation.product.name}</strong>
                     <span className={styles.productDetails}>{recommendation.product.category} · {formatPrice(recommendation.product.price)}</span>
                     <p>{recommendation.reason}</p>
                  </div>
               </li>
            ))}
         </ul>
      </section>
   )
}

export default RecommendedProducts
