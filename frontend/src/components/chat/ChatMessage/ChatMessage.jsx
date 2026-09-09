import RecommendedProducts from '../RecommendedProducts/RecommendedProducts'
import styles from './chatMessage.module.css'

function ChatMessage({ message }) {
   const isAssistant = message.role === 'ASSISTANT'

   return (
      <article className={`${styles.message} ${isAssistant ? styles.assistant : styles.user}`}>
         <p className={styles.sender}>{isAssistant ? 'Aligned Tech Assistant' : 'You'}</p>
         <p className={styles.content}>{message.content}</p>
         {isAssistant && <RecommendedProducts recommendations={message.recommendations} />}
      </article>
   )
}

export default ChatMessage
