import styles from './conversationStatus.module.css'

function ConversationStatus({ status }) {
   const isEnded = status === 'ENDED'

   return (
      <span className={isEnded ? styles.ended : styles.active} role="status">
         {isEnded ? 'Ended' : 'Active'}
      </span>
   )
}

export default ConversationStatus
