import { useState, useMemo, useEffect } from 'react';
import { FiX, FiSearch, FiUser } from 'react-icons/fi';
import { supabase } from '../../utils/supabase/client';
import '../../styles/ClientSearchModal.css';

export interface Client {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  segundoTelefono?: string;
  domicilio: string;
  email?: string;
}

interface ClientSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (client: Client) => void;
}

interface CustomerFromDB {
  id: number;
  name: string;
  last_name: string | null;
  phone: string | null;
  second_phone: string | null;
  email: string | null;
  ine_url: string | null; // Columna en minúsculas en la base de datos
}

const ClientSearchModal = ({ isOpen, onClose, onSelect }: ClientSearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'telefono' | 'nombre'>('telefono');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && searchQuery) {
      loadClients();
    }
  }, [isOpen, searchQuery, searchType]);

  const loadClients = async () => {
    if (!searchQuery.trim()) {
      setClients([]);
      return;
    }

    try {
      setLoading(true);
      let query = supabase.from('Customers').select('*');

      if (searchType === 'telefono') {
        query = query.ilike('phone', `%${searchQuery}%`);
      } else {
        query = query.or(`name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.limit(20);

      if (error) {
        console.error('Error loading clients:', error);
        return;
      }

      if (data) {
        const mappedClients: Client[] = data.map((customer: CustomerFromDB) => ({
          id: customer.id.toString(),
          nombre: customer.name,
          apellido: customer.last_name || '',
          telefono: customer.phone || '',
          segundoTelefono: customer.second_phone || undefined,
          domicilio: '', // No hay domicilio en Customers, se puede agregar después
          email: customer.email || undefined,
        }));

        setClients(mappedClients);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Los hooks deben estar antes del early return
  const filteredClients = useMemo(() => {
    return clients;
  }, [clients]);

  if (!isOpen) return null;

  const handleSelect = (client: Client) => {
    onSelect(client);
    onClose();
    setSearchQuery('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="client-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Buscar Cliente Registrado</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          <div className="search-type-buttons">
            <button
              type="button"
              className={`search-type-btn ${searchType === 'telefono' ? 'active' : ''}`}
              onClick={() => {
                setSearchType('telefono');
                setSearchQuery('');
              }}
            >
              Por Teléfono
            </button>
            <button
              type="button"
              className={`search-type-btn ${searchType === 'nombre' ? 'active' : ''}`}
              onClick={() => {
                setSearchType('nombre');
                setSearchQuery('');
              }}
            >
              Por Nombre
            </button>
          </div>

          <div className="modal-search">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder={searchType === 'telefono' ? 'Buscar por teléfono...' : 'Buscar por nombre...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              autoFocus
            />
          </div>

          <div className="clients-list">
            {loading ? (
              <div className="no-results">
                <p>Buscando...</p>
              </div>
            ) : filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="client-card"
                  onClick={() => handleSelect(client)}
                >
                  <FiUser className="client-icon" />
                  <div className="client-info">
                    <div className="client-name">
                      {client.nombre} {client.apellido}
                    </div>
                    <div className="client-details">
                      <span>Tel: {client.telefono}{client.segundoTelefono && ` / ${client.segundoTelefono}`}</span>
                      {client.email && (
                        <>
                          <span>•</span>
                          <span>{client.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : searchQuery ? (
              <div className="no-results">
                <p>No se encontraron clientes</p>
              </div>
            ) : (
              <div className="no-results">
                <p>Ingresa {searchType === 'telefono' ? 'un teléfono' : 'un nombre'} para buscar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSearchModal;

