'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import Sidebar from './Sidebar';

const STORAGE_KEY = 'local-flow-sidebar-collapsed';
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const getStoredSidebarState = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  if (typeof window.__localFlowSidebarCollapsed === 'boolean') {
    return window.__localFlowSidebarCollapsed;
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY);
  if (storedValue !== null) {
    const parsedValue = storedValue === 'true';
    window.__localFlowSidebarCollapsed = parsedValue;
    return parsedValue;
  }

  return false;
};

export default function MainLayout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => getStoredSidebarState());

  useIsomorphicLayoutEffect(() => {
    setIsSidebarCollapsed(getStoredSidebarState());
  }, []);

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed((value) => {
      const nextValue = !value;

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, nextValue ? 'true' : 'false');
        window.__localFlowSidebarCollapsed = nextValue;
      }

      return nextValue;
    });
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #fef2f2 0%, #fef9f3 25%, #ecfdf5 50%, #f0fdfa 75%, #f0f9ff 100%)'
      }}
    >
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <main
        className="min-h-screen transition-all duration-300 lg:ml-(--sidebar-width)"
        style={{ '--sidebar-width': isSidebarCollapsed ? '96px' : '280px' }}
      >
        {children}
      </main>
    </div>
  );
}
