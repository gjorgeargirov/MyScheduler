import React from 'react';
import {
  Calendar as CalendarIcon,
  Folder,
  User,
  LogOut,
  Settings,
  Bell
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const AppHeader = ({
  activePage,
  setActivePage,
  isAuthenticated,
  user,
  signOut,
  navigate,
  onOpenSettings,
  onOpenNotifications,
  unreadNotificationCount = 0
}) => {
  return (
    <header className="sticky top-0 z-40 glass border-b border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-900/10 dark:shadow-slate-900/30 backdrop-blur-xl">
      <div className="max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between py-3 sm:py-3.5 lg:py-4.5">
          {/* Left: Logo + Navigation */}
          <div className="flex items-center gap-6 sm:gap-8">
            <div className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-500 dark:from-blue-500 dark:via-cyan-400 dark:to-teal-400 flex items-center justify-center shadow-xl shadow-blue-500/40 dark:shadow-blue-500/30 ring-2 ring-blue-500/20 dark:ring-blue-400/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-blue-500/50 group-hover:ring-blue-500/30">
                <CalendarIcon size={22} className="text-white drop-shadow-lg" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-600 dark:from-blue-400 dark:via-cyan-300 dark:to-teal-400 bg-clip-text text-transparent tracking-tight">
                  FocusBoard
                </h1>
              </div>
            </div>
          </div>

          {/* Right: User Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-lg p-1">
              <button
                onClick={() => setActivePage('calendar')}
                className={`p-2 rounded-md transition-all ${activePage === 'calendar' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                title="Calendar"
              >
                <CalendarIcon size={18} />
              </button>
              <button
                onClick={() => setActivePage('tasks')}
                className={`p-2 rounded-md transition-all ${activePage === 'tasks' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                title="Tasks"
              >
                <Folder size={18} />
              </button>
            </div>

            {/* Notifications Button */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md hover:bg-white dark:hover:bg-slate-700 transition-all duration-300 text-slate-700 dark:text-slate-300 shadow-lg shadow-slate-900/10 dark:shadow-slate-900/30 ring-1 ring-slate-200/60 dark:ring-slate-700/60 hover:scale-110 hover:shadow-xl"
              title="Notifications"
            >
              <Bell size={19} className="text-blue-600 dark:text-blue-400" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-800">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md hover:bg-white dark:hover:bg-slate-700 transition-all duration-300 text-slate-700 dark:text-slate-300 shadow-lg shadow-slate-900/10 dark:shadow-slate-900/30 ring-1 ring-slate-200/60 dark:ring-slate-700/60 hover:scale-110 hover:shadow-xl"
              title="Settings"
            >
              <Settings size={19} className="text-blue-600 dark:text-blue-400" />
            </button>

            {/* User/Auth */}
            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2.5 px-4 py-2.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg shadow-slate-900/10 dark:shadow-slate-900/30 ring-1 ring-slate-200/40 dark:ring-slate-700/40">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center ring-2 ring-blue-500/20">
                  <User size={14} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{user?.name || user?.email}</span>
                <button
                  onClick={signOut}
                  className="ml-1 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 hover:scale-110"
                  title="Sign out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2.5">
                <Link
                  to="/signup"
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:from-blue-700 hover:via-cyan-600 hover:to-teal-600 text-white rounded-xl text-sm font-bold transition-all duration-300 shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 active:scale-95"
                >
                  Sign Up
                </Link>
                <button
                  onClick={() => navigate('/signin')}
                  className="px-4 py-2.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-slate-900/10 dark:shadow-slate-900/30 hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
