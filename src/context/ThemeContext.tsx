import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>(() => {
        return (localStorage.getItem('theme-mode') as ThemeMode) || 'system';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        localStorage.setItem('theme-mode', mode);

        const applyTheme = (isDark: boolean) => {
            if (isDark) {
                root.classList.add('dark');
                root.classList.remove('light');
                root.setAttribute('data-theme', 'dark');
            } else {
                root.classList.add('light');
                root.classList.remove('dark');
                root.setAttribute('data-theme', 'light');
            }
        };

        if (mode === 'system') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');
            applyTheme(systemPrefersDark.matches);

            const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
            systemPrefersDark.addEventListener('change', handler);
            return () => systemPrefersDark.removeEventListener('change', handler);
        } else {
            applyTheme(mode === 'dark');
        }
    }, [mode]);

    return (
        <ThemeContext.Provider value={{ mode, setMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
}
