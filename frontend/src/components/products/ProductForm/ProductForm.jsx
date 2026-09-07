import { useState } from 'react'
import { categoryOptions, getCategoryFields } from '../productFields'
import styles from './productForm.module.css'

function getAttributeValues(category, attributes = {}) {
   return getCategoryFields(category).reduce((values, field) => {
      const value = attributes[field.name]

      values[field.name] = Array.isArray(value)
         ? value.join(', ')
         : value === undefined || value === null ? '' : String(value)

      return values
   }, {})
}

function getInitialFormData(product) {
   const category = product?.category || ''

   return {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || '',
      category,
      imageUrl: product?.imageUrl || '',
      attributeValues: getAttributeValues(category, product?.attributes),
   }
}

// Builds the category-specific attributes object expected by the product API.
function buildAttributes(category, attributeValues) {
   return getCategoryFields(category).reduce((attributes, field) => {
      const value = attributeValues[field.name].trim()

      attributes[field.name] = field.type === 'list'
         ? value.split(',').map((feature) => feature.trim()).filter(Boolean)
         : value

      return attributes
   }, {})
}

function ProductForm({ mode, product, isSaving, error, onCancel, onSubmit }) {
   const [formData, setFormData] = useState(() => getInitialFormData(product))
   const [validationError, setValidationError] = useState('')
   const attributeFields = getCategoryFields(formData.category)

   function handleChange(event) {
      const { name, value } = event.target

      setFormData((current) => ({ ...current, [name]: value }))
   }

   function handleCategoryChange(event) {
      const category = event.target.value

      setFormData((current) => ({
         ...current,
         category,
         attributeValues: getAttributeValues(category),
      }))
   }

   function handleAttributeChange(event) {
      const { name, value } = event.target

      setFormData((current) => ({
         ...current,
         attributeValues: {
            ...current.attributeValues,
            [name]: value,
         },
      }))
   }

   function validateForm() {
      if (!formData.name.trim() || !formData.description.trim() || !formData.category.trim()) {
         return 'Name, description, and category are required.'
      }

      if (!Number.isFinite(Number(formData.price)) || Number(formData.price) <= 0) {
         return 'Price must be greater than 0.'
      }

      if (formData.imageUrl && !formData.imageUrl.trim()) {
         return 'Image URL cannot be blank when provided.'
      }

      const missingField = attributeFields.find((field) => !formData.attributeValues[field.name]?.trim())

      if (missingField) {
         return `${missingField.label} is required for this category.`
      }

      return ''
   }

   async function handleSubmit(event) {
      event.preventDefault()

      const nextValidationError = validateForm()

      if (nextValidationError) {
         setValidationError(nextValidationError)
         return
      }

      setValidationError('')

      const imageUrl = formData.imageUrl.trim()
      const productData = {
         name: formData.name.trim(),
         description: formData.description.trim(),
         price: Number(formData.price),
         category: formData.category,
         attributes: buildAttributes(formData.category, formData.attributeValues),
      }

      if (imageUrl) {
         productData.imageUrl = imageUrl
      }

      await onSubmit(productData)
   }

   return (
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
         <div className={styles.formHeader}>
            <div>
               <p className={styles.eyebrow}>{mode === 'edit' ? 'Update product' : 'New catalogue item'}</p>
               <h2>{mode === 'edit' ? 'Edit product' : 'Add product'}</h2>
            </div>
            <button type="button" className={styles.closeButton} onClick={onCancel} disabled={isSaving}>Close</button>
         </div>

         {(validationError || error) && <p className={styles.error} role="alert">{validationError || error}</p>}

         <div className={styles.fields}>
            <label>
               Name
               <input name="name" value={formData.name} onChange={handleChange} disabled={isSaving} />
            </label>
            <label>
               Price
               <input name="price" type="number" min="0.01" step="0.01" value={formData.price} onChange={handleChange} disabled={isSaving} />
            </label>
            <label className={styles.fullWidth}>
               Description
               <textarea name="description" value={formData.description} onChange={handleChange} disabled={isSaving} rows="3" />
            </label>
            <label>
               Category
               <select name="category" value={formData.category} onChange={handleCategoryChange} disabled={isSaving}>
                  <option value="">Select a category</option>
                  {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
               </select>
            </label>
            <label>
               Image URL <span className={styles.optional}>(optional)</span>
               <input name="imageUrl" type="url" value={formData.imageUrl} onChange={handleChange} disabled={isSaving} placeholder="https://example.com/product.jpg" />
            </label>
         </div>

         {attributeFields.length > 0 && (
            <fieldset className={styles.attributes}>
               <legend>Product details</legend>
               <div className={styles.fields}>
                  {attributeFields.map((field) => (
                     <label key={field.name}>
                        {field.label}
                        <input name={field.name} value={formData.attributeValues[field.name] || ''} onChange={handleAttributeChange} disabled={isSaving} placeholder={field.type === 'list' ? 'Separate items with commas' : ''} />
                     </label>
                  ))}
               </div>
            </fieldset>
         )}

         <div className={styles.formActions}>
            <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={isSaving}>Cancel</button>
            <button type="submit" className={styles.submitButton} disabled={isSaving}>
               {isSaving ? 'Saving...' : mode === 'edit' ? 'Save changes' : 'Add product'}
            </button>
         </div>
      </form>
   )
}

export default ProductForm
