export type CleaningStatus = 'Почистена' | 'За почистване';

export interface RoomType {
  id: string;
  name: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  pricePerNight: number;
}

export interface Reservation {
  id: string;
  roomId: string;
  guestName: string;
  checkInDate: string;
  nights: number;
}

export interface CleaningRecord {
  id: string;
  roomId: string;
  date: string;
  status: CleaningStatus;
}

export interface HotelData {
  roomTypes: RoomType[];
  rooms: Room[];
  reservations: Reservation[];
  cleaningRecords: CleaningRecord[];
}
