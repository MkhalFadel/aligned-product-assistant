import { useEffect, useRef } from 'react'
import styles from './feedbackMessage.module.css'

// Shows a concise result message and brings a new status into view.
function FeedbackMessage({ message, variant = 'success' }) {
   const messageRef = useRef(null)
   const previousMessageRef = useRef('')
   const feedbackKey = message ? `${variant}:${message}` : ''

   useEffect(() => {
      if (!feedbackKey) {
         previousMessageRef.current = ''
         return
      }

      if (previousMessageRef.current === feedbackKey) {
         return
      }

      messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      previousMessageRef.current = feedbackKey
   }, [feedbackKey])

   if (!message) {
      return null
   }

   const isError = variant === 'error'

   return (
      <p ref={messageRef} className={`${styles.message} ${isError ? styles.error : styles.success}`} role={isError ? 'alert' : 'status'}>
         <strong>{isError ? 'Error:' : 'Success:'}</strong> {message}
      </p>
   )
}

export default FeedbackMessage
