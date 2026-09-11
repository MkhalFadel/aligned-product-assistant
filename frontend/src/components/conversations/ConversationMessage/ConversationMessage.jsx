import ScoreBadge from '../ScoreBadge/ScoreBadge'
import styles from './conversationMessage.module.css'

function formatDateTime(value) {
   const date = new Date(value)

   if (Number.isNaN(date.getTime())) {
      return 'Unavailable'
   }

   return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
   }).format(date)
}

function formatPrice(price) {
   if (typeof price !== 'number' || !Number.isFinite(price)) {
      return ''
   }

   return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
   }).format(price)
}

function getProductDetails(product) {
   if (!product) {
      return ''
   }

   return [formatPrice(product.price), product.category]
      .filter(Boolean)
      .join(' · ')
}

// Renders message scores and historical recommendations for business review.
function ConversationMessage({ message }) {
   const isAssistant = message.role === 'ASSISTANT'

   return (
      <article className={`${styles.message} ${isAssistant ? styles.assistant : styles.user}`} aria-label={`${isAssistant ? 'Assistant' : 'Customer'} message`}>
         <header className={styles.header}>
            <div>
               <p className={styles.role}>{isAssistant ? 'Assistant' : 'Customer'}</p>
               <p className={styles.language}>Language: {message.language}</p>
            </div>
            <time className={styles.time} dateTime={message.createdAt}>{formatDateTime(message.createdAt)}</time>
         </header>

         <p className={styles.content}>{message.content}</p>

         {isAssistant && (
            <>
               <section className={styles.scores} aria-label="Assistant response scores">
                  <ScoreBadge label="Accuracy" value={message.accuracyScore} type="accuracy" />
                  <ScoreBadge label="Hallucination risk" value={message.hallucinationRisk} type="risk" />
               </section>

               {message.scoringMode === 'DETERMINISTIC_FALLBACK' && (
                  <p className={styles.fallbackReview} role="status">
                     <strong>Full semantic verification was unavailable.</strong> This response was scored using deterministic catalogue checks and has been flagged for review.
                  </p>
               )}

               {message.isFlagged && message.scoringMode !== 'DETERMINISTIC_FALLBACK' && (
                  <p className={styles.flagged} role="status">
                     <strong>Flagged for review.</strong> This response needs a business-owner review.
                  </p>
               )}

               {message.recommendations.length > 0 && (
                  <section className={styles.recommendations} aria-label="Recommended products">
                     <h3>Recommended products</h3>
                     <ul>
                        {message.recommendations.map((recommendation) => {
                           const productDetails = getProductDetails(recommendation.product)

                           return (
                              <li key={recommendation.id}>
                                 <strong>{recommendation.product?.name || 'Product unavailable'}</strong>
                                 {productDetails && <span>{productDetails}</span>}
                                 <p>{recommendation.reason}</p>
                              </li>
                           )
                        })}
                     </ul>
                  </section>
               )}
            </>
         )}
      </article>
   )
}

export default ConversationMessage
