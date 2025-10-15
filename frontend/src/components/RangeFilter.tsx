import { useState } from "react";
interface RangeFilterProps {
    label: string;
    group: string;
    min: number;
    max: number;
    step: number;
    filters: Record<string, any>; 
    updateFilter: (group: string, value: any) => void; 
}

export default function RangeFilter({label, group, min, max, step, filters, updateFilter,
}: RangeFilterProps) {
    const [range, setRange] = useState([min, max]);

    const handleChange = (index: number, value: number) => {
        const newRange = [...range];
        newRange[index] = value;
        setRange(newRange);
        updateFilter(group, newRange); // integrate with your filters state
    };

    return (
        // <div className="flex flex-col min-w-[228px]">
        //     <label className="font-semibold mb-2">{label}</label>
        //     <div className="flex items-center gap-2">
        //         <input
        //             type="range"
        //             min={min}
        //             max={max}
        //             step={step}
        //             value={range[0]}
        //             onChange={(e) => handleChange(0, Number(e.target.value))}
        //             className="flex-grow"
        //         />
        //         <input
        //             type="range"
        //             min={min}
        //             max={max}
        //             step={step}
        //             value={range[1]}
        //             onChange={(e) => handleChange(1, Number(e.target.value))}
        //             className="flex-grow"
        //         />
        //     </div>
        //     <div className="flex justify-between text-sm mt-1">
        //         <span>{range[0]}</span>
        //         <span>{range[1]}</span>
        //     </div>
        // </div>
        <div className="flex flex-col min-w-[228px]">
  <label className="font-semibold mb-2">{label}</label>

  {/* Dual slider for quick selection */}
  <div className="flex items-center gap-2">
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={range[0]}
      onChange={(e) => handleChange(0, Number(e.target.value))}
      className="flex-grow accent-tangerine cursor-pointer"
    />
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={range[1]}
      onChange={(e) => handleChange(1, Number(e.target.value))}
      className="flex-grow accent-tangerine cursor-pointer"
    />
  </div>

  {/* Manual inputs for precision */}
  <div className="flex justify-between text-sm mt-2 gap-2">
    <div className="flex items-center gap-1">
      <span className="text-gray-600">≥</span>
      <input
        type="number"
        min={min}
        max={range[1]}
        step={step}
        value={range[0]}
        onChange={(e) => handleChange(0, Number(e.target.value))}
        className="w-20 rounded border px-2 py-1 text-sm"
      />
    </div>
    <div className="flex items-center gap-1">
      <span className="text-gray-600">≤</span>
      <input
        type="number"
        min={range[0]}
        max={max}
        step={step}
        value={range[1]}
        onChange={(e) => handleChange(1, Number(e.target.value))}
        className="w-20 rounded border px-2 py-1 text-sm"
      />
    </div>
  </div>
</div>

    );
}