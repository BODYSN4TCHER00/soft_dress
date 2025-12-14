import '../../styles/StatusBadge.css';

export type StatusType = 'active' | 'completed' | 'cancelled' | 'pending' | 'inactive';

interface StatusBadgeProps {
  status: string | StatusType;
  onClick?: () => void;
  className?: string;
}

const StatusBadge = ({ status, onClick, className = '' }: StatusBadgeProps) => {
  // Normalizar el estado a minúsculas para comparación
  const normalizedStatus = status.toLowerCase();
  
  // Mapear estados en español a tipos
  let statusType: StatusType = 'active';
  let displayText = status;

  if (normalizedStatus.includes('activo') || normalizedStatus === 'active') {
    statusType = 'active';
    displayText = 'Activo';
  } else if (normalizedStatus.includes('completado') || normalizedStatus === 'completed') {
    statusType = 'completed';
    displayText = 'Completado';
  } else if (normalizedStatus.includes('cancelado') || normalizedStatus.includes('canceled') || normalizedStatus === 'cancelled') {
    statusType = 'cancelled';
    displayText = 'Cancelado';
  } else if (normalizedStatus.includes('pendiente') || normalizedStatus === 'pending') {
    statusType = 'pending';
    displayText = 'Pendiente';
  } else if (normalizedStatus.includes('inactivo') || normalizedStatus === 'inactive') {
    statusType = 'inactive';
    displayText = 'Inactivo';
  }

  const badgeClass = `status-badge status-${statusType} ${onClick ? 'clickable' : ''} ${className}`.trim();

  return (
    <span 
      className={badgeClass}
      onClick={onClick}
      title={onClick ? 'Click para cambiar estado' : undefined}
    >
      {displayText}
    </span>
  );
};

export default StatusBadge;

