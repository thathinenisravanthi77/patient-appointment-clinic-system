interface TimeSlotSelectorProps {
  slots: { start_time: string; end_time: string; available: boolean }[];
  selected: string | null;
  onSelect: (time: string) => void;
}

export function TimeSlotSelector({ slots, selected, onSelect }: TimeSlotSelectorProps) {
  const availableSlots = slots.filter((s) => s.available);

  if (slots.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-500">No working schedule configured for this day.</p>
      </div>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-500">No available slots for this date.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
      {slots.map((slot) => (
        <button
          key={slot.start_time}
          onClick={() => slot.available && onSelect(slot.start_time)}
          disabled={!slot.available}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            !slot.available
              ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-100"
              : selected === slot.start_time
              ? "bg-teal-600 text-white border-teal-600 shadow-md"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200"
          }`}
        >
          {slot.start_time}
        </button>
      ))}
    </div>
  );
}
