
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

interface UserMenuProps {
  onOpenSettings: () => void;
}

const UserMenu = ({ onOpenSettings }: UserMenuProps) => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const handleSettings = () => {
    onOpenSettings();
    setIsOpen(false);
  };

  // Extract first name from full name or use email if no full name
  const getDisplayName = () => {
    const fullName = user?.user_metadata?.full_name;
    if (fullName) {
      return fullName.split(' ')[0]; // Get first name
    }
    return user?.email?.split('@')[0] || 'User';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 sm:gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors px-2 sm:px-3"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
            {getDisplayName()}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 sm:w-56 p-1 sm:p-2" align="end">
        <div className="space-y-1">
          <div className="px-2 py-1.5 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {user?.user_metadata?.full_name || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.email}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSettings}
            className="w-full justify-start h-8 px-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserMenu;
