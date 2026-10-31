import React, { useState } from 'react';
import { Bus, Student, RouteStop, Language } from '../types';
import { translations } from '../data/translations';
import { InteractiveMap } from './InteractiveMap';
import { sound } from '../utils/audio';
import {
  Play,
  Square,
  AlertTriangle,
  UserCheck,
  UserX,
  Users,
  Navigation,
  Phone,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface DriverSupervisorPortalProps {
  bus: Bus;
  students: Student[];
  stops: RouteStop[];
  lang: Language;
  onStartTrip: (busId: number, type: 'morning' | 'afternoon') => void;
  onStopTrip: (busId: number) => void;
  onToggleDelay: (busId: number) => void;
  onMarkStudentBoarded: (studentId: number) => void;
  onMarkStudentExited: (studentId: number) => void;
  onMarkStudentAbsent: (studentId: number) => void;
}

export const DriverSupervisorPortal: React.FC<DriverSupervisorPortalProps> = ({
  bus,
  students,
  stops,
  lang,
  onStartTrip,
  onStopTrip,
  onToggleDelay,
  onMarkStudentBoarded,
  onMarkStudentExited,
  onMarkStudentAbsent,
}) => {
  const t = translations[lang];
  const [selectedTripType, setSelectedTripType] = useState<'morning' | 'afternoon'>('morning');
  const [activeTab, setActiveTab] = useState<'cockpit' | 'map' | 'attendance'>('cockpit');

  const busStudents = students.filter((s) => s.busId === bus.id);
  const boardedCount = busStudents.filter((s) => s.todayStatus === 'boarded').length;
  const absentCount = busStudents.filter((s) => s.todayStatus === 'absent').length;
  const pendingCount = busStudents.filter((s) => s.todayStatus === 'pending').length;

  const currentStop = stops[bus.currentStopIndex] || stops[0];

  const handleBoard = (studentId: number) => {
    sound.playBoardingChime();
    onMarkStudentBoarded(studentId);
  };

  const handleExit = (studentId: number) => {
    sound.playSafeExitChime();
    onMarkStudentExited(studentId);
  };

  const handleAbsent = (studentId: number) => {
    sound.playAbsenceChime();
    onMarkStudentAbsent(studentId);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Banner: Vehicle & Crew Status */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
            {bus.number.replace('BUS ', '')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-lg text-slate-900 dark:text-white leading-tight">
                {bus.number}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold">
                {lang === 'ar' ? bus.plateAr : bus.plateEn}
              </span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  bus.status === 'en_route'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : bus.status === 'delayed'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {t[bus.status]}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              <span>{t.driverName}: <strong className="text-slate-700 dark:text-slate-300">{bus.driverId === 1 ? 'محمود سيد' : 'أشرف عبد الحميد'}</strong></span>
              <span className="mx-1.5">·</span>
              <span>{t.supervisorName}: <strong className="text-slate-700 dark:text-slate-300">{bus.supervisorName}</strong></span>
            </p>
          </div>
        </div>

        {/* Live Gauges */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center min-w-[90px]">
            <div className="text-[10px] text-slate-500 uppercase font-medium">{t.passengersOnBoard}</div>
            <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
              {boardedCount} <span className="text-xs text-slate-400 font-normal">/ {busStudents.length}</span>
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center min-w-[80px]">
            <div className="text-[10px] text-slate-500 uppercase font-medium">{t.speed}</div>
            <div className="text-lg font-black font-mono text-amber-600 dark:text-amber-400">
              {bus.speedKmH} <span className="text-[10px] text-slate-400">{t.kmH}</span>
            </div>
          </div>

          <a
            href="tel:01000000000"
            className="h-10 px-3 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 flex items-center gap-1.5 text-xs font-bold hover:bg-rose-100 transition-colors"
          >
            <Phone size={14} />
            <span className="hidden sm:inline">Admin SOS</span>
          </a>
        </div>
      </div>

      {/* Main Trip Action Bar (Large touch targets for in-vehicle driving/supervision) */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {bus.status === 'idle' || bus.status === 'completed' ? (
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700">
                <button
                  onClick={() => setSelectedTripType('morning')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedTripType === 'morning' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {t.startMorningTrip}
                </button>
                <button
                  onClick={() => setSelectedTripType('afternoon')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedTripType === 'afternoon' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {t.startAfternoonTrip}
                </button>
              </div>

              <button
                onClick={() => onStartTrip(bus.id, selectedTripType)}
                className="h-11 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all"
              >
                <Play size={16} fill="currentColor" />
                <span>{selectedTripType === 'morning' ? t.startMorningTrip : t.startAfternoonTrip}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onStopTrip(bus.id)}
                className="h-11 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-rose-600/20 active:scale-98 transition-all"
              >
                <Square size={16} fill="currentColor" />
                <span>{t.completeTrip}</span>
              </button>

              <button
                onClick={() => onToggleDelay(bus.id)}
                className={`h-11 px-4 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                  bus.status === 'delayed'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                <AlertTriangle size={15} />
                <span>{t.pauseTrip}</span>
              </button>
            </div>
          )}
        </div>

        {/* Current Stop & Dynamic Absence Skip Alert */}
        <div className="flex items-center gap-3 text-xs">
          {bus.status === 'en_route' && (
            <div className="bg-slate-800/90 border border-slate-700 px-3 py-2 rounded-xl flex items-center gap-2">
              <Navigation size={14} className="text-amber-400 animate-pulse" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">{t.nextStop}</div>
                <div className="font-bold text-amber-300 truncate max-w-[220px]">
                  {lang === 'ar' ? currentStop.nameAr : currentStop.nameEn}
                </div>
              </div>
            </div>
          )}

          {absentCount > 0 && (
            <div className="bg-rose-950/50 border border-rose-800/80 px-3 py-2 rounded-xl text-rose-300 text-[11px] font-medium flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-rose-400 shrink-0" />
              <span>{absentCount} {lang === 'ar' ? 'غياب مسجل مسبقاً (تم تخطي محطتهم)' : 'pre-reported absence (stops auto-skipped)'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs for In-Vehicle Crew */}
      <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('cockpit')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'cockpit' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {t.inVehicleCockpit}
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'map' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {t.liveFleetMap}
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'attendance' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {t.studentRoster} ({busStudents.length})
        </button>
      </div>

      {/* Main Grid View */}
      {activeTab === 'cockpit' && (
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-4 items-start">
          {/* Left: Quick Tap Student Attendance Board */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-amber-500" />
                <h3 className="font-extrabold text-[15px] text-slate-900 dark:text-white">
                  {lang === 'ar' ? 'تسجيل صعود ونزول الطلاب الفوري' : 'One-Tap Student Check-In & Safe Dropoff'}
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {boardedCount} {t.boarded} · {absentCount} {t.absent} · {pendingCount} {t.pending}
              </span>
            </div>

            {/* Student Cards (Tactile, min 48px buttons) */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pe-1">
              {busStudents.map((student) => {
                const isAbsent = student.todayStatus === 'absent';
                const isBoarded = student.todayStatus === 'boarded';
                const isExited = student.todayStatus === 'exited';

                return (
                  <div
                    key={student.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
                      isAbsent
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/50 opacity-75'
                        : isBoarded
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                        : isExited
                        ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50'
                        : 'bg-white dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div
                        className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isAbsent
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                            : isBoarded
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                        }`}
                      >
                        {(lang === 'ar' ? student.nameAr : student.nameEn).charAt(0)}
                      </div>

                      <div>
                        <div className="font-bold text-[14px] text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{lang === 'ar' ? student.nameAr : student.nameEn}</span>
                          {student.feeStatus === 'pending' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-normal">
                              {t.feesPending}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{student.grade}</span>
                          <span>·</span>
                          <span className="truncate max-w-[150px]">
                            {lang === 'ar' ? student.pickupStop.nameAr.split(':')[1] || student.pickupStop.nameAr : student.pickupStop.nameEn}
                          </span>
                        </div>
                        {isAbsent && student.absenceReason && (
                          <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1">
                            ⚠️ {t.absentToday} ({student.absenceReason === 'sick' ? t.reasonSick : student.absenceReason === 'travel' ? t.reasonTravel : t.reasonSelfTransport})
                          </div>
                        )}
                        {isBoarded && student.boardedAt && (
                          <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 mt-1 flex items-center gap-1">
                            <Clock size={11} /> {t.boarded}: {student.boardedAt}
                          </div>
                        )}
                        {isExited && student.exitedAt && (
                          <div className="text-[10px] font-mono text-blue-700 dark:text-blue-300 mt-1 flex items-center gap-1">
                            <CheckCircle2 size={11} /> {t.exited}: {student.exitedAt}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons (Tactile Touch Hitbox >= 44px) */}
                    <div className="flex items-center gap-2 ms-auto">
                      {isAbsent ? (
                        <span className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 text-xs font-bold">
                          {t.absent}
                        </span>
                      ) : (
                        <>
                          {/* Board Button */}
                          <button
                            onClick={() => handleBoard(student.id)}
                            disabled={isBoarded || isExited}
                            className={`min-h-[44px] px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                              isBoarded
                                ? 'bg-emerald-600 text-white shadow-xs cursor-default'
                                : 'bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <UserCheck size={16} />
                            <span>{isBoarded ? t.boarded : t.markBoarded}</span>
                          </button>

                          {/* Safe Dropoff Exit Button */}
                          <button
                            onClick={() => handleExit(student.id)}
                            disabled={!isBoarded || isExited}
                            className={`min-h-[44px] px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                              isExited
                                ? 'bg-blue-600 text-white cursor-default'
                                : isBoarded
                                ? 'bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                                : 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}
                          >
                            <CheckCircle2 size={16} />
                            <span>{isExited ? t.exited : t.markExited}</span>
                          </button>

                          {/* Instant Absence Override */}
                          {!isBoarded && !isExited && (
                            <button
                              onClick={() => handleAbsent(student.id)}
                              title={t.absent}
                              className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors"
                            >
                              <UserX size={16} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Route Stops Sequence & Mini Map */}
          <div className="space-y-4">
            <InteractiveMap
              buses={[bus]}
              stops={stops}
              activeBusId={bus.id}
              highlightStopId={currentStop?.id}
              lang={lang}
              className="h-[260px]"
            />

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h4 className="font-extrabold text-[14px] text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Navigation size={16} className="text-amber-500" />
                <span>{t.allStops}</span>
              </h4>

              <div className="space-y-2">
                {stops.map((stop, index) => {
                  const isCurrent = index === bus.currentStopIndex;
                  const isPast = index < bus.currentStopIndex;
                  const isSkipped = stop.isSkipped;

                  return (
                    <div
                      key={stop.id}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                        isSkipped
                          ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 line-through'
                          : isCurrent
                          ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-slate-900 dark:text-white font-bold ring-2 ring-amber-400/30'
                          : isPast
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            isSkipped
                              ? 'bg-slate-300 text-slate-600'
                              : isCurrent
                              ? 'bg-amber-500 text-white'
                              : isPast
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {isSkipped ? '✕' : isPast ? '✓' : index + 1}
                        </span>
                        <span className="truncate">
                          {lang === 'ar' ? stop.nameAr : stop.nameEn}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono">
                        <span>{stop.scheduledTime}</span>
                        {isSkipped && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-sans font-bold no-underline">
                            {t.absent}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Map Tab */}
      {activeTab === 'map' && (
        <InteractiveMap
          buses={[bus]}
          stops={stops}
          activeBusId={bus.id}
          highlightStopId={currentStop?.id}
          lang={lang}
          className="h-[520px]"
        />
      )}

      {/* Attendance Full Roster Tab */}
      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <th className="p-3 text-start">{t.studentName}</th>
                <th className="p-3 text-start">{t.grade}</th>
                <th className="p-3 text-start">{t.pickupLocation}</th>
                <th className="p-3 text-start">{t.transportFees}</th>
                <th className="p-3 text-start">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {busStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                    {lang === 'ar' ? s.nameAr : s.nameEn}
                  </td>
                  <td className="p-3 text-slate-500">{s.grade}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">
                    {lang === 'ar' ? s.pickupStop.nameAr : s.pickupStop.nameEn}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.feeStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {s.feeStatus === 'paid' ? t.feesPaid : t.feesPending}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        s.todayStatus === 'boarded'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.todayStatus === 'absent'
                          ? 'bg-rose-100 text-rose-800'
                          : s.todayStatus === 'exited'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {s.todayStatus === 'boarded'
                        ? t.boarded
                        : s.todayStatus === 'absent'
                        ? t.absent
                        : s.todayStatus === 'exited'
                        ? t.exited
                        : t.pending}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
