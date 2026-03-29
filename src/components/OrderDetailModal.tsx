// src/components/OrderDetailsModal.tsx
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { OrderResponseDTO, OrderStatus } from "@/types"
import { formatCurrency } from "@/lib/format"
import { Loader2, X } from "lucide-react" // Importar o ícone X para o botão de fechar
import { cn } from "@/lib/utils"

interface Props {
  isOpen: boolean
  onClose: () => void
  order: OrderResponseDTO
  onUpdateStatus: (d: { orderId: number; newStatus: OrderStatus }) => void
  isUpdatingStatus: boolean
}

export default function OrderDetailsModal({
  isOpen,
  onClose,
  order,
  onUpdateStatus,
  isUpdatingStatus
}: Props) {
  const [newStatus, setNewStatus] = useState<OrderStatus>(order.orderStatus)

  useEffect(() => setNewStatus(order.orderStatus), [order])

  const save = () =>
    newStatus !== order.orderStatus
      ? onUpdateStatus({ orderId: order.id, newStatus })
      : onClose()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "w-[95vw] max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl rounded-2xl p-0 overflow-hidden", // Ajustado w-[95vw] e max-w para mobile
          "flex flex-col max-h-[95vh]" // Garante que o modal não exceda a altura da tela e permite rolagem interna
        )}
      >
        <DialogHeader className="px-5 py-4 border-b border-border/50 relative text-center"> {/* Adicionado relative e text-center */}
          <DialogTitle className="font-serif text-lg font-bold">
            Pedido #{String(order.id).padStart(4, "0")}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Gerencie os detalhes deste pedido
          </DialogDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full" // Botão de fechar no canto superior direito
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm"> {/* Reduzido o tamanho da fonte para melhor ajuste */}
            <div>
              <Label className="text-muted-foreground text-xs">E-mail</Label>
              <p className="font-medium break-all">{order.userEmail}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Data</Label>
              <p className="font-medium">
                {new Date(order.orderDate).toLocaleString()}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Total</Label>
              <p className="font-medium text-primary text-lg">
                {formatCurrency(order.totalPrice)}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Pagamento</Label>
              <p className="font-medium">
                {order.paymentMethod.replace(/_/g, " ")}
              </p>
            </div>
            <div className="col-span-2"> {/* Status Pgto. ocupa 2 colunas para evitar corte */}
              <Label className="text-muted-foreground text-xs">Status Pgto.</Label>
              <p className="font-medium">
                {order.payment?.paymentStatus
                  ? order.payment.paymentStatus.replace(/_/g, " ")
                  : "N/A"}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-xl font-bold mb-3">Itens</h3>
            <div className="border border-border/50 rounded-lg overflow-x-auto"> {/* Mantido overflow-x-auto para a tabela */}
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase w-[40%]"> {/* Ajuste de largura para Produto */}
                      Produto
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase w-[15%]"> {/* Ajuste de largura para Qtde */}
                      Qtde
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase w-[22.5%]"> {/* Ajuste de largura para Preço */}
                      Preço
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase w-[22.5%]"> {/* Ajuste de largura para Subtotal */}
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {order.items.map((i) => (
                    <tr key={i.id}>
                      <td className="px-3 py-2 text-sm">{i.productName}</td> {/* Removido whitespace-nowrap */}
                      <td className="px-3 py-2 text-muted-foreground text-sm">{i.quantity}</td>
                      <td className="px-3 py-2 text-muted-foreground text-right text-sm">
                        {formatCurrency(i.priceAtTime)}
                      </td>
                      <td className="px-3 py-2 font-medium text-right text-sm">
                        {formatCurrency(i.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-muted-foreground col-span-1 text-sm">
              Alterar status
            </Label>
            <Select
              value={newStatus}
              onValueChange={(v) => setNewStatus(v as OrderStatus)}
            >
              <SelectTrigger className="col-span-3 bg-background border-border text-sm">
                <SelectValue placeholder="Novo status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {Object.values(OrderStatus).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="px-5 py-4 border-t border-border/50 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Fechar
          </Button>
          <Button
            onClick={save}
            disabled={isUpdatingStatus || newStatus === order.orderStatus}
            className="w-full sm:w-auto"
          >
            {isUpdatingStatus && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}