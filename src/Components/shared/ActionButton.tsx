import { ReactNode } from 'react';
import '../../styles/ActionButton.css';

export type ActionButtonVariant = 'edit' | 'delete' | 'view' | 'blue' | 'yellow' | 'red' | 'green';

interface ActionButtonProps {
  variant?: ActionButtonVariant;
  onClick: (e?: React.MouseEvent) => void;
  icon?: ReactNode;
  title?: string;
  className?: string;
  children?: ReactNode;
}

const ActionButton = ({ 
  variant = 'blue', 
  onClick, 
  icon, 
  title, 
  className = '',
  children 
}: ActionButtonProps) => {
  const buttonClass = `action-btn action-btn-${variant} ${className}`.trim();

  return (
    <button 
      className={buttonClass}
      onClick={onClick}
      title={title}
    >
      {icon}
      {children}
    </button>
  );
};

export default ActionButton;

