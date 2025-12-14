import { FiX } from 'react-icons/fi';
import type { Rental } from '../../pages/staff/Rentas';
import '../../styles/RentalDetailModal.css';

interface RentalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: Rental | null;
}

const RentalDetailModal = ({ isOpen, onClose, rental }: RentalDetailModalProps) => {
  if (!isOpen || !rental) return null;

  const getStatusBadgeClass = (estado: string) => {
    switch (estado) {
      case 'Completado':
        return 'status-badge completed';
      case 'Cancelado':
        return 'status-badge cancelled';
      case 'Activo':
        return 'status-badge active';
      default:
        return 'status-badge';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="rental-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Detalles de la Renta</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <h3 className="section-title">Información del Cliente</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Cliente</span>
                <span className="detail-value">{rental.cliente}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Teléfono</span>
                <span className="detail-value">
                  {rental.telefono}
                  {rental.segundoTelefono && ` / ${rental.segundoTelefono}`}
                </span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3 className="section-title">Información de la Renta</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Vestido</span>
                <span className="detail-value">{rental.vestido}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Fecha de Renta</span>
                <span className="detail-value">{rental.fechaRenta}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Fecha de Entrega</span>
                <span className="detail-value">{rental.entrega}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Fecha de Devolución</span>
                <span className="detail-value">{rental.devolucion}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Estado</span>
                <span className={getStatusBadgeClass(rental.estado)}>
                  {rental.estado}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalDetailModal;

