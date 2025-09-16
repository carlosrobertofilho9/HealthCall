import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  icon?: string; // Material Symbols icon name
  id?: string;
  className?: string;
  loading?: boolean; // New prop
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Selecione uma opção',
  disabled = false,
  icon,
  id,
  className,
  loading = false, // Default to false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);
  const displayValue = loading ? 'Carregando...' : (selectedOption ? selectedOption.label : placeholder);

  const handleToggle = () => {
    if (!disabled && !loading) {
      setIsOpen(prev => !prev);
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <button
        type="button"
        id={id}
        className={`form-select appearance-none w-full rounded-full text-white bg-[#264532] border-none h-14 pl-12 pr-10 focus:ring-2 focus:ring-primary transition-all flex items-center justify-between focus:outline-none ${disabled || loading ? 'opacity-60 cursor-not-allowed' : ''}`}
        onClick={handleToggle}
        disabled={disabled || loading}
      >
        {icon && <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#96c5a9]">{icon}</span>}
        <span className={`block truncate ${value || loading ? 'text-white' : 'text-[#96c5a9]'} pl-8`}>{displayValue}</span>
        {loading ? (
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#96c5a9] animate-spin">progress_activity</span>
        ) : (
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#96c5a9] pointer-events-none">expand_more</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-[#264532] shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {options.map(option => (
              <li
                key={option.value}
                className="text-white cursor-pointer select-none relative py-2 pl-12 pr-4 hover:bg-[#3a6b4d]"
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
                {option.value === value && (
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">check</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
