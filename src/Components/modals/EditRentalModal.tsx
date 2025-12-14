import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import type { Rental } from '../../pages/staff/Rentas';
import '../../styles/EditRentalModal.css';

interface EditRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: Rental | null;
  onSave: (updatedRental: Rental) => void;
}

const EditRentalModal = ({ isOpen, onClose, rental, onSave }: EditRentalModalProps) => {
  const [formData, setFormData] = useState<Rental | null>(null);

  useEffect(() => {
    if (rental) {
      setFormData({ ...rental });
    }
  }, [rental]);

  if (!isOpen || !rental || !formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-rental-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Editar Renta</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="cliente">Cliente</label>
            <input
              type="text"
              id="cliente"
              value={formData.cliente}
              onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="vestido">Vestido</label>
            <input
              type="text"
              id="vestido"
              value={formData.vestido}
              onChange={(e) => setFormData({ ...formData, vestido: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="fechaRenta">Fecha de Renta</label>
            <input
              type="text"
              id="fechaRenta"
              value={formData.fechaRenta}
              onChange={(e) => setFormData({ ...formData, fechaRenta: e.target.value })}
              placeholder="DD/MM/YYYY"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="entrega">Fecha de Entrega</label>
              <input
                type="text"
                id="entrega"
                value={formData.entrega}
                onChange={(e) => setFormData({ ...formData, entrega: e.target.value })}
                placeholder="DD/MM/YYYY"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="devolucion">Fecha de Devolución</label>
              <input
                type="text"
                id="devolucion"
                value={formData.devolucion}
                onChange={(e) => setFormData({ ...formData, devolucion: e.target.value })}
                placeholder="DD/MM/YYYY"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="segundoTelefono">Segundo Teléfono (Opcional)</label>
              <input
                type="tel"
                id="segundoTelefono"
                value={formData.segundoTelefono || ''}
                onChange={(e) => setFormData({ ...formData, segundoTelefono: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="estado">Estado</label>
            <select
              id="estado"
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value as Rental['estado'] })}
              required
            >
              <option value="Activo">Activo</option>
              <option value="Completado">Completado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRentalModal;

