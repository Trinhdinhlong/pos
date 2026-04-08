"use client";
import React, { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";
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
      const res = await apiClient(`/shifts/${currentShift.id}/close`, {
        method: "POST",
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading shifts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Shifts</h1>
          <p className="text-sm text-muted-foreground mt-1">Track working hours and revenue</p>
        </div>

        {!currentShift ? (
          <button 
            onClick={() => setIsOpenModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-success text-success-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <PlayCircle className="w-5 h-5" /> Start Shift
          </button>
        ) : (
          <button 
            onClick={() => setIsCloseModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-destructive text-destructive-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <StopCircle className="w-5 h-5" /> End Shift
          </button>
        )}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${currentShift ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-sm text-muted-foreground">Status</span>
          </div>
          <p className="text-xl font-semibold text-foreground">
            {currentShift ? 'Active' : 'Closed'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {currentShift ? `Started ${new Date(currentShift.startTime).toLocaleTimeString('vi-VN')}` : 'Ready to start'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-muted rounded-lg">
              <Banknote className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">Cash</span>
          </div>
          <p className="text-xl font-semibold text-foreground tabular-nums">
            {(currentShift?.systemCashTotal || 0).toLocaleString()}d
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-muted rounded-lg">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">Bank Transfer</span>
          </div>
          <p className="text-xl font-semibold text-foreground tabular-nums">
            {(currentShift?.systemBankTotal || 0).toLocaleString()}d
          </p>
        </div>
      </div>

      {/* Shifts History */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <History className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-medium">Shift History</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Employee</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Time</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Cash</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Bank</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Total</th>
                <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No shifts recorded</p>
                  </td>
                </tr>
              ) : shifts.map((s) => (
                <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{s.user?.fullName || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-foreground">{new Date(s.startTime).toLocaleDateString('vi-VN')}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(s.startTime).toLocaleTimeString('vi-VN')}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-medium text-foreground tabular-nums">{(s.systemCashTotal || 0).toLocaleString()}d</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-medium text-accent tabular-nums">{(s.systemBankTotal || 0).toLocaleString()}d</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      {((s.systemCashTotal || 0) + (s.systemBankTotal || 0)).toLocaleString()}d
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      s.status === 'Open' 
                        ? 'bg-success/10 text-success' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {s.status === 'Open' ? 'Active' : 'Closed'}
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
