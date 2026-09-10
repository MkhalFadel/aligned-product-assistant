import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import productFallback from '../../assets/productFallback.svg'
import { getCategoryLabel, getProductSpecifications } from '../../components/catalogue/productAttributes'
import { getProductById } from '../../services/productApi'
import styles from './productDetails.module.css'

function formatPrice(price) {
   return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
   }).format(price)
}

function getLoadError(error) {
   if (error.status === 404) {
      return {
         title: 'Product unavailable',
         message: 'This product cannot be found or is no longer available in the catalogue.',
      }
   }

   if (error.message === 'VITE_API_URL is not configured.') {
      return {
         title: 'Products are unavailable',
         message: 'Product details are not configured. Please try again later.',
      }
   }

   return {
      title: 'Unable to load product',
      message: 'Please try again later or return to the catalogue.',
   }
}

// Shows customer-safe details for one active catalogue product.
function ProductDetails() {
   const { id } = useParams()
   const [product, setProduct] = useState(null)
   const [isLoading, setIsLoading] = useState(true)
   const [loadError, setLoadError] = useState(null)
   const [hasImageError, setHasImageError] = useState(false)

   useEffect(() => {
      let isCurrent = true

      async function loadProduct() {
         setIsLoading(true)
         setLoadError(null)
         setProduct(null)
         setHasImageError(false)

         try {
            const nextProduct = await getProductById(id)

            if (isCurrent) {
               setProduct(nextProduct)
               setHasImageError(!nextProduct.imageUrl)
            }
         } catch (error) {
            if (isCurrent) {
               setLoadError(getLoadError(error))
            }
         } finally {
            if (isCurrent) {
               setIsLoading(false)
            }
         }
      }

      loadProduct()

      return () => {
         isCurrent = false
      }
   }, [id])

   const specifications = product ? getProductSpecifications(product) : []

   return (
      <main className={styles.page}>
         <header className={styles.siteHeader}>
            <div className={styles.navigation}>
               <Link className={styles.brand} to="/">Aligned Tech</Link>
               <nav className={styles.navLinks} aria-label="Customer navigation">
                  <Link to="/">Browse products</Link>
                  <Link to="/chat">Ask the Assistant</Link>
               </nav>
            </div>
         </header>

         <div className={styles.content}>
            <Link className={styles.backLink} to="/">Back to products</Link>

            {isLoading && <p className={styles.loading}>Loading product details...</p>}

            {!isLoading && loadError && (
               <section className={styles.errorState} role="alert" aria-labelledby="product-error-title">
                  <h1 id="product-error-title">{loadError.title}</h1>
                  <p>{loadError.message}</p>
                  <Link to="/">Back to products</Link>
               </section>
            )}

            {!isLoading && product && (
               <>
                  <section className={styles.productHero} aria-labelledby="product-title">
                     <div className={styles.imagePanel}>
                        {hasImageError ? (
                           <img className={styles.imageFallback} src={productFallback} alt={`${product.name} image unavailable`} />
                        ) : (
                           <img
                              className={styles.productImage}
                              src={product.imageUrl}
                              alt={product.name}
                              onError={() => setHasImageError(true)}
                           />
                        )}
                     </div>

                     <div className={styles.productContent}>
                        <p className={styles.category}>{getCategoryLabel(product.category)}</p>
                        <h1 id="product-title">{product.name}</h1>
                        <p className={styles.price}>{formatPrice(product.price)}</p>
                        <p className={styles.description}>{product.description}</p>
                        <Link
                           className={styles.assistantButton}
                           to="/chat"
                           state={{ productId: product.id, productName: product.name }}
                        >
                           Ask the assistant about this product
                        </Link>
                     </div>
                  </section>

                  <section className={styles.specificationsSection} aria-labelledby="specifications-title">
                     <div className={styles.sectionHeading}>
                        <p className={styles.eyebrow}>Product details</p>
                        <h2 id="specifications-title">Specifications</h2>
                     </div>

                     {specifications.length > 0 ? (
                        <dl className={styles.specifications}>
                           {specifications.map((specification) => (
                              <div key={specification.key}>
                                 <dt>{specification.label}</dt>
                                 <dd>{specification.value}</dd>
                              </div>
                           ))}
                        </dl>
                     ) : (
                        <p className={styles.emptySpecifications}>Detailed specifications are not available for this product.</p>
                     )}
                  </section>
               </>
            )}
         </div>
      </main>
   )
}

export default ProductDetails
