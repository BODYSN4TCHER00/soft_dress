import { FiEdit, FiTrash2 } from 'react-icons/fi';
import type { Rental } from '../../pages/staff/Rentas';
import '../../styles/RentalTable.css';

interface RentalTableProps {
  rentals: Rental[];
  selectedRentals: Set<string>;
  onSelectAll: (checked: boolean) => void;
  onSelectRental: (id: string, checked: boolean) => void;
  onView: (rental: Rental) => void;
  onEdit: (rental: Rental) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: Rental['estado']) => void;
  isSelectionMode: boolean;
}

const RentalTable = ({
  rentals,
  selectedRentals,
  onSelectAll,
  onSelectRental,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  isSelectionMode
}: RentalTableProps) => {
  const allSelected = rentals.length > 0 && rentals.every(r => selectedRentals.has(r.id));
  const someSelected = rentals.some(r => selectedRentals.has(r.id));

  const handleRowClick = (rental: Rental, e: React.MouseEvent) => {
    // No abrir detalles si se hace clic en checkbox o botones
    if ((e.target as HTMLElement).closest('input[type="checkbox"]') ||
      (e.target as HTMLElement).closest('.action-buttons')) {
      return;
    }
    onView(rental);
  };

  const handleEditClick = (rental: Rental, e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(rental);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
  };

  const getStatusBadgeClass = (estado: string) => {
    switch (estado) {
      case 'Finalizado':
        return 'status-badge completed';
      case 'Cancelado':
        return 'status-badge cancelled';
      case 'En Curso':
        return 'status-badge active';
      case 'Pendiente':
        return 'status-badge pending';
      default:
        return 'status-badge';
    }
  };

  const handleStatusClick = (rental: Rental, e: React.MouseEvent) => {
    e.stopPropagation();
    const statuses: Rental['estado'][] = ['Pendiente', 'En Curso', 'Finalizado', 'Cancelado'];
    const currentIndex = statuses.indexOf(rental.estado);
    const nextIndex = (currentIndex + 1) % statuses.length;
    onStatusChange(rental.id, statuses[nextIndex]);
  };

  return (
    <div className="rental-table-container">
      {isSelectionMode && (
        <div className="table-header-actions">
          <div className="select-all-container">
            <label className="select-all-label">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected && !allSelected;
                }}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="select-checkbox"
              />
              <span>Seleccionar</span>
            </label>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className="rental-table">
          <thead>
            <tr>
              {isSelectionMode && <th style={{ width: '50px' }}></th>}
              <th>Cliente</th>
              <th>Vestido</th>
              <th>Fecha Renta</th>
              <th>Entrega</th>
              <th>Devolucion</th>
              <th>Teléfono</th>
              <th>Tel. 2</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rentals.map((rental) => (
              <tr
                key={rental.id}
                className="rental-row"
                onClick={(e) => handleRowClick(rental, e)}
              >
                {isSelectionMode && (
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRentals.has(rental.id)}
                      onChange={(e) => onSelectRental(rental.id, e.target.checked)}
                      className="row-checkbox"
                    />
                  </td>
                )}
                <td>{rental.cliente}</td>
                <td>{rental.vestido}</td>
                <td>{rental.fechaRenta}</td>
                <td>{rental.entrega}</td>
                <td>{rental.devolucion}</td>
                <td>{rental.telefono}</td>
                <td>{rental.segundoTelefono || '-'}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <span
                    className={`${getStatusBadgeClass(rental.estado)} clickable-status`}
                    onClick={(e) => handleStatusClick(rental, e)}
                    title="Click para cambiar estado"
                  >
                    {rental.estado}
                  </span>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="action-buttons">
                    <button
                      className="action-btn edit-btn"
                      onClick={(e) => handleEditClick(rental, e)}
                      title="Editar"
                    >
                      <FiEdit />
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={(e) => handleDeleteClick(rental.id, e)}
                      title="Eliminar"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RentalTable;

