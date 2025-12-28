import { useState } from 'react';
import { FiSearch, FiBell } from 'react-icons/fi';
import NotificationsModal from './NotificationsModal';
import UserDropdown from './UserDropdown';
import '../../styles/SharedHeader.css';

interface SharedHeaderProps {
  onSearch?: (query: string) => void;
  searchValue?: string;
  placeholder?: string;
}

const SharedHeader = ({
  onSearch,
  searchValue: controlledSearchValue,
  placeholder = 'Buscar...'
}: SharedHeaderProps) => {
  const [internalSearchValue, setInternalSearchValue] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const searchValue = controlledSearchValue !== undefined ? controlledSearchValue : internalSearchValue;

  const handleSearchChange = (value: string) => {
    if (controlledSearchValue === undefined) {
      setInternalSearchValue(value);
    }
    onSearch?.(value);
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
          <button className="bell-button" onClick={handleNotificationsClick}>
            <FiBell />
          </button>
          <UserDropdown />
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
