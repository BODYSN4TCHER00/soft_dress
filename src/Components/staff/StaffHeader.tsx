// Re-export SharedHeader for backward compatibility
import SharedHeader from '../shared/SharedHeader';

interface StaffHeaderProps {
  onSearch?: (query: string) => void;
}

const StaffHeader = (props: StaffHeaderProps) => {
  return <SharedHeader {...props} />;
};

export default StaffHeader;

