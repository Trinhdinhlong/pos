"use client";
import React, { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";
import { 
  Clock, 
  PlayCircle, 
  StopCircle, 
  History, 
  Wallet, 
  BadgeDollarSign, 
  User as UserIcon,
  Calendar,
  TrendingUp,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowUpFromLine,
  Zap,
  Coffee,
  X,
  Layers,
  Filter
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
  status: string; // Open, Closed
  user?: {
      fullName: string;
  };
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12;

  const fetchShifts = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await apiClient(`/shifts?pageNumber=${page}&pageSize=${pageSize}`);
      const data = await res.json();
      if (data.status) {
        setShifts(data.data.items);
        setTotalPages(data.data.totalPages);
        setTotalCount(data.data.totalCount);
        setCurrentPage(data.data.pageNumber);
        
        if (page === 1) {
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
      const res = await apiClient("/shifts/open", {
        method: "POST",
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.status) {
        setIsOpenModalOpen(false);
        fetchShifts(1);
      } else {
        alert(data.message || "Lỗi khi mở ca");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseShift = async () => {
    if (!currentShift) return;
    setSubmitting(true);
    try {
      const res = await apiClient(`/shifts/${currentShift.id}/close`, {
        method: "POST",
        body: "null"
      });
      const data = await res.json();
      if (data.status) {
        setIsCloseModalOpen(false);
        fetchShifts(1);
      } else {
        alert(data.message || "Lỗi khi đóng ca");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && shifts.length === 0) return (
    <div className="flex flex-col items-center justify-center p-24 gap-4 bg-white dark:bg-zinc-950 rounded-3xl min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <div className="flex flex-col items-center animate-pulse">
            <p className="text-zinc-900 dark:text-zinc-100 font-black text-xl italic uppercase">Hệ thống Ca trực</p>
            <p className="text-zinc-400 text-xs font-bold tracking-widest uppercase mt-1">Đang tổng hợp thời gian...</p>
        </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-32 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 px-2">
        <div className="space-y-2">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-lg italic font-black text-xl rotate-3">S</div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Shift Management</span>
            </div>
            <h1 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic leading-none">Lịch sử <br className="sm:hidden" /><span className="text-emerald-600">Ca trực</span></h1>
            <p className="text-sm font-bold text-zinc-400 italic">Theo dõi thời gian và đối soát doanh thu tự động</p>
        </div>

        <div className="flex flex-col gap-4 min-w-[200px]">
            {!currentShift ? (
                <button 
                    onClick={() => setIsOpenModalOpen(true)}
                    className="group relative overflow-hidden px-10 py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                    <span className="relative z-10 flex items-center gap-2"><PlayCircle className="w-5 h-5" /> BẮT ĐẦU CA MỚI</span>
                    <div className="absolute inset-0 bg-zinc-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </button>
            ) : (
                <button 
                    onClick={() => setIsCloseModalOpen(true)}
                    className="group relative overflow-hidden px-10 py-5 bg-rose-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-rose-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                    <span className="relative z-10 flex items-center gap-2"><StopCircle className="w-5 h-5 animate-pulse" /> KẾT THÚC CA</span>
                    <div className="absolute inset-0 bg-zinc-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </button>
            )}
        </div>
      </div>

      {/* STATUS METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2">
            <div className="bg-white dark:bg-zinc-900 p-10 rounded-[3.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-8">Trạng thái trực</p>
                <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-inner ${currentShift ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                        {currentShift ? <Zap className="w-8 h-8 animate-pulse" /> : <AlertCircle className="w-8 h-8" />}
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic leading-none mb-2">{currentShift ? 'Đang hoạt động' : 'Đang đóng'}</h3>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                            {currentShift ? `Mở lúc ${new Date(currentShift.startTime).toLocaleTimeString('vi-VN')}` : 'Sẵn sàng trực ca'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-10 rounded-[3.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-8">Tính toán hệ thống</p>
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.8rem] bg-zinc-50 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic leading-none mb-2">{(currentShift ? (currentShift.systemCashTotal + currentShift.systemBankTotal) : 0).toLocaleString()}đ</h3>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Doanh thu tạm tính</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-10 rounded-[3.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-8">Lịch sử ghi nhận</p>
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.8rem] bg-zinc-50 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center">
                        <History className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic leading-none mb-2">{totalCount} Ca trực</h3>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Dữ liệu lưu trữ</p>
                    </div>
                </div>
            </div>
      </div>

      {/* HISTORY CONTENT */}
      <div className="bg-white dark:bg-zinc-900 rounded-[3.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          
          <div className="p-10 sm:p-12 border-b border-zinc-50 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-50/20">
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-4 uppercase italic tracking-tighter">
                  <History className="w-7 h-7 text-emerald-600" /> NHẬT KÝ ĐỐI SOÁT CA TRỰC
              </h2>
              <div className="flex items-center gap-3 bg-white dark:bg-zinc-800 p-2 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-inner px-6 py-3">
                   <Filter className="w-4 h-4 text-zinc-300" />
                   <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Hiển thị ca gần nhất</span>
              </div>
          </div>

          <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-zinc-50/30 dark:bg-zinc-800/20">
                          <th className="py-8 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Thời điểm & Nhân viên</th>
                          <th className="py-8 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Số dư Tiền Mặt</th>
                          <th className="py-8 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Số dư Chuyển Khoản</th>
                          <th className="py-8 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Tổng thực tế</th>
                          <th className="py-8 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Trạng thái</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                      {shifts.length === 0 ? (
                          <tr>
                             <td colSpan={5} className="py-32 text-center opacity-20">
                                <Layers className="w-20 h-20 mx-auto mb-6 stroke-[1]" />
                                <p className="text-sm font-black uppercase tracking-widest">Không có dữ liệu ca làm</p>
                             </td>
                          </tr>
                      ) : shifts.map((s) => (
                          <tr key={s.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-all">
                              <td className="py-8 px-10">
                                  <div className="flex items-center gap-5">
                                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-sm text-zinc-400 shrink-0 italic shadow-sm">
                                          {s.user?.fullName?.charAt(0).toUpperCase() || <UserIcon className="w-5 h-5" />}
                                      </div>
                                      <div>
                                          <p className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tighter group-hover:text-emerald-600 transition-colors">{s.user?.fullName || 'N/A'}</p>
                                          <div className="flex items-center gap-2 text-[9px] font-black text-zinc-300 uppercase tracking-widest italic opacity-60">
                                              <Calendar className="w-3 h-3" /> {new Date(s.startTime).toLocaleDateString('vi-VN')}
                                              <span className="mx-1">•</span>
                                              <Clock className="w-3 h-3" /> {new Date(s.startTime).toLocaleTimeString('vi-VN')}
                                          </div>
                                      </div>
                                  </div>
                              </td>
                              <td className="py-8 px-10">
                                  <div className="flex flex-col">
                                      <span className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.1em] mb-1">CASH</span>
                                      <span className="text-sm font-black text-zinc-800 dark:text-zinc-200 tabular-nums">{(s.systemCashTotal || 0).toLocaleString()}đ</span>
                                  </div>
                              </td>
                              <td className="py-8 px-10">
                                  <div className="flex flex-col">
                                      <span className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.1em] mb-1">BANK</span>
                                      <span className="text-sm font-black text-emerald-600 tabular-nums">{(s.systemBankTotal || 0).toLocaleString()}đ</span>
                                  </div>
                              </td>
                              <td className="py-8 px-10 text-right">
                                  <span className="text-lg font-black text-zinc-900 dark:text-white italic tracking-tighter tabular-nums">{( (s.systemCashTotal || 0) + (s.systemBankTotal || 0) ).toLocaleString()}đ</span>
                              </td>
                              <td className="py-8 px-10 text-center">
                                  <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                      s.status === 'Open' 
                                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm animate-pulse-slow' 
                                          : 'bg-zinc-100 text-zinc-400 border-zinc-200/50'
                                  }`}>
                                      {s.status === 'Open' ? 'ĐANG TRỰC' : 'ĐÃ ĐÓNG'}
                                  </span>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>

          <div className="mt-auto p-12 bg-zinc-50/20 border-t border-zinc-50 dark:border-zinc-800">
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={(page) => setCurrentPage(page)}
              />
          </div>
      </div>

      {/* MODALS: SHIFT OPEN/CLOSE */}
      {isOpenModalOpen && (
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in" onClick={() => !submitting && setIsOpenModalOpen(false)}>
              <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[3rem] shadow-2xl p-10 border border-white/10 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                  <div className="text-center mb-10">
                      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/10">
                          <PlayCircle className="w-12 h-12" />
                      </div>
                      <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic leading-none mb-4">MỞ CA PHỤC VỤ</h2>
                      <p className="text-zinc-400 text-xs font-bold leading-relaxed px-4 italic uppercase tracking-widest">Hệ thống sẽ ghi nhận phiên trực mới và tính toán doanh thu kể từ bây giờ</p>
                  </div>
                  <div className="flex gap-4">
                      <button onClick={() => setIsOpenModalOpen(false)} className="flex-1 py-5 text-zinc-300 font-black text-[10px] uppercase tracking-widest hover:text-zinc-900 transition-colors">HỦY BỎ</button>
                      <button onClick={handleOpenShift} disabled={submitting} className="flex-[2] py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-black rounded-2xl shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "XÁC NHẬN MỞ CA"}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isCloseModalOpen && (
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in" onClick={() => !submitting && setIsCloseModalOpen(false)}>
              <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[3rem] shadow-2xl p-10 border border-white/10 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                  <div className="text-center mb-10">
                      <div className="w-20 h-20 bg-rose-100 dark:bg-rose-950/30 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-500/10">
                          <StopCircle className="w-12 h-12" />
                      </div>
                      <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic leading-none mb-4">XÁC NHẬN KẾT CA</h2>
                      <p className="text-zinc-400 text-xs font-bold leading-relaxed px-4 italic uppercase tracking-widest">Toàn bộ doanh thu trong ca sẽ được đối soát tự động bởi hệ thống</p>
                  </div>
                  <div className="flex gap-4">
                      <button onClick={() => setIsCloseModalOpen(false)} className="flex-1 py-5 text-zinc-300 font-black text-[10px] uppercase tracking-widest hover:text-zinc-900 transition-colors">QUAY LẠI</button>
                      <button onClick={handleCloseShift} disabled={submitting} className="flex-[2] py-5 bg-rose-600 text-white text-[11px] font-black rounded-2xl shadow-2xl shadow-rose-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "CHỐT & ĐÓNG CA TRỰC"}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
