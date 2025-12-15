import type { ReactNode } from 'react';
import '../../styles/MetricCard.css';

interface MetricCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  iconColor?: string;
}

const MetricCard = ({ title, icon, children, iconColor = '#7C107C' }: MetricCardProps) => {
  return (
    <div className="metric-card">
      <div className="metric-header">
        <div className="metric-icon" style={{ color: iconColor }}>
          {icon}
        </div>
        <h3 className="metric-title">{title}</h3>
      </div>
      <div className="metric-content">
        {children}
      </div>
    </div>
  );
};

export default MetricCard;

