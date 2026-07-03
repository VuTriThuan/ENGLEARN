import React, { useState } from "react";
import { Search } from "lucide-react";

export default function FilterBox({
  title,
  options,
  selectedIds,
  onChange,
  placeholder,
  singleSelect = false,
}) {
  const [search, setSearch] = useState("");
  const filtered = options.filter((o) =>
    (o.name || o.title || "").toLowerCase().includes(search.toLowerCase()),
  );
  const isAllSelected =
    filtered.length > 0 && filtered.every((o) => selectedIds.includes(o.id));

  const toggleAll = () => {
    if (isAllSelected) {
      onChange(selectedIds.filter((id) => !filtered.find((o) => o.id === id)));
    } else {
      const newIds = [
        ...new Set([...selectedIds, ...filtered.map((o) => o.id)]),
      ];
      onChange(newIds);
    }
  };

  const toggleOne = (id) => {
    if (singleSelect) {
      
      onChange(selectedIds.includes(id) ? [] : [id]);
    } else {
      onChange(
        selectedIds.includes(id)
          ? selectedIds.filter((i) => i !== id)
          : [...selectedIds, id],
      );
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-64">
      <div className="p-3 bg-gray-50 border-b border-gray-100 font-bold text-cyan-900 shrink-0">
        {title}
      </div>
      <div className="p-2 shrink-0 border-b border-gray-100 relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {!singleSelect && (
          <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleAll}
              className="w-4 h-4 text-cyan-600 rounded"
            />
            <span className="text-sm font-bold text-gray-700">Chọn tất cả</span>
          </label>
        )}
        {filtered.map((opt, index) => {
          const itemKey = opt.id ?? opt.name ?? opt.title ?? index;
          const isSelected = selectedIds.includes(opt.id);
          return (
            <label
              key={itemKey}
              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <input
                type={singleSelect ? "radio" : "checkbox"}
                checked={isSelected}
                onChange={() => toggleOne(opt.id)}
                className=" w-4 h-4 text-cyan-600 rounded"
              />
              <span className="text-sm text-gray-600">
                {opt.name || opt.title}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}