// src/components/AddressForm.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button"; // Assumindo que você tem um componente Button
import type { AddressRequestDTO, AddressResponseDTO } from "@/types";

interface AddressFormProps {
  address?: AddressResponseDTO; // Endereço existente para edição
  userId: number;
  onSave: (data: AddressRequestDTO) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function AddressForm({ address, userId, onSave, onCancel, isSaving }: AddressFormProps) {
  const [formData, setFormData] = useState<AddressRequestDTO>({
    street: "",
    number: "",
    complement: "",
    state: "",
    city: "",
    cep: "",
    isDefault: false,
    userId: userId,
  });

  useEffect(() => {
    if (address) {
      setFormData({
        street: address.street,
        number: address.number,
        complement: address.complement || "",
        state: address.state,
        city: address.city,
        cep: address.cep,
        isDefault: address.isDefault,
        userId: address.userId,
      });
    } else {
      // Reset form for new address
      setFormData({
        street: "",
        number: "",
        complement: "",
        state: "",
        city: "",
        cep: "",
        isDefault: false,
        userId: userId,
      });
    }
  }, [address, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="space-y-6 p-6 bg-background rounded-xl border border-border shadow-sm"
    >
      <h3 className="font-serif text-2xl font-bold text-foreground mb-4">
        {address ? "Edit Address" : "Add New Address"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="street" className="block text-sm font-medium text-muted-foreground mb-2">
            Street
          </label>
          <input
            type="text"
            id="street"
            name="street"
            value={formData.street}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label htmlFor="number" className="block text-sm font-medium text-muted-foreground mb-2">
            Number
          </label>
          <input
            type="text"
            id="number"
            name="number"
            value={formData.number}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div>
        <label htmlFor="complement" className="block text-sm font-medium text-muted-foreground mb-2">
          Complement (Optional)
        </label>
        <input
          type="text"
          id="complement"
          name="complement"
          value={formData.complement || ""}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-muted-foreground mb-2">
            City
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-muted-foreground mb-2">
            State (e.g., SP)
          </label>
          <input
            type="text"
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
            required
            maxLength={2}
            className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label htmlFor="cep" className="block text-sm font-medium text-muted-foreground mb-2">
            CEP
          </label>
          <input
            type="text"
            id="cep"
            name="cep"
            value={formData.cep}
            onChange={handleChange}
            required
            pattern="^\d{5}-\d{3}$|^\d{8}$" // Basic CEP pattern
            placeholder="00000-000"
            className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isDefault"
          name="isDefault"
          checked={formData.isDefault}
          onChange={handleChange}
          className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
        />
        <label htmlFor="isDefault" className="text-sm font-medium text-foreground">
          Set as default address
        </label>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Address"}
        </Button>
      </div>
    </motion.form>
  );
}