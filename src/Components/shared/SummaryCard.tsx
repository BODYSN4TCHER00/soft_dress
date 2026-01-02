import type { ReactNode } from 'react';
import '../../styles/SummaryCard.css';

export type SummaryCardVariant = 'default' | 'frequent' | 'blacklist' | 'success' | 'warning' | 'danger';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  variant?: SummaryCardVariant;
  subtitle?: string;
  items?: Array<{ label: string; value: string; dot?: 'green' | 'yellow' | 'red' }>;
  className?: string;
  onClick?: () => void;
}

const SummaryCard = ({
  title,
  value,
  icon,
  variant = 'default',
  subtitle,
  items,
  className = '',
  onClick
}: SummaryCardProps) => {
  const cardClass = `summary-card summary-card-${variant} ${className} ${onClick ? 'clickable' : ''}`.trim();

  return (
    <div className={cardClass} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      {icon && (
        <div className="card-icon">
          {icon}
        </div>
      )}
      <div className="card-content">
        <div className="card-title">{title}</div>
        {items ? (
          <div className="card-items">
            {items.map((item, index) => (
              <div key={index} className="card-item">
                {item.dot && <span className={`dot dot-${item.dot}`}></span>}
                <span>{item.label}: {item.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="card-value">{value}</div>
            {subtitle && <div className="card-subtitle">{subtitle}</div>}
          </>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;

