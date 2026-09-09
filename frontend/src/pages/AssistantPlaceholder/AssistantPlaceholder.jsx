import { Link } from 'react-router-dom'
import styles from './assistantPlaceholder.module.css'

function AssistantPlaceholder() {
   return (
      <main className={styles.page}>
         <section className={styles.card} aria-labelledby="assistant-title">
            <p className={styles.eyebrow}>Personal guidance</p>
            <h1 id="assistant-title">Assistant coming next</h1>
            <p>We are preparing a guided experience to help you choose from the available catalogue.</p>
            <Link className={styles.backLink} to="/">Browse products</Link>
         </section>
      </main>
   )
}

export default AssistantPlaceholder
