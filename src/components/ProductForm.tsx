import React, { useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
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
  onCancel: () => void;
  loading?: boolean;
}

export function ProductForm({ product, categories, onSubmit, onCancel, loading }: ProductFormProps) {
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

    if (selectedFiles.length > 0) {
      try {
        const formData = new FormData();
        selectedFiles.forEach(file => formData.append("files", file));

        const res = await fetch("/api/image", {
          method: "POST",
          body: formData
        });

        const result = await res.json();
        if (result.status === true || result.status === "success" || result.status === 200) {
          finalImageUrls = [...finalImageUrls, ...result.data];
        } else {
          setUploadError(result.message || "Upload failed");
          setInternalLoading(false);
          return;
        }
      } catch {
        setUploadError("Connection error");
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Product Name <span className="text-destructive">*</span>
        </label>
        <input
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter product name..."
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Price <span className="text-destructive">*</span>
          </label>
          <input
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            type="number"
            min={0}
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="0"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Category <span className="text-destructive">*</span>
          </label>
          <select
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            required
          >
            <option value="" disabled>Select category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Images</label>
        {uploadError && <div className="mb-2 text-xs text-destructive">{uploadError}</div>}
        
        <div className="grid grid-cols-4 gap-2">
          {existingImages.map((img, i) => (
            <div key={`existing-${i}`} className="relative aspect-square rounded-lg border border-border overflow-hidden group">
              <img src={`${IMAGE_BASE_URL}/${img}`} alt="Product" className="w-full h-full object-cover" />
              <button 
                type="button" 
                onClick={() => removeExistingImage(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {selectedPreviews.map((preview, i) => (
            <div key={`new-${i}`} className="relative aspect-square rounded-lg border-2 border-accent overflow-hidden group">
              <img src={preview} alt="New" className="w-full h-full object-cover" />
              <button 
                type="button" 
                onClick={() => removeSelectedFile(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-accent rounded-lg cursor-pointer transition-colors">
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
            <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">Add</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-border">
        <button 
          type="button" 
          className="flex-1 py-2.5 text-sm font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors" 
          onClick={onCancel} 
          disabled={isSaving}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="flex-1 py-2.5 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2" 
          disabled={isSaving}
        >
          {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : product ? "Save Changes" : "Create Product"}
        </button>
      </div>
    </form>
  );
}
