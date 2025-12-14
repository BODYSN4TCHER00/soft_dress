import { FiPlus } from 'react-icons/fi';
import '../../styles/FloatingActionButton.css';

interface FloatingActionButtonProps {
  onClick?: () => void;
}

const FloatingActionButton = ({ onClick }: FloatingActionButtonProps) => {
  return (
    <button className="fab-button" onClick={onClick}>
      <FiPlus className="fab-icon" />
    </button>
  );
};

export default FloatingActionButton;

