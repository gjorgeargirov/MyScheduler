import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const TimePicker = ({ value, onChange, className = '' }) => {
  // Parse time value (HH:MM format)
  const [hours, minutes] = value ? value.split(':').map(Number) : [8, 0];

  const handleHourChange = (newHour) => {
    const formattedHour = String(newHour).padStart(2, '0');
    const formattedMinute = String(minutes).padStart(2, '0');
    onChange(`${formattedHour}:${formattedMinute}`);
  };

  const handleMinuteChange = (newMinute) => {
    const formattedHour = String(hours).padStart(2, '0');
    const formattedMinute = String(newMinute).padStart(2, '0');
    onChange(`${formattedHour}:${formattedMinute}`);
  };

  const incrementHour = () => {
    const newHour = hours >= 23 ? 0 : hours + 1;
    handleHourChange(newHour);
  };

  const decrementHour = () => {
    const newHour = hours <= 0 ? 23 : hours - 1;
    handleHourChange(newHour);
  };

  const incrementMinute = () => {
    const newMinute = minutes >= 55 ? 0 : minutes + 5;
    handleMinuteChange(newMinute);
  };

  const decrementMinute = () => {
    const newMinute = minutes <= 0 ? 55 : minutes - 5;
    handleMinuteChange(newMinute);
  };

  // Generate hour options (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  
  // Generate minute options (0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55)
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Hours */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={incrementHour}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-t-md transition-colors"
          aria-label="Increment hour"
        >
          <ChevronUp size={16} className="text-slate-600 dark:text-slate-400" />
        </button>
        <select
          value={hours}
          onChange={(e) => handleHourChange(Number(e.target.value))}
          className="w-16 h-10 px-2 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 cursor-pointer text-center font-medium appearance-none"
        >
          {hourOptions.map(h => (
            <option key={h} value={h}>
              {String(h).padStart(2, '0')}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={decrementHour}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-b-md transition-colors"
          aria-label="Decrement hour"
        >
          <ChevronDown size={16} className="text-slate-600 dark:text-slate-400" />
        </button>
      </div>

      <span className="text-xl font-bold text-slate-700 dark:text-slate-300">:</span>

      {/* Minutes */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={incrementMinute}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-t-md transition-colors"
          aria-label="Increment minute"
        >
          <ChevronUp size={16} className="text-slate-600 dark:text-slate-400" />
        </button>
        <select
          value={minutes}
          onChange={(e) => handleMinuteChange(Number(e.target.value))}
          className="w-16 h-10 px-2 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 cursor-pointer text-center font-medium appearance-none"
        >
          {minuteOptions.map(m => (
            <option key={m} value={m}>
              {String(m).padStart(2, '0')}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={decrementMinute}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-b-md transition-colors"
          aria-label="Decrement minute"
        >
          <ChevronDown size={16} className="text-slate-600 dark:text-slate-400" />
        </button>
      </div>
    </div>
  );
};

export default TimePicker;
