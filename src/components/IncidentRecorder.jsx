import React, { useState, useRef, useEffect } from 'react'
import { Mic, Video, Square, Play, Pause, Save, Send, MapPin, AlertTriangle } from 'lucide-react'
import ContentCard from './ContentCard'

const IncidentRecorder = ({ user }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingType, setRecordingType] = useState('audio') // 'audio' or 'video'
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [recordedChunks, setRecordedChunks] = useState([])
  const [currentIncident, setCurrentIncident] = useState(null)
  const [incidents, setIncidents] = useState(() => {
    const saved = localStorage.getItem('incidents')
    return saved ? JSON.parse(saved) : []
  })
  const [location, setLocation] = useState(null)
  const [notes, setNotes] = useState('')
  const [alertSent, setAlertSent] = useState(false)

  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date().toISOString()
          })
        },
        (error) => {
          console.error('Location error:', error)
        }
      )
    }
  }, [])

  // Save incidents to localStorage
  useEffect(() => {
    localStorage.setItem('incidents', JSON.stringify(incidents))
  }, [incidents])

  const startRecording = async () => {
    try {
      const constraints = {
        audio: true,
        video: recordingType === 'video'
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (recordingType === 'video' && videoRef.current) {
        videoRef.current.srcObject = stream
      }

      const recorder = new MediaRecorder(stream)
      setMediaRecorder(recorder)

      const chunks = []
      setRecordedChunks(chunks)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, {
          type: recordingType === 'video' ? 'video/webm' : 'audio/webm'
        })
        
        const incident = {
          incidentId: 'incident_' + Date.now(),
          userId: user.userId,
          timestamp: new Date().toISOString(),
          location: location,
          recordingBlob: blob,
          recordingType: recordingType,
          summaryText: generateSummary(),
          notes: notes,
          createdAt: new Date().toISOString()
        }

        setCurrentIncident(incident)
        setIncidents(prev => [incident, ...prev])
      }

      recorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Recording error:', error)
      alert('Could not access camera/microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    
    setIsRecording(false)
  }

  const generateSummary = () => {
    const now = new Date()
    const locationText = location 
      ? `Location: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
      : 'Location: Not available'
    
    return `Incident recorded on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}\n${locationText}\nRecording type: ${recordingType}\nNotes: ${notes || 'None'}`
  }

  const sendAlert = async () => {
    if (user.trustedContacts.length === 0) {
      alert('Please add trusted contacts in settings first.')
      return
    }

    // Simulate sending alert (in real app, this would call an API)
    setAlertSent(true)
    
    // Reset after 3 seconds
    setTimeout(() => setAlertSent(false), 3000)
    
    console.log('Alert sent to trusted contacts:', user.trustedContacts)
  }

  const downloadRecording = (incident) => {
    if (!incident.recordingBlob) return
    
    const url = URL.createObjectURL(incident.recordingBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `incident_${incident.incidentId}.${incident.recordingType === 'video' ? 'webm' : 'webm'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-text mb-2">Incident Recorder</h1>
        <p className="text-text/70">
          Discretely record interactions and alert trusted contacts
        </p>
      </div>

      {/* Recording Controls */}
      <ContentCard>
        <div className="space-y-6">
          {/* Recording Type Selection */}
          <div>
            <label className="block text-sm font-medium text-text mb-3">Recording Type</label>
            <div className="flex space-x-4">
              <button
                onClick={() => setRecordingType('audio')}
                disabled={isRecording}
                className={`flex items-center space-x-2 px-4 py-3 rounded-md transition-colors ${
                  recordingType === 'audio'
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-primary/20 text-text hover:bg-primary/5'
                } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Mic className="h-5 w-5" />
                <span>Audio Only</span>
              </button>
              <button
                onClick={() => setRecordingType('video')}
                disabled={isRecording}
                className={`flex items-center space-x-2 px-4 py-3 rounded-md transition-colors ${
                  recordingType === 'video'
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-primary/20 text-text hover:bg-primary/5'
                } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Video className="h-5 w-5" />
                <span>Video</span>
              </button>
            </div>
          </div>

          {/* Video Preview */}
          {recordingType === 'video' && (
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any relevant details..."
              className="input h-20 resize-none"
              disabled={isRecording}
            />
          </div>

          {/* Recording Button */}
          <div className="text-center">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="btn-danger w-full sm:w-auto px-8 py-4 text-lg"
              >
                <div className="flex items-center justify-center space-x-3">
                  {recordingType === 'video' ? <Video className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  <span>Start Recording</span>
                </div>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="bg-red-600 text-white px-8 py-4 text-lg rounded-md font-medium shadow-card hover:opacity-90 transition-opacity w-full sm:w-auto"
              >
                <div className="flex items-center justify-center space-x-3">
                  <Square className="h-6 w-6" />
                  <span>Stop Recording</span>
                </div>
              </button>
            )}
          </div>

          {/* Alert Button */}
          {user.trustedContacts.length > 0 && (
            <div className="border-t border-primary/10 pt-4">
              <button
                onClick={sendAlert}
                disabled={alertSent}
                className={`w-full py-3 rounded-md font-medium transition-colors ${
                  alertSent
                    ? 'bg-accent text-white'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Send className="h-5 w-5" />
                  <span>{alertSent ? 'Alert Sent!' : 'Send Emergency Alert'}</span>
                </div>
              </button>
            </div>
          )}

          {/* Location Info */}
          {location && (
            <div className="bg-primary/5 border border-primary/10 rounded-md p-3">
              <div className="flex items-center space-x-2 text-sm text-text/80">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
              </div>
            </div>
          )}
        </div>
      </ContentCard>

      {/* Recent Incidents */}
      {incidents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-text mb-4">Recent Incidents</h2>
          <div className="space-y-4">
            {incidents.slice(0, 5).map((incident) => (
              <ContentCard key={incident.incidentId}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-text">
                        {new Date(incident.timestamp).toLocaleDateString()} at{' '}
                        {new Date(incident.timestamp).toLocaleTimeString()}
                      </p>
                      <p className="text-sm text-text/70 capitalize">
                        {incident.recordingType} recording
                      </p>
                    </div>
                    <button
                      onClick={() => downloadRecording(incident)}
                      className="btn-secondary text-sm px-3 py-1"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Download
                    </button>
                  </div>
                  
                  {incident.notes && (
                    <p className="text-sm text-text/80 bg-primary/5 rounded p-2">
                      {incident.notes}
                    </p>
                  )}
                </div>
              </ContentCard>
            ))}
          </div>
        </div>
      )}

      {/* Safety Notice */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-orange-900">Safety Notice</p>
            <p className="text-xs text-orange-800 mt-1">
              Recording laws vary by state. Some states require consent from all parties. 
              Use discretion and prioritize your safety above all else.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IncidentRecorder