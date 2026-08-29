'use client';

import * as React from 'react';
import { Menu, LogOut, ChevronDown } from 'lucide-react';
import { initials } from '@/lib/utils';
import { logoutAction } from '@/app/(auth)/actions';

export function Topbar({
  onMenu,
  user,
}: {
  onMenu: () => void;
  user: { name: string; email: string; role: string };
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-ink-200 bg-white/80 px-4 backdrop-blur sm:px-6">
      <button
        onClick={onMenu}
        className="rounded-md p-2 text-ink-500 hover:bg-ink-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="relative" ref={ref}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-ink-100"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
            {initials(user.name)}
          </div>
          <div className="hidden text-left sm:block">
            <div className="text-sm font-medium text-ink-900">{user.name}</div>
            <div className="text-[11px] text-ink-400">{user.email}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-ink-400" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-lg border border-ink-200 bg-white p-1.5 shadow-soft animate-fade-in">
            <div className="px-3 py-2">
              <div className="text-sm font-medium text-ink-900">{user.name}</div>
              <div className="text-xs text-ink-500">{user.email}</div>
              <div className="mt-1 inline-flex rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-600">
                {user.role}
              </div>
            </div>
            <div className="my-1 h-px bg-ink-100" />
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-700 hover:bg-ink-100"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
