import './LoadingSpinner.css'

export default function LoadingSpinner({ message = 'Loading...', fullScreen = false }) {
  return (
    <div className={`loading-spinner ${fullScreen ? 'loading-spinner--fullscreen' : ''}`}>
      <div className="spinner-container">
        <div className="spinner"></div>
        {message && <p className="loading-message">{message}</p>}
      </div>
    </div>
  )
}
