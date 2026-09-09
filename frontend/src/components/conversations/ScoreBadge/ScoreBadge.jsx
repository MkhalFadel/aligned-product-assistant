import styles from './scoreBadge.module.css'

function getScoreStyle(value, type) {
   if (type === 'accuracy') {
      if (value >= 85) {
         return { className: styles.strong, description: 'Strong' }
      }

      if (value >= 60) {
         return { className: styles.moderate, description: 'Moderate' }
      }

      return { className: styles.weak, description: 'Weak' }
   }

   if (value <= 20) {
      return { className: styles.low, description: 'Low' }
   }

   if (value <= 50) {
      return { className: styles.moderate, description: 'Moderate' }
   }

   return { className: styles.high, description: 'High' }
}

function ScoreBadge({ label, value, type }) {
   const isNotScored = typeof value !== 'number' || !Number.isFinite(value)
   const roundedValue = isNotScored ? null : Math.round(value)
   const scoreStyle = isNotScored ? { className: styles.neutral, description: 'Not scored' } : getScoreStyle(roundedValue, type)

   return (
      <div
         className={`${styles.badge} ${scoreStyle.className}`}
         aria-label={`${label}: ${isNotScored ? 'Not scored' : `${roundedValue}% (${scoreStyle.description})`}`}
      >
         <span className={styles.label}>{label}</span>
         <strong>{isNotScored ? 'Not scored' : `${roundedValue}%`}</strong>
         {!isNotScored && <span className={styles.description}>{scoreStyle.description}</span>}
      </div>
   )
}

export default ScoreBadge
