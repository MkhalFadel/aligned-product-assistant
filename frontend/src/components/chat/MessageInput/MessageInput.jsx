import styles from './messageInput.module.css'

function MessageInput({ value, isDisabled, isSending, onChange, onSend }) {
   function handleSubmit(event) {
      event.preventDefault()
      onSend()
   }

   function handleKeyDown(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
         event.preventDefault()
         onSend()
      }
   }

   return (
      <form className={styles.form} onSubmit={handleSubmit}>
         <label className={styles.label} htmlFor="chat-message">Your message</label>
         <div className={styles.controls}>
            <textarea
               id="chat-message"
               value={value}
               onChange={(event) => onChange(event.target.value)}
               onKeyDown={handleKeyDown}
               disabled={isDisabled || isSending}
               placeholder="Tell the assistant what you need..."
               rows="2"
            />
            <button type="submit" disabled={isDisabled || isSending || !value.trim()}>
               {isSending ? 'Sending...' : 'Send'}
            </button>
         </div>
         <p className={styles.hint}>Press Enter to send. Use Shift+Enter for a new line.</p>
      </form>
   )
}

export default MessageInput
