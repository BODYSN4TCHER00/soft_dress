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
  const firstItem = items && items.length > 0 ? items[0] : null;

  return (
    <div className="delivery-card" style={{ borderLeftColor: borderColor }}>
      <div className="delivery-badge">
        {badgeCount}
      </div>
      <h3 className="delivery-title">{title}</h3>
      {empty ? (
        <p className="delivery-empty">{emptyMessage}</p>
      ) : firstItem ? (
        <div className="delivery-item-content">
          <div className="delivery-item-dress">{firstItem.dress}</div>
          <div className="delivery-item-client">{firstItem.client}</div>
          <div className="delivery-item-date">{firstItem.date}</div>
        </div>
      ) : null}
    </div>
  );
};

export default DeliveryCard;
