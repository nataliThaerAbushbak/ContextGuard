import React from 'react';
import { LayoutGrid, PlusCircle, FolderGit2, BookOpen, Settings, X } from 'lucide-react';

export type NavView = 'dashboard' | 'new-audit' | 'my-audits' | 'sample-projects' | 'settings';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  onNewAuditClick: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onNewAuditClick,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'dashboard' as NavView, label: 'Dashboard', icon: LayoutGrid },
    { id: 'new-audit' as NavView, label: 'New Audit', icon: PlusCircle },
    { id: 'my-audits' as NavView, label: 'My Audits', icon: FolderGit2 },
    { id: 'sample-projects' as NavView, label: 'Sample Projects', icon: BookOpen },
    { id: 'settings' as NavView, label: 'Settings', icon: Settings },
  ];

  const handleItemClick = (id: NavView) => {
    if (id === 'new-audit') {
      onNewAuditClick();
    } else {
      onNavigate(id);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full bg-[#F9F8F6] select-none">
      {/* Top Section */}
      <div className="p-6">
        {/* Brand Logo & Mobile Close Button */}
        <div className="flex items-center justify-between mb-8">
          <div
            onClick={() => handleItemClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-[#B45309] flex items-center justify-center relative shadow-xs transition-transform group-hover:scale-105">
              <div className="w-3.5 h-3.5 rounded-full bg-[#F9F8F6] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#B45309]" />
              </div>
            </div>
            <span className="font-bold text-lg tracking-tight text-[#1C1917]">
              ContextGuard
            </span>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE6DF]"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#F4ECE3] text-[#B45309]'
                    : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#EFEAE2]/60'
                }`}
              >
                {/* Minimal dot indicator matching Figma */}
                <div
                  className={`w-2 h-2 rounded-full transition-colors ${
                    isActive ? 'bg-[#B45309]' : 'bg-[#A8A29E]'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Profile Section */}
      <div className="p-5 border-t border-[#EAE6DF]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#E5E7EB] text-[#374151] font-semibold text-xs flex items-center justify-center shrink-0">
            NT
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-semibold text-[#1C1917] truncate">
              Nataly Team
            </div>
            <div className="text-xs text-[#78716C] truncate">
              Product workspace
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#F9F8F6] border-r border-[#EAE6DF] shrink-0 min-h-screen flex-col justify-between no-print">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex no-print">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer content */}
          <div className="relative w-72 max-w-[80vw] h-full bg-[#F9F8F6] shadow-2xl z-10 border-r border-[#EAE6DF]">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
