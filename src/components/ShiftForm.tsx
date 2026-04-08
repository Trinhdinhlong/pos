import React from "react";

export interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
}

export interface ShiftFormProps {
  shift?: Shift;
  onSubmit: (data: Omit<Shift, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ShiftForm({ shift, onSubmit, onCancel, loading }: ShiftFormProps) {
  const [name, setName] = React.useState(shift?.name || "");
  const [startTime, setStartTime] = React.useState(shift?.startTime || "07:00");
  const [endTime, setEndTime] = React.useState(shift?.endTime || "11:00");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startTime || !endTime) return;
    onSubmit({ name, startTime, endTime });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Tên ca làm việc <span className="text-red-500">*</span></label>
        <input
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-zinc-900 dark:text-white"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nhập tên ca (VD: Ca Sáng)..."
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Giờ bắt đầu <span className="text-red-500">*</span></label>
          <input
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-zinc-900 dark:text-white"
            type="time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Giờ kết thúc <span className="text-red-500">*</span></label>
          <input
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-zinc-900 dark:text-white"
            type="time"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <button 
          type="button" 
          className="flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer" 
          onClick={onCancel} 
          disabled={loading}
        >
          Hủy bỏ
        </button>
        <button 
          type="submit" 
          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded-xl font-medium shadow-sm shadow-amber-600/20 transition-all active:scale-[0.98] cursor-pointer" 
          disabled={loading}
        >
          {loading ? "Đang xử lý..." : shift ? "Lưu thay đổi" : "Tạo ca làm việc"}
        </button>
      </div>
    </form>
  );
}
