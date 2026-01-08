import { useState, useMemo } from 'react';
import { FiX, FiSearch } from 'react-icons/fi';
import type { Dress } from '../../pages/Catalogo';
import '../../styles/SelectDressModal.css';

interface SelectDressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (dress: Dress) => void;
  dresses: Dress[];
}

const SelectDressModal = ({ isOpen, onClose, onSelect, dresses }: SelectDressModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Los hooks deben estar antes del early return
  const filteredDresses = useMemo(() => {
    if (!searchQuery) return dresses;
    const query = searchQuery.toLowerCase();
    return dresses.filter(dress =>
      dress.name.toLowerCase().includes(query)
    );
  }, [dresses, searchQuery]);

  if (!isOpen) return null;

  const totalPages = Math.ceil(filteredDresses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDresses = filteredDresses.slice(startIndex, startIndex + itemsPerPage);

  const handleSelect = (dress: Dress) => {
    onSelect(dress);
    onClose();
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="select-dress-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Seleccionar Vestido</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-search">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar vestido..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
          />
        </div>

        <div className="modal-body">
          <div className="dresses-grid-modal">
            {paginatedDresses.length > 0 ? (
              paginatedDresses.map((dress) => (
                <div
                  key={dress.id}
                  className={`dress-card-modal ${!dress.available ? 'unavailable' : ''}`}
                  onClick={() => dress.available && handleSelect(dress)}
                >
                  <div className="dress-image-placeholder-modal">
                    {dress.image ? (
                      <img src={dress.image} alt={dress.name} />
                    ) : (
                      <div className="image-placeholder">👗</div>
                    )}
                  </div>
                  <div className="dress-info-modal">
                    <h4 className="dress-name-modal">{dress.name}</h4>
                    <p className="dress-price-modal">${dress.rental_price} por renta</p>
                    {!dress.available && (
                      <span className="unavailable-badge">No Disponible</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <p>No se encontraron vestidos</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span className="pagination-info">
                Página {currentPage} de {totalPages} ({filteredDresses.length} vestidos)
              </span>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectDressModal;

