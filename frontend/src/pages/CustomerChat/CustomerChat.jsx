import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ChatMessage from '../../components/chat/ChatMessage/ChatMessage'
import MessageInput from '../../components/chat/MessageInput/MessageInput'
import ConfirmModal from '../../components/common/ConfirmModal/ConfirmModal'
import { createConversation, endConversation, sendMessage } from '../../services/chatApi'
import { detectLanguage } from '../../utils/detectLanguage'
import styles from './customerChat.module.css'

const maxMessageLength = 1000

function isConversationLimitError(error) {
   return error.status === 429
      && error.message === 'This conversation has reached its message limit. Please start a new conversation.'
}

function getSendErrorMessage(error, hasCreatedConversation) {
   if (error.message === 'VITE_API_URL is not configured.') {
      return 'The assistant is not configured. Please try again later.'
   }

   if (error.status === 409) {
      return 'This conversation has ended. Start a new conversation to continue.'
   }

   if (isConversationLimitError(error)) {
      return 'This conversation has reached its message limit. Start a new conversation to continue.'
   }

   if (error.status === 429) {
      return 'Too many requests. Please try again later.'
   }

   if (!hasCreatedConversation) {
      return 'Unable to start a conversation. Please try again.'
   }

   return 'The assistant could not respond. Please try again.'
}

function getEndErrorMessage(error) {
   if (error.message === 'VITE_API_URL is not configured.') {
      return 'The assistant is not configured. Please try again later.'
   }

   return 'Unable to end the conversation right now. Please try again.'
}

