"use client";
import React, { useEffect, useState, useCallback } from "react";
import { API_BASE_URL } from "@/app/api/apiConfig";
import { 
  Clock, 
  PlayCircle, 
  StopCircle, 
  History, 
  Banknote, 
  CreditCard,
  User,
  Calendar,
  Loader2,
  X,
  Zap
} from "lucide-react";
import { Pagination } from "@/components/Pagination";

interface Shift {
  id: number;
  userId: number;
  startTime: string;
  endTime?: string;
  systemCashTotal: number;
  systemBankTotal: number;
  userConfirmedTotal?: number;
  status: string;
  user?: { fullName: string };
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const fetchShifts = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shift?action=history&pageNumber=${page}&pageSize=${pageSize}`);
      const data = await res.json();
      if (data.status) {
        setShifts(data.data?.items || []);
        setTotalPages(data.data?.totalPages || 1);
        setTotalCount(data.data?.totalCount || 0);
        setCurrentPage(data.data?.pageNumber || 1);
        
        if (page === 1 && data.data?.items) {
          const active = data.data.items.find((s: Shift) => s.status === "Open");
          setCurrentShift(active || null);
        }
      }
    } catch (err) {
      console.error("Fetch shifts error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShifts(currentPage);
  }, [fetchShifts, currentPage]);

  const handleOpenShift = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/shift?action=open`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.status) {
        setIsOpenModalOpen(false);
        fetchShifts(1);
      } else {
        alert(data.message || "Failed to open shift");
      }
    } catch {
      alert("Connection error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseShift = async () => {
    if (!currentShift) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/shift?id=${currentShift.id}&action=close`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "null"
      });
      const data = await res.json();
      if (data.status) {
        setIsCloseModalOpen(false);
        fetchShifts(1);
      } else {
        alert(data.message || "Failed to close shift");
      }
    } catch {
      alert("Connection error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && shifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-24 gap-4 bg-white dark:bg-zinc-950 rounded-3xl min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <div className="flex flex-col items-center animate-pulse">
            <p className="text-zinc-900 dark:text-zinc-100 font-black text-xl italic uppercase">Hệ thống ca làm</p>
            <p className="text-zinc-400 text-xs font-bold tracking-widest uppercase mt-1">Đang đồng bộ dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-10">
        <div>
           <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-3xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-2xl shadow-indigo-600/30 italic rotate-6">🕒</div>
                <div>
                     <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic leading-none mb-2">Quản lý <span className="text-indigo-600">Ca làm</span></h1>
                     <p className="text-sm text-zinc-500 dark:text-zinc-400 font-bold tracking-tight">Theo dõi thời gian làm việc và đối soát doanh thu</p>
                </div>
           </div>
        </div>

        {!currentShift ? (
          <button 
            onClick={() => setIsOpenModalOpen(true)}
            className="flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-emerald-600/20 active:scale-95 text-xs uppercase tracking-widest cursor-pointer whitespace-nowrap"
          >
            <PlayCircle className="w-5 h-5" /> BẮT ĐẦU CA MỚI
          </button>
        ) : (
          <button 
            onClick={() => setIsCloseModalOpen(true)}
            className="flex items-center justify-center gap-3 bg-rose-600 hover:bg-rose-700 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-rose-600/20 active:scale-95 text-xs uppercase tracking-widest cursor-pointer whitespace-nowrap"
          >
            <StopCircle className="w-5 h-5" /> KẾT THÚC CA LÀM
          </button>
        )}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm transition-all group cursor-pointer hover:scale-[1.02]">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${currentShift ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-400'}`}>
              <Zap className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Trạng thái</span>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic leading-none">
            {currentShift ? 'Đang hoạt động' : 'Đã dừng'}
          </p>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-3">
            {currentShift ? `Bắt đầu lúc ${new Date(currentShift.startTime).toLocaleTimeString('vi-VN')}` : 'Sẵn sàng bắt đầu ca'}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm transition-all group cursor-pointer hover:scale-[1.02]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/30 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Banknote className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Tiền mặt</span>
          </div>
          <p className="text-3xl font-black text-zinc-900 dark:text-white italic tracking-tighter tabular-nums leading-none">
            {(currentShift?.systemCashTotal || 0).toLocaleString()}đ
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm transition-all group cursor-pointer hover:scale-[1.02]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Chuyển khoản</span>
          </div>
          <p className="text-3xl font-black text-zinc-900 dark:text-white italic tracking-tighter tabular-nums leading-none">
            {(currentShift?.systemBankTotal || 0).toLocaleString()}đ
          </p>
        </div>
      </div>

      {/* Shifts History */}
      <div className="bg-white dark:bg-zinc-900 rounded-[3.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="px-10 py-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3 bg-zinc-50/50 dark:bg-zinc-800/20">
          <History className="w-6 h-6 text-indigo-600 shadow-sm" />
          <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic leading-none">Lịch sử ca làm việc</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-800/30">
                <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-left">Nhân viên</th>
                <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-left">Thời gian</th>
                <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Tiền mặt</th>
                <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Chuyển khoản</th>
                <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Tổng cộng</th>
                <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-40 text-center opacity-20">
                    <Clock className="w-20 h-20 mx-auto mb-6 stroke-[1.5]" />
                    <p className="text-sm font-black uppercase tracking-widest">Chưa ghi nhận ca làm nào</p>
                  </td>
                </tr>
              ) : shifts.map((s) => (
                <tr key={s.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer">
                  <td className="py-6 px-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <User className="w-6 h-6 text-zinc-400" />
                      </div>
                      <span className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tighter">{s.user?.fullName || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="py-6 px-10">
                    <div className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tighter">{new Date(s.startTime).toLocaleDateString('vi-VN')}</div>
                    <div className="text-[10px] font-black text-zinc-400 flex items-center gap-1.5 uppercase tracking-widest mt-1">
                      <Clock className="w-3 h-3" /> {new Date(s.startTime).toLocaleTimeString('vi-VN')}
                    </div>
                  </td>
                  <td className="py-6 px-10 text-right">
                    <span className="text-md font-black text-zinc-900 dark:text-white italic tracking-tighter tabular-nums">{(s.systemCashTotal || 0).toLocaleString()}đ</span>
                  </td>
                  <td className="py-6 px-10 text-right">
                    <span className="text-md font-black text-indigo-600 italic tracking-tighter tabular-nums">{(s.systemBankTotal || 0).toLocaleString()}đ</span>
                  </td>
                  <td className="py-6 px-10 text-right">
                    <span className="text-lg font-black text-zinc-900 dark:text-white italic tracking-tighter tabular-nums">
                      {((s.systemCashTotal || 0) + (s.systemBankTotal || 0)).toLocaleString()}đ
                    </span>
                  </td>
                  <td className="py-6 px-10 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic ${
                      s.status === 'Open' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-100' 
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                    }`}>
                      {s.status === 'Open' ? 'Đang mở' : 'Đã đóng'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border">
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Open Shift Modal */}
      {isOpenModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !submitting && setIsOpenModalOpen(false)}>
          <div className="bg-card w-full max-w-sm rounded-xl shadow-xl p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4">
                <PlayCircle className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Start New Shift</h2>
              <p className="text-sm text-muted-foreground">The system will start tracking revenue from now</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsOpenModalOpen(false)} className="flex-1 py-2.5 text-sm font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted/80">
                Cancel
              </button>
              <button onClick={handleOpenShift} disabled={submitting} className="flex-1 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !submitting && setIsCloseModalOpen(false)}>
          <div className="bg-card w-full max-w-sm rounded-xl shadow-xl p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
                <StopCircle className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-semibold mb-2">End Shift</h2>
              <p className="text-sm text-muted-foreground">Revenue will be finalized and saved</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsCloseModalOpen(false)} className="flex-1 py-2.5 text-sm font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted/80">
                Cancel
              </button>
              <button onClick={handleCloseShift} disabled={submitting} className="flex-1 py-2.5 text-sm font-medium bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "End Shift"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
