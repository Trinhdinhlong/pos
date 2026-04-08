"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { SIGNALR_URL, SEPAY_CONFIG } from "@/app/api/apiConfig";
import * as signalR from "@microsoft/signalr";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Search, 
  Coffee, 
  Zap, 
  CreditCard, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  X,
  ChevronRight,
  Store,
  LayoutGrid,
  History,
  Info,
  Trash2
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
  const [orderCode, setOrderCode] = useState("");
  const [tempId, setTempId] = useState<number>(0);
  const [orderResult, setOrderResult] = useState<any>(null);

  // SignalR State
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "waiting" | "success">("idle");

  // 1. Initial Data Fetch
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      apiClient(`/tables/token/${token}`).then(r => r.json()),
      apiClient("/products/all").then(r => r.json()),
      apiClient("/categories").then(r => r.json())
    ])
      .then(([tableRes, prodRes, catRes]) => {
        if (tableRes.status) setTable(tableRes.data);
        else {
            alert("Mã bàn không hợp lệ!");
            router.push("/");
        }
        if (prodRes.status) setProducts(prodRes.data);
        if (catRes.status) setCategories(catRes.data);
      })
      .catch(err => console.error("Fetch error:", err))
      .finally(() => setLoading(false));
  }, [token, router]);

  // 2. SignalR Connection
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
          console.log("SignalR Connected");
          connection.on("PaymentReceived", (data) => {
            if (data.status === "Success") {
                setPaymentStatus("success");
            }
          });
        })
        .catch(e => console.log("Connection failed: ", e));
    }
    return () => { if (connection) connection.stop(); };
  }, [connection]);

  // 3. Cart Logic
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
        alert("Bàn này đang bận. Vui lòng đợi nhân viên phục vụ!");
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

  // 4. Handle Order ID and SignalR Group
  useEffect(() => {
    if (showCheckout) {
        if (!orderCode) {
            const numericId = Math.floor(Math.random() * 900000000) + 100000000;
            const code = `ORDER${numericId}`;
            setTempId(numericId);
            setOrderCode(code);
            
            if (connection && connection.state === signalR.HubConnectionState.Connected) {
                connection.invoke("JoinOrderChannel", code)
                    .catch(err => console.error("Join group error:", err));
            }
        }
    } else {
        // Only clear if search result is not there
        if (!orderResult) {
            setOrderCode("");
            setTempId(0);
            setPaymentStatus("idle");
        }
    }
  }, [showCheckout, connection, orderResult]);

  // 5. Checkout Execution
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

      const res = await apiClient("/orders/create", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status) {
        setOrderResult(data.data);
        setCartItems([]);
      } else {
        alert(data.message || "Lỗi khi tạo đơn hàng");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  }, [cartItems, tempId, orderCode, total, token, submitting]);

  // Auto-execute when payment success
  useEffect(() => {
    if (paymentStatus === "success" && !orderResult && !submitting) {
        executeOrder();
    }
  }, [paymentStatus, orderResult, submitting, executeOrder]);


  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white gap-4">
      <Loader2 className="w-12 h-12 text-zinc-900 animate-spin" />
      <div className="flex flex-col items-center">
            <span className="text-xl font-black italic text-zinc-900">POS SYSTEM</span>
            <p className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Đang chuẩn bị không gian...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      
      {/* HEADER: Dùng chung cho mọi thiết bị */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[1.2rem] bg-zinc-900 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-zinc-950/20 italic rotate-3">P</div>
                <div>
                    <h1 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">ORDER ONLINE</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">{table?.name} (Vị trí của bạn)</p>
                    </div>
                </div>
            </div>
            
            <div className="hidden lg:flex flex-1 max-w-md mx-8 relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input 
                    type="text" 
                    placeholder="Tìm món ngon hôm nay..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 text-sm font-bold"
                />
            </div>

            <div className="flex items-center gap-4">
                <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-zinc-100 rounded-xl shadow-sm text-[10px] font-black uppercase hover:bg-zinc-50 transition-colors">
                    <History className="w-4 h-4" /> Lịch sử đơn
                </button>
                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                    <Info className="w-5 h-5" />
                </div>
            </div>
        </div>
      </header>

      {/* SEARCH CHO MOBILE */}
      <div className="lg:hidden p-4 bg-white border-b border-zinc-100">
          <div className="relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input 
                    type="text" 
                    placeholder="Tìm món ngon..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 text-sm font-bold"
                />
          </div>
      </div>

      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-8 mt-8 px-4 lg:px-8 pb-32">
          
          {/* CỘT TRÁI: DANH MỤC (SIDEBAR TRÊN LAPTOP, HORIZONTAL TRÊN MOBILE) */}
          <aside className="lg:w-64 shrink-0">
             <div className="hidden lg:block sticky top-28 space-y-2">
                <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 pl-4">DANH MỤC</h2>
                <button 
                   onClick={() => setSelectedCategoryId(null)}
                   className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-black text-xs uppercase transition-all ${selectedCategoryId === null ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-transparent text-zinc-500 hover:bg-white'}`}
                >
                    <div className="flex items-center gap-3"><LayoutGrid className="w-4 h-4" /> TẤT CẢ</div>
                    <ChevronRight className={`w-4 h-4 opacity-40 ${selectedCategoryId === null ? 'rotate-90' : ''}`} />
                </button>
                {categories.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-black text-xs uppercase transition-all ${selectedCategoryId === cat.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-transparent text-zinc-500 hover:bg-white'}`}
                    >
                        {cat.name}
                        <ChevronRight className={`w-4 h-4 opacity-40 ${selectedCategoryId === cat.id ? 'rotate-90' : ''}`} />
                    </button>
                ))}
             </div>

             {/* HORIZONTAL CHO MOBILE/IPAD */}
             <div className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar pb-2">
                <button 
                   onClick={() => setSelectedCategoryId(null)}
                   className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all whitespace-nowrap shadow-sm ${selectedCategoryId === null ? 'bg-emerald-600 text-white' : 'bg-white text-zinc-500 border border-zinc-100'}`}
                >
                    TẤT CẢ
                </button>
                {categories.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all whitespace-nowrap shadow-sm ${selectedCategoryId === cat.id ? 'bg-emerald-600 text-white' : 'bg-white text-zinc-500 border border-zinc-100'}`}
                    >
                        {cat.name}
                    </button>
                ))}
             </div>
          </aside>

          {/* CỘT GIỮA: DANH SÁCH MÓN ĂN */}
          <main className="flex-1 min-w-0">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 sm:gap-8">
                {table?.status !== "Available" && (
                    <div className="col-span-full bg-amber-50 border border-amber-200 rounded-[2rem] p-8 text-center animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Info className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-amber-900 uppercase italic">Bàn đang bận</h3>
                        <p className="text-xs text-amber-700 font-bold max-w-xs mx-auto mt-2 leading-relaxed">Vui lòng đợi nhân viên phục vụ xong đơn hàng hiện tại trước khi bắt đầu lượt gọi món mới của bạn.</p>
                        <div className="mt-6 flex justify-center">
                            <div className="px-4 py-2 bg-white rounded-full text-[10px] font-black uppercase text-amber-500 shadow-sm border border-amber-100 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Đang phục vụ khách khác
                            </div>
                        </div>
                    </div>
                )}
                {filteredProducts.map(p => (
                    <div key={p.id} className="group bg-white dark:bg-zinc-900 rounded-[2.5rem] p-4 border border-zinc-100 dark:border-zinc-800/50 shadow-sm hover:shadow-2xl hover:shadow-zinc-200/50 dark:hover:shadow-none transition-all duration-500 flex flex-col relative overflow-hidden">
                        
                        <div className="aspect-square rounded-[2rem] bg-zinc-50 dark:bg-zinc-800 mb-5 overflow-hidden relative border-4 border-zinc-50/50 dark:border-zinc-800/50 shadow-inner">
                             {p.imageUrl ? (
                                <img src={`http://localhost:5298/api/images/${p.imageUrl.split(',')[0].trim()}`} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center opacity-10"><Coffee className="w-12 h-12" /></div>
                             )}
                             <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>

                        <div className="flex-1 flex flex-col px-1">
                            <h3 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-tight line-clamp-2 mb-2">{p.name}</h3>
                            <p className="hidden text-[10px] text-zinc-400 font-bold italic mb-5">{p.description || "Hương vị tuyệt hảo từ Hệ thống POS"}</p>
                            
                            <div className="mt-auto flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Giá bán</span>
                                    <span className="text-emerald-600 font-black text-lg tracking-tighter italic leading-none">{p.price.toLocaleString()}đ</span>
                                </div>
                                <button 
                                    onClick={() => addToCart(p)}
                                    className="w-12 h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all hover:bg-emerald-600 hover:text-white group/btn"
                                >
                                    <Plus className="w-6 h-6 transition-transform group-hover/btn:rotate-90" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
          </main>

          {/* CỘT PHẢI: GIỎ HÀNG (LUÔN HIỂN THỊ TRÊN LAPTOP) */}
          <aside className="hidden lg:block lg:w-[380px] shrink-0">
             <div className="sticky top-28 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-2xl flex flex-col h-[75vh] overflow-hidden">
                <div className="p-8 border-b border-zinc-50 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50">
                    <h2 className="text-lg font-black flex items-center gap-3">
                        <ShoppingCart className="w-6 h-6 text-emerald-500" /> GIỎ HÀNG
                    </h2>
                    <div className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-lg shadow-lg shadow-emerald-500/20 uppercase tracking-tighter">{totalItems} MÓN</div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-300 opacity-50 space-y-4">
                             <Zap className="w-16 h-16 animate-pulse" />
                             <p className="text-xs font-black uppercase tracking-widest text-center">Bắt đầu chọn món ngon <br/> cho riêng bạn</p>
                        </div>
                    ) : (
                        cartItems.map(item => (
                            <div key={item.productId} className="flex items-center gap-4 group animate-in slide-in-from-right-2">
                                <div className="w-14 h-14 rounded-2xl bg-zinc-50 overflow-hidden shrink-0">
                                    {item.product.imageUrl && <img src={`http://localhost:5298/api/images/${item.product.imageUrl.split(',')[0].trim()}`} className="w-full h-full object-cover" />}
                                </div>
                                <div className="flex-1 min-w-0 pr-4">
                                    <p className="text-xs font-black text-zinc-800 dark:text-white uppercase truncate">{item.product.name}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="flex items-center bg-zinc-100/50 rounded-lg p-0.5">
                                            <button onClick={() => updateQuantity(item.productId, -1)} className="w-6 h-6 rounded-md bg-white flex items-center justify-center shadow-sm text-xs font-bold">−</button>
                                            <span className="w-7 text-center text-xs font-black">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.productId, 1)} className="w-6 h-6 rounded-md bg-white flex items-center justify-center shadow-sm text-xs font-bold">+</button>
                                        </div>
                                        <button onClick={() => removeFromCart(item.productId)} className="text-rose-500 font-bold text-[10px] uppercase tracking-tighter">Xóa bỏ</button>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-black text-emerald-600 italic">{(item.product.price * item.quantity).toLocaleString()}đ</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-8 border-t border-zinc-50 dark:border-zinc-800 space-y-6 bg-zinc-50/50">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 leading-none">Tổng dự kiến</span>
                        <span className="text-3xl font-black text-zinc-900 dark:text-white leading-none italic">{total.toLocaleString()}đ</span>
                    </div>
                    <button 
                        onClick={() => setShowCheckout(true)} 
                        disabled={cartItems.length === 0}
                        className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-3xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all text-sm uppercase tracking-[0.1em] disabled:opacity-50"
                    >
                        XÁC NHẬN & THANH TOÁN
                    </button>
                    <p className="text-center text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">Vui lòng quét QR ở bước sau để chốt đơn</p>
                </div>
             </div>
          </aside>
      </div>

      {/* FLOATING CART CHO MOBILE */}
      {cartItems.length > 0 && (
          <div className="lg:hidden fixed bottom-6 inset-x-4 z-40 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-[2.5rem] p-5 shadow-2xl flex items-center justify-between border border-white/10 animate-in slide-in-from-bottom-10">
              <div className="flex items-center gap-4">
                  <div className="relative">
                      <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg"><ShoppingCart className="w-6 h-6 text-white" /></div>
                      <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-4 border-zinc-900">{totalItems}</span>
                  </div>
                  <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Thành tiền</p>
                      <p className="text-xl font-black italic">{total.toLocaleString()}đ</p>
                  </div>
              </div>
              <button 
                onClick={() => {
                    if (table?.status !== "Available") {
                        alert("Bàn đang bận!");
                        return;
                    }
                    setShowCheckout(true);
                }}
                disabled={table?.status !== "Available"}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                  ĐẶT MÓN
              </button>
          </div>
      )}

      {/* CHECKOUT MODAL: Step-by-step UI */}
      {showCheckout && (
          <div className="fixed inset-0 z-[100] bg-zinc-900/80 backdrop-blur-xl flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-950 w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 border border-white/5 flex flex-col">
                  {!orderResult ? (
                      <div className="p-8 sm:p-10">
                          <div className="flex items-center justify-between mb-8">
                              <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
                                  <CreditCard className="w-7 h-7 text-emerald-600" /> THANH TOÁN
                              </h2>
                              <button onClick={() => setShowCheckout(false)} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 hover:rotate-90 transition-all"><X className="w-4 h-4" /></button>
                          </div>

                          <div className="space-y-3 mb-8">
                                <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800">
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Đơn hàng tạm</span>
                                    <span className="text-xs font-black text-zinc-900 dark:text-white">{orderCode}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ví trí</span>
                                    <span className="text-xs font-black text-emerald-600 uppercase italic tracking-tighter">{table?.name}</span>
                                </div>
                          </div>

                          <div className="bg-zinc-50 dark:bg-zinc-900 p-8 rounded-[2.5rem] border-2 border-zinc-100 dark:border-zinc-800 mb-8 flex flex-col items-center">
                                {paymentStatus === "success" ? (
                                    <div className="py-10 flex flex-col items-center gap-3 animate-in zoom-in-50 duration-500">
                                        <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-emerald-500/30"><CheckCircle2 className="w-12 h-12" /></div>
                                        <p className="text-sm font-black text-emerald-600 uppercase tracking-[0.2em] mt-4">THANH TOÁN THÀNH CÔNG</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative p-4 bg-white rounded-3xl shadow-inner border-2 border-zinc-100 items-center justify-center flex">
                                            <img 
                                                src={`https://qr.sepay.vn/img?acc=${SEPAY_CONFIG.acc}&bank=${SEPAY_CONFIG.bank}&amount=${total}&des=${orderCode}&template=compact`} 
                                                alt="QR Thanh toán" 
                                                className="w-48 h-48 sm:w-56 sm:h-56 mx-auto object-contain" 
                                            />
                                        </div>
                                        <div className="mt-8 text-center space-y-1">
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Tổng thực thanh toán</p>
                                            <p className="text-3xl font-black text-emerald-600 italic leading-none">{total.toLocaleString()}đ</p>
                                        </div>
                                    </>
                                )}
                          </div>

                          <div className="flex flex-col gap-4 text-center">
                                <div className="flex items-center gap-2 justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">HỆ THỐNG ĐANG TỰ ĐỘNG XÁC NHẬN GIAO DỊCH</p>
                                </div>
                                <p className="text-[9px] text-zinc-400 font-bold italic">Lưu ý: Đơn hàng sẽ tự động được gửi tới nhà bếp ngay sau khi bạn thanh toán thành công.</p>
                          </div>
                      </div>
                  ) : (
                      <div className="p-12 flex flex-col items-center text-center space-y-8 animate-in scale-95 duration-300">
                           <div className="w-28 h-28 bg-emerald-500 text-white rounded-[3rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40 relative">
                                <CheckCircle2 className="w-16 h-16" />
                                <div className="absolute -top-2 -right-2 bg-white text-emerald-600 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg font-black italic">OK</div>
                           </div>
                           <div className="space-y-3">
                                <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic">ĐÃ NHẬN ĐƠN HÀNG!</h3>
                                <div className="inline-block px-4 py-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Mã đơn: <span className="text-emerald-600">{orderResult.orderCode}</span></p>
                                </div>
                                <p className="text-[10px] text-zinc-500 px-6 font-bold leading-relaxed uppercase tracking-tight">CẢM ƠN BẠN <br/> CHÚNG TÔI ĐANG CHUẨN BỊ MÓN CHO BẠN TẠI {table?.name}</p>
                           </div>
                           <button 
                            onClick={() => {
                                setShowCheckout(false);
                                setOrderResult(null);
                                setCartItems([]);
                            }} 
                            className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black rounded-3xl shadow-xl transition-all uppercase text-xs tracking-widest active:scale-95"
                           >
                              TIẾP TỤC KHÁM PHÁ MENU
                           </button>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
}
