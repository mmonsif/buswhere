import React from 'react';
import { NotificationItem, Language } from '../types';
import { translations } from '../data/translations';
import { Bell, CheckCheck, X, Clock, Bus as BusIcon, UserCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  lang: Language;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onMarkRead,
  lang,
}) => {
  const t = translations[lang];

  if (!isOpen) return null;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'proximity':
        return <Clock className="text-amber-500" size={16} />;
      case 'boarding':
      case 'exit':
        return <UserCheck className="text-emerald-500" size={16} />;
      case 'absence':
        return <AlertTriangle className="text-rose-500" size={16} />;
      case 'broadcast':
        return <ShieldAlert className="text-indigo-500" size={16} />;
      default:
        return <BusIcon className="text-blue-500" size={16} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-xs flex justify-end">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-s border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="font-bold text-[15px] text-slate-900 dark:text-white leading-tight">
                {t.notifications}
              </h3>
              <p className="text-[11px] text-slate-500">
                {notifications.filter((n) => !n.read).length} {t.unread}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onMarkAllRead}
              title={t.markAllRead}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
            >
              <CheckCheck size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Bell size={32} className="opacity-30 mb-2" />
              <p className="text-sm">{t.emptyNotifications}</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => onMarkRead(notif.id)}
                className={`p-3 rounded-xl border text-start transition-all cursor-pointer ${
                  notif.read
                    ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 opacity-80'
                    : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-xs shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate">
                        {lang === 'ar' ? notif.titleAr : notif.titleEn}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {notif.timestamp}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {lang === 'ar' ? notif.bodyAr : notif.bodyEn}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
