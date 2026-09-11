import { useEffect, useState } from 'react'
import FeedbackMessage from '../../components/common/FeedbackMessage/FeedbackMessage'
import DashboardNav from '../../components/dashboard/DashboardNav/DashboardNav'
import { getAssistantSettings, updateAssistantSettings } from '../../services/settingsApi'
import styles from './assistantSettings.module.css'

function getFormData(settings) {
   return {
      assistantName: settings.assistantName,
      systemInstructions: settings.systemInstructions,
      highRiskThreshold: String(settings.highRiskThreshold),
   }
}

function getLoadErrorMessage(error) {
   if (error.message === 'VITE_API_URL is not configured.') {
      return 'Settings API URL is not configured. Set VITE_API_URL and restart the frontend.'
   }

   return 'Failed to load assistant settings. Please try again.'
}

function validateForm(formData) {
   if (!formData.assistantName.trim()) {
      return 'Assistant name is required.'
   }

   if (!formData.systemInstructions.trim()) {
      return 'Assistant behavior instructions are required.'
   }

   const threshold = Number(formData.highRiskThreshold)

   if (!formData.highRiskThreshold.trim() || !Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
      return 'High-risk threshold must be a number from 0 to 100.'
   }

   return ''
}

// Lets the business owner adjust client-facing assistant behavior without editing safeguards.
function AssistantSettings() {
   const [formData, setFormData] = useState(null)
   const [isLoading, setIsLoading] = useState(true)
   const [isSaving, setIsSaving] = useState(false)
   const [loadError, setLoadError] = useState('')
   const [feedback, setFeedback] = useState(null)
   const [reloadCount, setReloadCount] = useState(0)

   useEffect(() => {
      let isCurrent = true

      async function loadSettings() {
         setIsLoading(true)
         setLoadError('')

         try {
            const settings = await getAssistantSettings()

            if (isCurrent) {
               setFormData(getFormData(settings))
            }
         } catch (error) {
            if (isCurrent) {
               setLoadError(getLoadErrorMessage(error))
            }
         } finally {
            if (isCurrent) {
               setIsLoading(false)
            }
         }
      }

      loadSettings()

      return () => {
         isCurrent = false
      }
   }, [reloadCount])

   function handleChange(event) {
      const { name, value } = event.target

      setFormData((current) => ({
         ...current,
         [name]: value,
      }))
   }

   function retryLoading() {
      setReloadCount((count) => count + 1)
   }

   async function handleSubmit(event) {
      event.preventDefault()

      const validationError = validateForm(formData)

      if (validationError) {
         setFeedback({ variant: 'error', message: validationError })
         return
      }

      setIsSaving(true)
      setFeedback(null)

      try {
         const settings = await updateAssistantSettings({
            assistantName: formData.assistantName.trim(),
            systemInstructions: formData.systemInstructions.trim(),
            highRiskThreshold: Number(formData.highRiskThreshold),
         })

         setFormData(getFormData(settings))
         setFeedback({ variant: 'success', message: 'Assistant settings saved.' })
      } catch (error) {
         setFeedback({
            variant: 'error',
            message: error.message === 'VITE_API_URL is not configured.'
               ? 'Settings API URL is not configured. Set VITE_API_URL and restart the frontend.'
               : 'Failed to save assistant settings. Please try again.',
         })
      } finally {
         setIsSaving(false)
      }
   }

   return (
      <main className={styles.page}>
         <div className={styles.content}>
            <DashboardNav />
            <header className={styles.header}>
               <p className={styles.eyebrow}>Assistant configuration</p>
               <h1>Assistant Settings</h1>
               <p className={styles.description}>Adjust the assistant’s business-facing tone and review threshold. Catalogue grounding and safety rules remain enforced.</p>
            </header>

            {isLoading && <section className={styles.stateCard}><p>Loading assistant settings...</p></section>}

            {!isLoading && loadError && (
               <section className={styles.errorState} role="alert">
                  <p>{loadError}</p>
                  <button type="button" onClick={retryLoading}>Try again</button>
               </section>
            )}

            {!isLoading && !loadError && formData && (
               <section className={styles.settingsCard} aria-labelledby="settings-form-heading">
                  {feedback && <FeedbackMessage message={feedback.message} variant={feedback.variant} />}
                  <form className={styles.form} onSubmit={handleSubmit} noValidate>
                     <div className={styles.formHeader}>
                        <h2 id="settings-form-heading">Business preferences</h2>
                        <p>These preferences cannot disable grounded catalogue recommendations or other developer-controlled safeguards.</p>
                     </div>

                     <label>
                        Assistant name
                        <input
                           name="assistantName"
                           value={formData.assistantName}
                           onChange={handleChange}
                           disabled={isSaving}
                           maxLength="80"
                        />
                     </label>

                     <label>
                        Assistant behavior instructions
                        <textarea
                           name="systemInstructions"
                           value={formData.systemInstructions}
                           onChange={handleChange}
                           disabled={isSaving}
                           maxLength="2000"
                           rows="6"
                           aria-describedby="behavior-instructions-help"
                        />
                        <span id="behavior-instructions-help" className={styles.helperText}>Use this for tone and business-specific behavior. It cannot change catalogue grounding or safety rules.</span>
                     </label>

                     <label>
                        High-risk threshold
                        <span className={styles.thresholdField}>
                           <input
                              name="highRiskThreshold"
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={formData.highRiskThreshold}
                              onChange={handleChange}
                              disabled={isSaving}
                              aria-describedby="threshold-help"
                           />
                           <span aria-hidden="true">%</span>
                        </span>
                        <span id="threshold-help" className={styles.helperText}>Assistant responses at or above this hallucination-risk percentage are flagged for review.</span>
                     </label>

                     <div className={styles.actions}>
                        <button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save settings'}</button>
                     </div>
                  </form>
               </section>
            )}
         </div>
      </main>
   )
}

export default AssistantSettings
