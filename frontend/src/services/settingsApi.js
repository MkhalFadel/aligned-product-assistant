const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '')

function isSettings(value) {
   return typeof value === 'object'
      && value !== null
      && !Array.isArray(value)
      && typeof value.assistantName === 'string'
      && value.assistantName.trim() !== ''
      && typeof value.systemInstructions === 'string'
      && value.systemInstructions.trim() !== ''
      && typeof value.highRiskThreshold === 'number'
      && Number.isFinite(value.highRiskThreshold)
      && value.highRiskThreshold >= 0
      && value.highRiskThreshold <= 100
}

function createApiError(message, status) {
   const error = new Error(message)
   error.status = status

   return error
}

async function request(path, options) {
   if (!apiUrl) {
      throw new Error('VITE_API_URL is not configured.')
   }

   const response = await fetch(`${apiUrl}${path}`, options)
   let data

   try {
      data = await response.json()
   } catch {
      throw new Error('Settings API returned an invalid response.')
   }

   if (!response.ok) {
      throw createApiError(data.message || 'Settings request failed', response.status)
   }

   return data
}

function getSettings(data) {
   if (!data || !isSettings(data.settings)) {
      throw new Error('Settings API returned invalid settings.')
   }

   return data.settings
}

export async function getAssistantSettings() {
   return getSettings(await request('/api/settings'))
}

export async function updateAssistantSettings(settingsData) {
   return getSettings(await request('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsData),
   }))
}
