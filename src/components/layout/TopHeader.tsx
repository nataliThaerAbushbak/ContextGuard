import React from 'react';
import { Menu } from 'lucide-react';

interface TopHeaderProps {
  breadcrumb: string;
  auditTitle?: string;
  displayName?: string;
  onToggleMobileMenu?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  breadcrumb,
  auditTitle,
  displayName,
  onToggleMobileMenu,
}) => {
  const initial = displayName?.trim() ? displayName.trim().charAt(0).toUpperCase() : 'U';
  const tooltip = displayName?.trim() ? `${displayName.trim()}` : 'User profile';

  return (
    <header className="h-16 bg-[#F9F8F6] border-b border-[#EAE6DF] px-4 sm:px-8 flex items-center justify-between shrink-0 no-print">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE6DF]/60 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#78716C] truncate">
          <span>{breadcrumb}</span>
          {auditTitle && (
            <>
              <span className="text-[#D6D0C7]">/</span>
              <span className="text-[#1C1917] font-semibold truncate max-w-[200px] sm:max-w-xs">
                {auditTitle}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Profile Avatar Initials */}
        <div
          className="w-8 h-8 rounded-full bg-[#E5E7EB] text-[#374151] font-semibold text-xs flex items-center justify-center cursor-default select-none shadow-xs"
          title={tooltip}
        >
          {initial}
        </div>
      </div>
    </header>
  );
};
