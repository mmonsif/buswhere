import React, { useState } from 'react';
import { Bus, Student, Parent, DriverSupervisor, RouteStop, RouteHistoryRecord, Language } from '../types';
import { translations } from '../data/translations';
import { InteractiveMap } from './InteractiveMap';
import {
  Bus as BusIcon,
  Users,
  CreditCard,
  History,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Megaphone,
  Navigation,
  ShieldCheck,
  Calendar,
  Clock,
  Play,
  RotateCcw,
  KeyRound,
  MessageSquare,
  Copy,
  Check,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';

interface AdminDashboardProps {
  buses: Bus[];
  students: Student[];
  parents: Parent[];
  drivers: DriverSupervisor[];
  stops: RouteStop[];
  historyRecords: RouteHistoryRecord[];
  lang: Language;
  onAddBus: (newBus: Partial<Bus>) => void;
  onAddStudent: (newStudent: Partial<Student>) => void;
  onAddParent: (newParent: Partial<Parent>) => void;
  onToggleFeeStatus: (studentId: number) => void;
  onBroadcastAlert: (title: string, body: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  buses,
  students,
  parents,
  drivers,
  stops,
  historyRecords,
  lang,
  onAddBus,
  onAddStudent,
  onAddParent,
  onToggleFeeStatus,
  onBroadcastAlert,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'fleet' | 'students' | 'parents' | 'buses' | 'history'>('fleet');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>(historyRecords[0]?.id || '');
  const [showAddBusModal, setShowAddBusModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddParentModal, setShowAddParentModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  // Parent credentials state
  const [revealedPasswords, setRevealedPasswords] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Form states
  const [busForm, setBusForm] = useState({
    number: '',
    plateAr: '',
    plateEn: '',
    capacity: 28,
    supervisorName: '',
    supervisorPhone: '',
  });

  const [studentForm, setStudentForm] = useState({
    nameAr: '',
    nameEn: '',
    grade: 'Grade 1 - A',
    busId: buses[0]?.id || 1,
    parentId: parents[0]?.id || 1,
    feeStatus: 'paid' as 'paid' | 'pending',
    pickupNameAr: 'التجمع الخامس - شارع التسعين',
    pickupNameEn: 'Fifth Settlement - 90th St',
  });

  const [parentForm, setParentForm] = useState({
    nameAr: '',
    nameEn: '',
    phone: '',
    password: '',
    feePaid: true,
    linkedKidIds: [] as number[],
  });

  const [broadcastText, setBroadcastText] = useState('');

  // Selected history record
  const selectedHistory = historyRecords.find((h) => h.id === selectedHistoryId) || historyRecords[0];

  // Derived stats
  const activeBusesCount = buses.filter((b) => b.status === 'en_route').length;
  const feesPaidCount = students.filter((s) => s.feeStatus === 'paid').length;
  const feesPendingCount = students.length - feesPaidCount;

  // Generate random secure password (e.g. ELS-4821)
  const generateRandomPassword = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `ELS-${num}`;
  };

  const handleCreateBus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busForm.number) return;
    onAddBus({
      number: busForm.number,
      plateAr: busForm.plateAr || 'ق ر س 4567',
      plateEn: busForm.plateEn || 'QRS 4567',
      capacity: Number(busForm.capacity) || 28,
      supervisorName: busForm.supervisorName || 'أ. سمر فاروق',
      supervisorPhone: busForm.supervisorPhone || '01001112288',
      driverId: drivers[0]?.id || 1,
      status: 'idle',
      currentLocation: { lat: 30.0245, lng: 31.4720 },
      speedKmH: 0,
      heading: 0,
      routeId: 1,
      tripType: 'morning',
      currentStopIndex: 0,
      routeWaypoints: buses[0]?.routeWaypoints || [],
    });
    setBusForm({ number: '', plateAr: '', plateEn: '', capacity: 28, supervisorName: '', supervisorPhone: '' });
    setShowAddBusModal(false);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.nameAr) return;
    onAddStudent({
      nameAr: studentForm.nameAr,
      nameEn: studentForm.nameEn || studentForm.nameAr,
      grade: studentForm.grade,
      busId: Number(studentForm.busId),
      parentId: Number(studentForm.parentId),
      feeStatus: studentForm.feeStatus,
      todayStatus: 'pending',
      pickupStop: {
        id: Date.now(),
        nameAr: studentForm.pickupNameAr,
        nameEn: studentForm.pickupNameEn,
        lat: 30.0350,
        lng: 31.4880,
        scheduledTime: '07:15 AM',
      },
      dropoffStop: {
        id: Date.now(),
        nameAr: studentForm.pickupNameAr,
        nameEn: studentForm.pickupNameEn,
        lat: 30.0350,
        lng: 31.4880,
        scheduledTime: '03:20 PM',
      },
    });
    setStudentForm({
      nameAr: '',
      nameEn: '',
      grade: 'Grade 1 - A',
      busId: buses[0]?.id || 1,
      parentId: parents[0]?.id || 1,
      feeStatus: 'paid',
      pickupNameAr: 'التجمع الخامس - شارع التسعين',
      pickupNameEn: 'Fifth Settlement - 90th St',
    });
    setShowAddStudentModal(false);
  };

  const handleCreateParent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentForm.nameAr || !parentForm.phone) return;

    const pass = parentForm.password || generateRandomPassword();

    onAddParent({
      nameAr: parentForm.nameAr,
      nameEn: parentForm.nameEn || parentForm.nameAr,
      phone: parentForm.phone,
      password: pass,
      kidIds: parentForm.linkedKidIds,
    });

    setParentForm({
      nameAr: '',
      nameEn: '',
      phone: '',
      password: '',
      feePaid: true,
      linkedKidIds: [],
    });
    setShowAddParentModal(false);
  };

  const handleSendBroadcast = () => {
    if (!broadcastText.trim()) return;
    onBroadcastAlert(
      lang === 'ar' ? 'تعميم أمان من إدارة المدرسة' : 'School Safety Broadcast',
      broadcastText
    );
    setBroadcastText('');
    setShowBroadcastModal(false);
  };

  const handleExportCSV = () => {
    if (!selectedHistory) return;
    const headers = ['Stop Name', 'Arrival Time', 'Boarded Count', 'Absent Count'];
    const rows = selectedHistory.stopLogs.map((l) => [
      `"${l.stopNameEn}"`,
      `"${l.arrivedAt}"`,
      l.boardedCount,
      l.absentCount,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `route-history-${selectedHistory.busNumber}-${selectedHistory.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // WhatsApp credential dispatcher for Admin
  const getWhatsAppCredentialsLink = (parent: Parent) => {
    const appUrl = window.location.origin;
    const msg = t.credentialsWhatsAppMsg
      .replace('{phone}', parent.phone)
      .replace('{password}', parent.password)
      .replace('{url}', appUrl);

    const cleanPhone = parent.phone.replace(/\D/g, '').replace(/^0/, '20');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const handleCopyCredentials = (parent: Parent) => {
    const text = `BusWhere - ELS Login Credentials\nPhone: ${parent.phone}\nPassword: ${parent.password}\nPortal: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedId(parent.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Header Actions: Broadcast & Production Roadmap Guide */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.schoolAdmin} · {t.schoolName}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'ar'
              ? 'مراقبة الأسطول اللحظية، تدقيق مسار الرحلات التاريخية، وضبط اشتراكات الرسوم'
              : 'Fleet dispatch monitor, GPS route playback audits, and fee-gated student enrollment'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Broadcast Alert */}
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="h-10 px-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Megaphone size={15} />
            <span>{t.broadcastNotice}</span>
          </button>

          {/* Add Student */}
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="h-10 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus size={15} />
            <span>{t.addStudent}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">{t.activeBuses}</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <BusIcon size={16} />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {activeBusesCount} <span className="text-xs text-slate-400 font-normal">/ {buses.length}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">{t.totalStudents}</span>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {students.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">{t.feesPaid}</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {feesPaidCount}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">{t.feesPending}</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
            {feesPendingCount}
          </div>
        </div>
      </div>

      {/* Nav Tab Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('fleet')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'fleet' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.liveFleetMap}
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'students' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.studentRoster} ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('parents')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'parents' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.parentAccounts} ({parents.length})
          </button>
          <button
            onClick={() => setActiveTab('buses')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'buses' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.busesFleet} ({buses.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'history' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.routeHistory}
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute top-1/2 -translate-y-1/2 left-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.search}
            className="w-full h-9 ps-8 pe-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-hidden focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* Tab 1: Live Master Fleet Map */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-4 items-start">
            <InteractiveMap
              buses={buses}
              stops={stops}
              showAllBuses={true}
              lang={lang}
              className="h-[460px] md:h-[540px]"
            />

            {/* Live Buses Status Cards */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                <span>{t.activeBuses}</span>
                <span className="text-xs font-mono text-slate-400">{buses.length} registered</span>
              </h3>

              <div className="space-y-2.5 max-h-[490px] overflow-y-auto pe-1">
                {buses.map((bus) => {
                  const busStudents = students.filter((s) => s.busId === bus.id);
                  const onBoard = busStudents.filter((s) => s.todayStatus === 'boarded').length;

                  return (
                    <div
                      key={bus.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-amber-400 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs font-mono">
                            {bus.number.replace('BUS ', '')}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{bus.number}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({lang === 'ar' ? bus.plateAr : bus.plateEn})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {bus.supervisorName}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            bus.status === 'en_route'
                              ? 'bg-emerald-100 text-emerald-800'
                              : bus.status === 'delayed'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {t[bus.status]}
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">
                          {t.passengersOnBoard}: <strong className="text-slate-800 dark:text-slate-200 font-mono">{onBoard}/{bus.capacity}</strong>
                        </span>
                        <span className="text-slate-500 font-mono">
                          {bus.speedKmH} {t.kmH}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Students & Fee Gating */}
      {activeTab === 'students' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {t.studentRoster}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'ar'
                  ? 'الطلاب المقيدون بخدمة الباص بعد التحقق من سداد الرسوم المدرسية'
                  : 'Students registered for bus transport upon fee payment verification'}
              </p>
            </div>

            <button
              onClick={() => setShowAddStudentModal(true)}
              className="h-9 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus size={14} />
              <span>{t.addStudent}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="p-3 text-start">{t.studentName}</th>
                  <th className="p-3 text-start">{t.grade}</th>
                  <th className="p-3 text-start">{t.busNumber}</th>
                  <th className="p-3 text-start">{t.pickupLocation}</th>
                  <th className="p-3 text-start">{t.transportFees}</th>
                  <th className="p-3 text-start">{t.status}</th>
                  <th className="p-3 text-start">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students
                  .filter((s) =>
                    `${s.nameAr} ${s.nameEn} ${s.grade}`.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {lang === 'ar' ? student.nameAr : student.nameEn}
                      </td>
                      <td className="p-3 text-slate-500">{student.grade}</td>
                      <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                        BUS {student.busId === 1 ? '101' : student.busId === 2 ? '205' : '308'}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        {lang === 'ar' ? student.pickupStop.nameAr : student.pickupStop.nameEn}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            student.feeStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {student.feeStatus === 'paid' ? t.feesPaid : t.feesPending}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-[11px] text-slate-600 dark:text-slate-400">
                          {student.todayStatus === 'boarded'
                            ? `✓ ${t.boarded}`
                            : student.todayStatus === 'absent'
                            ? `✕ ${t.absent}`
                            : student.todayStatus === 'exited'
                            ? `✓ ${t.exited}`
                            : t.pending}
                        </span>
                      </td>
                      <td className="p-3">
                        {student.feeStatus === 'pending' ? (
                          <button
                            onClick={() => onToggleFeeStatus(student.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors"
                          >
                            {t.markPaid}
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-medium">Verified Active</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Parent Accounts & Credential Generation (Fee-Gated) */}
      {activeTab === 'parents' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {t.parentAccounts}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'ar'
                  ? 'إدارة حسابات أولياء الأمور بعد سداد الرسوم مع خاصية إرسال بيانات الدخول عبر الواتساب مباشرة'
                  : 'Manage parent login credentials with automated one-click WhatsApp credential dispatch'}
              </p>
            </div>

            <button
              onClick={() => {
                setParentForm({
                  nameAr: '',
                  nameEn: '',
                  phone: '',
                  password: generateRandomPassword(),
                  feePaid: true,
                  linkedKidIds: [students[0]?.id || 1],
                });
                setShowAddParentModal(true);
              }}
              className="h-9 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <KeyRound size={14} />
              <span>{t.issueParentCredentials}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="p-3 text-start">{t.parentName}</th>
                  <th className="p-3 text-start">{t.parentPhoneRegistered}</th>
                  <th className="p-3 text-start">{t.parentPassword}</th>
                  <th className="p-3 text-start">{t.linkedStudents}</th>
                  <th className="p-3 text-start">{t.transportFees}</th>
                  <th className="p-3 text-start">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {parents
                  .filter((p) =>
                    `${p.nameAr} ${p.nameEn} ${p.phone}`.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((parent) => {
                    const linkedKids = students.filter((s) => parent.kidIds.includes(s.id));
                    const isAllPaid = linkedKids.every((k) => k.feeStatus === 'paid');
                    const isRevealed = revealedPasswords[parent.id];

                    return (
                      <tr key={parent.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          <div>{lang === 'ar' ? parent.nameAr : parent.nameEn}</div>
                          <div className="text-[10px] text-slate-400 font-normal">ID: {parent.id}</div>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {parent.phone}
                        </td>
                        <td className="p-3 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                              {isRevealed ? parent.password : '••••••••'}
                            </span>
                            <button
                              onClick={() =>
                                setRevealedPasswords((prev) => ({
                                  ...prev,
                                  [parent.id]: !prev[parent.id],
                                }))
                              }
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {linkedKids.map((k) => (
                              <span
                                key={k.id}
                                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium"
                              >
                                {lang === 'ar' ? k.nameAr : k.nameEn}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isAllPaid
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {isAllPaid ? t.feesPaid : t.feesPending}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {/* Copy button */}
                            <button
                              onClick={() => handleCopyCredentials(parent)}
                              title={t.copyCredentials}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                            >
                              {copiedId === parent.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>

                            {/* Direct WhatsApp Dispatch Bridge */}
                            <a
                              href={getWhatsAppCredentialsLink(parent)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors shadow-2xs"
                              title={t.sendCredentialsWhatsApp}
                            >
                              <MessageSquare size={13} />
                              <span className="hidden sm:inline">{t.sendCredentialsWhatsApp}</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Buses & Fleet Management */}
      {activeTab === 'buses' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {t.busesFleet}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'ar' ? 'إدارة حافلات المدرسة، السائقين، والمشرفات المعتمدين' : 'Manage school buses, certified drivers, and supervisors'}
              </p>
            </div>

            <button
              onClick={() => setShowAddBusModal(true)}
              className="h-9 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus size={14} />
              <span>{t.addBus}</span>
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {buses.map((bus) => {
              const busStudents = students.filter((s) => s.busId === bus.id);

              return (
                <div
                  key={bus.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">
                        {bus.number.replace('BUS ', '')}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{bus.number}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {lang === 'ar' ? bus.plateAr : bus.plateEn}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        bus.status === 'en_route' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {t[bus.status]}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400">{t.supervisorName}:</span> <strong>{bus.supervisorName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">{t.supervisorPhone}:</span> <span className="font-mono">{bus.supervisorPhone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">{t.capacity}:</span>{' '}
                      <strong className="font-mono">{busStudents.length} / {bus.capacity} seats</strong>
                    </div>
                  </div>

                  {/* Progress bar of seats */}
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.min(100, (busStudents.length / bus.capacity) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 5: Route History & Audit Dashboard */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History size={18} className="text-indigo-500" />
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {t.routeHistory}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'ar' ? 'سجل تتبع نظام الـ GPS وتدقيق الحضور لمطابقة المواعيد' : 'Audit GPS breadcrumbs, stop times, and student attendance records'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Trip Selector */}
              <select
                value={selectedHistoryId}
                onChange={(e) => setSelectedHistoryId(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-hidden"
              >
                {historyRecords.map((rec) => (
                  <option key={rec.id} value={rec.id}>
                    {rec.busNumber} · {rec.date} ({rec.type === 'morning' ? 'Morning' : 'Afternoon'})
                  </option>
                ))}
              </select>

              <button
                onClick={handleExportCSV}
                className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet size={14} />
                <span>{t.exportReport}</span>
              </button>
            </div>
          </div>

          {selectedHistory && (
            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4 items-start">
              {/* Route Replay Map */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    <Navigation size={14} />
                    <span>
                      {selectedHistory.busNumber} · {selectedHistory.date} · {t.playbackRoute}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {selectedHistory.distanceKm} km · {selectedHistory.durationMinutes} min
                  </span>
                </div>

                <InteractiveMap
                  buses={buses.filter((b) => b.number === selectedHistory.busNumber)}
                  stops={stops}
                  historyTrail={selectedHistory.path}
                  lang={lang}
                  className="h-[380px] md:h-[420px]"
                />
              </div>

              {/* Stop Audit Table & Metrics */}
              <div className="space-y-4">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 font-semibold">{t.onTimeRate}</div>
                    <div className="text-base font-black font-mono text-emerald-600 mt-0.5">
                      {selectedHistory.onTimePercent}%
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 font-semibold">{t.boarded}</div>
                    <div className="text-base font-black font-mono text-slate-900 dark:text-white mt-0.5">
                      {selectedHistory.studentsBoarded}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 font-semibold">{t.absent}</div>
                    <div className="text-base font-black font-mono text-rose-600 mt-0.5">
                      {selectedHistory.studentsAbsent}
                    </div>
                  </div>
                </div>

                {/* Stop Timestamps Audit */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                    {t.attendanceAudit}
                  </h4>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pe-1 text-xs">
                    {selectedHistory.stopLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {lang === 'ar' ? log.stopNameAr : log.stopNameEn}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                            <Clock size={11} />
                            <span>{log.arrivedAt}</span>
                          </div>
                        </div>

                        <div className="text-end font-mono">
                          <span className="text-emerald-600 font-bold">+{log.boardedCount}</span>
                          {log.absentCount > 0 && (
                            <span className="text-rose-600 font-bold ms-1.5">-{log.absentCount} abs</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Parent & Issue Credentials Modal */}
      {showAddParentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-amber-600">
                <KeyRound size={18} />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {t.issueParentCredentials}
                </h3>
              </div>
              <button onClick={() => setShowAddParentModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              {lang === 'ar'
                ? 'إنشاء حساب جديد لولي الأمر مع توليد كلمة مرور فورية، مع اشتراط سداد الرسوم لتفعيل الاشتراك.'
                : 'Create new parent login account with auto-generated password upon transport fee verification.'}
            </p>

            <form onSubmit={handleCreateParent} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">اسم ولي الأمر (عربي)</label>
                <input
                  type="text"
                  required
                  placeholder="د. محمد عبد المنعم..."
                  value={parentForm.nameAr}
                  onChange={(e) => setParentForm({ ...parentForm, nameAr: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Parent Name (English)</label>
                <input
                  type="text"
                  placeholder="Dr. Mohamed Abdelmonem..."
                  value={parentForm.nameEn}
                  onChange={(e) => setParentForm({ ...parentForm, nameEn: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t.parentPhoneRegistered}</label>
                <input
                  type="tel"
                  required
                  placeholder="010XXXXXXXX"
                  value={parentForm.phone}
                  onChange={(e) => setParentForm({ ...parentForm, phone: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">{t.parentPassword}</label>
                  <button
                    type="button"
                    onClick={() => setParentForm({ ...parentForm, password: generateRandomPassword() })}
                    className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline"
                  >
                    {t.generatePassword}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={parentForm.password}
                  onChange={(e) => setParentForm({ ...parentForm, password: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-amber-600"
                />
              </div>

              {/* Fee Verification Check */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-amber-900 dark:text-amber-200">
                  <input
                    type="checkbox"
                    checked={parentForm.feePaid}
                    onChange={(e) => setParentForm({ ...parentForm, feePaid: e.target.checked })}
                    className="h-4 w-4 accent-amber-500 rounded"
                  />
                  <span>تأكيد سداد رسوم الباص وتفعيل الحساب للموسم الحالي</span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddParentModal(false)}
                  className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!parentForm.feePaid}
                  className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Bus Modal */}
      {showAddBusModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {t.addBus}
              </h3>
              <button onClick={() => setShowAddBusModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateBus} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t.busNumber}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BUS 410"
                  value={busForm.number}
                  onChange={(e) => setBusForm({ ...busForm, number: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Plate (Arabic)</label>
                  <input
                    type="text"
                    placeholder="ر م د 7890"
                    value={busForm.plateAr}
                    onChange={(e) => setBusForm({ ...busForm, plateAr: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t.capacity}</label>
                  <input
                    type="number"
                    min="10"
                    max="60"
                    value={busForm.capacity}
                    onChange={(e) => setBusForm({ ...busForm, capacity: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t.supervisorName}</label>
                <input
                  type="text"
                  placeholder="Ms. Hoda..."
                  value={busForm.supervisorName}
                  onChange={(e) => setBusForm({ ...busForm, supervisorName: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBusModal(false)}
                  className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal (Fee verification & seat assign) */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {t.addStudent}
              </h3>
              <button onClick={() => setShowAddStudentModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">اسم الطالب (عربي)</label>
                  <input
                    type="text"
                    required
                    placeholder="كريم أحمد..."
                    value={studentForm.nameAr}
                    onChange={(e) => setStudentForm({ ...studentForm, nameAr: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Student Name (EN)</label>
                  <input
                    type="text"
                    placeholder="Kareem Ahmed..."
                    value={studentForm.nameEn}
                    onChange={(e) => setStudentForm({ ...studentForm, nameEn: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t.grade}</label>
                  <input
                    type="text"
                    value={studentForm.grade}
                    onChange={(e) => setStudentForm({ ...studentForm, grade: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t.busNumber}</label>
                  <select
                    value={studentForm.busId}
                    onChange={(e) => setStudentForm({ ...studentForm, busId: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {buses.map((b) => (
                      <option key={b.id} value={b.id}>{b.number} ({b.capacity} seats)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t.parentName}</label>
                  <select
                    value={studentForm.parentId}
                    onChange={(e) => setStudentForm({ ...studentForm, parentId: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {parents.map((p) => (
                      <option key={p.id} value={p.id}>{lang === 'ar' ? p.nameAr : p.nameEn}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t.transportFees}</label>
                  <select
                    value={studentForm.feeStatus}
                    onChange={(e) => setStudentForm({ ...studentForm, feeStatus: e.target.value as 'paid' | 'pending' })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="paid">{t.feesPaid}</option>
                    <option value="pending">{t.feesPending}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t.pickupLocation}</label>
                <input
                  type="text"
                  value={studentForm.pickupNameAr}
                  onChange={(e) => setStudentForm({ ...studentForm, pickupNameAr: e.target.value, pickupNameEn: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-black"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Alert Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-indigo-600">
              <div className="flex items-center gap-2">
                <Megaphone size={18} />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {t.broadcastNotice}
                </h3>
              </div>
              <button onClick={() => setShowBroadcastModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                {t.broadcastPrompt}
              </label>
              <textarea
                rows={4}
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: يرجى العلم بوجود إصلاحات في محور المشير طنطاوي وتأخر باص 101 لمدة 10 دقائق...' : 'e.g. Please note roadwork near Tantawy axis may cause a 10-minute delay for BUS 101...'}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-hidden focus:ring-2 focus:ring-indigo-400 leading-relaxed"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleSendBroadcast}
                className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md"
              >
                {t.sendBroadcast}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
