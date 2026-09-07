import { useEffect, useId, useRef } from 'react'
import styles from './confirmModal.module.css'

// Presents a focused confirmation step before an irreversible or consequential action.
function ConfirmModal({
   isOpen,
   title,
   message,
   confirmText,
   cancelText,
   variant = 'normal',
   isLoading,
   onConfirm,
   onCancel,
   returnFocusRef,
}) {
   const dialogRef = useRef(null)
   const cancelButtonRef = useRef(null)
   const onCancelRef = useRef(onCancel)
   const isLoadingRef = useRef(isLoading)
   const titleId = useId()
   const messageId = useId()

   useEffect(() => {
      onCancelRef.current = onCancel
      isLoadingRef.current = isLoading
   }, [isLoading, onCancel])

   useEffect(() => {
      if (!isOpen) {
         return undefined
      }

      const previousOverflow = document.body.style.overflow
      const triggerElement = returnFocusRef?.current
      document.body.style.overflow = 'hidden'
      cancelButtonRef.current?.focus()

      function handleKeyDown(event) {
         if (event.key === 'Escape' && !isLoadingRef.current) {
            event.preventDefault()
            onCancelRef.current()
            return
         }

         if (event.key !== 'Tab') {
            return
         }

         const focusableElements = dialogRef.current?.querySelectorAll('button:not(:disabled)')

         if (!focusableElements || focusableElements.length === 0) {
            return
         }

         const firstElement = focusableElements[0]
         const lastElement = focusableElements[focusableElements.length - 1]

         if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
         } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
         }
      }

      document.addEventListener('keydown', handleKeyDown)

      return () => {
         document.body.style.overflow = previousOverflow
         document.removeEventListener('keydown', handleKeyDown)
         triggerElement?.focus()
      }
   }, [isOpen, returnFocusRef])

   if (!isOpen) {
      return null
   }

   return (
      <div className={styles.backdrop}>
         <div
            ref={dialogRef}
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={messageId}
         >
            <h2 id={titleId}>{title}</h2>
            <p id={messageId}>{message}</p>
            <div className={styles.actions}>
               <button
                  ref={cancelButtonRef}
                  type="button"
                  className={styles.cancelButton}
                  onClick={onCancel}
                  disabled={isLoading}
               >
                  {cancelText}
               </button>
               <button
                  type="button"
                  className={`${styles.confirmButton} ${variant === 'danger' ? styles.dangerButton : ''}`}
                  onClick={onConfirm}
                  disabled={isLoading}
               >
                  {isLoading ? 'Processing...' : confirmText}
               </button>
            </div>
         </div>
      </div>
   )
}

export default ConfirmModal