// Manages one customer conversation without creating a record until the first send.
function CustomerChat() {
   const location = useLocation()
   const [conversationId, setConversationId] = useState('')
   const [messages, setMessages] = useState([])
   const [input, setInput] = useState('')
   const [isSending, setIsSending] = useState(false)
   const [isEnding, setIsEnding] = useState(false)
   const [isEnded, setIsEnded] = useState(false)
   const [reportToken, setReportToken] = useState('')
   const [errorMessage, setErrorMessage] = useState('')
   const [isEndConfirmationOpen, setIsEndConfirmationOpen] = useState(false)
   const [hasReachedMessageLimit, setHasReachedMessageLimit] = useState(false)
   const isSendingRef = useRef(false)
   const isEndingRef = useRef(false)
   const endButtonRef = useRef(null)
   const messageEndRef = useRef(null)
   const appliedPrefillKeyRef = useRef('')

   useEffect(() => {
      const { productId, productName } = location.state || {}

      if (appliedPrefillKeyRef.current === location.key
         || typeof productId !== 'string'
         || typeof productName !== 'string'
         || !productName.trim()
         || conversationId
         || messages.length > 0) {
         return
      }

      // Prefills the message from a product page without starting a conversation.
      setInput(`Tell me more about ${productName.trim()} and whether it fits my needs.`)
      appliedPrefillKeyRef.current = location.key
   }, [conversationId, location.key, location.state, messages.length])

   useEffect(() => {
      if (messages.length > 0) {
         messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }
   }, [isSending, messages])

   // Renders a temporary user message before creating a first conversation or sending a follow-up.
   async function handleSend() {
      const content = input.trim()

      if (!content || isEnded || hasReachedMessageLimit || isSendingRef.current) {
         return
      }

      if (content.length > maxMessageLength) {
         setErrorMessage(`Message must be ${maxMessageLength} characters or fewer.`)

         return
      }

      isSendingRef.current = true
      const language = detectLanguage(content)
      const temporaryMessageId = `temp-${Date.now()}`
      const temporaryMessage = {
         id: temporaryMessageId,
         role: 'USER',
         content,
         recommendations: [],
      }
      const isFirstMessage = !conversationId
      let hasCreatedConversation = !isFirstMessage

      setMessages((current) => [...current, temporaryMessage])
      setInput('')
      setIsSending(true)
      setErrorMessage('')

      try {
         let activeConversationId = conversationId

         if (!activeConversationId) {
            const conversation = await createConversation()

            activeConversationId = conversation.id
            hasCreatedConversation = true
            setConversationId(activeConversationId)
         }

         const result = await sendMessage(activeConversationId, {
            role: 'USER',
            content,
            language,
         })

         setMessages((current) => {
            const reconciledMessages = current.map((message) => (
               message.id === temporaryMessageId ? result.userMessage : message
            ))

            return [...reconciledMessages, result.assistantMessage]
         })
      } catch (error) {
         if (!error.userMessageStored) {
            setMessages((current) => current.filter((message) => message.id !== temporaryMessageId))
            setInput(content)
         }

         if (error.status === 409) {
            setIsEnded(true)
         }

         if (isConversationLimitError(error)) {
            setHasReachedMessageLimit(true)
         }

         setErrorMessage(getSendErrorMessage(error, hasCreatedConversation))
      } finally {
         isSendingRef.current = false
         setIsSending(false)
      }
   }

   function openEndConfirmation(event) {
      endButtonRef.current = event.currentTarget
      setErrorMessage('')
      setIsEndConfirmationOpen(true)
   }

   function closeEndConfirmation() {
      if (!isEnding) {
         setIsEndConfirmationOpen(false)
      }
   }

   // Ends the active conversation and keeps its messages available for review.
   async function handleEndConversation() {
      if (!conversationId || isEndingRef.current) {
         return
      }

      isEndingRef.current = true
      setIsEnding(true)
      setErrorMessage('')

      try {
         const conversation = await endConversation(conversationId)

         setIsEnded(true)
         setReportToken(conversation.reportToken)
         setIsEndConfirmationOpen(false)
      } catch (error) {
         setIsEndConfirmationOpen(false)
         setErrorMessage(getEndErrorMessage(error))
      } finally {
         isEndingRef.current = false
         setIsEnding(false)
      }
   }

   // Clears local chat state without creating a new backend conversation.
   function startNewConversation() {
      if (isSending || isEnding) {
         return
      }

      setConversationId('')
      setMessages([])
      setInput('')
      setIsEnded(false)
      setReportToken('')
      setErrorMessage('')
      setIsEndConfirmationOpen(false)
      setHasReachedMessageLimit(false)
   }

   return (
      <main className={styles.page}>
         <header className={styles.siteHeader}>
            <div className={styles.navigation}>
               <Link className={styles.brand} to="/">Aligned Tech</Link>
               <nav className={styles.navLinks} aria-label="Customer navigation">
                  <Link to="/">Products</Link>
                  <Link to="/chat">Ask Assistant</Link>
                  <Link to="/dashboard/products">Reviewer Dashboard</Link>
               </nav>
            </div>
         </header>

         <div className={styles.content}>
            <header className={styles.chatHeader}>
               <div>
                  <p className={styles.eyebrow}>Personal guidance</p>
                  <h1>Find the right tech</h1>
                  <p>Tell the assistant what you need, and it will recommend from the available catalogue.</p>
               </div>
               {conversationId && !isEnded && (
                  <button
                     ref={endButtonRef}
                     type="button"
                     className={styles.endButton}
                     onClick={openEndConfirmation}
                     disabled={isSending || isEnding}
                  >
                     End conversation
                  </button>
               )}
            </header>

            <section className={styles.chatCard} aria-label="Product assistant conversation">
               {errorMessage && <p className={styles.errorMessage} role="alert">{errorMessage}</p>}

               {messages.length === 0 && !isSending && !isEnded && (
                  <div className={styles.welcomeState}>
                     <h2>Tell me what you’re looking for</h2>
                     <p>Share your budget, priorities, and the kind of work or play you have in mind.</p>
                     <ul>
                        <li>I need a laptop for university under $1000</li>
                        <li>bade controller lal PC w ykoun wireless</li>
                        <li>أحتاج شاشة مناسبة للعمل والألعاب</li>
                     </ul>
                  </div>
               )}

               {messages.length > 0 && (
                  <section className={styles.messages} role="log" aria-live="polite" aria-label="Conversation messages">
                     {messages.map((message) => <ChatMessage key={message.id} message={message} />)}
                     {isSending && (
                        <p className={styles.typingIndicator} role="status" aria-live="polite">Assistant is thinking...</p>
                     )}
                     <div ref={messageEndRef} />
                  </section>
               )}

               {isEnded ? (
                  <section className={styles.endedState} aria-labelledby="ended-heading">
                     <h2 id="ended-heading">Conversation ended</h2>
                     <p>You can review this conversation later or start another product search.</p>
                     <div className={styles.endedActions}>
                        {reportToken && <Link className={styles.reportLink} to={`/report/${reportToken}`}>View conversation report</Link>}
                        <button type="button" className={styles.newConversationButton} onClick={startNewConversation}>Start new conversation</button>
                     </div>
                  </section>
               ) : hasReachedMessageLimit ? (
                  <section className={styles.endedState} aria-labelledby="limit-heading">
                     <h2 id="limit-heading">Message limit reached</h2>
                     <p>This conversation has reached its message limit. You can start a new product search when you’re ready.</p>
                     <div className={styles.endedActions}>
                        <button type="button" className={styles.newConversationButton} onClick={startNewConversation}>Start new conversation</button>
                     </div>
                  </section>
               ) : (
                  <MessageInput
                     value={input}
                     isDisabled={isEnding}
                     isSending={isSending}
                     maxMessageLength={maxMessageLength}
                     onChange={setInput}
                     onSend={handleSend}
                  />
               )}
            </section>
         </div>

         <ConfirmModal
            isOpen={isEndConfirmationOpen}
            title="End conversation"
            message="You will no longer be able to send messages in this conversation. A report link will be created so you can review the recommendations and leave feedback."
            confirmText="End conversation"
            cancelText="Cancel"
            variant="normal"
            isLoading={isEnding}
            onConfirm={handleEndConversation}
            onCancel={closeEndConfirmation}
            returnFocusRef={endButtonRef}
         />
      </main>
   )
}

export default CustomerChat
