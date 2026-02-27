import { useEffect, useState, useRef, useCallback } from 'react';

const CHOICE_KEY = 'spillover_analytics_choice_made';
const OPTOUT_KEY = 'spillover_analytics_optout';

/** Spotify user profile data */
interface SpotifyUser {
  /** Spotify user ID */
  id: string;
  /** User's display name */
  display_name: string | null;
  /** User's profile images */
  images: { url: string; height: number; width: number }[];
}

/** Props for the authentication button component */
interface AuthButtonProps {
  /** Whether user is currently authenticated */
  isAuthenticated: boolean;
}

export default function AuthButton({ isAuthenticated }: AuthButtonProps) {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/me')
        .then((res) => res.ok ? res.json() : null)
        .then((data) => setUser(data))
        .catch(() => setUser(null));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Check existing preference
    const optedOut = localStorage.getItem(OPTOUT_KEY) === 'true';
    setAnalyticsEnabled(!optedOut);
  }, []);

  // Handle escape key and focus trap for login modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowLoginModal(false);
      return;
    }

    // Focus trap
    if (e.key === 'Tab' && dialogRef.current) {
      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  }, []);

  useEffect(() => {
    if (!showLoginModal) return;

    // Store previously focused element
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    // Focus the cancel button when modal opens
    cancelButtonRef.current?.focus();

    // Add keyboard listener
    document.addEventListener('keydown', handleKeyDown);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      // Restore focus when modal closes
      previouslyFocusedElement.current?.focus();
    };
  }, [showLoginModal, handleKeyDown]);

  const handleLoginClick = (e: React.MouseEvent): void => {
    // If user has already made a choice, go directly to login
    const choiceMade = localStorage.getItem(CHOICE_KEY);
    if (choiceMade) return; // Let the link navigate normally

    e.preventDefault();
    setShowLoginModal(true);
  };

  const handleContinueToLogin = (): void => {
    // Save analytics preference
    localStorage.setItem(CHOICE_KEY, 'true');
    if (analyticsEnabled) {
      localStorage.removeItem(OPTOUT_KEY);
    } else {
      localStorage.setItem(OPTOUT_KEY, 'true');
    }
    // Navigate to login
    window.location.href = '/api/auth/login';
  };

  if (isAuthenticated) {
    const avatarUrl = user?.images?.[0]?.url;
    const displayName = user?.display_name || 'User';

    return (
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${displayName}'s profile picture`}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-spillover-cyan/30"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-spillover-gray flex items-center justify-center ring-2 ring-spillover-cyan/30" aria-hidden="true">
            <svg className="w-4 h-4 text-spillover-lightgray" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}
        <a
          href="/api/auth/logout"
          className="px-4 py-2 text-sm font-medium text-spillover-lightgray hover:text-spillover-cyan transition-colors"
        >
          Logout
        </a>
      </div>
    );
  }

  return (
    <>
      <a
        href="/api/auth/login"
        onClick={handleLoginClick}
        className="relative inline-flex items-center gap-3 px-8 py-3.5 bg-spillover-white text-spillover-obsidian font-display font-bold text-[0.95rem] uppercase tracking-wide rounded-full overflow-hidden group hover:scale-[1.02] transition-transform duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(0,240,255,0.3)]"
      >
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-spillover-cyan via-spillover-indigo to-spillover-cyan opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
        <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
        <span className="relative z-10">Connect Spotify</span>
      </a>

      {/* Login Modal with Analytics Choice */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-spillover-obsidian/80 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
          aria-describedby="login-modal-description"
          onClick={(e) => e.target === e.currentTarget && setShowLoginModal(false)}
        >
          <div
            ref={dialogRef}
            className="bg-white/[0.03] border border-white/10 rounded-[1.5rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] max-w-md w-full p-7 animate-scale-in relative overflow-hidden"
          >
            {/* Modal Ambient Glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-spillover-cyan/20 rounded-full blur-[3rem] pointer-events-none"></div>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-12 h-12 bg-spillover-cyan/10 border border-spillover-cyan/30 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.15)]" aria-hidden="true">
                <svg className="w-6 h-6 text-spillover-cyan" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
              </div>
              <div>
                <h3 id="login-modal-title" className="text-spillover-white font-display font-bold text-xl tracking-tight">Connect to Spotify</h3>
                <p id="login-modal-description" className="text-spillover-lightgray text-sm mt-0.5">Securely link your music library.</p>
              </div>
            </div>

            {/* What we access */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-5 mb-5 relative z-10 backdrop-blur-md">
              <p className="text-xs uppercase tracking-widest text-spillover-lightgray mb-3 font-semibold">Engine Access Required:</p>
              <ul className="space-y-2.5 text-[0.85rem] text-spillover-white/90" aria-label="Permissions required">
                <li className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-spillover-cyan flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  View and modify your Liked Songs
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-spillover-cyan flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  View and add to your playlists
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-spillover-cyan flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Analyze current playback state
                </li>
              </ul>
            </div>

            {/* Analytics Toggle */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-5 mb-7 relative z-10 backdrop-blur-md">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-spillover-white font-semibold text-sm">Anonymous Analytics</p>
                  <p className="text-spillover-lightgray text-[0.75rem] mt-1">
                    Help improve the Spillover engine (no personal data)
                  </p>
                </div>
                <button
                  onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-spillover-cyan focus:ring-offset-2 focus:ring-offset-spillover-obsidian ${analyticsEnabled ? 'bg-spillover-cyan' : 'bg-spillover-gray/50'
                    }`}
                  role="switch"
                  aria-checked={analyticsEnabled}
                  aria-label="Toggle analytics"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full transition-transform ${analyticsEnabled ? 'bg-spillover-obsidian translate-x-6' : 'bg-spillover-lightgray translate-x-1'
                      }`}
                  />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 relative z-10">
              <button
                ref={cancelButtonRef}
                onClick={() => setShowLoginModal(false)}
                className="flex-1 px-4 py-3 text-[0.85rem] font-semibold text-spillover-white/70 hover:text-spillover-white border border-white/10 rounded-full hover:border-white/30 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleContinueToLogin}
                className="flex-1 px-4 py-3 text-[0.85rem] uppercase tracking-wide font-bold bg-spillover-cyan text-spillover-obsidian rounded-full hover:bg-spillover-cyan/90 hover:scale-[1.02] shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all"
              >
                Authorize
              </button>
            </div>

            {/* Privacy link */}
            <p className="text-center text-[0.7rem] text-spillover-lightgray/60 mt-5 relative z-10">
              By continuing, you agree to our{' '}
              <a href="/privacy" className="text-spillover-lightgray hover:text-spillover-white underline decoration-white/20 hover:decoration-white/60 transition-colors">Privacy Policy</a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}

