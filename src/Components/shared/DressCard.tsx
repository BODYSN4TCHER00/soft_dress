import { useState } from 'react';
import { FiTrendingUp } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { supabase } from '../../utils/supabase/client';
import type { Dress } from '../../pages/Catalogo';
import '../../styles/DressCard.css';

interface DressCardProps {
  dress: Dress;
  onStatusChange?: () => void;
}

const DressCard = ({ dress, onStatusChange }: DressCardProps) => {
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const getStatusLabel = () => {
    if (dress.status === 'available') return 'Disponible';
    if (dress.status === 'rented') return 'Rentado';
    if (dress.status === 'maintenance') return 'Mantenimiento';
    return 'No Disponible';
  };

  const getNextStatus = () => {
    if (dress.status === 'available') return 'rented';
    if (dress.status === 'rented') return 'maintenance';
    if (dress.status === 'maintenance') return 'available';
    return 'available';
  };

  const handleStatusClick = async () => {
    if (isChangingStatus) return;

    const newStatus = getNextStatus();
    setIsChangingStatus(true);

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
    if (dress.status === 'available') return 'available';
    if (dress.status === 'rented') return 'rented';
    if (dress.status === 'maintenance') return 'maintenance';
    return 'unavailable';
  };

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
        <div className="dress-rental-badge">
          <FiTrendingUp className="badge-icon" />
          <span className="badge-text">{dress.rentals} rentas</span>
        </div>
      </div>
      <div className="dress-info">
        <h3 className="dress-name">{dress.name}</h3>
        <p className="dress-price">${dress.price} por renta</p>
        <button 
          className={`dress-status-button ${getStatusClass()}`}
          onClick={handleStatusClick}
          disabled={isChangingStatus}
        >
          {isChangingStatus ? 'Cambiando...' : getStatusLabel()}
        </button>
      </div>
    </div>
  );
};

export default DressCard;

