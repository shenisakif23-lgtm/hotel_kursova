import {
  CleaningRecord,
  HotelData,
  Reservation,
  Room,
  RoomType,
} from '../types/hotel';

export const STORAGE_KEY = 'hotel_manager_data_v1';
export const RECEPTION_PASSWORD = 'hotel123';

export const DEFAULT_ROOM_TYPES: RoomType[] = [
  { id: 'type-single', name: 'Единична стая' },
  { id: 'type-double', name: 'Двойна стая' },
  { id: 'type-studio', name: 'Студио' },
  { id: 'type-apartment', name: 'Апартамент' },
];

export const DEFAULT_ROOMS: Room[] = [
  { id: 'room-101', roomNumber: '101', roomTypeId: 'type-single', pricePerNight: 95 },
  { id: 'room-102', roomNumber: '102', roomTypeId: 'type-double', pricePerNight: 140 },
  { id: 'room-201', roomNumber: '201', roomTypeId: 'type-studio', pricePerNight: 185 },
  { id: 'room-202', roomNumber: '202', roomTypeId: 'type-apartment', pricePerNight: 260 },
];

export const DEFAULT_RESERVATIONS: Reservation[] = [
  {
    id: 'res-1',
    roomId: 'room-102',
    guestName: 'Елена Георгиева',
    checkInDate: '2026-11-18',
    nights: 3,
  },
  {
    id: 'res-2',
    roomId: 'room-201',
    guestName: 'Мартин Николов',
    checkInDate: '2026-11-19',
    nights: 2,
  },
  {
    id: 'res-3',
    roomId: 'room-202',
    guestName: 'Семейство Тодорови',
    checkInDate: '2026-11-17',
    nights: 5,
  },
];

export const DEFAULT_CLEANING: CleaningRecord[] = [
  { id: 'clean-1', roomId: 'room-101', date: '2026-11-18', status: 'Почистена' },
  { id: 'clean-2', roomId: 'room-102', date: '2026-11-18', status: 'За почистване' },
  { id: 'clean-3', roomId: 'room-201', date: '2026-11-18', status: 'Почистена' },
  { id: 'clean-4', roomId: 'room-202', date: '2026-11-18', status: 'За почистване' },
];

export function createInitialData(): HotelData {
  return {
    roomTypes: DEFAULT_ROOM_TYPES,
    rooms: DEFAULT_ROOMS,
    reservations: DEFAULT_RESERVATIONS,
    cleaningRecords: DEFAULT_CLEANING,
  };
}

export function loadHotelData(): HotelData {
  if (typeof window === 'undefined') {
    return createInitialData();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createInitialData();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as Partial<HotelData>;
    return {
      roomTypes: Array.isArray(parsed.roomTypes) ? parsed.roomTypes : DEFAULT_ROOM_TYPES,
      rooms: Array.isArray(parsed.rooms) ? parsed.rooms : DEFAULT_ROOMS,
      reservations: Array.isArray(parsed.reservations) ? parsed.reservations : DEFAULT_RESERVATIONS,
      cleaningRecords: Array.isArray(parsed.cleaningRecords) ? parsed.cleaningRecords : DEFAULT_CLEANING,
    };
  } catch {
    return createInitialData();
  }
}

export function saveHotelData(data: HotelData): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function calculateStayTotal(pricePerNight: number, nights: number): number {
  if (pricePerNight < 0 || nights < 0) {
    return 0;
  }
  return Math.round(pricePerNight * nights * 100) / 100;
}

export function getRoomTypeName(roomTypes: RoomType[], roomTypeId: string): string {
  const found = roomTypes.find((type) => type.id === roomTypeId);
  return found ? found.name : 'Неизвестен тип';
}

export function getReservationsForRoom(
  reservations: Reservation[],
  roomId: string
): Reservation[] {
  return reservations.filter((res) => res.roomId === roomId);
}

export function getLatestCleaningForRoom(
  cleaningRecords: CleaningRecord[],
  roomId: string
): CleaningRecord | null {
  const matching = cleaningRecords.filter((rec) => rec.roomId === roomId);
  if (matching.length === 0) {
    return null;
  }
  const sorted = [...matching].sort((a, b) => b.date.localeCompare(a.date));
  return sorted[0];
}

export type QuickStatusFilter = 'all' | 'free' | 'occupied' | 'cleaned';

export function filterRooms(
  rooms: Room[],
  searchRoomNumber: string,
  selectedTypeId: string,
  reservations: Reservation[] = [],
  cleaningRecords: CleaningRecord[] = [],
  quickStatus: QuickStatusFilter = 'all'
): Room[] {
  const normalizedQuery = searchRoomNumber.trim().toLowerCase();
  return rooms.filter((room) => {
    const matchesNumber =
      normalizedQuery === '' ||
      room.roomNumber.toLowerCase().includes(normalizedQuery);
    const matchesType =
      selectedTypeId === 'all' || room.roomTypeId === selectedTypeId;
    if (!matchesNumber || !matchesType) {
      return false;
    }
    if (quickStatus === 'free') {
      return getReservationsForRoom(reservations, room.id).length === 0;
    }
    if (quickStatus === 'occupied') {
      return getReservationsForRoom(reservations, room.id).length > 0;
    }
    if (quickStatus === 'cleaned') {
      return getLatestCleaningForRoom(cleaningRecords, room.id)?.status === 'Почистена';
    }
    return true;
  });
}

export function checkReceptionPassword(input: string): boolean {
  return input === RECEPTION_PASSWORD;
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
