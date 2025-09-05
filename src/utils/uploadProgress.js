/**
 * Upload progress tracking utilities
 */

export class UploadProgressTracker {
  constructor() {
    this.uploads = new Map()
    this.listeners = new Map()
  }

  /**
   * Start tracking an upload
   */
  startUpload(uploadId, totalSize = 0) {
    this.uploads.set(uploadId, {
      id: uploadId,
      progress: 0,
      totalSize,
      uploadedSize: 0,
      status: 'uploading',
      startTime: Date.now(),
      error: null
    })

    this.notifyListeners(uploadId)
  }

  /**
   * Update upload progress
   */
  updateProgress(uploadId, uploadedSize, totalSize = null) {
    const upload = this.uploads.get(uploadId)
    if (!upload) return

    if (totalSize) upload.totalSize = totalSize
    upload.uploadedSize = uploadedSize
    upload.progress = upload.totalSize > 0 ? Math.round((uploadedSize / upload.totalSize) * 100) : 0

    this.uploads.set(uploadId, upload)
    this.notifyListeners(uploadId)
  }

  /**
   * Mark upload as completed
   */
  completeUpload(uploadId, result = null) {
    const upload = this.uploads.get(uploadId)
    if (!upload) return

    upload.status = 'completed'
    upload.progress = 100
    upload.endTime = Date.now()
    upload.duration = upload.endTime - upload.startTime
    upload.result = result

    this.uploads.set(uploadId, upload)
    this.notifyListeners(uploadId)

    // Clean up after 30 seconds
    setTimeout(() => {
      this.removeUpload(uploadId)
    }, 30000)
  }

  /**
   * Mark upload as failed
   */
  failUpload(uploadId, error) {
    const upload = this.uploads.get(uploadId)
    if (!upload) return

    upload.status = 'failed'
    upload.error = error
    upload.endTime = Date.now()
    upload.duration = upload.endTime - upload.startTime

    this.uploads.set(uploadId, upload)
    this.notifyListeners(uploadId)
  }

  /**
   * Get upload status
   */
  getUpload(uploadId) {
    return this.uploads.get(uploadId)
  }

  /**
   * Get all uploads
   */
  getAllUploads() {
    return Array.from(this.uploads.values())
  }

  /**
   * Remove upload from tracking
   */
  removeUpload(uploadId) {
    this.uploads.delete(uploadId)
    this.listeners.delete(uploadId)
  }

  /**
   * Add progress listener
   */
  addListener(uploadId, callback) {
    if (!this.listeners.has(uploadId)) {
      this.listeners.set(uploadId, new Set())
    }
    this.listeners.get(uploadId).add(callback)
  }

  /**
   * Remove progress listener
   */
  removeListener(uploadId, callback) {
    const listeners = this.listeners.get(uploadId)
    if (listeners) {
      listeners.delete(callback)
      if (listeners.size === 0) {
        this.listeners.delete(uploadId)
      }
    }
  }

  /**
   * Notify all listeners for an upload
   */
  notifyListeners(uploadId) {
    const listeners = this.listeners.get(uploadId)
    const upload = this.uploads.get(uploadId)
    
    if (listeners && upload) {
      listeners.forEach(callback => {
        try {
          callback(upload)
        } catch (error) {
          console.error('Error in upload progress listener:', error)
        }
      })
    }
  }

  /**
   * Calculate upload speed (bytes per second)
   */
  getUploadSpeed(uploadId) {
    const upload = this.uploads.get(uploadId)
    if (!upload || upload.uploadedSize === 0) return 0

    const elapsed = (Date.now() - upload.startTime) / 1000 // seconds
    return elapsed > 0 ? upload.uploadedSize / elapsed : 0
  }

  /**
   * Estimate time remaining (seconds)
   */
  getTimeRemaining(uploadId) {
    const upload = this.uploads.get(uploadId)
    if (!upload || upload.status !== 'uploading') return 0

    const speed = this.getUploadSpeed(uploadId)
    if (speed === 0) return Infinity

    const remaining = upload.totalSize - upload.uploadedSize
    return remaining / speed
  }

  /**
   * Format time remaining as human readable string
   */
  formatTimeRemaining(uploadId) {
    const seconds = this.getTimeRemaining(uploadId)
    
    if (seconds === Infinity) return 'Calculating...'
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
  }

  /**
   * Format upload speed as human readable string
   */
  formatUploadSpeed(uploadId) {
    const speed = this.getUploadSpeed(uploadId)
    
    if (speed < 1024) return `${Math.round(speed)} B/s`
    if (speed < 1024 * 1024) return `${Math.round(speed / 1024)} KB/s`
    return `${Math.round(speed / (1024 * 1024))} MB/s`
  }

  /**
   * Format file size as human readable string
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }
}

// Global instance
export const uploadTracker = new UploadProgressTracker()

/**
 * React hook for tracking upload progress
 */
export const useUploadProgress = (uploadId) => {
  const [upload, setUpload] = React.useState(null)

  React.useEffect(() => {
    if (!uploadId) return

    const updateUpload = (uploadData) => {
      setUpload(uploadData)
    }

    uploadTracker.addListener(uploadId, updateUpload)
    
    // Get initial state
    const initialUpload = uploadTracker.getUpload(uploadId)
    if (initialUpload) {
      setUpload(initialUpload)
    }

    return () => {
      uploadTracker.removeListener(uploadId, updateUpload)
    }
  }, [uploadId])

  return upload
}

/**
 * Generate unique upload ID
 */
export const generateUploadId = () => {
  return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
