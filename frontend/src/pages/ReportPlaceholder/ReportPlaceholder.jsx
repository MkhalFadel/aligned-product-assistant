import { Link } from 'react-router-dom'
import styles from './reportPlaceholder.module.css'

function ReportPlaceholder() {
   return (
      <main className={styles.page}>
         <section className={styles.card} aria-labelledby="report-title">
            <p className={styles.eyebrow}>Conversation review</p>
            <h1 id="report-title">Your report is coming next</h1>
            <p>We are preparing a focused view of your recommendations and conversation feedback.</p>
            <Link className={styles.backLink} to="/">Browse products</Link>
         </section>
      </main>
   )
}

export default ReportPlaceholder
