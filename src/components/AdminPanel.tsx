import { CheckCircle2, LogOut, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { CleaningStatus, HotelData } from '../types/hotel';
import { calculateStayTotal, createId, getLatestCleaningForRoom, getRoomTypeName } from '../utils/hotelLogic';

interface AdminPanelProps {
  data: HotelData;
  onUpdateData: (updater: (prev: HotelData) => HotelData) => void;
  onLogout: () => void;
}

type AdminSection = 'rooms' | 'types' | 'reservations' | 'cleaning';

export default function AdminPanel({
  data,
  onUpdateData,
  onLogout,
}: AdminPanelProps) {
  const [section, setSection] = useState<AdminSection>('rooms');

  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomNumber, setRoomNumber] = useState('');
  const [roomTypeId, setRoomTypeId] = useState(data.roomTypes[0]?.id ?? '');
  const [pricePerNight, setPricePerNight] = useState('120');
  const [roomError, setRoomError] = useState('');

  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [typeName, setTypeName] = useState('');
  const [typeError, setTypeError] = useState('');

  const [editingReservationId, setEditingReservationId] = useState<string | null>(null);
  const [resRoomId, setResRoomId] = useState(data.rooms[0]?.id ?? '');
  const [guestName, setGuestName] = useState('');
  const [checkInDate, setCheckInDate] = useState('2026-11-18');
  const [nights, setNights] = useState('2');
  const [resError, setResError] = useState('');

  const [editingCleaningId, setEditingCleaningId] = useState<string | null>(null);
  const [cleanRoomId, setCleanRoomId] = useState(data.rooms[0]?.id ?? '');
  const [cleanDate, setCleanDate] = useState('2026-11-18');
  const [cleanStatus, setCleanStatus] = useState<CleaningStatus>('Почистена');
  const [cleanError, setCleanError] = useState('');
  const [statusFeedback, setStatusFeedback] = useState('');

  const notifySaved = (message: string) => {
    setStatusFeedback(message);
  };

  const effectiveRoomTypeId = data.roomTypes.some((t) => t.id === roomTypeId)
    ? roomTypeId
    : (data.roomTypes[0]?.id ?? '');
  const effectiveResRoomId = data.rooms.some((r) => r.id === resRoomId)
    ? resRoomId
    : (data.rooms[0]?.id ?? '');
  const effectiveCleanRoomId = data.rooms.some((r) => r.id === cleanRoomId)
    ? cleanRoomId
    : (data.rooms[0]?.id ?? '');

  const handleRoomSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedNumber = roomNumber.trim();
    const parsedPrice = Number(pricePerNight);

    if (!trimmedNumber) {
      setRoomError('Моля, въведи номер на стаята.');
      return;
    }
    if (!effectiveRoomTypeId) {
      setRoomError('Моля, избери тип стая.');
      return;
    }
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setRoomError('Цената за нощувка трябва да е положително число.');
      return;
    }

    const duplicate = data.rooms.find(
      (r) => r.roomNumber.toLowerCase() === trimmedNumber.toLowerCase() && r.id !== editingRoomId
    );
    if (duplicate) {
      setRoomError('Вече съществува стая с този номер.');
      return;
    }

    setRoomError('');
    if (editingRoomId) {
      onUpdateData((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.id === editingRoomId
            ? { ...r, roomNumber: trimmedNumber, roomTypeId: effectiveRoomTypeId, pricePerNight: parsedPrice }
            : r
        ),
      }));
      setEditingRoomId(null);
      notifySaved('Промените по стаята са запазени.');
    } else {
      const newRoom = {
        id: createId('room'),
        roomNumber: trimmedNumber,
        roomTypeId: effectiveRoomTypeId,
        pricePerNight: parsedPrice,
      };
      onUpdateData((prev) => ({
        ...prev,
        rooms: [...prev.rooms, newRoom],
      }));
      notifySaved(`Стая ${trimmedNumber} е добавена.`);
    }
    setRoomNumber('');
    setPricePerNight('120');
  };

  const handleDeleteRoom = (id: string) => {
    onUpdateData((prev) => ({
      ...prev,
      rooms: prev.rooms.filter((r) => r.id !== id),
      reservations: prev.reservations.filter((res) => res.roomId !== id),
      cleaningRecords: prev.cleaningRecords.filter((rec) => rec.roomId !== id),
    }));
    if (editingRoomId === id) {
      setEditingRoomId(null);
      setRoomNumber('');
    }
  };

  const handleTypeSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = typeName.trim();
    if (!trimmedName) {
      setTypeError('Моля, въведи име на типа стая.');
      return;
    }
    const duplicate = data.roomTypes.find(
      (t) => t.name.toLowerCase() === trimmedName.toLowerCase() && t.id !== editingTypeId
    );
    if (duplicate) {
      setTypeError('Този тип стая вече съществува.');
      return;
    }

    setTypeError('');
    if (editingTypeId) {
      onUpdateData((prev) => ({
        ...prev,
        roomTypes: prev.roomTypes.map((t) =>
          t.id === editingTypeId ? { ...t, name: trimmedName } : t
        ),
      }));
      setEditingTypeId(null);
    } else {
      const newType = {
        id: createId('type'),
        name: trimmedName,
      };
      onUpdateData((prev) => ({
        ...prev,
        roomTypes: [...prev.roomTypes, newType],
      }));
      if (!roomTypeId) {
        setRoomTypeId(newType.id);
      }
    }
    setTypeName('');
  };

  const handleDeleteType = (id: string) => {
    const isUsed = data.rooms.some((r) => r.roomTypeId === id);
    if (isUsed) {
      setTypeError('Този тип не може да се изтрие, защото се използва от стая.');
      return;
    }
    setTypeError('');
    onUpdateData((prev) => ({
      ...prev,
      roomTypes: prev.roomTypes.filter((t) => t.id !== id),
    }));
    if (editingTypeId === id) {
      setEditingTypeId(null);
      setTypeName('');
    }
  };

  const handleReservationSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedGuest = guestName.trim();
    const parsedNights = Number(nights);

    if (!effectiveResRoomId) {
      setResError('Моля, избери стая.');
      return;
    }
    if (!trimmedGuest) {
      setResError('Моля, въведи име на госта.');
      return;
    }
    if (!checkInDate) {
      setResError('Моля, избери дата на настаняване.');
      return;
    }
    if (Number.isNaN(parsedNights) || parsedNights < 1) {
      setResError('Броят нощувки трябва да е поне 1.');
      return;
    }

    setResError('');
    if (editingReservationId) {
      onUpdateData((prev) => ({
        ...prev,
        reservations: prev.reservations.map((res) =>
          res.id === editingReservationId
            ? { ...res, roomId: effectiveResRoomId, guestName: trimmedGuest, checkInDate, nights: parsedNights }
            : res
        ),
      }));
      setEditingReservationId(null);
    } else {
      onUpdateData((prev) => ({
        ...prev,
        reservations: [
          ...prev.reservations,
          {
            id: createId('res'),
            roomId: effectiveResRoomId,
            guestName: trimmedGuest,
            checkInDate,
            nights: parsedNights,
          },
        ],
      }));
    }
    setGuestName('');
    setNights('2');
  };

  const handleDeleteReservation = (id: string) => {
    onUpdateData((prev) => ({
      ...prev,
      reservations: prev.reservations.filter((res) => res.id !== id),
    }));
    if (editingReservationId === id) {
      setEditingReservationId(null);
      setGuestName('');
    }
  };

  const handleCleaningSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!effectiveCleanRoomId) {
      setCleanError('Моля, избери стая.');
      return;
    }
    if (!cleanDate) {
      setCleanError('Моля, избери дата.');
      return;
    }

    setCleanError('');
    if (editingCleaningId) {
      onUpdateData((prev) => ({
        ...prev,
        cleaningRecords: prev.cleaningRecords.map((rec) =>
          rec.id === editingCleaningId
            ? { ...rec, roomId: effectiveCleanRoomId, date: cleanDate, status: cleanStatus }
            : rec
        ),
      }));
      setEditingCleaningId(null);
      notifySaved('Записът за почистване е обновен.');
    } else {
      onUpdateData((prev) => ({
        ...prev,
        cleaningRecords: [
          ...prev.cleaningRecords,
          {
            id: createId('clean'),
            roomId: effectiveCleanRoomId,
            date: cleanDate,
            status: cleanStatus,
          },
        ],
      }));
      notifySaved('Записът за почистване е добавен.');
    }
  };

  const handleToggleCleaningStatus = (id: string) => {
    onUpdateData((prev) => ({
      ...prev,
      cleaningRecords: prev.cleaningRecords.map((rec) =>
        rec.id === id
          ? {
              ...rec,
              status: rec.status === 'Почистена' ? 'За почистване' : 'Почистена',
            }
          : rec
      ),
    }));
    notifySaved('Статусът на почистване е обновен.');
  };

  const handleDeleteCleaning = (id: string) => {
    onUpdateData((prev) => ({
      ...prev,
      cleaningRecords: prev.cleaningRecords.filter((rec) => rec.id !== id),
    }));
    if (editingCleaningId === id) {
      setEditingCleaningId(null);
    }
  };

  const selectedResRoom = data.rooms.find((r) => r.id === effectiveResRoomId);
  const previewTotal = selectedResRoom
    ? calculateStayTotal(selectedResRoom.pricePerNight, Number(nights) || 0)
    : 0;

  const cleanedRoomsCount = data.rooms.filter(
    (room) => getLatestCleaningForRoom(data.cleaningRecords, room.id)?.status === 'Почистена'
  ).length;
  const needsCleaningCount = data.rooms.length - cleanedRoomsCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Административен панел — Рецепция
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Вътрешна информация за стаи, гости, резервации и почистване. Всички промени се записват автоматично.
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-rose-600 hover:text-white hover:border-rose-600 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Изход
        </button>
      </div>

      <section
        aria-label="Служебна статистика за почистване"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Общо стаи</p>
          <p className="mt-1.5 text-xl font-bold text-slate-900 font-mono tabular-nums">
            {data.rooms.length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Активни резервации</p>
          <p className="mt-1.5 text-xl font-bold text-amber-700 font-mono tabular-nums">
            {data.reservations.length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Почистени стаи</p>
          <p className="mt-1.5 text-xl font-bold text-emerald-700 font-mono tabular-nums">
            {cleanedRoomsCount}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">За почистване</p>
          <p className="mt-1.5 text-xl font-bold text-rose-700 font-mono tabular-nums">
            {needsCleaningCount}
          </p>
        </div>
      </section>

      {statusFeedback && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-xl px-4 py-2.5 text-sm"
        >
          <span className="inline-flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-teal-700" />
            {statusFeedback}
          </span>
          <button
            type="button"
            onClick={() => setStatusFeedback('')}
            className="text-xs font-medium text-teal-800 hover:text-teal-950 cursor-pointer"
          >
            Скрий
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSection('rooms')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer hover:-translate-y-0.5 ${
            section === 'rooms'
              ? 'bg-teal-700 text-white shadow-sm hover:bg-teal-600'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 hover:shadow-sm'
          }`}
        >
          Стаи ({data.rooms.length})
        </button>
        <button
          type="button"
          onClick={() => setSection('types')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer hover:-translate-y-0.5 ${
            section === 'types'
              ? 'bg-teal-700 text-white shadow-sm hover:bg-teal-600'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 hover:shadow-sm'
          }`}
        >
          Типове стаи ({data.roomTypes.length})
        </button>
        <button
          type="button"
          onClick={() => setSection('reservations')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer hover:-translate-y-0.5 ${
            section === 'reservations'
              ? 'bg-teal-700 text-white shadow-sm hover:bg-teal-600'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 hover:shadow-sm'
          }`}
        >
          Резервации ({data.reservations.length})
        </button>
        <button
          type="button"
          onClick={() => setSection('cleaning')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer hover:-translate-y-0.5 ${
            section === 'cleaning'
              ? 'bg-teal-700 text-white shadow-sm hover:bg-teal-600'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 hover:shadow-sm'
          }`}
        >
          Почистване ({data.cleaningRecords.length})
        </button>
      </div>

      {section === 'rooms' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleRoomSubmit}
            className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {editingRoomId ? 'Редактиране на стая' : 'Добавяне на нова стая'}
            </h2>
            <div>
              <label htmlFor="admin-room-number" className="block text-sm font-medium text-slate-700 mb-1">
                Номер на стая
              </label>
              <input
                id="admin-room-number"
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="Напр. 301"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>
            <div>
              <label htmlFor="admin-room-type" className="block text-sm font-medium text-slate-700 mb-1">
                Тип стая
              </label>
              <select
                id="admin-room-type"
                value={effectiveRoomTypeId}
                onChange={(e) => setRoomTypeId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              >
                {data.roomTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="admin-room-price" className="block text-sm font-medium text-slate-700 mb-1">
                Цена за нощувка (€)
              </label>
              <input
                id="admin-room-price"
                type="number"
                min="1"
                step="0.01"
                value={pricePerNight}
                onChange={(e) => setPricePerNight(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            {roomError && (
              <p role="alert" className="text-sm font-medium text-rose-700">
                {roomError}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 flex-1 px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-600 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] rounded-lg transition-all duration-200 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {editingRoomId ? 'Запази промените' : 'Добави стая'}
              </button>
              {editingRoomId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingRoomId(null);
                    setRoomNumber('');
                    setPricePerNight('120');
                    setRoomError('');
                  }}
                  className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Отказ
                </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Номер</th>
                    <th className="px-4 py-3 font-semibold">Тип стая</th>
                    <th className="px-4 py-3 font-semibold text-right">Цена / нощ</th>
                    <th className="px-4 py-3 font-semibold text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.rooms.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        Няма добавени стаи.
                      </td>
                    </tr>
                  ) : (
                    data.rooms.map((room) => (
                      <tr key={room.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900 font-mono tabular-nums">
                          {room.roomNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {getRoomTypeName(data.roomTypes, room.roomTypeId)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900">
                          {room.pricePerNight.toFixed(2)} €
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              aria-label={`Редактирай стая ${room.roomNumber}`}
                              onClick={() => {
                                setEditingRoomId(room.id);
                                setRoomNumber(room.roomNumber);
                                setRoomTypeId(room.roomTypeId);
                                setPricePerNight(String(room.pricePerNight));
                                setRoomError('');
                              }}
                              className="p-1.5 text-slate-600 hover:text-white hover:bg-teal-600 hover:scale-105 rounded-md transition-all duration-200 cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Изтрий стая ${room.roomNumber}`}
                              onClick={() => handleDeleteRoom(room.id)}
                              className="p-1.5 text-slate-600 hover:text-white hover:bg-rose-600 hover:scale-105 rounded-md transition-all duration-200 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {section === 'types' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleTypeSubmit}
            className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {editingTypeId ? 'Редактиране на тип стая' : 'Добавяне на тип стая'}
            </h2>
            <div>
              <label htmlFor="admin-type-name" className="block text-sm font-medium text-slate-700 mb-1">
                Име на тип стая
              </label>
              <input
                id="admin-type-name"
                type="text"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                placeholder="Напр. Президентски суит"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            {typeError && (
              <p role="alert" className="text-sm font-medium text-rose-700">
                {typeError}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 flex-1 px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-600 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] rounded-lg transition-all duration-200 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {editingTypeId ? 'Запази' : 'Добави тип'}
              </button>
              {editingTypeId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingTypeId(null);
                    setTypeName('');
                    setTypeError('');
                  }}
                  className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Отказ
                </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Тип стая</th>
                  <th className="px-4 py-3 font-semibold text-right">Брой стаи</th>
                  <th className="px-4 py-3 font-semibold text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.roomTypes.map((type) => {
                  const roomCount = data.rooms.filter((r) => r.roomTypeId === type.id).length;
                  return (
                    <tr key={type.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{type.name}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">
                        {roomCount}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            aria-label={`Редактирай тип ${type.name}`}
                            onClick={() => {
                              setEditingTypeId(type.id);
                              setTypeName(type.name);
                              setTypeError('');
                            }}
                            className="p-1.5 text-slate-600 hover:text-white hover:bg-teal-600 hover:scale-105 rounded-md transition-all duration-200 cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Изтрий тип ${type.name}`}
                            onClick={() => handleDeleteType(type.id)}
                            className="p-1.5 text-slate-600 hover:text-white hover:bg-rose-600 hover:scale-105 rounded-md transition-all duration-200 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {section === 'reservations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleReservationSubmit}
            className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {editingReservationId ? 'Редактиране на резервация' : 'Нова резервация'}
            </h2>
            <div>
              <label htmlFor="admin-res-room" className="block text-sm font-medium text-slate-700 mb-1">
                Стая
              </label>
              <select
                id="admin-res-room"
                value={effectiveResRoomId}
                onChange={(e) => setResRoomId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              >
                {data.rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    Стая {room.roomNumber} ({room.pricePerNight.toFixed(2)} €/нощ)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="admin-res-guest" className="block text-sm font-medium text-slate-700 mb-1">
                Име на гост
              </label>
              <input
                id="admin-res-guest"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Напр. Иван Петров"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>
            <div>
              <label htmlFor="admin-res-date" className="block text-sm font-medium text-slate-700 mb-1">
                Дата на настаняване
              </label>
              <input
                id="admin-res-date"
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>
            <div>
              <label htmlFor="admin-res-nights" className="block text-sm font-medium text-slate-700 mb-1">
                Брой нощувки
              </label>
              <input
                id="admin-res-nights"
                type="number"
                min="1"
                value={nights}
                onChange={(e) => setNights(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <div className="bg-slate-50 rounded-lg px-3.5 py-2.5 flex items-center justify-between text-sm">
              <span className="text-slate-600">Обща сума за престоя</span>
              <span className="font-bold text-teal-800 font-mono tabular-nums">
                {previewTotal.toFixed(2)} €
              </span>
            </div>

            {resError && (
              <p role="alert" className="text-sm font-medium text-rose-700">
                {resError}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 flex-1 px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-600 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] rounded-lg transition-all duration-200 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {editingReservationId ? 'Запази' : 'Добави резервация'}
              </button>
              {editingReservationId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingReservationId(null);
                    setGuestName('');
                    setNights('2');
                    setResError('');
                  }}
                  className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Отказ
                </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Стая</th>
                    <th className="px-4 py-3 font-semibold">Гост</th>
                    <th className="px-4 py-3 font-semibold">Дата</th>
                    <th className="px-4 py-3 font-semibold text-right">Нощувки</th>
                    <th className="px-4 py-3 font-semibold text-right">Обща сума</th>
                    <th className="px-4 py-3 font-semibold text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.reservations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        Няма добавени резервации.
                      </td>
                    </tr>
                  ) : (
                    data.reservations.map((res) => {
                      const room = data.rooms.find((r) => r.id === res.roomId);
                      const total = room ? calculateStayTotal(room.pricePerNight, res.nights) : 0;
                      return (
                        <tr key={res.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-900 font-mono tabular-nums">
                            {room ? room.roomNumber : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-900">{res.guestName}</td>
                          <td className="px-4 py-3 text-slate-600 font-mono tabular-nums">
                            {res.checkInDate}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                            {res.nights}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold font-mono tabular-nums text-teal-800">
                            {total.toFixed(2)} €
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                aria-label={`Редактирай резервация на ${res.guestName}`}
                                onClick={() => {
                                  setEditingReservationId(res.id);
                                  setResRoomId(res.roomId);
                                  setGuestName(res.guestName);
                                  setCheckInDate(res.checkInDate);
                                  setNights(String(res.nights));
                                  setResError('');
                                }}
                                className="p-1.5 text-slate-600 hover:text-white hover:bg-teal-600 hover:scale-105 rounded-md transition-all duration-200 cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Изтрий резервация на ${res.guestName}`}
                                onClick={() => handleDeleteReservation(res.id)}
                                className="p-1.5 text-slate-600 hover:text-white hover:bg-rose-600 hover:scale-105 rounded-md transition-all duration-200 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {section === 'cleaning' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleCleaningSubmit}
            className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {editingCleaningId ? 'Редактиране на почистване' : 'Нов запис за почистване'}
            </h2>
            <div>
              <label htmlFor="admin-clean-room" className="block text-sm font-medium text-slate-700 mb-1">
                Стая
              </label>
              <select
                id="admin-clean-room"
                value={effectiveCleanRoomId}
                onChange={(e) => setCleanRoomId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              >
                {data.rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    Стая {room.roomNumber}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="admin-clean-date" className="block text-sm font-medium text-slate-700 mb-1">
                Дата
              </label>
              <input
                id="admin-clean-date"
                type="date"
                value={cleanDate}
                onChange={(e) => setCleanDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>
            <div>
              <label htmlFor="admin-clean-status" className="block text-sm font-medium text-slate-700 mb-1">
                Статус
              </label>
              <select
                id="admin-clean-status"
                value={cleanStatus}
                onChange={(e) => setCleanStatus(e.target.value as CleaningStatus)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              >
                <option value="Почистена">Почистена</option>
                <option value="За почистване">За почистване</option>
              </select>
            </div>

            {cleanError && (
              <p role="alert" className="text-sm font-medium text-rose-700">
                {cleanError}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 flex-1 px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-600 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] rounded-lg transition-all duration-200 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {editingCleaningId ? 'Запази' : 'Запиши статус'}
              </button>
              {editingCleaningId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCleaningId(null);
                    setCleanError('');
                  }}
                  className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Отказ
                </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Стая</th>
                    <th className="px-4 py-3 font-semibold">Дата</th>
                    <th className="px-4 py-3 font-semibold">Статус</th>
                    <th className="px-4 py-3 font-semibold text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.cleaningRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        Няма добавени записи за почистване.
                      </td>
                    </tr>
                  ) : (
                    data.cleaningRecords.map((rec) => {
                      const room = data.rooms.find((r) => r.id === rec.roomId);
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-900 font-mono tabular-nums">
                            {room ? room.roomNumber : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-mono tabular-nums">
                            {rec.date}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`font-medium ${
                                rec.status === 'Почистена' ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {rec.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                aria-label={`Смени статус за почистване на стая ${room?.roomNumber ?? ''}`}
                                onClick={() => handleToggleCleaningStatus(rec.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-600 hover:text-white hover:-translate-y-0.5 hover:shadow-xs rounded-md transition-all duration-200 cursor-pointer whitespace-nowrap"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Смени статус
                              </button>
                              <button
                                type="button"
                                aria-label={`Редактирай почистване на стая ${room?.roomNumber ?? ''}`}
                                onClick={() => {
                                  setEditingCleaningId(rec.id);
                                  setCleanRoomId(rec.roomId);
                                  setCleanDate(rec.date);
                                  setCleanStatus(rec.status);
                                  setCleanError('');
                                }}
                                className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Изтрий запис за почистване на стая ${room?.roomNumber ?? ''}`}
                                onClick={() => handleDeleteCleaning(rec.id)}
                                className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
