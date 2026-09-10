import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import productFallback from '../../assets/productFallback.svg'
import FeedbackMessage from '../../components/common/FeedbackMessage/FeedbackMessage'
import { getReport, submitFeedback } from '../../services/reportApi'
import styles from './conversationReport.module.css'

function formatDateTime(value) {
   if (!value) {
      return 'Not available'
   }

   return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
   }).format(new Date(value))
}

function formatPrice(price) {
   return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
   }).format(price)
}

function getLoadErrorMessage(error) {
   if (error.status === 404) {
      return 'This conversation report could not be found.'
   }

   if (error.status === 409) {
      return 'This report is available after the conversation has ended.'
   }

   if (error.message === 'VITE_API_URL is not configured.') {
      return 'This report is not configured. Please try again later.'
   }

   return 'Unable to load this conversation report right now.'
}

function getFeedbackErrorMessage(error) {
   if (error.status === 404) {
      return 'This conversation report could not be found.'
   }

   if (error.status === 409) {
      return 'This report is available after the conversation has ended.'
   }

   return 'Unable to save your feedback right now. Please try again.'
}

function RecommendedProductImage({ product }) {
   const [hasImageError, setHasImageError] = useState(!product.imageUrl)

   if (hasImageError) {
      return <img className={styles.imageFallback} src={productFallback} alt={`${product.name} image unavailable`} />
   }

   return (
      <img
         className={styles.productImage}
         src={product.imageUrl}
         alt={product.name}
         onError={() => setHasImageError(true)}
      />
   )
}

