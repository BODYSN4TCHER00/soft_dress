import { ReactNode } from 'react';
import StaffNavbar from './StaffNavbar';
import '../../styles/StaffMenu.css';

interface StaffLayoutProps {
  children: ReactNode;
}

const StaffLayout = ({ children }: StaffLayoutProps) => {
  return (
    <div className="staff-layout">
      <StaffNavbar />
      <div className="staff-main-content">
        {children}
      </div>
    </div>
  );
};

export default StaffLayout;

