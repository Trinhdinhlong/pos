import React from "react";
import { apiClient } from "@/lib/apiClient";

export interface Order {
  id: number;
  orderCode: string;
  tableId: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  totalAmount: number;
}

export interface OrderDetail {
  productId: number;
  quantity: number;
  price: number;
}

export interface OrderDetailViewProps {
  order: Order | null;
  onClose: () => void;
}

export function OrderDetailView({ order, onClose }: OrderDetailViewProps) {
  const [details, setDetails] = React.useState<OrderDetail[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!order) return;
    setLoading(true);
    apiClient(`/orders/${order.id}`)
      .then(r => r.json())
      .then(res => {
        if (res.status === true || res.status === "success" || res.status === 200) setDetails(res.data.orderDetails || []);
        else setError(res.message || "Lỗi tải chi tiết đơn hàng");
      })
      .catch(() => setError("Lỗi kết nối máy chủ"))
      .finally(() => setLoading(false));
  }, [order]);

  if (!order) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[350px] max-w-[90vw]">
        <h2 className="text-xl font-bold mb-2 uppercase tracking-tight">Chi tiết đơn hàng #{order.orderCode}</h2>
        <div className="mb-4 p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-[11px] font-bold text-zinc-500 uppercase flex flex-wrap gap-x-6 gap-y-2">
            <span>Bàn: <span className="text-zinc-900">{order.tableId}</span></span>
            <span>Phục vụ: <span className={order.status === 'Paid' ? 'text-blue-600' : 'text-orange-500'}>{order.status === 'Paid' ? 'HOÀN THÀNH' : 'CHỜ XỬ LÝ'}</span></span>
            <span>Thanh toán: <span className={order.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-red-500'}>{order.paymentStatus === 'Paid' ? 'ĐÃ THANH TOÁN' : 'CHỜ THANH TOÁN'}</span></span>
            <span>Ngày: <span className="text-zinc-900">{new Date(order.createdAt).toLocaleString()}</span></span>
        </div>
        {loading ? (
          <div>Đang tải...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <table className="w-full border mt-2 mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Mã SP</th>
                <th className="border px-2 py-1">SL</th>
                <th className="border px-2 py-1">Đơn giá</th>
              </tr>
            </thead>
            <tbody>
              {details.map((d, i) => (
                <tr key={i}>
                  <td className="border px-2 py-1">{d.productId}</td>
                  <td className="border px-2 py-1">{d.quantity}</td>
                  <td className="border px-2 py-1">{d.price.toLocaleString()} đ</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button className="bg-gray-200 px-4 py-2 rounded" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
