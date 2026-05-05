"use client";
import React, { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

export interface Category {
  id: number;
  name: string;
  displayOrder: number;
}

export interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: Omit<Category, "id">) => void;
  onDelete?: (id: number) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function CategoryForm({ category, onSubmit, onDelete, onCancel, loading }: CategoryFormProps) {
  const [name, setName] = useState(category?.name || "");
  const [displayOrder, setDisplayOrder] = useState(category?.displayOrder?.toString() || "1");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !displayOrder) return;
    onSubmit({
      name,
      displayOrder: Number(displayOrder),
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Tên danh mục *</label>
          <input
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nhập tên danh mục..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Thứ tự hiển thị *</label>
          <input
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            type="number"
            min={1}
            value={displayOrder}
            onChange={e => setDisplayOrder(e.target.value)}
            required
          />
        </div>
        
        <div className="flex flex-col gap-3 pt-4 border-t border-border">
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="flex-1 py-2.5 text-sm font-medium bg-muted rounded-lg hover:bg-muted/80 transition-colors" disabled={loading}>Hủy bỏ</button>
            <button type="submit" className="flex-1 py-2.5 text-sm font-medium bg-foreground text-background rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : category ? "Lưu thay đổi" : "Tạo danh mục"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}