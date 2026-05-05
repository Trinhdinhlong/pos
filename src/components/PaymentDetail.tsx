import React from "react";
import { X, Loader2, Banknote, CreditCard, CheckCircle2 } from "lucide-react";

export interface PaymentDetailProps {
  orderId: number;
  onClose: () => void;
}

interface OrderDetailItem {
  productId: number;
  name?: string;
  quantity: number;
  price: number;
}

interface OrderData {
  id: number;
  orderCode: string;
  tableId: number;
  createdAt: string;
  totalAmount: number;
  orderDetails?: OrderDetailItem[];
}

export function PaymentDetail({ orderId, onClose }: PaymentDetailProps) {
  const [order, setOrder] = React.useState<OrderData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [paying, setPaying] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/order?id=${orderId}`)
      .then(r => r.json())
      .then(res => {
        if (res.status === true || res.status === "success" || res.status === 200) {
          setOrder(res.data);
        } else {
          setError(res.message || "Lỗi tải thông tin đơn hàng");
        }
      })
      .catch(() => setError("Lỗi kết nối máy chủ"))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handlePayment = async (method: "Cash" | "Bank") => {
    setPaying(true);
    setError(null);
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, paymentMethod: method }),
      });
      const result = await res.json();
      if (result.status === true || result.status === "success" || result.status === 200) {
        setSuccess(true);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setError(result.message || "Thanh toán thất bại");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-10 flex flex-col items-center gap-4 shadow-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const total = order.orderDetails?.reduce((sum, d) => sum + d.price * d.quantity, 0) || order.totalAmount;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter italic">Thanh toán</h2>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Đơn hàng #{order.orderCode}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 hover:rotate-90 transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          {success ? (
            <div className="flex flex-col items-center py-10 text-center animate-in zoom-in-95">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter italic mb-2">Thanh toán thành công</h3>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Đang chuyển hướng...</p>
            </div>
          ) : (
            <>
              {/* Order Items */}
              <div className="space-y-3 mb-6 max-h-48 overflow-y-auto no-scrollbar">
                {order.orderDetails?.map((d, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-zinc-50/50 dark:bg-zinc-800/20 rounded-xl border border-zinc-100/50 dark:border-zinc-800/50 text-xs font-black uppercase tracking-tight">
                    <span className="text-zinc-600 dark:text-zinc-400 truncate mr-4">{d.name || `Sản phẩm #${d.productId}`} x{d.quantity}</span>
                    <span className="text-zinc-900 dark:text-white italic tabular-nums">{(d.price * d.quantity).toLocaleString()}đ</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-between items-end py-6 border-t border-zinc-100 dark:border-zinc-800 mb-6">
                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Tổng cộng</span>
                <span className="text-3xl font-black text-emerald-600 italic tabular-nums">{total.toLocaleString()}đ</span>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-500 text-[10px] font-black uppercase tracking-widest text-center rounded-2xl mb-6">
                    {error}
                </div>
              )}

              {/* Payment Buttons */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button 
                  onClick={() => handlePayment("Cash")} 
                  disabled={paying}
                  className="flex flex-col items-center justify-center gap-2 py-6 bg-zinc-900 dark:bg-zinc-800 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shadow-xl shadow-zinc-900/10"
                >
                  <Banknote className="w-6 h-6 mb-1" /> Tiền mặt
                </button>
                <button 
                  onClick={() => handlePayment("Bank")} 
                  disabled={paying}
                  className="flex flex-col items-center justify-center gap-2 py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shadow-xl shadow-emerald-600/10"
                >
                  <CreditCard className="w-6 h-6 mb-1" /> Chuyển khoản
                </button>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl hover:bg-zinc-100 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
