import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export interface AdminTheme {
  // Page
  pageBg: string;
  // Cards
  cardBg: string;
  cardBorder: string;
  // Sidebar
  sidebarBg: string;
  sidebarBorder: string;
  headerBg: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Input
  inputBg: string;
  inputBorder: string;
  inputText: string;
  placeholder: string;
  inputPlaceholder: string;
  // Code
  codeBg: string;
  codeText: string;
  // Buttons
  buttonBg: string;
  buttonText: string;
  // Icons
  iconBg: string;
  iconColor: string;
  iconMuted: string;
  iconHover: string;
  // Rows
  rowBg: string;
  rowHover: string;
  rowActive: string;
  // Navigation
  navActive: string;
  navInactive: string;
  tabActive: string;
  tabInactive: string;
  // Hover
  hoverText: string;
  hoverBg: string;
  hoverBgSolid: string;
  // Avatar
  avatarBg: string;
  avatarRing: string;
  avatarText: string;
  // Copy button
  copyButton: string;
  // Dividers
  divider: string;
  // Other
  spinnerBorder: string;
  overlay: string;
}

export function getAdminTheme(isDark: boolean): AdminTheme {
  return {
    // Page
    pageBg: isDark ? 'bg-zinc-950' : 'bg-zinc-100',
    // Cards
    cardBg: isDark ? 'bg-zinc-900' : 'bg-white',
    cardBorder: isDark ? 'border-zinc-800' : 'border-zinc-200',
    // Sidebar
    sidebarBg: isDark ? 'bg-zinc-900' : 'bg-white',
    sidebarBorder: isDark ? 'border-zinc-800' : 'border-zinc-200',
    headerBg: isDark ? 'bg-zinc-950/80' : 'bg-white/80',
    // Text
    textPrimary: isDark ? 'text-zinc-100' : 'text-zinc-900',
    textSecondary: isDark ? 'text-zinc-400' : 'text-zinc-600',
    textMuted: isDark ? 'text-zinc-500' : 'text-zinc-500',
    // Input
    inputBg: isDark ? 'bg-zinc-800' : 'bg-zinc-50',
    inputBorder: isDark ? 'border-zinc-700' : 'border-zinc-300',
    inputText: isDark ? 'text-zinc-100' : 'text-zinc-900',
    placeholder: isDark ? 'placeholder-zinc-600' : 'placeholder-zinc-400',
    inputPlaceholder: isDark ? 'placeholder-zinc-500' : 'placeholder-zinc-400',
    // Code
    codeBg: isDark ? 'bg-zinc-800' : 'bg-zinc-100',
    codeText: isDark ? 'text-zinc-300' : 'text-zinc-700',
    // Buttons
    buttonBg: isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200',
    buttonText: isDark ? 'text-zinc-300' : 'text-zinc-700',
    // Icons
    iconBg: isDark ? 'bg-zinc-800' : 'bg-zinc-100',
    iconColor: isDark ? 'text-zinc-400' : 'text-zinc-500',
    iconMuted: isDark ? 'text-zinc-700' : 'text-zinc-300',
    iconHover: isDark ? 'hover:text-zinc-300' : 'hover:text-zinc-600',
    // Rows
    rowBg: isDark ? 'bg-zinc-800/50' : 'bg-zinc-50',
    rowHover: isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50',
    rowActive: isDark ? 'bg-zinc-800' : 'bg-zinc-100',
    // Navigation
    navActive: isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-100 text-zinc-900',
    navInactive: isDark ? 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
    tabActive: isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-100 text-zinc-900',
    tabInactive: isDark ? 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
    // Hover
    hoverText: isDark ? 'hover:text-zinc-100' : 'hover:text-zinc-900',
    hoverBg: isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-100',
    hoverBgSolid: isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100',
    // Avatar
    avatarBg: isDark ? 'bg-zinc-800' : 'bg-zinc-100',
    avatarRing: isDark ? 'ring-zinc-700' : 'ring-zinc-300',
    avatarText: isDark ? 'text-zinc-300' : 'text-zinc-700',
    // Copy button
    copyButton: isDark ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200',
    // Dividers
    divider: isDark ? 'divide-zinc-800/50' : 'divide-zinc-200/50',
    // Other
    spinnerBorder: isDark ? 'border-zinc-700 border-t-zinc-400' : 'border-zinc-300 border-t-zinc-600',
    overlay: isDark ? 'bg-black/60' : 'bg-black/30',
  };
}

export const useAdminTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin-theme');
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    }
    return 'dark';
  });

  useEffect(() => {
    localStorage.setItem('admin-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const isDark = theme === 'dark';

  return { theme, setTheme, toggleTheme, isDark };
};

export default useAdminTheme;
