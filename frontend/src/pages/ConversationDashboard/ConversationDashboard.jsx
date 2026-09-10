import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardNav from '../../components/dashboard/DashboardNav/DashboardNav'
import ConversationStatus from '../../components/conversations/ConversationStatus/ConversationStatus'
import ScoreBadge from '../../components/conversations/ScoreBadge/ScoreBadge'
import { getConversations } from '../../services/conversationApi'
import styles from './conversationDashboard.module.css'

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

function formatLanguage(language) {
   return language ? language.charAt(0) + language.slice(1).toLowerCase() : 'Not detected'
}

function getErrorMessage(error) {
   if (error.message === 'VITE_API_URL is not configured.') {
      return 'Conversation API URL is not configured. Set VITE_API_URL and restart the frontend.'
   }

   return 'Failed to load conversations. Please try again.'
}

// Shows recent conversations with score summaries for quick business review.
function ConversationDashboard() {
   const [conversations, setConversations] = useState([])
   const [isLoading, setIsLoading] = useState(true)
   const [errorMessage, setErrorMessage] = useState('')
   const [reloadCount, setReloadCount] = useState(0)

   useEffect(() => {
      let isCurrent = true

      async function loadConversations() {
         setIsLoading(true)
         setErrorMessage('')

         try {
            const nextConversations = await getConversations()

            if (isCurrent) {
               setConversations(nextConversations)
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

      loadConversations()

      return () => {
         isCurrent = false
      }
   }, [reloadCount])

   function retryLoading() {
      setReloadCount((count) => count + 1)
   }

   return (
      <main className={styles.page}>
         <div className={styles.content}>
            <DashboardNav />
            <header className={styles.header}>
               <p className={styles.eyebrow}>Conversation review</p>
               <h1>Conversations</h1>
               <p className={styles.description}>Review customer conversations, response quality, and flagged assistant replies.</p>
            </header>

            <section className={styles.listCard} aria-label="Conversation list">
               {isLoading && <p className={styles.loading}>Loading conversations...</p>}

               {!isLoading && errorMessage && (
                  <div className={styles.errorState} role="alert">
                     <p>{errorMessage}</p>
                     <button type="button" onClick={retryLoading}>Try again</button>
                  </div>
               )}

               {!isLoading && !errorMessage && conversations.length === 0 && (
                  <div className={styles.emptyState}>
                     <h2>No conversations yet</h2>
                     <p>Customer conversations will appear here once the assistant is used.</p>
                  </div>
               )}

               {!isLoading && !errorMessage && conversations.length > 0 && (
                  <div className={styles.tableWrap}>
                     <table className={styles.table}>
                        <thead>
                           <tr>
                              <th scope="col">Conversation</th>
                              <th scope="col">Status</th>
                              <th scope="col">Language</th>
                              <th scope="col">Messages</th>
                              <th scope="col">Score summary</th>
                              <th scope="col">Flagged</th>
                              <th scope="col" className={styles.actionsHeading}>Action</th>
                           </tr>
                        </thead>
                        <tbody>
                           {conversations.map((conversation) => (
                              <tr key={conversation.id}>
                                 <td data-label="Conversation">
                                    <strong className={styles.conversationId}>Conversation {conversation.id.slice(0, 8)}</strong>
                                    <span className={styles.startedAt}>Started {formatDateTime(conversation.startedAt)}</span>
                                 </td>
                                 <td data-label="Status"><ConversationStatus status={conversation.status} /></td>
                                 <td data-label="Language">{formatLanguage(conversation.detectedLanguage)}</td>
                                 <td data-label="Messages">{conversation.messageCount}</td>
                                 <td data-label="Score summary">
                                    <div className={styles.scoreSummary}>
                                       <ScoreBadge label="Avg. accuracy" value={conversation.averageAccuracy} type="accuracy" />
                                       <ScoreBadge label="Avg. risk" value={conversation.averageHallucinationRisk} type="risk" />
                                    </div>
                                 </td>
                                 <td data-label="Flagged">
                                    <span className={conversation.flaggedMessageCount > 0 ? styles.flagged : styles.notFlagged}>
                                       {conversation.flaggedMessageCount > 0
                                          ? `${conversation.flaggedMessageCount} flagged response${conversation.flaggedMessageCount === 1 ? '' : 's'}`
                                          : 'No flagged responses'}
                                    </span>
                                 </td>
                                 <td data-label="Action" className={styles.actionCell}>
                                    <Link className={styles.viewLink} to={`/dashboard/conversations/${conversation.id}`}>View conversation</Link>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               )}
            </section>
         </div>
      </main>
   )
}

export default ConversationDashboard
