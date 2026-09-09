import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ConversationMessage from '../../components/conversations/ConversationMessage/ConversationMessage'
import ConversationStatus from '../../components/conversations/ConversationStatus/ConversationStatus'
import ScoreBadge from '../../components/conversations/ScoreBadge/ScoreBadge'
import { getConversationById } from '../../services/conversationApi'
import styles from './conversationDetails.module.css'

function formatDateTime(value) {
   if (!value) {
      return 'Not ended'
   }

   const date = new Date(value)

   if (Number.isNaN(date.getTime())) {
      return 'Unavailable'
   }

   return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
   }).format(date)
}

function formatLanguage(language) {
   return language ? language.charAt(0) + language.slice(1).toLowerCase() : 'Not detected'
}

function getErrorMessage(error) {
   if (error.message === 'VITE_API_URL is not configured.') {
      return 'Conversation API URL is not configured. Set VITE_API_URL and restart the frontend.'
   }

   if (error.message === 'Conversation not found') {
      return 'Conversation not found. It may have been deleted.'
   }

   return 'Failed to load conversation. Please try again.'
}

// Loads one chronological conversation for detailed response-quality review.
function ConversationDetails() {
   const { id } = useParams()
   const [conversation, setConversation] = useState(null)
   const [isLoading, setIsLoading] = useState(true)
   const [errorMessage, setErrorMessage] = useState('')
   const [reloadCount, setReloadCount] = useState(0)

   useEffect(() => {
      let isCurrent = true

      async function loadConversation() {
         setIsLoading(true)
         setErrorMessage('')

         try {
            const nextConversation = await getConversationById(id)

            if (isCurrent) {
               setConversation(nextConversation)
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

      loadConversation()

      return () => {
         isCurrent = false
      }
   }, [id, reloadCount])

   function retryLoading() {
      setReloadCount((count) => count + 1)
   }

   return (
      <main className={styles.page}>
         <div className={styles.content}>
            <Link className={styles.backLink} to="/dashboard/conversations">Back to conversations</Link>

            {isLoading && <section className={styles.stateCard}><p>Loading conversation...</p></section>}

            {!isLoading && errorMessage && (
               <section className={styles.errorState} role="alert">
                  <p>{errorMessage}</p>
                  <button type="button" onClick={retryLoading}>Try again</button>
               </section>
            )}

            {!isLoading && !errorMessage && conversation && (
               <>
                  <header className={styles.header}>
                     <div>
                        <p className={styles.eyebrow}>Conversation review</p>
                        <h1>Conversation {conversation.id.slice(0, 8)}</h1>
                        <p className={styles.description}>Review the full message history and assistant-response quality scores.</p>
                     </div>
                     <ConversationStatus status={conversation.status} />
                  </header>

                  <section className={styles.summaryCard} aria-labelledby="summary-heading">
                     <div className={styles.summaryHeader}>
                        <h2 id="summary-heading">Conversation summary</h2>
                        {conversation.flaggedMessageCount > 0 && (
                           <p className={styles.flaggedCount}>
                              <strong>Flagged for review:</strong> {conversation.flaggedMessageCount} assistant response{conversation.flaggedMessageCount === 1 ? '' : 's'}
                           </p>
                        )}
                     </div>
                     <dl className={styles.metadata}>
                        <div>
                           <dt>Detected language</dt>
                           <dd>{formatLanguage(conversation.detectedLanguage)}</dd>
                        </div>
                        <div>
                           <dt>Started</dt>
                           <dd>{formatDateTime(conversation.startedAt)}</dd>
                        </div>
                        <div>
                           <dt>Ended</dt>
                           <dd>{formatDateTime(conversation.endedAt)}</dd>
                        </div>
                        <div>
                           <dt>Messages</dt>
                           <dd>{conversation.messageCount}</dd>
                        </div>
                     </dl>
                     <div className={styles.scoreSummary} aria-label="Conversation score summary">
                        <ScoreBadge label="Average accuracy" value={conversation.averageAccuracy} type="accuracy" />
                        <ScoreBadge label="Average hallucination risk" value={conversation.averageHallucinationRisk} type="risk" />
                     </div>
                  </section>

                  <section className={styles.history} aria-labelledby="history-heading">
                     <h2 id="history-heading">Message history</h2>
                     {conversation.messages.length === 0 && (
                        <p className={styles.emptyHistory}>No messages have been sent in this conversation yet.</p>
                     )}
                     {conversation.messages.length > 0 && (
                        <div className={styles.messages}>
                           {conversation.messages.map((message) => <ConversationMessage key={message.id} message={message} />)}
                        </div>
                     )}
                  </section>
               </>
            )}
         </div>
      </main>
   )
}

export default ConversationDetails
