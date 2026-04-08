import React from "react";
import { apiClient } from "@/lib/apiClient";

export interface PaymentDetailProps {
  orderId: number;
  onClose: () => void;
}

export function PaymentDetail({ orderId, onClose }: PaymentDetailProps) {
  const [order, setOrder] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [paying, setPaying] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    apiClient(`/orders/${orderId}`)
      .then(r => r.json())
      .then(res => {
        if (res.status === true || res.status === "success" || res.status === 200) setOrder(res.data);
        else setError(res.message || "Lỗi tải đơn hàng");
      })
      .catch(() => setError("Lỗi kết nối máy chủ"))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handlePayment = async (method: "Cash" | "Bank") => {
    setPaying(true);
    setMessage(null);
    setError(null);
    try {
      const res = await apiClient(`/payments/process-manual`, {
        method: "POST",
        body: JSON.stringify({ orderId, paymentMethod: method }),
      });
      const result = await res.json();
      if (result.status === true || result.status === "success" || result.status === 200) {
        setMessage(`Xác nhận thanh toán ${method === "Cash" ? "Tiền mặt" : "Chuyển khoản"} thành công!`);
        setTimeout(() => {
          window.location.reload(); // Reload để cập nhật trạng thái đơn hàng trên bảng
        }, 1000);
      } else {
        setError(result.message || "Lỗi thanh toán");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setPaying(false);
    }
  };

  if (loading) return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[350px] max-w-[90vw]">Đang tải...</div>
    </div>
  );
  if (error) return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[350px] max-w-[90vw] text-red-600">{error}</div>
    </div>
  );
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[350px] max-w-[90vw]">
        <h2 className="text-xl font-bold mb-2">Thanh toán đơn #{order.orderCode}</h2>
        <div className="mb-2 text-gray-600">Bàn: {order.tableId} | Ngày: {new Date(order.createdAt).toLocaleString()}</div>
        <table className="w-full border mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Tên SP</th>
              <th className="border px-2 py-1">SL</th>
              <th className="border px-2 py-1">Đơn giá</th>
              <th className="border px-2 py-1">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.orderDetails?.map((d: any, i: number) => (
              <tr key={i}>
                <td className="border px-2 py-1">{d.name || d.productId}</td>
                <td className="border px-2 py-1">{d.quantity}</td>
                <td className="border px-2 py-1">{d.price?.toLocaleString()} đ</td>
                <td className="border px-2 py-1">{(d.price * d.quantity)?.toLocaleString()} đ</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mb-4 font-bold text-lg">Tổng tiền: {order.orderDetails?.reduce((sum: number, d: any) => sum + d.price * d.quantity, 0)?.toLocaleString()} đ</div>
        {message && <div className="mb-2 text-green-600">{message}</div>}
        <div className="flex gap-4 mb-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded flex-1 font-bold" onClick={() => handlePayment("Bank") } disabled={paying}>Xác nhận CHUYỂN KHOẢN</button>
          <button className="bg-green-600 text-white px-4 py-2 rounded flex-1 font-bold" onClick={() => handlePayment("Cash") } disabled={paying}>Thu TIỀN MẶT</button>
        </div>
        <button className="w-full bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded font-bold text-zinc-600" onClick={onClose}>Hủy</button>
      </div>
    </div>
  );
}
