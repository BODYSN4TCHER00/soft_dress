import { FiShoppingBag } from 'react-icons/fi';
import '../../styles/ReserveDressButton.css';

interface ReserveDressButtonProps {
  onClick?: () => void;
}

const ReserveDressButton = ({ onClick }: ReserveDressButtonProps) => {
  return (
    <button className="reserve-dress-button" onClick={onClick}>
      <div className="reserve-icon">
        <FiShoppingBag />
      </div>
      <span className="reserve-text">Reservar Vestido</span>
    </button>
  );
};

export default ReserveDressButton;

