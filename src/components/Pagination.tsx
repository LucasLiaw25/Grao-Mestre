// src/components/Pagination.tsx
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils"; // Assumindo que você tem um utilitário cn

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Gera um array de números de página para exibir
  // Você pode implementar uma lógica mais sofisticada para exibir apenas algumas páginas (ex: 1, 2, ..., 5, 6)
  // Para este exemplo, vamos exibir todas as páginas se não forem muitas, ou um range simples.
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // Número máximo de botões de página para exibir

    if (totalPages <= maxPagesToShow) {
      for (let i = 0; i < totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Lógica para exibir um subconjunto de páginas
      let startPage = Math.max(0, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);

      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(0, endPage - maxPagesToShow + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Botão para a primeira página, se não estiver visível */}
      {totalPages > pageNumbers.length && pageNumbers[0] > 0 && (
        <>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(0)}
            className={cn("bg-background text-foreground hover:bg-muted")}
          >
            1
          </Button>
          {pageNumbers[0] > 1 && <span className="text-muted-foreground">...</span>}
        </>
      )}

      {pageNumbers.map((pageNumber) => (
        <Button
          key={pageNumber}
          variant={pageNumber === currentPage ? "default" : "outline"}
          size="icon"
          onClick={() => onPageChange(pageNumber)}
          className={cn(
            pageNumber === currentPage ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"
          )}
        >
          {pageNumber + 1}
        </Button>
      ))}

      {/* Botão para a última página, se não estiver visível */}
      {totalPages > pageNumbers.length && pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
        <>
          {pageNumbers[pageNumbers.length - 1] < totalPages - 2 && <span className="text-muted-foreground">...</span>}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages - 1)}
            className={cn("bg-background text-foreground hover:bg-muted")}
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}