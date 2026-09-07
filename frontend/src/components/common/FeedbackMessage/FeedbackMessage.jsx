import styles from './feedbackMessage.module.css'

// Shows one concise result message after a meaningful dashboard action.
function FeedbackMessage({ message, variant = 'success' }) {
   if (!message) {
      return null
   }

   const isError = variant === 'error'

   return (
      <p className={`${styles.message} ${isError ? styles.error : styles.success}`} role={isError ? 'alert' : 'status'}>
         <strong>{isError ? 'Error:' : 'Success:'}</strong> {message}
      </p>
   )
}

export default FeedbackMessage
