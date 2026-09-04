type TagFilterValue = 'vn' | 'kr' | 'all';

interface TagFilterProps {
  value: TagFilterValue;
  onChange: (value: TagFilterValue) => void;
}

export default function TagFilter({ value, onChange }: TagFilterProps) {
  const options: { value: TagFilterValue; label: string }[] = [
    { value: 'vn', label: 'VN' },
    { value: 'kr', label: 'KR' },
    { value: 'all', label: 'All' },
  ];

  return (
    <div className="flex items-center bg-pink-100 rounded-full p-0.5 gap-0.5">
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-2.5 py-1 text-xs sm:text-sm font-medium rounded-full transition-all ${
            value === option.value
              ? 'bg-white text-pink-600 shadow-sm'
              : 'text-pink-500 hover:text-pink-700'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
