import React, { useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { ImagePlus, X, Loader2 } from "lucide-react";

export interface Product {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  imageUrl?: string;
}

export interface Category {
  id: number;
  name: string;
  displayOrder: number;
}

export interface ProductFormProps {
  product?: Product;
  categories: Category[];
  onSubmit: (data: Omit<Product, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ProductForm({ product, categories, onSubmit, onCancel, loading }: ProductFormProps) {
  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [categoryId, setCategoryId] = useState(product?.categoryId?.toString() || (categories[0]?.id?.toString() || ""));
  
  // Existing image URLs (string separated by comma)
  const [existingImages, setExistingImages] = useState<string[]>(
    product?.imageUrl ? product.imageUrl.split(",").map(s => s.trim()).filter(Boolean) : []
  );
  
  // New files to upload
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPreviews, setSelectedPreviews] = useState<string[]>([]);
  
  const [internalLoading, setInternalLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
      
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setSelectedPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setSelectedPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !categoryId) return;
    
    setInternalLoading(true);
    setUploadError(null);
    let finalImageUrls = [...existingImages];

    // Upload new files if any
    if (selectedFiles.length > 0) {
      try {
        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append("files", file);
        });

        // Tự gọi thẳng API upload vì upload file cần FormData, không thể gửi JSON.
        // apiClient của bạn hiện có thể đang overwrite content-type thành application/json
        // nên ta cần cấu hình fetch cẩn thận, hoặc tạm tắt Header "Content-Type" cho FormData.
        const token = document.cookie.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1];
        const res = await fetch("http://localhost:5298/api/images/upload", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        });

        const result = await res.json();
        if (result.status === true || result.status === "success" || result.status === 200) {
          finalImageUrls = [...finalImageUrls, ...result.data];
        } else {
          setUploadError(result.message || "Tải ảnh thất bại");
          setInternalLoading(false);
          return;
        }
      } catch (err) {
        setUploadError("Lỗi kết nối khi tải ảnh");
        setInternalLoading(false);
        return;
      }
    }

    setInternalLoading(false);
    onSubmit({
      name,
      price: Number(price),
      categoryId: Number(categoryId),
      imageUrl: finalImageUrls.length > 0 ? finalImageUrls.join(",") : undefined,
    });
  };

  const isSaving = loading || internalLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Tên sản phẩm <span className="text-red-500">*</span></label>
        <input
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-zinc-900 dark:text-white"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nhập tên sản phẩm..."
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Giá (VNĐ) <span className="text-red-500">*</span></label>
          <input
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-zinc-900 dark:text-white"
            type="number"
            min={0}
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="0"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Loại sản phẩm <span className="text-red-500">*</span></label>
          <select
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-zinc-900 dark:text-white"
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            required
          >
            <option value="" disabled>Chọn danh mục</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Hình ảnh sản phẩm</label>
        {uploadError && <div className="mb-2 text-xs text-red-500 font-medium">{uploadError}</div>}
        
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
          {/* Ảnh cũ từ server */}
          {existingImages.map((img, i) => (
            <div key={`existing-${i}`} className="relative aspect-square rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden group">
              <img src={`http://localhost:5298/api/images/${img}`} alt="Product" className="w-full h-full object-cover" />
              <button 
                type="button" 
                onClick={() => removeExistingImage(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Ảnh mới vừa chọn */}
          {selectedPreviews.map((preview, i) => (
             <div key={`new-${i}`} className="relative aspect-square rounded-xl border-2 border-emerald-500/50 overflow-hidden group">
              <img src={preview} alt="New Product" className="w-full h-full object-cover opacity-80" />
              <button 
                type="button" 
                onClick={() => removeSelectedFile(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Nút thêm file */}
          <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-xl cursor-pointer transition-colors">
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
            <ImagePlus className="w-8 h-8 text-zinc-400 mb-2" />
            <span className="text-xs font-semibold text-zinc-500">Thêm ảnh</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <button 
          type="button" 
          className="flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer" 
          onClick={onCancel} 
          disabled={isSaving}
        >
          Hủy bỏ
        </button>
        <button 
          type="submit" 
          className="flex-1 flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-medium shadow-sm shadow-emerald-600/20 transition-all active:scale-[0.98] cursor-pointer" 
          disabled={isSaving}
        >
          {isSaving ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...</> : product ? "Lưu thay đổi" : "Tạo sản phẩm"}
        </button>
      </div>
    </form>
  );
}
