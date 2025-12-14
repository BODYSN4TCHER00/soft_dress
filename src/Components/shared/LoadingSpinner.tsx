import '../../styles/LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  fullScreen?: boolean;
  message?: string;
}

const LoadingSpinner = ({ 
  size = 'medium', 
  color = '#7C107C',
  fullScreen = false,
  message 
}: LoadingSpinnerProps) => {
  const spinner = (
    <div className={`loading-spinner-container ${fullScreen ? 'fullscreen' : ''}`}>
      <div className={`spinner ${size}`} style={{ borderTopColor: color }}>
        <div className="spinner-inner"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-overlay">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;

