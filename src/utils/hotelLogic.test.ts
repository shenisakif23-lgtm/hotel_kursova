import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateStayTotal,
  checkReceptionPassword,
  createInitialData,
  filterRooms,
  getLatestCleaningForRoom,
  getReservationsForRoom,
  getRoomTypeName,
} from './hotelLogic';

test('calculateStayTotal multiplies price per night and nights accurately', () => {
  assert.equal(calculateStayTotal(140, 3), 420);
  assert.equal(calculateStayTotal(95.5, 2), 191);
  assert.equal(calculateStayTotal(-10, 2), 0);
});

test('filterRooms filters by room number, room type, and quick status', () => {
  const data = createInitialData();
  assert.equal(filterRooms(data.rooms, '', 'all').length, 4);
  assert.equal(filterRooms(data.rooms, '10', 'all').length, 2);
  assert.equal(filterRooms(data.rooms, '', 'type-apartment').length, 1);
  assert.equal(filterRooms(data.rooms, '202', 'type-apartment')[0].roomNumber, '202');
  assert.equal(filterRooms(data.rooms, '202', 'type-single').length, 0);
  assert.equal(filterRooms(data.rooms, '', 'all', data.reservations, data.cleaningRecords, 'free').length, 1);
  assert.equal(filterRooms(data.rooms, '', 'all', data.reservations, data.cleaningRecords, 'occupied').length, 3);
  assert.equal(filterRooms(data.rooms, '', 'all', data.reservations, data.cleaningRecords, 'cleaned').length, 2);
});

test('getLatestCleaningForRoom returns the most recent record by date', () => {
  const records = [
    { id: 'c1', roomId: 'room-101', date: '2026-11-16', status: 'За почистване' as const },
    { id: 'c2', roomId: 'room-101', date: '2026-11-18', status: 'Почистена' as const },
  ];
  const latest = getLatestCleaningForRoom(records, 'room-101');
  assert.equal(latest?.status, 'Почистена');
  assert.equal(getLatestCleaningForRoom(records, 'room-999'), null);
});

test('getReservationsForRoom and getRoomTypeName work on seed data', () => {
  const data = createInitialData();
  const res102 = getReservationsForRoom(data.reservations, 'room-102');
  assert.equal(res102.length, 1);
  assert.equal(res102[0].guestName, 'Елена Георгиева');
  assert.equal(getRoomTypeName(data.roomTypes, 'type-studio'), 'Студио');
});

test('checkReceptionPassword accepts only hotel123', () => {
  assert.equal(checkReceptionPassword('hotel123'), true);
  assert.equal(checkReceptionPassword('hotel123 '), false);
  assert.equal(checkReceptionPassword('wrong'), false);
});
