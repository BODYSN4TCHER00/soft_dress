import { FiStar } from 'react-icons/fi';
import '../../styles/FrequentClients.css';

interface Client {
  id: string;
  name: string;
  rentals: number;
  lastRental?: string;
}

interface FrequentClientsProps {
  clients?: Client[];
}

const FrequentClients = ({ clients }: FrequentClientsProps) => {
  // Datos de ejemplo si no se proporcionan
  const defaultClients: Client[] = clients || [
    { id: '1', name: 'María González', rentals: 8, lastRental: '2024-01-15' },
    { id: '2', name: 'Ana Martínez', rentals: 6, lastRental: '2024-01-10' },
    { id: '3', name: 'Laura Sánchez', rentals: 5, lastRental: '2024-01-08' },
  ];

  return (
    <div className="frequent-clients-card">
      <div className="frequent-clients-header">
        <div className="frequent-clients-icon">
          <FiStar />
        </div>
        <h3 className="frequent-clients-title">Clientes Frecuentes</h3>
      </div>
      <div className="frequent-clients-content">
        {defaultClients.length > 0 ? (
          <ul className="clients-list">
            {defaultClients.map((client) => (
              <li key={client.id} className="client-item">
                <div className="client-info">
                  <div className="client-name">{client.name}</div>
                  <div className="client-details">
                    <span className="client-rentals">{client.rentals} rentas</span>
                    {client.lastRental && (
                      <span className="client-last">Última: {new Date(client.lastRental).toLocaleDateString('es-ES')}</span>
                    )}
                  </div>
                </div>
                <div className="client-badge">
                  <FiStar className="star-icon" />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-clients">
            <p>No hay clientes frecuentes registrados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FrequentClients;

