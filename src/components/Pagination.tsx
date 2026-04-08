"use client";
import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ 
    currentPage, 
    totalPages, 
    totalCount, 
    pageSize, 
    onPageChange 
}) => {
    if (totalPages <= 1) return null;

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }

        return pages.map((page, index) => {
            if (page === '...') {
                return (
                    <div key={`dots-${index}`} className="w-10 h-10 flex items-center justify-center text-zinc-400">
                        <MoreHorizontal className="w-4 h-4" />
                    </div>
                );
            }

            const isCurrent = page === currentPage;
            return (
                <button
                    key={page}
                    onClick={() => onPageChange(page as number)}
                    className={`w-10 h-10 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center text-sm ${
                        isCurrent 
                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg shadow-zinc-900/10 dark:shadow-white/10" 
                            : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-100 dark:border-zinc-800"
                    }`}
                >
                    {page}
                </button>
            );
        });
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-8 gap-6 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                <span className="text-zinc-900 dark:text-white font-black">{((currentPage - 1) * pageSize) + 1}</span>
                <span>-</span>
                <span className="text-zinc-900 dark:text-white font-black">{Math.min(currentPage * pageSize, totalCount)}</span>
                <span>trên tổng số</span>
                <span className="text-emerald-500 font-black">{totalCount}</span>
            </div>

            <div className="flex items-center gap-2">
                <button
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="w-10 h-10 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-2">
                    {renderPageNumbers()}
                </div>

                <button
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="w-10 h-10 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
