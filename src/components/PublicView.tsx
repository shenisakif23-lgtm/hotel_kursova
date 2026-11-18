import { BedDouble, KeyRound, LockKeyhole, X } from 'lucide-react';
import { useState } from 'react';
import { HotelData } from '../types/hotel';
import {
  filterRooms,
  getReservationsForRoom,
  getRoomTypeName,
  QuickStatusFilter,
} from '../utils/hotelLogic';

interface PublicViewProps {
  data: HotelData;
}

export default function PublicView({ data }: PublicViewProps) {
  const [selectedTypeId, setSelectedTypeId] = useState('all');
  const [quickStatus, setQuickStatus] = useState<QuickStatusFilter>('all');

  const filteredRooms = filterRooms(
    data.rooms,
    '',
    selectedTypeId,
    data.reservations,
    data.cleaningRecords,
    quickStatus
  );

  const occupiedCount = data.rooms.filter(
    (room) => getReservationsForRoom(data.reservations, room.id).length > 0
  ).length;
  const freeCount = data.rooms.length - occupiedCount;

  const hasActiveFilter = selectedTypeId !== 'all' || quickStatus !== 'all';

  const resetAllFilters = () => {
    setSelectedTypeId('all');
    setQuickStatus('all');
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white p-6 sm:p-8 shadow-sm">
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-teal-300">
              Публична информация за налични стаи и цени
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Справки за свободни стаи
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Разгледай типовете стаи, цените за нощувка и актуалната заетост. Използвай картите или филтрите по-долу за бързо търсене.
            </p>
          </div>
          <div className="flex items-center gap-4 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6 shrink-0">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-teal-300">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-300">Заетост на хотела</p>
              <p className="text-xl font-bold font-mono tabular-nums text-white">
                {data.rooms.length > 0
                  ? `${Math.round((occupiedCount / data.rooms.length) * 100)}%`
                  : '0%'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label="Бърз филтър по статус"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <button
          type="button"
          onClick={() => setQuickStatus('all')}
          className={`text-left rounded-xl p-5 border transition-all duration-200 cursor-pointer active:scale-[0.98] ${
            quickStatus === 'all'
              ? 'bg-teal-700 text-white border-teal-700 shadow-md hover:bg-teal-600'
              : 'bg-white border-slate-200 hover:bg-teal-50 hover:border-teal-400 hover:-translate-y-0.5 hover:shadow-md'
          }`}
        >
          <p className={`text-xs font-medium ${quickStatus === 'all' ? 'text-teal-100' : 'text-slate-500'}`}>
            Общо стаи
          </p>
          <p className={`mt-2 text-2xl font-bold font-mono tabular-nums ${quickStatus === 'all' ? 'text-white' : 'text-slate-900'}`}>
            {data.rooms.length}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setQuickStatus(quickStatus === 'free' ? 'all' : 'free')}
          className={`text-left rounded-xl p-5 border transition-all duration-200 cursor-pointer active:scale-[0.98] ${
            quickStatus === 'free'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-md hover:bg-emerald-600'
              : 'bg-white border-slate-200 hover:bg-emerald-50 hover:border-emerald-400 hover:-translate-y-0.5 hover:shadow-md'
          }`}
        >
          <p className={`text-xs font-medium ${quickStatus === 'free' ? 'text-emerald-100' : 'text-slate-500'}`}>
            Свободни стаи
          </p>
          <p className={`mt-2 text-2xl font-bold font-mono tabular-nums ${quickStatus === 'free' ? 'text-white' : 'text-emerald-700'}`}>
            {freeCount}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setQuickStatus(quickStatus === 'occupied' ? 'all' : 'occupied')}
          className={`text-left rounded-xl p-5 border transition-all duration-200 cursor-pointer active:scale-[0.98] ${
            quickStatus === 'occupied'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md hover:bg-amber-500'
              : 'bg-white border-slate-200 hover:bg-amber-50 hover:border-amber-400 hover:-translate-y-0.5 hover:shadow-md'
          }`}
        >
          <p className={`text-xs font-medium ${quickStatus === 'occupied' ? 'text-amber-100' : 'text-slate-500'}`}>
            Заети стаи
          </p>
          <p className={`mt-2 text-2xl font-bold font-mono tabular-nums ${quickStatus === 'occupied' ? 'text-white' : 'text-amber-700'}`}>
            {occupiedCount}
          </p>
        </button>
      </section>

      <section
        aria-label="Филтри"
        className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4 shadow-2xs"
      >
        <div className="flex-1">
          <span className="block text-sm font-medium text-slate-700 mb-2">
            Филтър по тип стая
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedTypeId('all')}
              className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer hover:-translate-y-0.5 ${
                selectedTypeId === 'all'
                  ? 'bg-teal-700 text-white shadow-sm hover:bg-teal-600'
                  : 'bg-slate-100 text-slate-700 hover:bg-teal-600 hover:text-white hover:shadow-sm'
              }`}
            >
              Всички типове
            </button>
            {data.roomTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedTypeId(type.id)}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer hover:-translate-y-0.5 ${
                  selectedTypeId === type.id
                    ? 'bg-teal-700 text-white shadow-sm hover:bg-teal-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-teal-600 hover:text-white hover:shadow-sm'
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={resetAllFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-rose-600 hover:text-white hover:-translate-y-0.5 hover:shadow-sm rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
            Изчисти
          </button>
        )}
      </section>

      {filteredRooms.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <p className="text-base font-semibold text-slate-900">
            Няма намерени стаи по зададените критерии
          </p>
          <p className="text-sm text-slate-600">
            Избери друг тип стая или изчисти активните филтри.
          </p>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-600 hover:-translate-y-0.5 hover:shadow-md rounded-lg transition-all duration-200 cursor-pointer"
            >
              Покажи всички стаи
            </button>
          )}
        </div>
      ) : (
        <section
          aria-label="Списък със стаи"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {filteredRooms.map((room) => {
            const typeName = getRoomTypeName(data.roomTypes, room.roomTypeId);
            const roomReservations = getReservationsForRoom(data.reservations, room.id);
            const isOccupied = roomReservations.length > 0;

            return (
              <article
                key={room.id}
                className="group bg-white border border-slate-200 hover:border-teal-300 hover:shadow-md hover:-translate-y-0.5 rounded-xl p-6 flex flex-col justify-between gap-5 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 ${
                        isOccupied
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-teal-50 text-teal-700 border border-teal-200'
                      }`}
                    >
                      <BedDouble className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p
                        className={`text-xs font-semibold ${
                          isOccupied ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {isOccupied ? 'Заета' : 'Свободна'}
                      </p>
                      <h2 className="text-xl font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                        {typeName}
                      </h2>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                      {room.pricePerNight.toFixed(2)} €
                    </p>
                    <p className="text-xs text-slate-500">на нощувка</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  {isOccupied ? (
                    <div className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50/70 rounded-lg px-3.5 py-2.5">
                      <LockKeyhole className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>В момента стаята е заета</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-emerald-800 bg-emerald-50/70 rounded-lg px-3.5 py-2.5">
                      <KeyRound className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Готова за настаняване</span>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
