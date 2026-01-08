import { useState, type ReactElement } from 'react';
import { FiTrendingUp, FiEdit2, FiCheck, FiClock, FiTool, FiAlertTriangle, FiXCircle, FiChevronDown } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { supabase } from '../../utils/supabase/client';
import type { Dress } from '../../pages/Catalogo';
import '../../styles/DressCard.css';

interface DressCardProps {
  dress: Dress;
  onStatusChange?: () => void;
  onEdit?: (dress: Dress) => void;
}

interface StatusOption {
  value: string;
  label: string;
  icon: ReactElement;
  color: string;
}

const DressCard = ({ dress, onStatusChange, onEdit }: DressCardProps) => {
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const statusOptions: StatusOption[] = [
    { value: 'available', label: 'Disponible', icon: <FiCheck />, color: '#28a745' },
    { value: 'rented', label: 'Rentado', icon: <FiClock />, color: '#ffc107' },
    { value: 'maintenance', label: 'Mantenimiento', icon: <FiTool />, color: '#0d6efd' },
    { value: 'damaged', label: 'Dañado', icon: <FiAlertTriangle />, color: '#dc3545' },
    { value: 'not_available', label: 'No Disponible', icon: <FiXCircle />, color: '#6c757d' },
  ];

  const getCurrentStatus = () => {
    return statusOptions.find(opt => opt.value === dress.status) || statusOptions[0];
  };

  const handleStatusChange = async (newStatus: string) => {
    if (isChangingStatus || newStatus === dress.status) {
      setIsDropdownOpen(false);
      return;
    }

    setIsChangingStatus(true);
    setIsDropdownOpen(false);

    try {
      const { error } = await supabase
        .from('Products')
        .update({ status: newStatus })
        .eq('id', parseInt(dress.id));

      if (error) {
        toast.error('Error al actualizar el estado');
      } else {
        toast.success('Estado actualizado');
        if (onStatusChange) {
          onStatusChange();
        }
      }
    } catch (error) {
      toast.error('Error al actualizar el estado');
    } finally {
      setIsChangingStatus(false);
    }
  };

  const getStatusClass = () => {
    const status = dress.status || 'available';
    return status.replace('_', '-');
  };

  const currentStatus = getCurrentStatus();

  return (
    <div className="dress-card">
      <div className="dress-image-container">
        {dress.image ? (
          <img src={dress.image} alt={dress.name} className="dress-image" />
        ) : (
          <div className="dress-image-placeholder">
            {/* Placeholder gris para la imagen */}
          </div>
        )}
        {onEdit && (
          <button
            className="dress-edit-button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(dress);
            }}
            title="Editar vestido"
          >
            <FiEdit2 />
          </button>
        )}
        <div className="dress-rental-badge">
          <FiTrendingUp className="badge-icon" />
          <span className="badge-text">{dress.rentals} rentas</span>
        </div>
      </div>
      <div className="dress-info">
        <h3 className="dress-name">{dress.name}</h3>
        <div className="dress-prices">
          <div className="price-item">
            <span className="price-label">Renta:</span>
            <span className="dress-price">${dress.rental_price}</span>
          </div>
          {dress.sales_price && dress.sales_price > 0 && (
            <div className="price-item">
              <span className="price-label">Venta:</span>
              <span className="dress-price sales-price">${dress.sales_price}</span>
            </div>
          )}
        </div>

        {/* Custom Dropdown */}
        <div className="status-dropdown-container">
          <button
            type="button"
            className={`status-dropdown-button ${getStatusClass()}`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={isChangingStatus}
          >
            <span className="status-icon" style={{ color: currentStatus.color }}>
              {currentStatus.icon}
            </span>
            <span className="status-label">{currentStatus.label}</span>
            <FiChevronDown className={`dropdown-chevron ${isDropdownOpen ? 'open' : ''}`} />
          </button>

          {isDropdownOpen && (
            <>
              <div className="dropdown-overlay" onClick={() => setIsDropdownOpen(false)} />
              <div className="status-dropdown-menu">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`status-option ${option.value === dress.status ? 'selected' : ''}`}
                    onClick={() => handleStatusChange(option.value)}
                  >
                    <span className="option-icon" style={{ color: option.color }}>
                      {option.icon}
                    </span>
                    <span className="option-label">{option.label}</span>
                    {option.value === dress.status && (
                      <FiCheck className="check-icon" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DressCard;
