import React from "react";
import { Loader2 } from "lucide-react";

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Tên ca làm việc <span className="text-destructive">*</span></label>
        <input
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ví dụ: Ca Sáng"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Giờ bắt đầu <span className="text-destructive">*</span></label>
          <input
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
            type="time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Giờ kết thúc <span className="text-destructive">*</span></label>
          <input
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
            type="time"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="flex items-center gap-2 pt-4 border-t border-border">
        <button 
          type="button" 
          className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-2.5 rounded-lg font-medium transition-colors cursor-pointer text-sm" 
          onClick={onCancel} 
          disabled={loading}
        >
          Hủy bỏ
        </button>
        <button 
          type="submit" 
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2.5 rounded-lg font-medium transition-all active:scale-95 cursor-pointer text-sm flex items-center justify-center gap-2" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            shift ? "Lưu thay đổi" : "Tạo ca làm việc"
          )}
        </button>
      </div>
    </form>
  );
}