// Displays the public, token-scoped record for one completed customer conversation.
function ConversationReport() {
   const { token } = useParams()
   const navigate = useNavigate()
   const [report, setReport] = useState(null)
   const [isLoading, setIsLoading] = useState(true)
   const [errorMessage, setErrorMessage] = useState('')
   const [rating, setRating] = useState('')
   const [comment, setComment] = useState('')
   const [isSubmitting, setIsSubmitting] = useState(false)
   const [feedbackMessage, setFeedbackMessage] = useState('')
   const [feedbackError, setFeedbackError] = useState('')
   const [isRedirecting, setIsRedirecting] = useState(false)
   const redirectTimerRef = useRef(null)

   useEffect(() => () => {
      if (redirectTimerRef.current) {
         window.clearTimeout(redirectTimerRef.current)
      }
   }, [])

   useEffect(() => {
      let isCurrent = true

      async function loadReport() {
         if (redirectTimerRef.current) {
            window.clearTimeout(redirectTimerRef.current)
            redirectTimerRef.current = null
         }

         setIsLoading(true)
         setErrorMessage('')
         setFeedbackMessage('')
         setFeedbackError('')
         setIsRedirecting(false)

         try {
            const nextReport = await getReport(token)

            if (isCurrent) {
               setReport(nextReport)
               setRating(nextReport.feedback ? String(nextReport.feedback.rating) : '')
               setComment(nextReport.feedback?.comment || '')
            }
         } catch (error) {
            if (isCurrent) {
               setReport(null)
               setErrorMessage(getLoadErrorMessage(error))
            }
         } finally {
            if (isCurrent) {
               setIsLoading(false)
            }
         }
      }

      loadReport()

      return () => {
         isCurrent = false
      }
   }, [token])

   async function handleFeedbackSubmit(event) {
      event.preventDefault()
      const selectedRating = Number(rating)

      if (isRedirecting) {
         return
      }

      setFeedbackMessage('')
      setFeedbackError('')

      if (!Number.isInteger(selectedRating) || selectedRating < 1 || selectedRating > 5) {
         setFeedbackError('Please select a rating from 1 to 5.')

         return
      }

      setIsSubmitting(true)

      try {
         const feedback = await submitFeedback(token, {
            rating: selectedRating,
            comment,
         })

         setReport((currentReport) => ({
            ...currentReport,
            feedback,
         }))
         setFeedbackMessage(report.feedback ? 'Your feedback has been updated.' : 'Thank you for your feedback.')
         setIsRedirecting(true)
         redirectTimerRef.current = window.setTimeout(() => navigate('/'), 1500)
      } catch (error) {
         setFeedbackError(getFeedbackErrorMessage(error))
      } finally {
         setIsSubmitting(false)
      }
   }

   return (
      <main className={styles.page}>
         <header className={styles.siteHeader}>
            <div className={styles.navigation}>
               <Link className={styles.brand} to="/">Aligned Tech</Link>
               <Link className={styles.catalogueLink} to="/">Browse products</Link>
            </div>
         </header>

         <section className={styles.content} aria-labelledby="report-title">
            {isLoading && <p className={styles.loading}>Loading conversation report...</p>}

            {!isLoading && errorMessage && (
               <div className={styles.errorState} role="alert">
                  <h1 id="report-title">Conversation report</h1>
                  <p>{errorMessage}</p>
                  <Link to="/">Browse products</Link>
               </div>
            )}

            {!isLoading && report && (
               <>
                  <header className={styles.reportHeader}>
                     <p className={styles.eyebrow}>Your recommendations</p>
                     <h1 id="report-title">Conversation report</h1>
                     <p>Here is a focused record of what you were looking for and the products discussed.</p>
                     <dl className={styles.reportMeta}>
                        <div>
                           <dt>Conversation ended</dt>
                           <dd>{formatDateTime(report.conversation.endedAt)}</dd>
                        </div>
                     </dl>
                  </header>

                  <section className={styles.section} aria-labelledby="summary-title">
                     <div className={styles.sectionHeading}>
                        <p className={styles.eyebrow}>Your request</p>
                        <h2 id="summary-title">What you were looking for</h2>
                     </div>
                     <p className={styles.summary}>{report.summary || 'No customer request was recorded for this conversation.'}</p>
                  </section>

                  <section className={styles.section} aria-labelledby="recommendations-title">
                     <div className={styles.sectionHeading}>
                        <p className={styles.eyebrow}>Recommended products</p>
                        <h2 id="recommendations-title">Products discussed for your needs</h2>
                     </div>
                     {report.recommendedProducts.length === 0 ? (
                        <p className={styles.emptyText}>No products were recommended in this conversation.</p>
                     ) : (
                        <ul className={styles.productGrid}>
                           {report.recommendedProducts.map((product) => (
                              <li key={`${product.name}-${product.reason}`} className={styles.productCard}>
                                 <div className={styles.imageWrap}>
                                    <RecommendedProductImage product={product} />
                                 </div>
                                 <div className={styles.productContent}>
                                    <h3>{product.name}</h3>
                                    <p className={styles.productDetails}>{product.category} · {formatPrice(product.price)}</p>
                                    <p>{product.reason}</p>
                                    {product.isAvailable ? (
                                       <Link className={styles.detailsLink} to={`/products/${product.id}`}>View details</Link>
                                    ) : (
                                       <span className={styles.unavailable}>Currently unavailable</span>
                                    )}
                                 </div>
                              </li>
                           ))}
                        </ul>
                     )}
                  </section>

                  <section className={styles.section} aria-labelledby="feedback-title">
                     <div className={styles.sectionHeading}>
                        <p className={styles.eyebrow}>Your feedback</p>
                        <h2 id="feedback-title">How helpful was this conversation?</h2>
                     </div>
                     <form className={styles.feedbackForm} onSubmit={handleFeedbackSubmit}>
                        <fieldset className={styles.ratingFieldset} disabled={isSubmitting || isRedirecting}>
                           <legend>Choose a rating from 1 to 5</legend>
                           <div className={styles.ratingOptions}>
                              {[1, 2, 3, 4, 5].map((value) => (
                                 <label key={value} className={rating === String(value) ? styles.selectedRating : styles.ratingOption}>
                                    <input
                                       type="radio"
                                       name="rating"
                                       value={value}
                                       checked={rating === String(value)}
                                       onChange={(event) => setRating(event.target.value)}
                                    />
                                    {value}
                                 </label>
                              ))}
                           </div>
                        </fieldset>
                        <label className={styles.commentField} htmlFor="feedback-comment">
                           Share an optional comment
                           <textarea
                              id="feedback-comment"
                              value={comment}
                              onChange={(event) => setComment(event.target.value)}
                              rows="4"
                              disabled={isSubmitting || isRedirecting}
                              placeholder="Tell us what was useful or what could be better."
                           />
                        </label>
                        {feedbackError && <FeedbackMessage message={feedbackError} variant="error" />}
                        {feedbackMessage && (
                           <div className={styles.successActions}>
                              <FeedbackMessage message={feedbackMessage} />
                              <Link className={styles.backToProducts} to="/">Back to products</Link>
                           </div>
                        )}
                        <button type="submit" disabled={isSubmitting || isRedirecting}>
                           {isSubmitting ? 'Saving feedback...' : report.feedback ? 'Update feedback' : 'Submit feedback'}
                        </button>
                     </form>
                  </section>
               </>
            )}
         </section>
      </main>
   )
}

export default ConversationReport
