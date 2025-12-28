import { FiCalendar } from 'react-icons/fi';
import '../../styles/DeliveryCard.css';

interface DeliveryCardProps {
  title: string;
  borderColor: string;
  badgeCount: number;
  empty?: boolean;
  emptyMessage?: string;
  items?: Array<{
    dress: string;
    client: string;
    date: string;
  }>;
}

const DeliveryCard = ({ title, borderColor, badgeCount, empty, emptyMessage, items }: DeliveryCardProps) => {
  return (
    <div className="delivery-card" style={{ borderLeftColor: borderColor }}>
      <div className="delivery-card-header">
        <h3 className="delivery-title">{title}</h3>
        <div className="delivery-badge">{badgeCount}</div>
      </div>

      {empty ? (
        <p className="delivery-empty">{emptyMessage}</p>
      ) : items && items.length > 0 ? (
        <div className="delivery-items-scroll">
          {items.map((item, index) => (
            <div key={index} className="delivery-item">
              <div className="delivery-item-dress">{item.dress}</div>
              <div className="delivery-item-client">{item.client}</div>
              <div className="delivery-item-date">
                <FiCalendar />
                {item.date}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default DeliveryCard;
