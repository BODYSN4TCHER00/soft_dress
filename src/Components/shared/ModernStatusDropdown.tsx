import { useState, useRef, useEffect } from 'react';
import { FiMoreVertical, FiUserCheck, FiUserX, FiUserMinus, FiStar, FiX } from 'react-icons/fi';
import type { Customer } from '../../pages/admin/Clientes';
import '../../styles/ModernStatusDropdown.css';

type CustomerStatus = 'active' | 'inactive' | 'blacklisted' | 'frecuent_customer';

interface ModernStatusDropdownProps {
    customer: Customer;
    onStatusChange: (customer: Customer, newStatus: CustomerStatus) => void;
}

const ModernStatusDropdown = ({ customer, onStatusChange }: ModernStatusDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleDropdown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const handleStatusChange = (e: React.MouseEvent, newStatus: CustomerStatus) => {
        e.stopPropagation();
        onStatusChange(customer, newStatus);
        setIsOpen(false);
    };

    const closeDropdown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    return (
        <div className="modern-status-dropdown" ref={dropdownRef}>
            <button
                className="status-trigger-btn"
                onClick={toggleDropdown}
                title="Cambiar estado"
            >
                <FiMoreVertical />
            </button>

            {isOpen && (
                <>
                    <div className="dropdown-overlay" onClick={closeDropdown} />
                    <div className="modern-dropdown-menu">
                        <button
                            className={`modern-option ${customer.status === 'active' ? 'active' : ''}`}
                            onClick={(e) => handleStatusChange(e, 'active')}
                        >
                            <FiUserCheck className="option-icon" />
                            <span className="option-text">ACTIVO</span>
                        </button>
                        <button
                            className={`modern-option ${customer.status === 'inactive' ? 'active' : ''}`}
                            onClick={(e) => handleStatusChange(e, 'inactive')}
                        >
                            <FiUserX className="option-icon" />
                            <span className="option-text">INACTIVO</span>
                        </button>
                        <button
                            className={`modern-option ${customer.status === 'frecuent_customer' ? 'active' : ''}`}
                            onClick={(e) => handleStatusChange(e, 'frecuent_customer')}
                        >
                            <FiStar className="option-icon" />
                            <span className="option-text">CLIENTE FRECUENTE</span>
                        </button>
                        <button
                            className={`modern-option blacklist ${customer.status === 'blacklisted' ? 'active' : ''}`}
                            onClick={(e) => handleStatusChange(e, 'blacklisted')}
                        >
                            <FiUserMinus className="option-icon" />
                            <span className="option-text">LISTA NEGRA</span>
                        </button>

                        <button className="close-dropdown-btn" onClick={closeDropdown}>
                            <FiX />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ModernStatusDropdown;
