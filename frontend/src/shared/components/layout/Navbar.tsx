import { useEffect, useRef, useState } from 'react';
import { LogOut, UserCircle } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import type { AuthUser } from '../../../types/auth';
import { NotificationBell } from '../../../features/notification/components/NotificationBell';

interface NavbarProps {
  user: AuthUser | null;
  activeRole: string;
  onLogout: () => void;
}

export function Navbar({ user, activeRole, onLogout }: NavbarProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const displayName = user?.name || 'Campus User';
  const profileImage = user?.profilePicture?.trim() || '';
  const displayEmail = user?.email || 'No email available';
  const roleLabel = activeRole.charAt(0).toUpperCase() + activeRole.slice(1);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      const targetNode = event.target as Node;

      if (profileMenuRef.current && !profileMenuRef.current.contains(targetNode)) {
        setIsProfileMenuOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocumentClick);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onDocumentClick);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:px-6 lg:px-8">
      <div className="flex items-center">
        <span className="text-xl font-bold text-foreground tracking-wide">SmartCampus</span>
      </div>
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <ThemeToggle />
          <NotificationBell role={activeRole} />

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />

          <div ref={profileMenuRef} className="relative flex items-center gap-x-3">
            <span className="hidden lg:flex lg:items-center text-sm font-semibold leading-6 text-foreground">
              👋 Welcome, {displayName}
            </span>

            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="h-9 w-9 overflow-hidden rounded-full border border-border bg-muted/40 flex items-center justify-center hover:border-primary/50"
              aria-label="Open profile menu"
              aria-haspopup="menu"
              aria-expanded={isProfileMenuOpen}
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="User profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserCircle className="h-7 w-7 text-foreground/60" />
              )}
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 top-12 z-50 w-72 rounded-lg border border-border bg-background p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 overflow-hidden rounded-full border border-border bg-muted/40 flex items-center justify-center">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="User profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserCircle className="h-10 w-10 text-foreground/60" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                    <p className="truncate text-xs text-foreground/70">{displayEmail}</p>
                    <p className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      {roleLabel}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/70 text-foreground/70 hover:bg-primary/10 hover:text-primary"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
