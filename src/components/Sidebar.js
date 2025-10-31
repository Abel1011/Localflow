'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Wand2,
  RefreshCw,
  Menu,
  X,
  Home,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  MessageSquare,
  Languages,
  List,
  Zap,
  Rows,
  Plus,
  ChevronLeft
} from 'lucide-react';

export default function Sidebar({ isCollapsed = false, onToggleCollapse = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(true);
  const [isFlowMenuOpen, setIsFlowMenuOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const primaryItems = [
    { href: '/', icon: Home, label: 'Home', color: '#FF6B6B' }
  ];

  const flowItems = [
    { href: '/flows/new', icon: Plus, label: 'Create Flow', color: '#6366f1' },
    { href: '/flows', icon: Rows, label: 'My Flows', color: '#0ea5e9' }
  ];

  const playgroundItems = [
    { href: '/writer', icon: Wand2, label: 'Writer API', color: '#FF6B6B' },
    { href: '/rewriter', icon: RefreshCw, label: 'Rewriter API', color: '#14b8a6' },
    { href: '/proofreader', icon: CheckCircle, label: 'Proofreader API', color: '#8b5cf6' },
    { href: '/prompt', icon: MessageSquare, label: 'Prompt API', color: '#f59e0b' },
    { href: '/translator', icon: Languages, label: 'Translator API', color: '#3b82f6' },
    { href: '/summarizer', icon: List, label: 'Summarizer API', color: '#10b981' },
  ];

  const isFlowItemActive = (href) => {
    if (href === '/flows') {
      return pathname === '/flows' || /^\/flows\/(?!new(\/|$))/.test(pathname);
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isFlowActive = flowItems.some((item) => isFlowItemActive(item.href));

  useEffect(() => {
    if (isFlowActive) {
      setIsFlowMenuOpen(true);
    }
  }, [isFlowActive]);

  const closeOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const handleFlowMenuToggle = () => {
    if (isCollapsed) {
      setIsFlowMenuOpen(true);
      router.push('/flows');
      closeOnMobile();
      return;
    }
    setIsFlowMenuOpen((value) => !value);
  };

  const linkBaseClasses = 'flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold transition-all duration-200';
  const nestedLinkBaseClasses = 'flex items-center gap-3 py-3 rounded-2xl font-medium transition-all duration-200';

  const computeActiveStyles = (isActive, color) =>
    isActive
      ? {
          background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
          boxShadow: `0 10px 25px -5px ${color}66`
        }
      : {};

  const textVisibilityClass = isCollapsed ? 'lg:hidden' : '';
  const justifyClass = isCollapsed ? 'lg:justify-center' : 'justify-between';

  return (
    <>
      <button
        onClick={() => setIsOpen((value) => !value)}
        className={`fixed top-4 z-50 lg:hidden p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-lg transition-all duration-300 ${
          isOpen ? 'left-[292px]' : 'left-4'
        }`}
        title={isOpen ? 'Close navigation' : 'Open navigation'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r-2 border-slate-200/60 transition-[transform,width] duration-300 z-40 w-72 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${isCollapsed ? 'lg:w-24' : 'lg:w-[280px]'}`}
        style={{ boxShadow: '0 0 50px -12px rgba(0, 0, 0, 0.08)' }}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="mb-8">
            <div
              className={`flex gap-3 ${
                isCollapsed ? 'lg:flex-col lg:items-center lg:gap-4' : 'lg:items-center lg:justify-between lg:gap-3'
              }`}
            >
              <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:flex-col lg:items-center lg:gap-3' : ''}`}>
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-2xl text-white shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                    boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.4)'
                  }}
                >
                  <Zap className="w-7 h-7" />
                </div>
                <div className={`flex flex-col min-w-0 ${textVisibilityClass}`}>
                  <h1 className="text-2xl font-bold text-slate-900 whitespace-nowrap">Local Flow</h1>
                  <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">AI Flow Workspace</p>
                </div>
              </div>
              {typeof onToggleCollapse === 'function' && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="hidden lg:flex items-center justify-center w-10 h-10 rounded-xl border-2 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
                  aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {primaryItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${linkBaseClasses} ${justifyClass} ${
                    isActive ? 'text-white shadow-lg' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  style={computeActiveStyles(isActive, item.color)}
                  onClick={closeOnMobile}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className={`${textVisibilityClass}`}>{item.label}</span>
                  </div>
                  {isActive && !isCollapsed && <ChevronRight className="w-5 h-5 hidden lg:block" />}
                </Link>
              );
            })}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleFlowMenuToggle}
                className={`w-full flex items-center ${justifyClass} gap-3 px-4 py-3.5 rounded-2xl font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-200`}
                title={isCollapsed ? 'Flows menu' : undefined}
              >
                <div className="flex items-center gap-3">
                  <Rows className="w-5 h-5" />
                  <span className={`${textVisibilityClass}`}>Flows</span>
                </div>
                {!isCollapsed && (
                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isFlowMenuOpen ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                )}
              </button>

              <div
                className={`space-y-1 overflow-hidden transition-all duration-200 ${
                  isFlowMenuOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'
                }`}
              >
                {flowItems.map((item) => {
                  const isActive = isFlowItemActive(item.href);
                  const Icon = item.icon;
                  const layoutClasses = isCollapsed ? 'justify-center px-4' : 'pl-12 pr-4 justify-between';

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`${nestedLinkBaseClasses} ${layoutClasses} ${
                        isActive ? 'text-white shadow-lg' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                      style={computeActiveStyles(isActive, item.color)}
                      onClick={() => {
                        closeOnMobile();
                      }}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span className={`text-sm ${textVisibilityClass}`}>{item.label}</span>
                      </div>
                      {!isCollapsed && isActive && <ChevronRight className="w-4 h-4" />}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsPlaygroundOpen((value) => !value)}
                className={`w-full flex items-center ${justifyClass} gap-3 px-4 py-3.5 rounded-2xl font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-200`}
                title={isCollapsed ? 'Playground menu' : undefined}
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5" />
                  <span className={`${textVisibilityClass}`}>Playground</span>
                </div>
                {!isCollapsed && (
                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isPlaygroundOpen ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                )}
              </button>

              <div
                className={`space-y-1 overflow-hidden transition-all duration-200 ${
                  isPlaygroundOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'
                }`}
              >
                {playgroundItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  const layoutClasses = isCollapsed ? 'justify-center px-4' : 'pl-12 pr-4 justify-between';

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`${nestedLinkBaseClasses} ${layoutClasses} ${
                        isActive ? 'text-white shadow-lg' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                      style={computeActiveStyles(isActive, item.color)}
                      onClick={closeOnMobile}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span className={`text-sm ${textVisibilityClass}`}>{item.label}</span>
                      </div>
                      {!isCollapsed && isActive && <ChevronRight className="w-4 h-4" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>

          <div className={`mt-auto pt-6 border-t-2 border-slate-200 ${textVisibilityClass}`}>
            <div className="text-xs text-slate-500 space-y-1">
              <p className="font-semibold">Requirements:</p>
              <p>• Chrome 131+</p>
              <p>• Gemini Nano enabled</p>
            </div>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
