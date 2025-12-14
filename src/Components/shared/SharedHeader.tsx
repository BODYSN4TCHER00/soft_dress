import { useState } from 'react';
import { FiSearch, FiBell } from 'react-icons/fi';
import { useAuth } from '../../utils/context/AuthContext';
import { toast } from 'react-hot-toast';
import NotificationsModal from './NotificationsModal';
import { generateDailyReport } from '../../utils/reports/generateReport';
import '../../styles/SharedHeader.css';

interface SharedHeaderProps {
  onSearch?: (query: string) => void;
  onGenerateReport?: () => void;
  searchValue?: string;
  showWelcome?: boolean;
  placeholder?: string;
}

const SharedHeader = ({ 
  onSearch, 
  onGenerateReport, 
  searchValue: controlledSearchValue,
  showWelcome = true,
  placeholder = 'Buscar...'
}: SharedHeaderProps) => {
  const { user } = useAuth();
  const [internalSearchValue, setInternalSearchValue] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  const searchValue = controlledSearchValue !== undefined ? controlledSearchValue : internalSearchValue;

  const handleSearchChange = (value: string) => {
    if (controlledSearchValue === undefined) {
      setInternalSearchValue(value);
    }
    onSearch?.(value);
  };

  const handleGenerateReport = async () => {
    if (onGenerateReport) {
      onGenerateReport();
      return;
    }

    try {
      setIsGeneratingReport(true);
      toast.loading('Generando reporte...', { id: 'report' });
      await generateDailyReport();
      toast.success('Reporte generado exitosamente', { id: 'report' });
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Error al generar el reporte', { id: 'report' });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleNotificationsClick = () => {
    setIsNotificationsOpen(true);
  };

  return (
    <div className="shared-header">
      <div className="header-top">
        <div className="search-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="header-right">
          {showWelcome && user && (
            <span className="welcome-text">Bienvenido, {user.name}</span>
          )}
          <button 
            className="report-button" 
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? 'Generando...' : 'Generar reporte'}
          </button>
          <button className="bell-button" onClick={handleNotificationsClick}>
            <FiBell />
          </button>
        </div>
      </div>

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
};

export default SharedHeader;

