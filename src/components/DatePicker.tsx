interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  min?: string;
  label?: string;
  disabled?: boolean;
}

export function DatePicker({ value, onChange, min, label = "Select Date", disabled = false }: DatePickerProps) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="date"
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        disabled={disabled}
      />
    </div>
  );
}
