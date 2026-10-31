import React, { useState } from 'react';
import { Bus, Student, Parent, RouteStop, AbsenceReason, Language } from '../types';
import { translations } from '../data/translations';
import { InteractiveMap } from './InteractiveMap';
import { sound } from '../utils/audio';
import {
  Clock,
  Navigation,
  Phone,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Bus as BusIcon,
  CalendarX,
  CreditCard,
  MapPin,
  ChevronRight,
  Smile,
  Send,
} from 'lucide-react';

interface ParentPortalProps {
  parent: Parent;
  students: Student[];
  buses: Bus[];
  stops: RouteStop[];
  lang: Language;
  onReportAbsence: (studentId: number, reason: AbsenceReason) => void;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({
  parent,
  students,
  buses,
  stops,
  lang,
  onReportAbsence,
}) => {
  const t = translations[lang];
  const myKids = students.filter((s) => parent.kidIds.includes(s.id));
  const [selectedKidId, setSelectedKidId] = useState<number>(myKids[0]?.id || 1);
  const [showAbsenceModal, setShowAbsenceModal] = useState<boolean>(false);
  const [absenceReason, setAbsenceReason] = useState<AbsenceReason>('sick');

  const selectedKid = myKids.find((k) => k.id === selectedKidId) || myKids[0];
  const assignedBus = buses.find((b) => b.id === selectedKid?.busId) || buses[0];
  const childStop = selectedKid?.pickupStop;

  // Approximate ETA calculation based on bus distance to stop
  const isEnRoute = assignedBus.status === 'en_route';
  const isBoarded = selectedKid?.todayStatus === 'boarded';
  const isExited = selectedKid?.todayStatus === 'exited';
  const isAbsent = selectedKid?.todayStatus === 'absent';

  // WhatsApp quick text builder
  const getWhatsAppLink = (driverPhone: string, kidName: string, busNum: string) => {
    const reasonText =
      absenceReason === 'sick'
        ? t.reasonSick
        : absenceReason === 'travel'
        ? t.reasonTravel
        : absenceReason === 'self_transport'
        ? t.reasonSelfTransport
        : t.reasonFamily;

    const message = t.whatsAppTemplate
      .replace('{student}', kidName)
      .replace('{bus}', busNum)
      .replace('{reason}', reasonText);

    const cleanPhone = driverPhone.replace(/\D/g, '').replace(/^0/, '20');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleConfirmAbsence = () => {
    if (!selectedKid) return;
    sound.playAbsenceChime();
    onReportAbsence(selectedKid.id, absenceReason);
    setShowAbsenceModal(false);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Child Switcher Tabs if parent has more than one child */}
      {myKids.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {myKids.map((kid) => {
            const isSelected = kid.id === selectedKidId;
            return (
              <button
                key={kid.id}
                onClick={() => setSelectedKidId(kid.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="h-5 w-5 rounded-full bg-slate-950/10 flex items-center justify-center font-bold text-[10px]">
                  {(lang === 'ar' ? kid.nameAr : kid.nameEn).charAt(0)}
                </div>
                <span>{lang === 'ar' ? kid.nameAr : kid.nameEn}</span>
                <span className="text-[10px] opacity-70">({kid.grade})</span>
              </button>
            );
          })}
        </div>
      )}

      {selectedKid && (
        <>
          {/* Status Hero Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md">
                  {(lang === 'ar' ? selectedKid.nameAr : selectedKid.nameEn).charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {lang === 'ar' ? selectedKid.nameAr : selectedKid.nameEn}
                    </h2>
                    <span className="text-xs text-slate-500 font-medium">· {selectedKid.grade}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="font-bold text-amber-600 dark:text-amber-400">{assignedBus.number}</span>
                    <span>·</span>
                    <span>{t.pickupLocation}: <strong className="text-slate-700 dark:text-slate-300">{lang === 'ar' ? childStop?.nameAr : childStop?.nameEn}</strong></span>
                  </div>
                </div>
              </div>

              {/* Status Pill Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-xs ${
                    isBoarded
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : isExited
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : isAbsent
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {isBoarded ? (
                    <>
                      <CheckCircle2 size={15} />
                      <span>{t.boarded} ({selectedKid.boardedAt || '07:22 AM'})</span>
                    </>
                  ) : isExited ? (
                    <>
                      <CheckCircle2 size={15} />
                      <span>{t.exited} ({selectedKid.exitedAt || '07:54 AM'})</span>
                    </>
                  ) : isAbsent ? (
                    <>
                      <AlertCircle size={15} />
                      <span>{t.absent}</span>
                    </>
                  ) : (
                    <>
                      <Clock size={15} />
                      <span>{isEnRoute ? t.en_route : t.pending}</span>
                    </>
                  )}
                </span>

                {/* Pre-trip Report Absence Button */}
                {!isBoarded && !isExited && !isAbsent && (
                  <button
                    onClick={() => setShowAbsenceModal(true)}
                    className="h-9 px-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <CalendarX size={14} />
                    <span>{t.reportAbsence}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic ETA / Live Alert Banner */}
            {isEnRoute && !isAbsent && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <Navigation size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
                      {isBoarded
                        ? lang === 'ar'
                          ? 'الباص في طريقه إلى حرم المدرسة المصرية للغات (ELS)'
                          : 'Bus is en route to ELS School Campus'
                        : lang === 'ar'
                        ? 'الباص يقترب من محطتك! الوصول المتوقع: 4 دقائق (حوالي 450 متر)'
                        : 'Bus is approaching your stop! ETA: ~4 minutes (around 450m)'}
                    </div>
                    <div className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                      {lang === 'ar'
                        ? 'التنبيه التلقائي مفعل داخل دائرة الأمان (500 متر)'
                        : 'Automatic geofence proximity trigger active (500m perimeter)'}
                    </div>
                  </div>
                </div>

                <div className="text-end">
                  <div className="text-xs font-mono font-black text-amber-900 dark:text-amber-200">
                    {assignedBus.speedKmH} {t.kmH}
                  </div>
                  <div className="text-[10px] text-slate-500">{t.speed}</div>
                </div>
              </div>
            )}
          </div>

          {/* Map & Today's Journey Grid */}
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4 items-start">
            {/* Live Leaflet Map */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-amber-500" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {t.liveBusTracker} - {assignedBus.number}
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  GPS: {assignedBus.currentLocation.lat.toFixed(4)}, {assignedBus.currentLocation.lng.toFixed(4)}
                </span>
              </div>

              <InteractiveMap
                buses={[assignedBus]}
                stops={stops}
                activeBusId={assignedBus.id}
                highlightStopId={childStop?.id}
                lang={lang}
                className="h-[360px] md:h-[420px]"
              />
            </div>

            {/* Right: Journey Milestones & Bus Crew Details */}
            <div className="space-y-4">
              {/* Safety Timeline */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <span>{t.safetyTimeline}</span>
                </h4>

                <div className="space-y-3 text-xs relative ps-5 border-s-2 border-slate-200 dark:border-slate-800 ms-2">
                  {/* Step 1: Route Departed */}
                  <div className="relative">
                    <div className="absolute -left-[27px] top-0 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
                    <div className="font-bold text-slate-900 dark:text-white">
                      {assignedBus.status !== 'idle' ? '07:05 AM' : '--:--'} · {lang === 'ar' ? 'انطلاق باص 101 من الجراج' : 'Bus 101 departed depot'}
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      {lang === 'ar' ? 'تم بدء التتبع المباشر وإشعار المشرفين' : 'Live tracking initiated with supervisors'}
                    </div>
                  </div>

                  {/* Step 2: Proximity 500m Geofence */}
                  <div className="relative">
                    <div
                      className={`absolute -left-[27px] top-0 h-4 w-4 rounded-full border-2 border-white shadow-xs ${
                        isEnRoute ? 'bg-amber-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    />
                    <div className="font-bold text-slate-900 dark:text-white">
                      {isEnRoute ? '07:18 AM' : '--:--'} · {lang === 'ar' ? 'تنبيه الاقتراب من محطة التسعين (500م)' : 'Near Stop Proximity (500m)'}
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      {lang === 'ar' ? 'إشعار فوري لولي الأمر بالاستعداد' : 'Automated near-stop push alert'}
                    </div>
                  </div>

                  {/* Step 3: Boarded */}
                  <div className="relative">
                    <div
                      className={`absolute -left-[27px] top-0 h-4 w-4 rounded-full border-2 border-white shadow-xs ${
                        isBoarded ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    />
                    <div className="font-bold text-slate-900 dark:text-white">
                      {isBoarded ? selectedKid.boardedAt || '07:22 AM' : '--:--'} · {lang === 'ar' ? 'صعود الطفل وتأكيد المشرفة' : 'Safely Boarded on Bus'}
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      {lang === 'ar' ? 'تأكيد المقعد بواسطة المشرفة أ. فاطمة' : 'Verified by supervisor Ms. Fatima'}
                    </div>
                  </div>

                  {/* Step 4: Arrived School */}
                  <div className="relative">
                    <div
                      className={`absolute -left-[27px] top-0 h-4 w-4 rounded-full border-2 border-white shadow-xs ${
                        isExited ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    />
                    <div className="font-bold text-slate-900 dark:text-white">
                      {isExited ? selectedKid.exitedAt || '07:54 AM' : '--:--'} · {lang === 'ar' ? 'الوصول الآمن لحرم المدرسة' : 'Arrived at ELS Campus'}
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      {lang === 'ar' ? 'تسليم الطلاب لإشراف الطابور الصباحي' : 'Student handed over to morning school staff'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bus & Crew Contact Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <BusIcon size={16} className="text-amber-500" />
                  <span>{t.busDetails}</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <div>
                      <div className="text-slate-400 text-[10px]">{t.driverName}</div>
                      <div className="font-bold text-slate-900 dark:text-white">محمود سيد عثمان</div>
                    </div>
                    <a
                      href="tel:01001112233"
                      className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 font-bold text-[11px] transition-colors"
                    >
                      <Phone size={13} />
                      <span>اتصال</span>
                    </a>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <div>
                      <div className="text-slate-400 text-[10px]">{t.supervisorName}</div>
                      <div className="font-bold text-slate-900 dark:text-white">{assignedBus.supervisorName}</div>
                    </div>
                    <a
                      href={`tel:${assignedBus.supervisorPhone}`}
                      className="h-8 px-2.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white flex items-center gap-1 font-bold text-[11px] transition-colors"
                    >
                      <Phone size={13} />
                      <span>اتصال</span>
                    </a>
                  </div>
                </div>

                {/* Transportation Fee Badge */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <CreditCard size={14} className="text-amber-500" />
                    <span>{t.feeSubscription}:</span>
                  </div>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      selectedKid.feeStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {selectedKid.feeStatus === 'paid' ? t.feesPaid : t.feesPending}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Report Absence Modal with WhatsApp Dispatch */}
      {showAbsenceModal && selectedKid && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600">
                <CalendarX size={20} />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {t.reportAbsence}
                </h3>
              </div>
              <button
                onClick={() => setShowAbsenceModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {lang === 'ar'
                  ? `تسجيل غياب الطالب (${selectedKid.nameAr}) قبل انطلاق الرحلة يتيح للباص تخطي محطة الالتقاط واختصار وقت الرحلة لزملائه.`
                  : `Reporting absence for (${selectedKid.nameEn}) before route starts allows the bus to skip this pickup stop and optimize the route.`}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t.selectAbsenceReason}
              </label>

              {(['sick', 'travel', 'self_transport', 'family'] as AbsenceReason[]).map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                    absenceReason === reason
                      ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>
                    {reason === 'sick'
                      ? t.reasonSick
                      : reason === 'travel'
                      ? t.reasonTravel
                      : reason === 'self_transport'
                      ? t.reasonSelfTransport
                      : t.reasonFamily}
                  </span>
                  <input
                    type="radio"
                    name="absenceReason"
                    value={reason}
                    checked={absenceReason === reason}
                    onChange={() => setAbsenceReason(reason)}
                    className="accent-amber-500 h-4 w-4"
                  />
                </label>
              ))}
            </div>

            {/* Direct WhatsApp Quick Bridge */}
            <div className="pt-2">
              <a
                href={getWhatsAppLink('01001112233', lang === 'ar' ? selectedKid.nameAr : selectedKid.nameEn, assignedBus.number)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors mb-2"
              >
                <MessageSquare size={16} />
                <span>{t.sendWhatsAppToDriver}</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowAbsenceModal(false)}
                  className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleConfirmAbsence}
                  className="h-11 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-black text-xs shadow-md"
                >
                  {t.submitAbsence}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
