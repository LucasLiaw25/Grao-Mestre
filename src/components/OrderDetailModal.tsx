// src/components/OrderDetailsModal.tsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderResponseDTO, OrderStatus } from "@/types";
import { formatCurrency } from "@/lib/format";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderResponseDTO;
  onUpdateStatus: (data: { orderId: number; newStatus: OrderStatus }) => void;
  isUpdatingStatus: boolean;
}

export default function OrderDetailsModal({
  isOpen,
  onClose,
  order,
  onUpdateStatus,
  isUpdatingStatus,
}: OrderDetailsModalProps) {
  const [newStatus, setNewStatus] = useState<OrderStatus>(order.orderStatus);

  useEffect(() => {
    if (order) {
      setNewStatus(order.orderStatus);
    }
  }, [order]);

  const handleStatusChange = (value: OrderStatus) => {
    setNewStatus(value);
  };

  const handleSaveStatus = () => {
    if (order.id && newStatus !== order.orderStatus) {
      onUpdateStatus({ orderId: order.id, newStatus });
    } else {
      onClose(); // Se não houver mudança, apenas fecha
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-card text-foreground rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-bold text-foreground">
            Order Details #{order.id}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            View and manage the details of this order.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Order Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Customer Email</Label>
              <p className="font-medium text-foreground">{order.userEmail}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Order Date</Label>
              <p className="font-medium text-foreground">{new Date(order.orderDate).toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Total Price</Label>
              <p className="font-medium text-primary text-lg">{formatCurrency(order.totalPrice)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Payment Method</Label>
              <p className="font-medium text-foreground">{order.paymentMethod.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Payment Status</Label>
              <p className="font-medium text-foreground">
                {order.payment?.paymentStatus ? order.payment.paymentStatus.replace(/_/g, ' ') : 'N/A'}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="mt-4">
            <h3 className="font-serif text-xl font-bold text-foreground mb-3">Items</h3>
            <div className="border border-border/50 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Price</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-foreground">{item.productName}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-muted-foreground">{item.quantity}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-muted-foreground text-right">{formatCurrency(item.priceAtTime)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-foreground text-right">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Update Status */}
          <div className="mt-4 grid grid-cols-4 items-center gap-4">
            <Label htmlFor="orderStatus" className="text-right text-muted-foreground">
              Update Status
            </Label>
            <Select value={newStatus} onValueChange={handleStatusChange}>
              <SelectTrigger id="orderStatus" className="col-span-3 bg-background border-border text-foreground">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                {Object.values(OrderStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} type="button">
            Close
          </Button>
          <Button
            onClick={handleSaveStatus}
            disabled={isUpdatingStatus || newStatus === order.orderStatus}
          >
            {isUpdatingStatus ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Save Status"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}