/**
 * Pinata IPFS service for secure, decentralized storage of incident recordings
 */
import axios from 'axios'
import { handleError, retryOperation } from '../utils/errorHandler'

// Pinata API configuration
const PINATA_API_URL = 'https://api.pinata.cloud'
const PINATA_GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs'

// Initialize Pinata client
const pinataClient = axios.create({
  baseURL: PINATA_API_URL,
  headers: {
    'pinata_api_key': import.meta.env.VITE_PINATA_API_KEY,
    'pinata_secret_api_key': import.meta.env.VITE_PINATA_SECRET_KEY,
  }
})

// Alternative JWT-based client
const pinataJWTClient = axios.create({
  baseURL: PINATA_API_URL,
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
  }
})

// Use JWT client if available, otherwise fall back to API key
const client = import.meta.env.VITE_PINATA_JWT ? pinataJWTClient : pinataClient

/**
 * Test Pinata connection
 */
export const testPinataConnection = async () => {
  try {
    const response = await client.get('/data/testAuthentication')
    return response.data
  } catch (error) {
    throw handleError(error, { service: 'pinata', operation: 'testConnection' })
  }
}

/**
 * Upload incident recording to IPFS via Pinata
 */
export const uploadIncidentRecording = async (blob, metadata = {}, onProgress = null) => {
  if (!import.meta.env.VITE_PINATA_API_KEY && !import.meta.env.VITE_PINATA_JWT) {
    throw new Error('Pinata API credentials not configured')
  }

  try {
    const formData = new FormData()
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const extension = metadata.recordingType === 'video' ? 'webm' : 'webm'
    const filename = `incident_${metadata.incidentId || timestamp}.${extension}`
    
    formData.append('file', blob, filename)
    
    // Add metadata
    const pinataMetadata = {
      name: filename,
      keyvalues: {
        type: 'incident-recording',
        recordingType: metadata.recordingType || 'audio',
        timestamp: metadata.timestamp || new Date().toISOString(),
        userId: metadata.userId || 'anonymous',
        incidentId: metadata.incidentId || '',
        location: metadata.location ? JSON.stringify(metadata.location) : '',
        ...metadata.customMetadata
      }
    }
    
    formData.append('pinataMetadata', JSON.stringify(pinataMetadata))
    
    // Pin options for better organization
    const pinataOptions = {
      cidVersion: 1,
      wrapWithDirectory: false
    }
    
    formData.append('pinataOptions', JSON.stringify(pinataOptions))

    const response = await retryOperation(async () => {
      return await client.post('/pinning/pinFileToIPFS', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(percentCompleted)
          }
        }
      })
    }, 2, 2000)

    return {
      ipfsHash: response.data.IpfsHash,
      pinSize: response.data.PinSize,
      timestamp: response.data.Timestamp,
      gatewayUrl: `${PINATA_GATEWAY_URL}/${response.data.IpfsHash}`,
      metadata: pinataMetadata
    }
  } catch (error) {
    throw handleError(error, { service: 'pinata', operation: 'uploadIncidentRecording', metadata })
  }
}

/**
 * Upload incident summary as JSON to IPFS
 */
export const uploadIncidentSummary = async (summaryData, metadata = {}) => {
  if (!import.meta.env.VITE_PINATA_API_KEY && !import.meta.env.VITE_PINATA_JWT) {
    throw new Error('Pinata API credentials not configured')
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `incident_summary_${metadata.incidentId || timestamp}.json`
    
    const pinataMetadata = {
      name: filename,
      keyvalues: {
        type: 'incident-summary',
        timestamp: metadata.timestamp || new Date().toISOString(),
        userId: metadata.userId || 'anonymous',
        incidentId: metadata.incidentId || '',
        ...metadata.customMetadata
      }
    }

    const pinataOptions = {
      cidVersion: 1,
      wrapWithDirectory: false
    }

    const requestBody = {
      pinataContent: summaryData,
      pinataMetadata,
      pinataOptions
    }

    const response = await retryOperation(async () => {
      return await client.post('/pinning/pinJSONToIPFS', requestBody)
    }, 2, 2000)

    return {
      ipfsHash: response.data.IpfsHash,
      pinSize: response.data.PinSize,
      timestamp: response.data.Timestamp,
      gatewayUrl: `${PINATA_GATEWAY_URL}/${response.data.IpfsHash}`,
      metadata: pinataMetadata
    }
  } catch (error) {
    throw handleError(error, { service: 'pinata', operation: 'uploadIncidentSummary', metadata })
  }
}

