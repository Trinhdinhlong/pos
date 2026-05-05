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
  const pageSize = 5;

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
      <div className="flex flex-col items-center justify-center p-24 gap-4 bg-card rounded-xl min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <div className="flex flex-col items-center animate-pulse">
            <p className="text-foreground font-medium text-base">Ca Làm Việc</p>
            <p className="text-muted-foreground text-xs mt-1">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">Ca Làm Việc</h1>
          <p className="text-sm text-muted-foreground">Quản lý thời gian làm việc và doanh thu</p>
        </div>

        {!currentShift ? (
          <button 
            onClick={() => setIsOpenModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-success hover:bg-success/90 text-white px-4 py-2 rounded-lg font-medium transition-all cursor-pointer text-sm whitespace-nowrap"
          >
            <PlayCircle className="w-4 h-4" /> Bắt đầu ca
          </button>
        ) : (
          <button 
            onClick={() => setIsCloseModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg font-medium transition-all cursor-pointer text-sm whitespace-nowrap"
          >
            <StopCircle className="w-4 h-4" /> Kết thúc ca
          </button>
        )}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Trạng thái</p>
              <p className="text-base font-semibold text-foreground">
                {currentShift ? 'Đang hoạt động' : 'Đã dừng'}
              </p>
            </div>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentShift ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {currentShift ? `Từ ${new Date(currentShift.startTime).toLocaleTimeString('vi-VN')}` : 'Sẵn sàng bắt đầu'}
          </p>
        </div>

        <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Tiền mặt</p>
              <p className="text-base font-semibold text-foreground tabular-nums">
                {(currentShift?.systemCashTotal || 0).toLocaleString()}đ
              </p>
            </div>
            <div className="w-8 h-8 bg-warning/10 text-warning rounded-lg flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Chuyển khoản</p>
              <p className="text-base font-semibold text-foreground tabular-nums">
                {(currentShift?.systemBankTotal || 0).toLocaleString()}đ
              </p>
            </div>
            <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Shifts History */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-secondary">
          <History className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Lịch sử ca làm</h2>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary">
                <th className="py-3 px-4 text-xs font-semibold text-muted-foreground text-left">Nhân viên</th>
                <th className="py-3 px-4 text-xs font-semibold text-muted-foreground text-left">Thời gian</th>
                <th className="py-3 px-4 text-xs font-semibold text-muted-foreground text-right">Tiền mặt</th>
                <th className="py-3 px-4 text-xs font-semibold text-muted-foreground text-right">Chuyển khoản</th>
                <th className="py-3 px-4 text-xs font-semibold text-muted-foreground text-right">Tổng</th>
                <th className="py-3 px-4 text-xs font-semibold text-muted-foreground text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center opacity-30">
                    <Clock className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-sm font-medium">Chưa ghi nhận ca làm nào</p>
                  </td>
                </tr>
              ) : shifts.map((s) => (
                <tr key={s.id} className="hover:bg-secondary transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{s.user?.fullName || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm font-medium text-foreground">{new Date(s.startTime).toLocaleDateString('vi-VN')}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3" /> {new Date(s.startTime).toLocaleTimeString('vi-VN')}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-sm font-medium text-foreground tabular-nums">{(s.systemCashTotal || 0).toLocaleString()}đ</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-sm font-medium text-primary tabular-nums">{(s.systemBankTotal || 0).toLocaleString()}đ</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      {((s.systemCashTotal || 0) + (s.systemBankTotal || 0)).toLocaleString()}đ
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`px-3 py-1 rounded text-xs font-medium ${
                      s.status === 'Open' 
                        ? 'bg-success/10 text-success' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {s.status === 'Open' ? 'Đang mở' : 'Đã đóng'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border bg-secondary">
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !submitting && setIsOpenModalOpen(false)}>
          <div className="bg-card w-full max-w-sm rounded-lg shadow-xl p-6 border border-border animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4">
                <PlayCircle className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Bắt Đầu Ca Mới</h2>
              <p className="text-sm text-muted-foreground">Hệ thống sẽ bắt đầu theo dõi doanh thu từ bây giờ</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsOpenModalOpen(false)} className="flex-1 py-2.5 text-sm font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted/80" disabled={submitting}>
                Hủy bỏ
              </button>
              <button onClick={handleOpenShift} disabled={submitting} className="flex-1 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !submitting && setIsCloseModalOpen(false)}>
          <div className="bg-card w-full max-w-sm rounded-lg shadow-xl p-6 border border-border animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
                <StopCircle className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Kết Thúc Ca</h2>
              <p className="text-sm text-muted-foreground">Doanh thu sẽ được hoàn tất và lưu lại</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsCloseModalOpen(false)} className="flex-1 py-2.5 text-sm font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted/80" disabled={submitting}>
                Hủy bỏ
              </button>
              <button onClick={handleCloseShift} disabled={submitting} className="flex-1 py-2.5 text-sm font-medium bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kết Thúc Ca"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
