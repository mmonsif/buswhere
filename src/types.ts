/**
 * Data structures and types for BusWhere School Bus Tracer
 */

export type Role = 'admin' | 'driver' | 'parent';

export type Language = 'ar' | 'en';

export type TripStatus = 'idle' | 'en_route' | 'delayed' | 'completed';

export type StudentStatus = 'pending' | 'boarded' | 'exited' | 'absent';

export type AbsenceReason = 'sick' | 'travel' | 'self_transport' | 'family';

export type FeeStatus = 'paid' | 'pending';

export interface LocationPoint {
  lat: number;
  lng: number;
}

export interface RouteStop {
  id: number;
  nameAr: string;
  nameEn: string;
  lat: number;
  lng: number;
  scheduledTime: string;
  order: number;
  studentIds: number[];
  isReached: boolean;
  isSkipped: boolean;
}

export interface Bus {
  id: number;
  number: string; // e.g. "BUS 101"
  plateAr: string;
  plateEn: string;
  driverId: number;
  supervisorName: string;
  supervisorPhone: string;
  capacity: number;
  status: TripStatus;
  currentLocation: LocationPoint;
  speedKmH: number;
  heading: number;
  routeId: number;
  tripType: 'morning' | 'afternoon';
  currentStopIndex: number;
  routeWaypoints: [number, number][];
}

export interface Student {
  id: number;
  nameAr: string;
  nameEn: string;
  grade: string;
  parentId: number;
  busId: number;
  pickupStop: {
    id: number;
    nameAr: string;
    nameEn: string;
    lat: number;
    lng: number;
    scheduledTime: string;
  };
  dropoffStop: {
    id: number;
    nameAr: string;
    nameEn: string;
    lat: number;
    lng: number;
    scheduledTime: string;
  };
  feeStatus: FeeStatus;
  todayStatus: StudentStatus;
  absenceReason?: AbsenceReason;
  boardedAt?: string;
  exitedAt?: string;
}

export interface Parent {
  id: number;
  nameAr: string;
  nameEn: string;
  phone: string;
  password: string;
  kidIds: number[];
  emergencyPhone?: string;
}

export interface DriverSupervisor {
  id: number;
  nameAr: string;
  nameEn: string;
  phone: string;
  password: string;
  busId: number;
  driverNameAr: string;
  driverNameEn: string;
  supervisorNameAr: string;
  supervisorNameEn: string;
}

export interface NotificationItem {
  id: string;
  timestamp: string;
  type: 'proximity' | 'boarding' | 'exit' | 'absence' | 'route_status' | 'broadcast' | 'fee';
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  busId?: number;
  studentId?: number;
  read: boolean;
}

export interface RouteHistoryRecord {
  id: string;
  busNumber: string;
  date: string;
  type: 'morning' | 'afternoon';
  driverName: string;
  supervisorName: string;
  durationMinutes: number;
  distanceKm: number;
  onTimePercent: number;
  studentsBoarded: number;
  studentsAbsent: number;
  path: [number, number][];
  stopLogs: {
    stopNameAr: string;
    stopNameEn: string;
    arrivedAt: string;
    boardedCount: number;
    absentCount: number;
  }[];
}
