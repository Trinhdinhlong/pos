"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_BASE_URL, SIGNALR_URL, SEPAY_CONFIG, IMAGE_BASE_URL } from "@/app/api/apiConfig";
import * as signalR from "@microsoft/signalr";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Search, 
  Package, 
  CreditCard, 
  CheckCircle2, 
  Loader2,
  X,
  Trash2,
  AlertCircle
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  imageUrl?: string;
  description?: string;
}

interface Category {
  id: number;
  name: string;
}

interface Table {
  id: number;
  name: string;
  status: string;
  tableToken: string;
}

interface CartItem {
  productId: number;
  product: Product;
  quantity: number;
}

export default function CustomerOrderPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();

  const [table, setTable] = useState<Table | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [orderCode, setOrderCode] = useState("");
  const [tempId, setTempId] = useState<number>(0);
  const [orderResult, setOrderResult] = useState<{ orderCode?: string } | null>(null);

  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "waiting" | "success">("idle");
  const [notification, setNotification] = useState<{ message: string, type: 'info' | 'error' | 'success' } | null>(null);

  const showNotification = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/table?token=${token}`).then(r => r.json()),
      fetch(`/api/product`).then(r => r.json()),
      fetch(`/api/category`).then(r => r.json())
    ])
      .then(([tableRes, prodRes, catRes]) => {
        if (tableRes.status) setTable(tableRes.data);
        else {
          showNotification("Mã bàn không hợp lệ!", "error");
          router.push("/");
        }
        if (prodRes.status) {
          const pData = prodRes.data;
          setProducts(Array.isArray(pData) ? pData : (pData?.items || []));
        }
        if (catRes.status) {
          const cData = catRes.data;
          setCategories(Array.isArray(cData) ? cData : []);
        }
      })
      .catch(err => console.error("Fetch error:", err))
      .finally(() => setLoading(false));
  }, [token, router]);

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_URL)
      .withAutomaticReconnect()
      .build();
    setConnection(newConnection);
  }, []);

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          connection.on("PaymentReceived", (data) => {
            if (data.status === "Success") {
              setPaymentStatus("success");
              window.location.reload();
            }
          });
        })
        .catch(e => console.log("Connection failed: ", e));
    }
    return () => { if (connection) connection.stop(); };
  }, [connection]);

  const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = selectedCategoryId === null || p.categoryId === selectedCategoryId;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategoryId, searchQuery]);

  const addToCart = (product: Product) => {
    if (table?.status !== "Available") {
      showNotification("Bàn này đang bận. Vui lòng đợi nhân viên.", "error");
      return;
    }
    setCartItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCartItems(prev => prev.map(i => {
      if (i.productId === productId) {
        const nextQty = i.quantity + delta;
        return nextQty > 0 ? { ...i, quantity: nextQty } : i;
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const removeFromCart = (productId: number) => {
    setCartItems(prev => prev.filter(i => i.productId !== productId));
  };

  useEffect(() => {
    if (showCheckout) {
      if (!orderCode) {
        const numericId = Math.floor(Math.random() * 900000000) + 100000000;
        const code = `ORDER${numericId}`;
        setTempId(numericId);
        setOrderCode(code);
        
        if (connection && connection.state === signalR.HubConnectionState.Connected) {
          connection.invoke("JoinOrderChannel", code).catch(err => console.error("Join group error:", err));
        }
      }
    } else {
      if (!orderResult) {
        setOrderCode("");
        setTempId(0);
        setPaymentStatus("idle");
      }
    }
  }, [showCheckout, connection, orderResult, orderCode]);

  const executeOrder = useCallback(async () => {
    if (cartItems.length === 0 || !tempId || submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        tableToken: token,
        order: {
          id: tempId,
          orderCode: orderCode,
          paymentMethod: "Transfer",
          paymentStatus: "Paid",
          totalAmount: total
        },
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.product.price
        }))
      };

      const res = await fetch(`/api/order?action=create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status) {
        setOrderResult(data.data);
        setCartItems([]);
        showNotification("Đã gửi đơn hàng thành công!", "success");
      } else {
        showNotification(data.message || "Không thể tạo đơn hàng", "error");
      }
    } catch {
      showNotification("Lỗi kết nối", "error");
    } finally {
      setSubmitting(false);
    }
  }, [cartItems, tempId, orderCode, total, token, submitting]);

  useEffect(() => {
    if (paymentStatus === "success" && !orderResult && !submitting) {
      executeOrder();
    }
  }, [paymentStatus, orderResult, submitting, executeOrder]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Đang tải menu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              P
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Đặt món Trực tuyến</h1>
              <p className="text-xs text-accent">{table?.name}</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowMobileCart(true)}
            className="lg:hidden relative p-2"
          >
            <ShoppingCart className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xs font-medium">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Table Busy Warning */}
      {table?.status !== "Available" && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="bg-warning/10 border border-warning/20 text-warning rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-medium">Bàn đang bận</p>
              <p className="text-sm opacity-80">Vui lòng đợi nhân viên hoàn tất đơn hàng hiện tại.</p>
            </div>
          </div>
        </div>
      )}

      {/* Search (Mobile) */}
      <div className="lg:hidden max-w-5xl mx-auto px-4 py-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Tìm món ăn..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-muted border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto flex gap-6 px-4 py-4 pb-32 lg:pb-8">
        {/* Categories & Products */}
        <div className="flex-1 min-w-0">
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
            <button 
              onClick={() => setSelectedCategoryId(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategoryId === null 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Tất cả
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategoryId === cat.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredProducts.map(p => (
              <button 
                key={p.id} 
                onClick={() => addToCart(p)}
                disabled={table?.status !== "Available"}
                className="bg-card border border-border rounded-xl p-3 text-left hover:border-accent transition-colors disabled:opacity-50 group"
              >
                <div className="aspect-square rounded-lg bg-muted mb-3 overflow-hidden">
                  {p.imageUrl ? (
                    <img 
                      src={`${IMAGE_BASE_URL}/${p.imageUrl.split(',')[0].trim()}`} 
                      alt={p.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground line-clamp-2 mb-1">{p.name}</p>
                <p className="text-sm font-semibold text-accent">{p.price.toLocaleString()} VNĐ</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cart (Desktop) */}
        <aside className="hidden lg:block w-80 shrink-0">
          <div className="sticky top-24 bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Giỏ hàng</span>
              </div>
              <span className="text-sm text-muted-foreground">{totalItems} món</span>
            </div>

            <div className="max-h-80 overflow-y-auto p-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <ShoppingCart className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">Giỏ hàng trống</p>
                </div>
              ) : (
                cartItems.map(item => (
                  <div key={item.productId} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                    <div className="w-10 h-10 rounded bg-muted overflow-hidden shrink-0">
                      {item.product.imageUrl ? (
                        <img src={`${IMAGE_BASE_URL}/${item.product.imageUrl.split(',')[0].trim()}`} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-4 h-4 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{item.product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <button onClick={() => updateQuantity(item.productId, -1)} className="w-5 h-5 rounded bg-background flex items-center justify-center text-xs">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, 1)} className="w-5 h-5 rounded bg-background flex items-center justify-center text-xs">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-accent">{(item.product.price * item.quantity).toLocaleString()} VNĐ</p>
                      <button onClick={() => removeFromCart(item.productId)} className="text-xs text-destructive hover:underline flex items-center gap-1 justify-end mt-1">
                        <Trash2 className="w-3 h-3" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-border space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tổng cộng</span>
                <span className="text-lg font-semibold text-foreground">{total.toLocaleString()} VNĐ</span>
              </div>
              <button 
                onClick={() => setShowCheckout(true)} 
                disabled={cartItems.length === 0 || table?.status !== "Available"}
                className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Thanh toán
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Cart FAB */}
      {cartItems.length > 0 && (
        <div className="lg:hidden fixed bottom-6 left-4 right-4 z-40">
          <button 
            onClick={() => setShowMobileCart(true)}
            className="w-full bg-primary text-primary-foreground py-4 rounded-xl shadow-lg flex items-center justify-between px-6"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-[10px] font-medium">
                  {totalItems}
                </span>
              </div>
              <span className="font-medium">Xem giỏ hàng</span>
            </div>
            <span className="font-semibold">{total.toLocaleString()} VNĐ</span>
          </button>
        </div>
      )}

      {/* Mobile Cart Modal */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold">Giỏ hàng</h2>
            <button onClick={() => setShowMobileCart(false)} className="p-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cartItems.map(item => (
              <div key={item.productId} className="flex items-center gap-4 p-3 bg-card border border-border rounded-lg">
                <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden shrink-0">
                  {item.product.imageUrl ? (
                    <img src={`${IMAGE_BASE_URL}/${item.product.imageUrl.split(',')[0].trim()}`} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.product.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.productId, -1)} className="w-7 h-7 rounded bg-muted flex items-center justify-center">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, 1)} className="w-7 h-7 rounded bg-muted flex items-center justify-center">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-semibold text-accent">{(item.product.price * item.quantity).toLocaleString()} VNĐ</span>
                      <button 
                        onClick={() => removeFromCart(item.productId)}
                        className="p-1 text-destructive hover:bg-destructive/10 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tổng cộng</span>
              <span className="text-2xl font-semibold">{total.toLocaleString()} VNĐ</span>
            </div>
            <button 
              onClick={() => { setShowMobileCart(false); setShowCheckout(true); }}
              disabled={table?.status !== "Available"}
              className="w-full py-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Tiếp tục thanh toán
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-xl shadow-xl overflow-hidden">
            {!orderResult ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold">Thanh toán</h2>
                  </div>
                  <button onClick={() => setShowCheckout(false)} className="p-2 hover:bg-muted rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Đơn hàng</span>
                    <span className="font-mono text-foreground">{orderCode}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bàn</span>
                    <span className="text-primary font-medium">{table?.name}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center py-6">
                  {paymentStatus === "success" ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-success text-success-foreground rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <p className="font-medium text-success">Thanh toán thành công</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-white rounded-lg mb-4">
                        <img 
                          src={`https://qr.sepay.vn/img?acc=${SEPAY_CONFIG.acc}&bank=${SEPAY_CONFIG.bank}&amount=${total}&des=${orderCode}&template=compact`} 
                          alt="QR Code" 
                          className="w-40 h-40" 
                        />
                      </div>
                      <p className="text-lg font-semibold text-primary mb-2">{total.toLocaleString()} VNĐ</p>
                      <p className="text-xs text-muted-foreground text-center">Quét mã bằng ứng dụng ngân hàng để thanh toán</p>
                      <div className="flex items-center gap-2 mt-4">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <p className="text-xs text-muted-foreground">Đang đợi thanh toán...</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Đã nhận đơn hàng!</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Đơn hàng #{orderResult.orderCode}<br />
                  Chúng tôi đang chuẩn bị món tại {table?.name}
                </p>
                <button 
                  onClick={() => { setShowCheckout(false); setOrderResult(null); setCartItems([]); }} 
                  className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Tiếp tục đặt món
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] ${
            notification.type === 'success' ? 'bg-success text-success-foreground' :
            notification.type === 'error' ? 'bg-destructive text-destructive-foreground' :
            'bg-card border border-border text-foreground'
          }`}>
            {notification.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5" />}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
