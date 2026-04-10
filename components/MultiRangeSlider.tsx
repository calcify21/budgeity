import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  ChangeEvent,
} from "react";
import "./MultiRangeSlider.css";

interface MultiRangeSliderProps {
  min: number;
  max: number;
  minVal: number;
  maxVal: number;
  onChange: (min: number, max: number) => void;
  formatValue?: (val: number) => string;
}

const MultiRangeSlider: React.FC<MultiRangeSliderProps> = ({
  min,
  max,
  minVal: parentMin,
  maxVal: parentMax,
  onChange,
  formatValue = (v) => v.toString(),
}) => {
  const [minVal, setMinVal] = useState(parentMin);
  const [maxVal, setMaxVal] = useState(parentMax);
  const minValRef = useRef(parentMin);
  const maxValRef = useRef(parentMax);
  const range = useRef<HTMLDivElement>(null);

  // Convert to percentage
  const getPercent = useCallback(
    (value: number) => {
      if (max === min) return 0;
      return Math.round(((value - min) / (max - min)) * 100);
    },
    [min, max],
  );

  // Sync with parent props
  useEffect(() => {
    setMinVal(parentMin);
    minValRef.current = parentMin;
  }, [parentMin]);

  useEffect(() => {
    setMaxVal(parentMax);
    maxValRef.current = parentMax;
  }, [parentMax]);

  // Update Range Size
  useEffect(() => {
    const minPercent = getPercent(minVal);
    const maxPercent = getPercent(maxValRef.current);

    if (range.current) {
      range.current.style.left = `${minPercent}%`;
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [minVal, getPercent]);

  useEffect(() => {
    const minPercent = getPercent(minValRef.current);
    const maxPercent = getPercent(maxVal);

    if (range.current) {
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [maxVal, getPercent]);

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
        <span>{formatValue(minVal)}</span>
        <span>{formatValue(maxVal)}</span>
      </div>

      <div className="multi-range-slider-container">
        <input
          type="range"
          min={min}
          max={max}
          value={minVal}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            const value = Math.min(Number(event.target.value), maxVal - 1);
            setMinVal(value);
            minValRef.current = value;
            onChange(value, maxVal);
          }}
          className="thumb-input z-30"
          style={{ zIndex: minVal > max - 100 ? 50 : 30 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={maxVal}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            const value = Math.max(Number(event.target.value), minVal + 1);
            setMaxVal(value);
            maxValRef.current = value;
            onChange(minVal, value);
          }}
          className="thumb-input z-40"
        />

        <div className="slider__track" />
        <div ref={range} className="slider__range" />
      </div>
    </div>
  );
};

export default MultiRangeSlider;
