import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../../components/catalogue/ProductCard/ProductCard'
import { filterProducts } from '../../components/catalogue/catalogueFilters'
import { getAvailableCategories, getCategoryLabel } from '../../components/catalogue/productAttributes'
import { getActiveProducts } from '../../services/productApi'
import styles from './productCatalogue.module.css'

function getErrorMessage(error) {
   if (error.message === 'VITE_API_URL is not configured.') {
      return 'Product catalogue is not configured. Set VITE_API_URL and restart the frontend.'
   }

   return 'Unable to load products right now. Please try again.'
}

// Presents active catalogue products with local search and category filtering.
function ProductCatalogue() {
   const [products, setProducts] = useState([])
   const [searchTerm, setSearchTerm] = useState('')
   const [selectedCategory, setSelectedCategory] = useState('all')
   const [isLoading, setIsLoading] = useState(true)
   const [errorMessage, setErrorMessage] = useState('')
   const [reloadCount, setReloadCount] = useState(0)

   useEffect(() => {
      let isCurrent = true

      async function loadProducts() {
         setIsLoading(true)
         setErrorMessage('')

         try {
            const nextProducts = await getActiveProducts()

            if (isCurrent) {
               setProducts(nextProducts)
            }
         } catch (error) {
            if (isCurrent) {
               setErrorMessage(getErrorMessage(error))
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
   }, [reloadCount])

   const categories = getAvailableCategories(products)
   const filteredProducts = filterProducts(products, searchTerm, selectedCategory)

   function retryLoading() {
      setReloadCount((count) => count + 1)
   }

   return (
      <main className={styles.page}>
         <header className={styles.siteHeader}>
            <div className={styles.navigation}>
               <Link className={styles.brand} to="/">Aligned Tech</Link>
               <nav className={styles.navLinks} aria-label="Customer navigation">
                  <a href="#products">Products</a>
                  <Link to="/chat">Ask the Assistant</Link>
               </nav>
            </div>
         </header>

         <section className={styles.hero} aria-labelledby="catalogue-title">
            <div className={styles.heroContent}>
               <p className={styles.eyebrow}>Technology that fits your life</p>
               <h1 id="catalogue-title">Find the right tech for your needs</h1>
               <p>Browse laptops, desktop PCs, monitors, keyboards, and controllers, then ask our assistant for help choosing the right fit.</p>
               <Link className={styles.primaryButton} to="/chat">Ask the Assistant</Link>
            </div>
            <div className={styles.heroNote}>
               <strong>Browse with confidence</strong>
               <span>Clear product details, practical specifications, and guidance when you need it.</span>
            </div>
         </section>

         <section id="products" className={styles.catalogue} aria-labelledby="products-heading">
            <div className={styles.sectionHeader}>
               <div>
                  <p className={styles.eyebrow}>Browse the catalogue</p>
                  <h2 id="products-heading">Available products</h2>
               </div>
               {!isLoading && !errorMessage && products.length > 0 && (
                  <p className={styles.productCount} aria-live="polite">
                     {filteredProducts.length} of {products.length} product{products.length === 1 ? '' : 's'}
                  </p>
               )}
            </div>

            {!isLoading && !errorMessage && products.length > 0 && (
               <div className={styles.filters}>
                  <label className={styles.searchField} htmlFor="product-search">
                     Search products
                     <input
                        id="product-search"
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search by name, category, brand, or description"
                     />
                  </label>
                  <div className={styles.categoryFilters} role="group" aria-label="Filter products by category">
                     <span className={styles.filterLabel}>Category</span>
                     <div className={styles.filterButtons}>
                        <button
                           type="button"
                           className={selectedCategory === 'all' ? styles.selectedFilter : styles.filterButton}
                           onClick={() => setSelectedCategory('all')}
                           aria-pressed={selectedCategory === 'all'}
                        >
                           All
                        </button>
                        {categories.map((category) => (
                           <button
                              key={category}
                              type="button"
                              className={selectedCategory === category ? styles.selectedFilter : styles.filterButton}
                              onClick={() => setSelectedCategory(category)}
                              aria-pressed={selectedCategory === category}
                           >
                              {getCategoryLabel(category)}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
            )}

            {isLoading && <p className={styles.loading}>Loading products...</p>}

            {!isLoading && errorMessage && (
               <div className={styles.errorState} role="alert">
                  <h2>Products are unavailable</h2>
                  <p>{errorMessage}</p>
                  <button type="button" onClick={retryLoading}>Try again</button>
               </div>
            )}

            {!isLoading && !errorMessage && products.length === 0 && (
               <div className={styles.emptyState}>
                  <h2>No products are currently available.</h2>
                  <p>Please check back soon or ask the assistant when it becomes available.</p>
               </div>
            )}

            {!isLoading && !errorMessage && products.length > 0 && filteredProducts.length === 0 && (
               <div className={styles.emptyState}>
                  <h2>No products match your current search.</h2>
                  <p>Try a different search term or choose another category.</p>
               </div>
            )}

            {!isLoading && !errorMessage && filteredProducts.length > 0 && (
               <div className={styles.productGrid}>
                  {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
               </div>
            )}
         </section>

         <section className={styles.assistantCta} aria-labelledby="assistant-heading">
            <div>
               <p className={styles.eyebrow}>Need help deciding?</p>
               <h2 id="assistant-heading">Tell us what you need, and let the assistant narrow it down.</h2>
            </div>
            <Link className={styles.secondaryButton} to="/chat">Ask the Assistant</Link>
         </section>
      </main>
   )
}

export default ProductCatalogue
