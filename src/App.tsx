import React, { useState, useEffect } from 'react';
import { Role, Language, Bus, Student, Parent, DriverSupervisor, RouteStop, RouteHistoryRecord, NotificationItem, AbsenceReason } from './types';
import {
  INITIAL_BUSES,
  INITIAL_STUDENTS,
  INITIAL_PARENTS,
  INITIAL_DRIVERS,
  INITIAL_STOPS_BUS_101,
  INITIAL_NOTIFICATIONS,
  INITIAL_ROUTE_HISTORY,
  SCHOOL_LOCATION,
} from './data/mockData';
import { translations } from './data/translations';
import { AdminDashboard } from './components/AdminDashboard';
import { DriverSupervisorPortal } from './components/DriverSupervisorPortal';
import { ParentPortal } from './components/ParentPortal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { sound } from './utils/audio';
import {
  Bus as BusIcon,
  Bell,
  Languages,
  LogOut,
  Moon,
  Sun,
  Shield,
  User,
  Truck,
  Sparkles,
  KeyRound,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  LockKeyhole,
  Check,
  AlertCircle,
} from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('ar');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);

  // Login form state
  const [selectedLoginTab, setSelectedLoginTab] = useState<Role>('parent');
  const [currentUserPhone, setCurrentUserPhone] = useState('01001234567');
  const [currentPassword, setCurrentPassword] = useState('1234');
  const [loginError, setLoginError] = useState('');

  // Central Application Reactive State
  const [buses, setBuses] = useState<Bus[]>(INITIAL_BUSES);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [parents, setParents] = useState<Parent[]>(INITIAL_PARENTS);
  const [drivers, setDrivers] = useState<DriverSupervisor[]>(INITIAL_DRIVERS);
  const [stops, setStops] = useState<RouteStop[]>(INITIAL_STOPS_BUS_101);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [historyRecords, setHistoryRecords] = useState<RouteHistoryRecord[]>(INITIAL_ROUTE_HISTORY);

  // UI Drawer & Toasts
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<{ id: string; title: string; body: string } | null>(null);

  const t = translations[lang];

  // Sync RTL / LTR document attributes
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    if (lang === 'ar') {
      document.body.style.fontFamily = "'Cairo', sans-serif";
    } else {
      document.body.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
    }
  }, [lang]);

  // Sync Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Helper to trigger real-time notification
  const triggerNotification = (
    type: NotificationItem['type'],
    titleAr: string,
    titleEn: string,
    bodyAr: string,
    bodyEn: string,
    busId?: number,
    studentId?: number
  ) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
      type,
      titleAr,
      titleEn,
      bodyAr,
      bodyEn,
      busId,
      studentId,
      read: false,
    };

    setNotifications((prev) => [newNotif, ...prev]);

    // Show top floating toast for 4.5 seconds
    setActiveToast({
      id: newNotif.id,
      title: lang === 'ar' ? titleAr : titleEn,
      body: lang === 'ar' ? bodyAr : bodyEn,
    });

    setTimeout(() => {
      setActiveToast((curr) => (curr?.id === newNotif.id ? null : curr));
    }, 4500);
  };

  // Automated GPS Real-time Movement & Geofence Proximity Engine
  useEffect(() => {
    const timer = setInterval(() => {
      setBuses((prevBuses) => {
        return prevBuses.map((bus) => {
          if (bus.status !== 'en_route') return bus;

          const waypoints = bus.routeWaypoints;
          if (!waypoints || waypoints.length === 0) return bus;

          // Find current stop and check for skips
          const currentStop = stops[bus.currentStopIndex];

          // Move along waypoints
          const nextIndex = (bus.currentStopIndex + 1) % waypoints.length;
          const [nextLat, nextLng] = waypoints[nextIndex];

          // Calculate distance to upcoming stop
          if (currentStop && !currentStop.isReached && !currentStop.isSkipped) {
            const distanceMeters = Math.hypot(
              (bus.currentLocation.lat - currentStop.lat) * 111000,
              (bus.currentLocation.lng - currentStop.lng) * 111000
            );

            // Trigger Geofence Proximity Alert (< 450 meters)
            if (distanceMeters <= 450) {
              sound.playNearStopAlert();
              triggerNotification(
                'proximity',
                `تنبيه وصول: ${bus.number} يقترب من محطة ${currentStop.nameAr.split(':')[1] || currentStop.nameAr}`,
                `Near Stop Alert: ${bus.number} is approaching ${currentStop.nameEn.split(':')[1] || currentStop.nameEn}`,
                `الباص على بعد حوالي 400 متر (3 دقائق). يرجى التواجد بنقطة الالتقاط.`,
                `Bus is within 400 meters (~3 minutes). Please be ready at pickup point.`,
                bus.id
              );
            }
          }

          // Advance bus position smoothly
          return {
            ...bus,
            currentLocation: { lat: nextLat, lng: nextLng },
            speedKmH: Math.floor(Math.random() * 12) + 32, // Realistic Cairo road speed 32-44 km/h
            currentStopIndex: nextIndex,
          };
        });
      });
    }, 2800);

    return () => clearInterval(timer);
  }, [stops, lang]);

  // Handle Tab Change on Login Screen (pre-populates demo creds for easy evaluation)
  const handleSelectLoginTab = (role: Role) => {
    setSelectedLoginTab(role);
    setLoginError('');
    if (role === 'parent') {
      setCurrentUserPhone('01001234567');
      setCurrentPassword('1234');
    } else if (role === 'driver') {
      setCurrentUserPhone('01001112233');
      setCurrentPassword('1234');
    } else if (role === 'admin') {
      setCurrentUserPhone('01000000000');
      setCurrentPassword('admin123');
    }
  };

  // Auth Handler: Strictly Locks User into That Role
  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');

    if (selectedLoginTab === 'admin') {
      if (currentUserPhone === '01000000000' && currentPassword === 'admin123') {
        setCurrentRole('admin');
      } else {
        setLoginError(t.invalidLogin);
      }
    } else if (selectedLoginTab === 'driver') {
      const foundDriver = drivers.find((d) => d.phone === currentUserPhone && d.password === currentPassword);
      if (foundDriver) {
        setCurrentRole('driver');
      } else {
        setLoginError(t.invalidLogin);
      }
    } else if (selectedLoginTab === 'parent') {
      const foundParent = parents.find((p) => p.phone === currentUserPhone && p.password === currentPassword);
      if (foundParent) {
        setCurrentRole('parent');
      } else {
        setLoginError(t.invalidLogin);
      }
    }
  };

  // Explicit Logout: The ONLY way to switch portals
  const handleLogout = () => {
    setCurrentRole(null);
    setLoginError('');
  };

  // Bus Operations Handlers
  const handleStartTrip = (busId: number, type: 'morning' | 'afternoon') => {
    setBuses((prev) =>
      prev.map((b) => (b.id === busId ? { ...b, status: 'en_route', tripType: type, speedKmH: 35 } : b))
    );

    const bus = buses.find((b) => b.id === busId);
    triggerNotification(
      'route_status',
      `انطلاق رحلة ${type === 'morning' ? 'الصباح' : 'العودة'} - ${bus?.number || 'الباص'}`,
      `${type === 'morning' ? 'Morning' : 'Afternoon'} Route Started - ${bus?.number || 'Bus'}`,
      `انطلق الباص وبدأت متابعة الـ GPS اللحظية للطلاب. المشرفة: ${bus?.supervisorName || 'فاطمة إبراهيم'}.`,
      `Bus started scheduled route. Live GPS and proximity alerts active. Supervisor: ${bus?.supervisorName || 'Fatima Ibrahim'}.`,
      busId
    );
  };

  const handleStopTrip = (busId: number) => {
    setBuses((prev) =>
      prev.map((b) => (b.id === busId ? { ...b, status: 'completed', speedKmH: 0 } : b))
    );

    const bus = buses.find((b) => b.id === busId);
    triggerNotification(
      'route_status',
      `اكتملت الرحلة بنجاح - ${bus?.number}`,
      `Route Completed - ${bus?.number}`,
      `وصل الباص إلى وجهته النهائية وسُجل حضور جميع الطلاب بسلام.`,
      `Bus reached destination. Student attendance logged safely.`,
      busId
    );
  };

  const handleToggleDelay = (busId: number) => {
    setBuses((prev) =>
      prev.map((b) =>
        b.id === busId
          ? { ...b, status: b.status === 'delayed' ? 'en_route' : 'delayed', speedKmH: b.status === 'delayed' ? 35 : 0 }
          : b
      )
    );

    triggerNotification(
      'route_status',
      'تنبيه زحام مروري / توقف مؤقت',
      'Traffic Congestion / Temporary Delay',
      'الباص يواجه كثافة مرورية في محور التسعين. الوصول المتوقع قد يتأخر 5-10 دقائق.',
      'Bus encountering heavy traffic near 90th axis. ETA delayed by 5-10 minutes.',
      busId
    );
  };

  // Student Attendance Handlers (One-tap Verification)
  const handleMarkStudentBoarded = (studentId: number) => {
    const timeNow = new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, todayStatus: 'boarded', boardedAt: timeNow } : s))
    );

    const student = students.find((s) => s.id === studentId);
    triggerNotification(
      'boarding',
      `تم صعود الطالب: ${student?.nameAr || 'الطفل'}`,
      `Student Boarded: ${student?.nameEn || 'Child'}`,
      `صعد ${student?.nameAr || 'الطفل'} الباص بأمان في تمام ${timeNow}. المشرفة: فاطمة إبراهيم.`,
      `${student?.nameEn || 'Child'} boarded the bus safely at ${timeNow}. Verified by supervisor.`,
      student?.busId,
      studentId
    );
  };

  const handleMarkStudentExited = (studentId: number) => {
    const timeNow = new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, todayStatus: 'exited', exitedAt: timeNow } : s))
    );

    const student = students.find((s) => s.id === studentId);
    triggerNotification(
      'exit',
      `نزول آمن: ${student?.nameAr || 'الطفل'}`,
      `Safe Dropoff Verified: ${student?.nameEn || 'Child'}`,
      `نزل ${student?.nameAr || 'الطفل'} بأمان في تمام ${timeNow} تحت إشراف طاقم الباص.`,
      `${student?.nameEn || 'Child'} safely alighted at ${timeNow} under supervisor care.`,
      student?.busId,
      studentId
    );
  };

  const handleMarkStudentAbsent = (studentId: number, reason: AbsenceReason = 'sick') => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, todayStatus: 'absent', absenceReason: reason } : s))
    );

    const student = students.find((s) => s.id === studentId);

    // Dynamic Route Optimization: If all students at this pickup stop are now absent, skip the stop!
    if (student) {
      setStops((prevStops) =>
        prevStops.map((st) => {
          if (st.id === student.pickupStop.id) {
            // Check if all students for this stop are absent
            const stopStudents = students.filter((item) => st.studentIds.includes(item.id));
            const allAbsent = stopStudents.every((item) => (item.id === studentId ? true : item.todayStatus === 'absent'));
            return {
              ...st,
              isSkipped: allAbsent,
            };
          }
          return st;
        })
      );
    }

    triggerNotification(
      'absence',
      `إشعار غياب: ${student?.nameAr || 'طالب'}`,
      `Absence Reported: ${student?.nameEn || 'Student'}`,
      `أبلغ ولي الأمر بعدم حضور الطالب اليوم. تم تحديث مسار الباص تلقائياً.`,
      `Absence reported by parent. Route sequence dynamically updated.`,
      student?.busId,
      studentId
    );
  };

  // Fee Status Gating
  const handleToggleFeeStatus = (studentId: number) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, feeStatus: 'paid' } : s))
    );

    const student = students.find((s) => s.id === studentId);
    triggerNotification(
      'fee',
      `سداد الرسوم وتفعيل المقعد: ${student?.nameAr}`,
      `Transport Fee Verified: ${student?.nameEn}`,
      `تم التحقق من سداد رسوم اشتراك الباص وتفعيل المقعد للعام الدراسي.`,
      `Transport subscription verified. Seat activated on Bus.`,
      student?.busId,
      studentId
    );
  };

  // New Bus, Student & Parent Credential Management
  const handleAddBus = (newBusData: Partial<Bus>) => {
    const newBus: Bus = {
      id: Date.now(),
      number: newBusData.number || `BUS ${Math.floor(Math.random() * 800) + 200}`,
      plateAr: newBusData.plateAr || 'أ ب ج 9999',
      plateEn: newBusData.plateEn || 'ABC 9999',
      driverId: newBusData.driverId || 1,
      supervisorName: newBusData.supervisorName || 'أ. هدى عبد الرحيم',
      supervisorPhone: newBusData.supervisorPhone || '01001112299',
      capacity: newBusData.capacity || 28,
      status: 'idle',
      currentLocation: newBusData.currentLocation || { lat: 30.0245, lng: 31.4720 },
      speedKmH: 0,
      heading: 0,
      routeId: 1,
      tripType: 'morning',
      currentStopIndex: 0,
      routeWaypoints: INITIAL_BUSES[0].routeWaypoints,
    };
    setBuses((prev) => [...prev, newBus]);
  };

  const handleAddStudent = (newStudentData: Partial<Student>) => {
    const newStudent: Student = {
      id: Date.now(),
      nameAr: newStudentData.nameAr || 'طالب جديد',
      nameEn: newStudentData.nameEn || 'New Student',
      grade: newStudentData.grade || 'Grade 1',
      parentId: newStudentData.parentId || parents[0].id,
      busId: newStudentData.busId || buses[0].id,
      pickupStop: newStudentData.pickupStop || INITIAL_STOPS_BUS_101[0],
      dropoffStop: newStudentData.dropoffStop || INITIAL_STOPS_BUS_101[0],
      feeStatus: newStudentData.feeStatus || 'paid',
      todayStatus: 'pending',
    };
    setStudents((prev) => [...prev, newStudent]);

    // Update parent's kids array
    setParents((prev) =>
      prev.map((p) => (p.id === newStudent.parentId ? { ...p, kidIds: [...p.kidIds, newStudent.id] } : p))
    );
  };

  const handleAddParent = (newParentData: Partial<Parent>) => {
    const newParent: Parent = {
      id: Date.now(),
      nameAr: newParentData.nameAr || 'ولي أمر جديد',
      nameEn: newParentData.nameEn || 'New Parent',
      phone: newParentData.phone || '01000000000',
      password: newParentData.password || '1234',
      kidIds: newParentData.kidIds || [],
    };
    setParents((prev) => [...prev, newParent]);

    triggerNotification(
      'fee',
      `تم إنشاء حساب وتفعيل اشتراك: ${newParent.nameAr}`,
      `Parent Account Activated: ${newParent.nameEn}`,
      `تم إصدار بيانات الدخول لولي الأمر بعد التحقق من سداد الرسوم.`,
      `Parent credentials issued and verified upon fee settlement.`
    );
  };

  const handleBroadcastAlert = (title: string, body: string) => {
    triggerNotification('broadcast', title, title, body, body);
  };

  const currentParent = parents.find((p) => p.phone === currentUserPhone) || parents[0];
  const currentDriver = drivers.find((d) => d.phone === currentUserPhone) || drivers[0];
  const currentAssignedBus = buses.find((b) => b.id === currentDriver.busId) || buses[0];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navigation Bar: Fully Responsive Mobile & Desktop */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4 md:gap-8">
          {/* Zone 1: Brand Wordmark (Compact on mobile) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-sm shrink-0">
              <BusIcon size={20} />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 whitespace-nowrap">
                <span>BusWhere</span>
                <span className="text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                  ELS
                </span>
              </div>
              <div className="hidden lg:block text-[11px] text-slate-500 truncate max-w-[200px]">
                {lang === 'ar' ? 'المدرسة المصرية للغات · التجمع الخامس' : 'Egyptian Language School · New Cairo'}
              </div>
            </div>
          </div>

          {/* Zone 2: STRICT ROLE LOCKDOWN (Desktop) */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            {currentRole ? (
              <div className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-2 shadow-2xs">
                <LockKeyhole size={14} className="text-amber-500 shrink-0" />
                <span className="font-bold">
                  {currentRole === 'admin'
                    ? t.schoolAdmin
                    : currentRole === 'driver'
                    ? `${t.driverSupervisor} (${currentAssignedBus.number})`
                    : `${t.parentPortal} (${lang === 'ar' ? currentParent.nameAr : currentParent.nameEn})`}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {lang === 'ar' ? '· جلسة مخصصة مقفلة' : '· Isolated Portal Session'}
                </span>
              </div>
            ) : (
              <span className="text-slate-400 text-xs italic">
                {lang === 'ar' ? 'بوابات منفصلة لكل مستخدم · أمان وتحكم كامل' : 'Isolated portals per role · Secure verified access'}
              </span>
            )}
          </div>

          {/* Zone 3: Primary Utilities & Explicit Logout (Guaranteed Mobile Visibility) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Language Switch */}
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="h-9 px-2 sm:px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-amber-400 flex items-center gap-1 transition-colors shrink-0"
              title="Toggle Language (العربية / English)"
            >
              <Languages size={15} />
              <span className="text-[11px] font-bold">{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Dark Mode Switch */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="h-9 w-9 shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-amber-400 flex items-center justify-center transition-colors"
              title="Toggle Dark/Light Mode"
              aria-label="Toggle Dark/Light Mode"
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotifOpen(true)}
              className="relative h-9 w-9 shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-amber-400 flex items-center justify-center transition-colors"
              title={t.notifications}
              aria-label="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Logout button: Fully visible on both mobile and desktop */}
            {currentRole && (
              <button
                onClick={handleLogout}
                className="h-9 px-2.5 sm:px-3.5 shrink-0 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-extrabold flex items-center gap-1.5 transition-colors shadow-2xs"
                title={t.logout}
                aria-label={t.logout}
              >
                <LogOut size={15} />
                <span className="font-bold">{t.logout}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile-only Role Lock Sub-strip */}
        {currentRole && (
          <div className="md:hidden px-3.5 py-1.5 bg-slate-100/90 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-1.5 min-w-0">
              <LockKeyhole size={12} className="text-amber-500 shrink-0" />
              <span className="font-bold truncate text-[11px]">
                {currentRole === 'admin'
                  ? t.schoolAdmin
                  : currentRole === 'driver'
                  ? `${t.driverSupervisor} (${currentAssignedBus.number})`
                  : `${t.parentPortal} (${lang === 'ar' ? currentParent.nameAr : currentParent.nameEn})`}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 shrink-0 font-medium ps-2">
              {lang === 'ar' ? 'جلسة مؤمنة' : 'Secure Session'}
            </span>
          </div>
        )}
      </header>

      {/* Floating Live Alert Toast (Auto dismisses) */}
      {activeToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-top duration-200">
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 flex items-start gap-3">
            <div className="p-1.5 rounded-xl bg-amber-500 text-slate-950 mt-0.5 shrink-0">
              <Bell size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-xs text-amber-300">{activeToast.title}</div>
              <div className="text-[12px] text-slate-200 mt-0.5 leading-snug">{activeToast.body}</div>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {!currentRole ? (
          /* Role-Tabbed Login Gateway */
          <div className="max-w-2xl mx-auto py-6 sm:py-10 space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="text-center space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
                <ShieldCheck size={14} />
                <span>{t.tagline}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {lang === 'ar' ? 'تسجيل الدخول إلى بوابتك المخصصة' : 'Sign In to Your Designated Portal'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                {lang === 'ar'
                  ? 'يرجى اختيار البوابة الخاصة بك. عند الدخول يتم قفل الجلسة على دورك المحدد لمنع التنقل بين الصلاحيات.'
                  : 'Select your portal. Upon sign-in, session is strictly locked to your authorized role.'}
              </p>
            </div>

            {/* Dedicated Role Tabs on Login Screen */}
            <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-200/80 dark:bg-slate-800 rounded-2xl">
              <button
                onClick={() => handleSelectLoginTab('parent')}
                className={`py-3 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-1 ${
                  selectedLoginTab === 'parent'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <User size={18} className={selectedLoginTab === 'parent' ? 'text-amber-500' : ''} />
                <span>{t.parentPortal}</span>
              </button>

              <button
                onClick={() => handleSelectLoginTab('driver')}
                className={`py-3 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-1 ${
                  selectedLoginTab === 'driver'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Truck size={18} className={selectedLoginTab === 'driver' ? 'text-amber-500' : ''} />
                <span>{t.driverSupervisor}</span>
              </button>

              <button
                onClick={() => handleSelectLoginTab('admin')}
                className={`py-3 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-1 ${
                  selectedLoginTab === 'admin'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Shield size={18} className={selectedLoginTab === 'admin' ? 'text-amber-500' : ''} />
                <span>{t.schoolAdmin}</span>
              </button>
            </div>

            {/* Login Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                    <Lock size={16} />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {selectedLoginTab === 'parent'
                        ? t.parentPortal
                        : selectedLoginTab === 'driver'
                        ? t.driverSupervisor
                        : t.schoolAdmin}
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      {selectedLoginTab === 'parent'
                        ? lang === 'ar' ? 'أدخل رقم الموبايل وكلمة المرور المستلمة من إدارة المدرسة' : 'Enter mobile & password issued by school administration'
                        : selectedLoginTab === 'driver'
                        ? lang === 'ar' ? 'بوابة تشغيل الباص لطاقم السائق والمشرفة' : 'In-vehicle bus crew operating portal'
                        : lang === 'ar' ? 'لوحة تحكم إدارة الحركة والاشتراكات المدرسية' : 'School transportation management console'}
                    </p>
                  </div>
                </div>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t.phone}
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute top-1/2 -translate-y-1/2 left-3 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={currentUserPhone}
                      onChange={(e) => setCurrentUserPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full h-11 ps-9 pe-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono outline-hidden focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t.password}
                  </label>
                  <div className="relative">
                    <KeyRound size={15} className="absolute top-1/2 -translate-y-1/2 left-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 ps-9 pe-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono outline-hidden focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98"
                >
                  <span>{t.signIn}</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              {/* Demo Logins Info Box */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-medium">{t.demoLogins}:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {selectedLoginTab === 'parent'
                    ? '01001234567 / 1234'
                    : selectedLoginTab === 'driver'
                    ? '01001112233 / 1234'
                    : '01000000000 / admin123'}
                </span>
              </div>
            </div>
          </div>
        ) : currentRole === 'admin' ? (
          /* Strictly Isolated Admin Dashboard */
          <AdminDashboard
            buses={buses}
            students={students}
            parents={parents}
            drivers={drivers}
            stops={stops}
            historyRecords={historyRecords}
            lang={lang}
            onAddBus={handleAddBus}
            onAddStudent={handleAddStudent}
            onAddParent={handleAddParent}
            onToggleFeeStatus={handleToggleFeeStatus}
            onBroadcastAlert={handleBroadcastAlert}
          />
        ) : currentRole === 'driver' ? (
          /* Strictly Isolated Driver & Supervisor Portal */
          <DriverSupervisorPortal
            bus={currentAssignedBus}
            students={students}
            stops={stops}
            lang={lang}
            onStartTrip={handleStartTrip}
            onStopTrip={handleStopTrip}
            onToggleDelay={handleToggleDelay}
            onMarkStudentBoarded={handleMarkStudentBoarded}
            onMarkStudentExited={handleMarkStudentExited}
            onMarkStudentAbsent={handleMarkStudentAbsent}
          />
        ) : (
          /* Strictly Isolated Parent Portal */
          <ParentPortal
            parent={currentParent}
            students={students}
            buses={buses}
            stops={stops}
            lang={lang}
            onReportAbsence={handleMarkStudentAbsent}
          />
        )}
      </main>

      {/* Notifications Slide-over Drawer */}
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
        onMarkRead={(id) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))}
        lang={lang}
      />
    </div>
  );
}