/**
 * Retrieve file from IPFS via Pinata gateway
 */
export const retrieveFromIPFS = async (ipfsHash) => {
  try {
    const response = await axios.get(`${PINATA_GATEWAY_URL}/${ipfsHash}`, {
      timeout: 30000 // 30 second timeout for IPFS retrieval
    })
    return response.data
  } catch (error) {
    throw handleError(error, { service: 'pinata', operation: 'retrieveFromIPFS', ipfsHash })
  }
}

/**
 * List pinned files for a user (requires authentication)
 */
export const listUserIncidents = async (userId, limit = 10, offset = 0) => {
  if (!import.meta.env.VITE_PINATA_API_KEY && !import.meta.env.VITE_PINATA_JWT) {
    throw new Error('Pinata API credentials not configured')
  }

  try {
    const params = {
      status: 'pinned',
      pageLimit: limit,
      pageOffset: offset,
      metadata: {
        keyvalues: {
          userId: {
            value: userId,
            op: 'eq'
          },
          type: {
            value: 'incident-recording',
            op: 'eq'
          }
        }
      }
    }

    const response = await client.get('/data/pinList', { params })
    
    return {
      files: response.data.rows.map(file => ({
        ipfsHash: file.ipfs_pin_hash,
        filename: file.metadata.name,
        size: file.size,
        timestamp: file.date_pinned,
        metadata: file.metadata.keyvalues,
        gatewayUrl: `${PINATA_GATEWAY_URL}/${file.ipfs_pin_hash}`
      })),
      totalCount: response.data.count
    }
  } catch (error) {
    throw handleError(error, { service: 'pinata', operation: 'listUserIncidents', userId })
  }
}

/**
 * Unpin a file from IPFS (delete)
 */
export const unpinFile = async (ipfsHash) => {
  if (!import.meta.env.VITE_PINATA_API_KEY && !import.meta.env.VITE_PINATA_JWT) {
    throw new Error('Pinata API credentials not configured')
  }

  try {
    await client.delete(`/pinning/unpin/${ipfsHash}`)
    return { success: true, ipfsHash }
  } catch (error) {
    throw handleError(error, { service: 'pinata', operation: 'unpinFile', ipfsHash })
  }
}

/**
 * Generate shareable link for incident
 */
export const generateShareableLink = (ipfsHash, metadata = {}) => {
  const baseUrl = `${PINATA_GATEWAY_URL}/${ipfsHash}`
  
  // Add query parameters for better sharing context
  const params = new URLSearchParams()
  if (metadata.incidentId) params.append('incident', metadata.incidentId)
  if (metadata.timestamp) params.append('date', metadata.timestamp)
  
  return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl
}

/**
 * Check if Pinata is properly configured
 */
export const isPinataConfigured = () => {
  return !!(import.meta.env.VITE_PINATA_API_KEY || import.meta.env.VITE_PINATA_JWT)
}

/**
 * Get Pinata usage statistics
 */
export const getPinataUsage = async () => {
  if (!isPinataConfigured()) {
    throw new Error('Pinata API credentials not configured')
  }

  try {
    const response = await client.get('/data/userPinnedDataTotal')
    return {
      pinCount: response.data.pin_count,
      pinSizeTotal: response.data.pin_size_total,
      pinSizeWithReplicationsTotal: response.data.pin_size_with_replications_total
    }
  } catch (error) {
    throw handleError(error, { service: 'pinata', operation: 'getPinataUsage' })
  }
}
