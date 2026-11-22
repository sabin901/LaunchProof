import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AuthOverlay, useAuthProfileReady, signOut } from 'deepspace'
import {
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Settings,
} from 'lucide-react'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui'

export default function Navigation() {
  const { isLoaded, isSignedIn, user } = useAuthProfileReady({
    requireUser: true,
  })
  const { pathname } = useLocation()
  const [showAuth, setShowAuth] = useState(false)

  return (
    <>
      <nav data-testid="app-navigation" className="lp-nav">
        <Link to="/home" className="lp-brand">
          <img src="/logo.svg" width="32" height="32" alt="" />
          <span>LaunchProof</span>
        </Link>
        <div className="lp-nav-links">
          <Link
            to="/home"
            aria-label="Releases"
            aria-current={pathname !== '/settings' ? 'page' : undefined}
          >
            <LayoutDashboard size={16} />
            <span>Releases</span>
          </Link>
          <Link
            to="/settings"
            aria-label="Settings"
            aria-current={pathname === '/settings' ? 'page' : undefined}
          >
            <Settings size={16} />
            <span>Settings</span>
          </Link>
        </div>
        <div className="lp-nav-account">
          {isSignedIn && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    aria-label="Account menu"
                    className="lp-account-button"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage
                        src={user.imageUrl ?? undefined}
                        referrerPolicy="no-referrer"
                      />
                      <AvatarFallback>
                        {(
                          user.name?.[0] ??
                          user.email?.[0] ??
                          '?'
                        ).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span data-testid="nav-user-name">
                      {user.name || user.email}
                    </span>
                    <ChevronDown size={14} />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div>{user.name || 'Signed in'}</div>
                  <div
                    data-testid="nav-user-email"
                    className="truncate text-xs font-normal text-muted-foreground"
                  >
                    {user.email}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut size={16} />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : isLoaded && !isSignedIn ? (
            <button
              data-testid="nav-sign-in-button"
              className="lp-button"
              onClick={() => setShowAuth(true)}
            >
              Sign in
            </button>
          ) : (
            <span className="lp-note">Loading account…</span>
          )}
        </div>
      </nav>
      {showAuth && <AuthOverlay onClose={() => setShowAuth(false)} />}
    </>
  )
}
