import { useState, useRef, useEffect } from 'react';
import { FiMoreVertical, FiUserCheck, FiUserX, FiUserMinus, FiStar } from 'react-icons/fi';
import type { Customer } from '../../pages/admin/Clientes';
import '../../styles/CustomerStatusDropdown.css';

type CustomerStatus = 'active' | 'inactive' | 'blacklisted' | 'frecuent_customer';

interface CustomerStatusDropdownProps {
    customer: Customer;
    onStatusChange: (customer: Customer, newStatus: CustomerStatus) => void;
}

const CustomerStatusDropdown = ({ customer, onStatusChange }: CustomerStatusDropdownProps) => {
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

    // Close dropdown when clicking outside
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
        <div className="customer-status-dropdown" ref={dropdownRef}>
            <button
                className="status-dropdown-trigger"
                onClick={toggleDropdown}
                title="Gestionar estado del cliente"
            >
                <FiMoreVertical />
            </button>

            {isOpen && (
                <div className="status-dropdown-menu">
                    <button
                        className={`status-option ${customer.status === 'active' ? 'selected' : ''}`}
                        onClick={(e) => handleStatusChange(e, 'active')}
                    >
                        <FiUserCheck className="option-icon" />
                        <span>Activo</span>
                    </button>
                    <button
                        className={`status-option ${customer.status === 'inactive' ? 'selected' : ''}`}
                        onClick={(e) => handleStatusChange(e, 'inactive')}
                    >
                        <FiUserX className="option-icon" />
                        <span>Inactivo</span>
                    </button>
                    <button
                        className={`status-option ${customer.status === 'frecuent_customer' ? 'selected' : ''}`}
                        onClick={(e) => handleStatusChange(e, 'frecuent_customer')}
                    >
                        <FiStar className="option-icon" />
                        <span>Cliente Frecuente</span>
                        {(customer.rental_count || 0) >= 3 && (
                            <span className="auto-badge">Auto</span>
                        )}
                    </button>
                    <button
                        className={`status-option blacklist ${customer.status === 'blacklisted' ? 'selected' : ''}`}
                        onClick={(e) => handleStatusChange(e, 'blacklisted')}
                    >
                        <FiUserMinus className="option-icon" />
                        <span>Lista Negra</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default CustomerStatusDropdown;
