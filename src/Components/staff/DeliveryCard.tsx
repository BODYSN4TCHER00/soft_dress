import { FiCalendar } from 'react-icons/fi';
import '../../styles/DeliveryCard.css';

interface DeliveryCardProps {
  title: string;
  borderColor: string;
  badgeCount: number;
  empty?: boolean;
  emptyMessage?: string;
  items?: Array<{
    id: number;
    dress: string;
    client: string;
    date: string;
  }>;
  onItemClick?: (item: { id: number; dress: string; client: string; date: string }) => void;
}

const DeliveryCard = ({ title, borderColor, badgeCount, empty, emptyMessage, items, onItemClick }: DeliveryCardProps) => {
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
          {items.map((item) => (
            <div
              key={item.id}
              className={`delivery-item ${onItemClick ? 'clickable' : ''}`}
              onClick={() => onItemClick?.(item)}
            >
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
