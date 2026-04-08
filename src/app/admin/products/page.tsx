"use client";
import React, { useMemo } from "react";
import { API_BASE_URL, IMAGE_BASE_URL } from "@/app/api/apiConfig";
import { ProductForm, Product, Category as ProductCategory } from "@/components/ProductForm";
import { CategoryForm, Category } from "@/components/CategoryForm";
import { 
  Package, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Tag, 
  X, 
  Loader2, 
  AlertCircle,
  MoreHorizontal
} from "lucide-react";
import { Pagination } from "@/components/Pagination";

export default function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const pageSize = 12;

  const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  const [showProductForm, setShowProductForm] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | undefined>(undefined);
  const [formLoading, setFormLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const [showCategoryForm, setShowCategoryForm] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | undefined>(undefined);
  const [categoryLoading, setCategoryLoading] = React.useState(false);

  const fetchCategories = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/category`).then(r => r.json());
      if (res.status === true || res.status === 200 || res.status === "success") {
        const cats = res.data.sort((a: Category, b: Category) => a.displayOrder - b.displayOrder);
        setCategories(cats);
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  }, []);

  const fetchProducts = React.useCallback(async (page: number, catId: number | null, search: string) => {
    try {
      const query = new URLSearchParams({
        pageNumber: page.toString(),
        pageSize: pageSize.toString(),
        ...(catId && { categoryId: catId.toString() }),
        ...(search && { searchTerm: search })
      }).toString();

      const res = await fetch(`/api/product?${query}`).then(r => r.json());
      if (res.status === true || res.status === 200 || res.status === "success") {
        setProducts(res.data.items);
        setTotalPages(res.data.totalPages);
        setTotalCount(res.data.totalCount);
        setCurrentPage(res.data.pageNumber);
      } else {
        setError(res.message || "Lỗi tải danh mục sản phẩm");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  React.useEffect(() => {
    fetchProducts(currentPage, selectedCategoryId, searchQuery);
  }, [fetchProducts, currentPage, selectedCategoryId, searchQuery]);

  const handleProductSubmit = async (data: Omit<Product, "id">) => {
    setFormLoading(true); 
    setMessage(null); 
    setError(null);
    try {
      let res;
      if (editingProduct) {
        res = await fetch(`/api/product?id=${editingProduct.id}`, {
          method: "PUT", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, id: editingProduct.id }),
        });
      } else {
        res = await fetch(`/api/product`, {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }
      const result = await res.json();
      if (result.status === true || result.status === "success" || result.status === 200) {
        setMessage(editingProduct ? "Product updated" : "Product created");
        fetchProducts(currentPage, selectedCategoryId, searchQuery); 
        setShowProductForm(false); 
        setEditingProduct(undefined);
      } else {
        setError(result.message || "Operation failed");
      }
    } catch { 
      setError("Connection error"); 
    } finally { 
      setFormLoading(false); 
    }
  };

  const handleProductDelete = async (id: number) => {
    if (!window.confirm("Delete this product?")) return;
    setFormLoading(true); 
    setError(null); 
    setMessage(null);
    try {
      const res = await fetch(`/api/product?id=${id}`, { 
        method: "DELETE"
      });
      const result = await res.json();
      if (result.status === true || result.status === "success" || result.status === 200) {
        setMessage("Product deleted");
        fetchProducts(currentPage, selectedCategoryId, searchQuery);
      } else {
        setError(result.message || "Delete failed");
      }
    } catch { 
      setError("Connection error"); 
    } finally { 
      setFormLoading(false); 
    }
  };

  const handleCategorySubmit = async (data: Omit<Category, "id">) => {
    setCategoryLoading(true); 
    setMessage(null); 
    setError(null);
    try {
      let res;
      if (editingCategory) {
        res = await fetch(`/api/category?id=${editingCategory.id}`, {
          method: "PUT", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, id: editingCategory.id }),
        });
      } else {
        res = await fetch(`/api/category`, {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }
      const result = await res.json();
      if (result.status === true || result.status === "success" || result.status === 200) {
        setMessage(editingCategory ? "Category updated" : "Category created");
        fetchCategories(); 
        fetchProducts(currentPage, selectedCategoryId, searchQuery); 
        setShowCategoryForm(false); 
        setEditingCategory(undefined);
      } else {
        setError(result.message || "Operation failed");
      }
    } catch { 
      setError("Connection error"); 
    } finally { 
      setCategoryLoading(false); 
    }
  };

  const handleCategoryDelete = async (id: number) => {
    if (!window.confirm("Delete this category?")) return;
    setCategoryLoading(true); 
    setError(null); 
    setMessage(null);
    try {
      const res = await fetch(`/api/category?id=${id}`, { 
        method: "DELETE"
      });
      const result = await res.json();
      if (result.status === true || result.status === "success" || result.status === 200) {
        setMessage("Category deleted");
        if (selectedCategoryId === id) setSelectedCategoryId(null);
        fetchCategories(); 
        fetchProducts(currentPage, selectedCategoryId, searchQuery);
      } else {
        setError(result.message || "Delete failed");
      }
    } catch { 
      setError("Connection error"); 
    } finally { 
      setCategoryLoading(false); 
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-24 gap-4 bg-white dark:bg-zinc-950 rounded-2xl min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <div className="flex flex-col items-center animate-pulse">
            <p className="text-zinc-900 dark:text-zinc-100 font-semibold text-lg">Sản Phẩm</p>
            <p className="text-zinc-400 text-xs font-medium mt-1">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Sản Phẩm</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Quản lý thực đơn và danh mục sản phẩm</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-100 dark:border-zinc-800 group cursor-pointer lg:w-64">
            <Search className="w-4 h-4 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Tìm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-white p-1 w-full cursor-pointer placeholder:text-zinc-400"
            />
          </div>
          <button
            onClick={() => { setShowProductForm(true); setEditingProduct(undefined); }}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all cursor-pointer text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Thêm
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {(error || message) && (
        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
          error ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
        }`}>
          <AlertCircle className="w-4 h-4" />
          {error || message}
        </div>
      )}

      {/* Categories & Products */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Categories Sidebar */}
        <aside className="lg:w-56 shrink-0 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">Danh mục</h2>
              <button 
                onClick={() => { setShowCategoryForm(true); setEditingCategory(undefined); }}
                className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                title="Thêm danh mục"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible no-scrollbar pb-2 lg:pb-0">
              <button 
                onClick={() => setSelectedCategoryId(null)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategoryId === null 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600'
                }`}
              >
                <Package className="w-3.5 h-3.5" /> Tất cả
              </button>

              {categories.map(cat => (
                <div key={cat.id} className="relative group">
                  <button 
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                      selectedCategoryId === cat.id 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" /> {cat.name}
                  </button>
                  <div className="hidden lg:flex absolute right-1 top-1/2 -translate-y-1/2 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); setShowCategoryForm(true); }}
                      className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCategoryDelete(cat.id); }}
                      className="w-6 h-6 rounded bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package className="w-12 h-12 mb-3 text-zinc-300 dark:text-zinc-700" />
                <p className="text-sm text-zinc-400 dark:text-zinc-500 font-medium">Không có sản phẩm</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                        <th className="py-4 px-6 text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-left">Sản phẩm</th>
                        <th className="py-4 px-6 text-xs font-semibold text-zinc-600 dark:text-zinc-400">Danh mục</th>
                        <th className="py-4 px-6 text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-right">Giá</th>
                        <th className="py-4 px-6 text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-right">Tương tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {products.map(p => (
                        <tr key={p.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {p.imageUrl ? (
                                  <img src={`${IMAGE_BASE_URL}/${p.imageUrl.split(',')[0].trim()}`} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-5 h-5 text-zinc-300 dark:text-zinc-700" />
                                )}
                              </div>
                              <span className="text-sm font-medium text-zinc-900 dark:text-white">{p.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-medium text-zinc-600 dark:text-zinc-400">
                              {categories.find(c => c.id === p.categoryId)?.name || "---"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className="text-sm font-semibold text-zinc-900 dark:text-white tabular-nums">{p.price.toLocaleString()}đ</span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => { setShowProductForm(true); setEditingProduct(p); }}
                                className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                                title="Chỉnh sửa"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleProductDelete(p.id)}
                                className="w-8 h-8 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden p-4 grid gap-3">
                  {products.map(p => (
                    <div key={p.id} className="bg-background border border-border rounded-lg p-3 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        {p.imageUrl ? (
                          <img src={`${IMAGE_BASE_URL}/${p.imageUrl.split(',')[0].trim()}`} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{categories.find(c => c.id === p.categoryId)?.name || "-"}</p>
                        <p className="text-sm font-medium text-accent mt-1">{p.price.toLocaleString()}d</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => { setShowProductForm(true); setEditingProduct(p); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleProductDelete(p.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-muted"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-border">
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalCount={totalCount}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-xl shadow-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">{editingProduct ? "Edit Product" : "New Product"}</h2>
              <button onClick={() => { setShowProductForm(false); setEditingProduct(undefined); }} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <ProductForm 
                product={editingProduct}
                categories={categories}
                onSubmit={handleProductSubmit}
                onCancel={() => { setShowProductForm(false); setEditingProduct(undefined); }}
                loading={formLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-xl shadow-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">{editingCategory ? "Edit Category" : "New Category"}</h2>
              <button onClick={() => { setShowCategoryForm(false); setEditingCategory(undefined); }} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <CategoryForm 
                category={editingCategory}
                onSubmit={handleCategorySubmit}
                onCancel={() => { setShowCategoryForm(false); setEditingCategory(undefined); }}
                loading={categoryLoading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
