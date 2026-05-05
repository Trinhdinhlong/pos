"use client";
import React, { useState } from "react";
import { ImagePlus, X, Loader2, Trash2 } from "lucide-react";
import { IMAGE_BASE_URL } from "@/app/api/apiConfig";

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
  onDelete?: (id: number) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ProductForm({ product, categories, onSubmit, onDelete, onCancel, loading }: ProductFormProps) {
  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [categoryId, setCategoryId] = useState(product?.categoryId?.toString() || (categories[0]?.id?.toString() || ""));
  
  const [existingImages, setExistingImages] = useState<string[]>(
    product?.imageUrl ? product.imageUrl.split(",").map(s => s.trim()).filter(Boolean) : []
  );
  
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

    if (selectedFiles.length > 0) {
      try {
        const formData = new FormData();
        selectedFiles.forEach(file => formData.append("files", file));
        const res = await fetch("/api/image", { method: "POST", body: formData });
        const result = await res.json();
        if (result.status === true || result.status === "success" || result.status === 200) {
          finalImageUrls = [...finalImageUrls, ...result.data];
        } else {
          setUploadError(result.message || "Tải ảnh lên thất bại");
          setInternalLoading(false);
          return;
        }
      } catch {
        setUploadError("Lỗi kết nối máy chủ");
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

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Tên sản phẩm *</label>
          <input
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nhập tên sản phẩm..."
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Giá bán *</label>
            <input
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="0"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Danh mục *</label>
            <select
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              required
            >
              <option value="" disabled>Chọn danh mục</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Hình ảnh</label>
          {uploadError && <div className="mb-2 text-xs text-destructive">{uploadError}</div>}
          <div className="grid grid-cols-4 gap-2">
            {existingImages.map((img, i) => (
              <div key={`exist-${i}`} className="relative aspect-square rounded-lg border overflow-hidden group">
                <img src={`${IMAGE_BASE_URL}/${img}`} className="w-full h-full object-cover" alt="" />
                <button type="button" onClick={() => setExistingImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
              </div>
            ))}
            {selectedPreviews.map((p, i) => (
              <div key={`new-${i}`} className="relative aspect-square rounded-lg border-2 border-accent overflow-hidden group">
                <img src={p} className="w-full h-full object-cover" alt="" />
                <button type="button" onClick={() => removeSelectedFile(i)} className="absolute top-1 right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
              </div>
            ))}
            <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-accent rounded-lg cursor-pointer transition-colors">
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
              <ImagePlus className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mt-1">Thêm</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-4 border-t border-border">
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="flex-1 py-2.5 text-sm font-medium bg-muted rounded-lg hover:bg-muted/80 transition-colors" disabled={loading || internalLoading}>Hủy bỏ</button>
            <button type="submit" className="flex-1 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors" disabled={loading || internalLoading}>
              {(loading || internalLoading) ? <Loader2 className="w-4 h-4 animate-spin" /> : product ? "Lưu thay đổi" : "Tạo sản phẩm"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
