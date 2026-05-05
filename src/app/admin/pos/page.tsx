"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { API_BASE_URL, SIGNALR_URL, SEPAY_CONFIG, IMAGE_BASE_URL } from "@/app/api/apiConfig";
import * as signalR from "@microsoft/signalr";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Package,
  CreditCard, 
  Banknote,
  CheckCircle2,
  ChevronDown,
  Loader2,
  X,
  ArrowRight
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  imageUrl?: string;
}

interface Category {
  id: number;
  name: string;
  displayOrder: number;
}

interface Table {
  id: number;
  name: string;
  status: string;
}

interface CartItem {
  productId: number;
  product: Product;
  quantity: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [showCheckout, setShowCheckout] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Transfer">("Cash");
  const [tempOrderId, setTempOrderId] = useState("");
  const [tempId, setTempId] = useState<number>(0);
  const [orderResult, setOrderResult] = useState<Record<string, unknown> | null>(null);

  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "waiting" | "success">("idle");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pRes, cRes, tRes] = await Promise.all([
          fetch(`/api/product?action=all`).then(r => r.json()),
          fetch(`/api/category`).then(r => r.json()),
          fetch(`/api/table`).then(r => r.json())
        ]);

        if (pRes.status) {
          const productData = pRes.data;
          setProducts(Array.isArray(productData) ? productData : (productData?.items || []));
        }
        if (cRes.status) {
          const categoryData = cRes.data;
          const sortedCats = Array.isArray(categoryData) 
            ? [...categoryData].sort((a: Category, b: Category) => a.displayOrder - b.displayOrder)
            : [];
          setCategories(sortedCats);
        }
        if (tRes.status) {
          const allTables = tRes.data as Table[];
          const sortedTables = [...allTables].sort((a, b) => 
            a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
          );
          setTables(sortedTables);
          const takeAway = sortedTables.find(t => t.name?.includes("Mang ve") || t.name?.includes("Mang về"));
          if (takeAway) setSelectedTableId(takeAway.id);
        }
      } catch (err) {
        console.error("POS Data fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_URL)
      .withAutomaticReconnect()
      .build();
    setConnection(newConnection);
    return () => { if(newConnection) newConnection.stop(); };
  }, []);

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          connection.on("PaymentReceived", (data: any) => {
            if (data.status === "Success") setPaymentStatus("success");
          });
        })
        .catch(e => console.log("SignalR Connection failed: ", e));
    }
  }, [connection]);

  const total = useMemo(() => cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0), [cartItems]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = selectedCategoryId === null || p.categoryId === selectedCategoryId;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategoryId, searchQuery]);

  useEffect(() => {
    if (showCheckout) {
      // Đảm bảo selectedTableId luôn khớp với một bàn đang trống (Available) có trong dropdown
      const availableTables = tables.filter(t => t.status === "Available");
      if (availableTables.length > 0 && !availableTables.some(t => t.id === selectedTableId)) {
        const takeAway = availableTables.find(t => t.name?.includes("Mang ve") || t.name?.includes("Mang về"));
        setSelectedTableId(takeAway ? takeAway.id : availableTables[0].id);
      }

      if (!tempOrderId) {
        const numericId = Math.floor(Math.random() * 900000000) + 100000000;
        const orderCode = `ORDER${numericId}`;
        setTempId(numericId);
        setTempOrderId(orderCode);
      }
      if (paymentMethod === "Transfer" && connection?.state === signalR.HubConnectionState.Connected) {
        connection.invoke("JoinOrderChannel", tempOrderId || "").catch(err => console.error(err));
      } else {
        setPaymentStatus("idle");
      }
    } else {
      setTempOrderId(""); 
      setTempId(0); 
      setPaymentStatus("idle");
    }
  }, [showCheckout, paymentMethod, connection, tempOrderId, tables, selectedTableId]);

  const addToCart = (product: Product) => {
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

  const executeCheckout = useCallback(async (isPaid: boolean) => {
    if (cartItems.length === 0 || !tempId) return;
    setSubmitting(true);
    try {
      const selectedTable = tables.find(t => t.id === selectedTableId);
      const payload = {
        order: {
          id: tempId, 
          orderCode: tempOrderId, 
          tableId: Number(selectedTableId),
          paymentMethod, 
          orderType: selectedTable?.name?.includes("Mang") ? "TakeAway" : "Counter",
          totalAmount: total, 
          paymentStatus: isPaid ? "Paid" : "Pending"
        },
        items: cartItems.map(item => ({ productId: item.productId, quantity: item.quantity, unitPrice: item.product.price }))
      };
      const res = await fetch(`/api/order?action=counter`, { 
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload) 
      });
      const data = await res.json();
      if (data.status) {
        setOrderResult(data.data);
        setCartItems([]);
        setTimeout(() => window.location.reload(), 2000);
      } else alert(data.message || "Đặt hàng thất bại");
    } catch { 
      alert("Lỗi kết nối máy chủ"); 
    } finally { 
      setSubmitting(false); 
    }
  }, [cartItems, selectedTableId, tempId, tempOrderId, paymentMethod, total, tables]);

  useEffect(() => {
    if (paymentStatus === "success" && !orderResult && !submitting) executeCheckout(true);
  }, [paymentStatus, orderResult, submitting, executeCheckout]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground font-medium">Đang tải thực đơn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-4 overflow-hidden">
      
      {/* Left: Products */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search & Categories */}
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Tìm kiếm sản phẩm..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-muted border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setSelectedCategoryId(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategoryId === null 
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Tất cả
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategoryId === cat.id 
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map(p => (
              <button 
                key={p.id} 
                onClick={() => addToCart(p)}
                className="bg-card border border-border rounded-xl p-3 hover:border-accent transition-all hover:scale-[1.02] text-left group cursor-pointer shadow-sm active:scale-95"
              >
                <div className="aspect-square rounded-lg bg-muted mb-3 overflow-hidden shadow-inner">
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
                <p className="text-sm font-semibold text-accent">{p.price.toLocaleString()}đ</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cart (Desktop) */}
      <div className="hidden lg:flex w-80 flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/20">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Giỏ hàng</span>
          </div>
          <span className="text-xs font-medium text-muted-foreground">{cartItems.length} món</span>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-300 dark:text-zinc-700">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-xs font-medium text-muted-foreground">Giỏ hàng trống</p>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.productId} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0 shadow-sm border border-border/50">
                  {item.product.imageUrl ? (
                    <img src={`${IMAGE_BASE_URL}/${item.product.imageUrl.split(',')[0].trim()}`} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate mb-0.5">{item.product.name}</p>
                  <p className="text-sm font-semibold text-accent">{(item.product.price * item.quantity).toLocaleString()}đ</p>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => updateQuantity(item.productId, -1)} 
                    className="w-7 h-7 rounded-md bg-white dark:bg-zinc-900 border border-border flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.productId, 1)} 
                    className="w-7 h-7 rounded-md bg-white dark:bg-zinc-900 border border-border flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => removeFromCart(item.productId)} 
                    className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-rose-500 transition-colors ml-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-border space-y-4 bg-zinc-50/50 dark:bg-zinc-800/10">
          <div className="flex justify-between items-end">
            <span className="text-sm font-medium text-muted-foreground">Tổng cộng</span>
            <span className="text-xl font-bold text-accent tabular-nums">{total.toLocaleString()}đ</span>
          </div>
          <button 
            onClick={() => setShowCheckout(true)} 
            disabled={cartItems.length === 0} 
            className="w-full py-3.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            Thanh toán <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Cart Button */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button 
          onClick={() => setShowMobileCart(true)}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 active:scale-95 transition-all cursor-pointer border border-white/10"
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            {cartItems.length > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md">
                {cartItems.length}
              </span>
            )}
          </div>
          <span className="text-sm font-bold">{total.toLocaleString()}đ</span>
        </button>
      </div>

      {/* Mobile Cart Modal */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-zinc-950 flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold">Giỏ hàng</h2>
            <button onClick={() => setShowMobileCart(false)} className="w-10 h-10 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.map(item => (
              <div key={item.productId} className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl shadow-sm">
                <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0 shadow-inner">
                  {item.product.imageUrl ? (
                    <img src={`${IMAGE_BASE_URL}/${item.product.imageUrl.split(',')[0].trim()}`} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateQuantity(item.productId, -1)} className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center cursor-pointer">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium tabular-nums">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, 1)} className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center cursor-pointer">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-base font-semibold text-accent">{(item.product.price * item.quantity).toLocaleString()}đ</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-border space-y-4 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex justify-between items-end">
              <span className="text-sm font-medium text-muted-foreground">Tổng cộng</span>
              <span className="text-2xl font-bold text-accent tabular-nums">{total.toLocaleString()}đ</span>
            </div>
            <button 
              onClick={() => { setShowMobileCart(false); setShowCheckout(true); }} 
              className="w-full py-4 bg-primary text-primary-foreground text-sm font-semibold rounded-2xl shadow-lg active:scale-95 cursor-pointer"
            >
              Tiến hành thanh toán
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => !submitting && (setShowCheckout(false), setOrderResult(null))}>
          <div className="bg-card w-full max-w-sm border border-border" style={{ borderRadius: 0 }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-zinc-50 dark:bg-zinc-900/80">
              <div className="font-bold text-base text-foreground">Xác nhận thanh toán</div>
              <button onClick={() => { setShowCheckout(false); setOrderResult(null); }} className="text-foreground text-xl leading-none px-2 py-1">×</button>
            </div>
            <div className="px-6 py-4 bg-card">
              {!orderResult ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-foreground">
                    <span>Mã đơn hàng:</span>
                    <span className="font-semibold">#{tempOrderId}</span>
                  </div>
                  {/* Chọn bàn */}
                  <div className="flex justify-between items-center text-xs text-foreground">
                    <span>Bàn:</span>
                    <select
                      value={selectedTableId}
                      onChange={e => setSelectedTableId(Number(e.target.value))}
                      className="font-semibold bg-muted border border-border px-2 py-1 text-xs rounded focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                      style={{ minWidth: 100 }}
                    >
                      {tables.filter(t => t.status === "Available").map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-between text-xs text-foreground">
                    <span>Ngày bán:</span>
                    <span className="font-semibold">{new Date().toLocaleDateString('vi-VN')}</span>
                  </div>
                  {/* Tabs chọn phương thức thanh toán */}
                  <div className="flex gap-2 my-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("Cash")}
                      className={`flex-1 py-2 text-xs font-bold border border-border rounded-none cursor-pointer ${paymentMethod === "Cash" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
                    >
                      <Banknote className="inline w-4 h-4 mr-1" /> Tiền mặt
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("Transfer")}
                      className={`flex-1 py-2 text-xs font-bold border border-border rounded-none cursor-pointer ${paymentMethod === "Transfer" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
                    >
                      <CreditCard className="inline w-4 h-4 mr-1" /> Chuyển khoản/QR
                    </button>
                  </div>
                  {/* Nếu chọn QR/Chuyển khoản, hiển thị hướng dẫn hoặc mã QR */}
                  {paymentMethod === "Transfer" && (
                    <div className="mb-2 flex flex-col items-center gap-2">
                      <div className="text-xs text-accent font-semibold">Vui lòng quét mã QR SEPAY để thanh toán:</div>
                      <div className="p-2 bg-white border border-border" style={{ borderRadius: 8 }}>
                        <img
                          src={`https://qr.sepay.vn/img?acc=${SEPAY_CONFIG?.acc || ''}&bank=${SEPAY_CONFIG?.bank || ''}&amount=${total}&des=${tempOrderId}&template=compact`}
                          alt="QR Code SEPAY"
                          className="w-40 h-40 object-contain"
                        />
                      </div>
                      <div className="text-[11px] text-muted-foreground text-center">Quét mã bằng app ngân hàng hoặc ví điện tử để chuyển khoản tự động.</div>
                    </div>
                  )}
                  <div className="border-t border-border my-2" />
                  <div className="text-xs text-foreground mb-1">Món đã gọi:</div>
                  <div className="space-y-1">
                    {cartItems.map(item => (
                      <div key={item.productId} className="flex justify-between text-xs text-foreground">
                        <span>{item.product.name} x{item.quantity}</span>
                        <span>{(item.product.price * item.quantity).toLocaleString()}đ</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border my-2" />
                  <div className="flex justify-between items-center text-xs text-foreground font-bold">
                    <span>Tổng thanh toán</span>
                    <span style={{ fontSize: 18 }} className="text-foreground">{total.toLocaleString()}đ</span>
                  </div>
                  <div className="flex gap-2 pt-3">
                    <button
                      onClick={() => setShowCheckout(false)}
                      className="flex-1 py-2 text-xs text-foreground border border-border bg-card cursor-pointer"
                      style={{ borderRadius: 0 }}
                    >
                      Hủy bỏ
                    </button>
                    <button
                      onClick={() => executeCheckout(true)}
                      disabled={submitting}
                      className="flex-1 py-2 text-xs text-primary-foreground bg-primary cursor-pointer"
                      style={{ borderRadius: 0 }}
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xác nhận đơn hàng"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-12 text-center">
                  <div className="w-16 h-16 bg-accent/20 text-accent flex items-center justify-center mb-6" style={{ borderRadius: 0 }}>
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-base font-bold mb-2 text-foreground">Đơn hàng hoàn tất</h3>
                  <p className="text-xs text-foreground mb-6">Mã đơn #{tempOrderId} đã được lưu vào hệ thống</p>
                  <button
                    onClick={() => { setCartItems([]); setShowCheckout(false); setOrderResult(null); window.location.reload(); }}
                    className="w-full py-3 bg-primary text-primary-foreground text-xs font-bold cursor-pointer"
                    style={{ borderRadius: 0 }}
                  >
                    Đơn hàng mới
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
