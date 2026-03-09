// src/pages/UserManagement.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, CheckCircle, XCircle, Loader2, Home, KeyRound } from "lucide-react";
import { usersApi, scopesApi, addressesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { UserRequestDTO, UserResponseDTO, ScopeResponseDTO, AddressRequestDTO, AddressResponseDTO } from "@/types";
import { Textarea } from "@/components/ui/textarea"; // Adicionado para consistência com ProductManagement

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isUserFormModalOpen, setIsUserFormModalOpen] = useState(false);
  const [isAddressFormModalOpen, setIsAddressFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponseDTO | null>(null);
  const [editingAddress, setEditingAddress] = useState<AddressResponseDTO | null>(null);
  const [userForm, setUserForm] = useState<UserRequestDTO>({
    email: "",
    name: "",
    phone: "",
    active: true,
    scopeIds: [],
  });
  const [userPassword, setUserPassword] = useState(""); // For new user or password reset
  const [addressForm, setAddressForm] = useState<AddressRequestDTO>({
    street: "",
    number: "",
    complement: "",
    state: "",
    city: "",
    cep: "",
    isDefault: false,
    userId: 0, // Will be set when opening the address modal for a specific user
  });

  // Fetch Users
  const { data: users, isLoading: isLoadingUsers, error: usersError } = useQuery<UserResponseDTO[]>({
    queryKey: ["users"],
    queryFn: async () => (await usersApi.getAll()).data,
  });

  // Fetch Scopes
  const { data: scopes, isLoading: isLoadingScopes, error: scopesError } = useQuery<ScopeResponseDTO[]>({
    queryKey: ["scopes"],
    queryFn: async () => (await scopesApi.getAll()).data,
  });

  // Fetch Addresses for a specific user (only when editingUser is set)
  const { data: userAddresses, isLoading: isLoadingUserAddresses, error: userAddressesError } = useQuery<AddressResponseDTO[]>({
    queryKey: ["userAddresses", editingUser?.id],
    queryFn: async () => {
      if (!editingUser?.id) return [];
      const response = await addressesApi.getByUserId(editingUser.id);
      return response.data;
    },
    enabled: !!editingUser?.id, // Only run when editingUser.id is available
  });

  // User Mutations
  const createUserMutation = useMutation({
    mutationFn: (newUser: UserRequestDTO) => usersApi.create(newUser),
    onSuccess: () => {
      toast({ title: "Success", description: "User created successfully." });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeUserFormModal();
    },
    onError: (err) => {
      console.error("Error creating user:", err);
      toast({ title: "Error", description: "Failed to create user. Please try again.", variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (updatedUser: { id: number; data: UserRequestDTO }) =>
      usersApi.update(updatedUser.id, updatedUser.data),
    onSuccess: () => {
      toast({ title: "Success", description: "User updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeUserFormModal();
    },
    onError: (err) => {
      console.error("Error updating user:", err);
      toast({ title: "Error", description: "Failed to update user. Please try again.", variant: "destructive" });
    },
  });

  const updateUserPasswordMutation = useMutation({
    mutationFn: (data: { id: number; newPassword: string }) =>
      usersApi.updatePassword(data.id, data.newPassword),
    onSuccess: () => {
      toast({ title: "Success", description: "User password updated successfully." });
      // No need to invalidate users query, as password change doesn't affect user list display
    },
    onError: (err) => {
      console.error("Error updating password:", err);
      toast({ title: "Error", description: "Failed to update password. Please try again.", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      toast({ title: "Success", description: "User deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      console.error("Error deleting user:", err);
      toast({ title: "Error", description: "Failed to delete user. Please try again.", variant: "destructive" });
    },
  });

  // Address Mutations
  const createAddressMutation = useMutation({
    mutationFn: (newAddress: AddressRequestDTO) => addressesApi.create(newAddress),
    onSuccess: () => {
      toast({ title: "Success", description: "Address created successfully." });
      queryClient.invalidateQueries({ queryKey: ["userAddresses", editingUser?.id] });
      closeAddressFormModal();
    },
    onError: (err) => {
      console.error("Error creating address:", err);
      toast({ title: "Error", description: "Failed to create address. Please try again.", variant: "destructive" });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: (updatedAddress: { id: number; data: AddressRequestDTO }) =>
      addressesApi.update(updatedAddress.id, updatedAddress.data),
    onSuccess: () => {
      toast({ title: "Success", description: "Address updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["userAddresses", editingUser?.id] });
      closeAddressFormModal();
    },
    onError: (err) => {
      console.error("Error updating address:", err);
      toast({ title: "Error", description: "Failed to update address. Please try again.", variant: "destructive" });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: number) => addressesApi.delete(id),
    onSuccess: () => {
      toast({ title: "Success", description: "Address deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ["userAddresses", editingUser?.id] });
    },
    onError: (err) => {
      console.error("Error deleting address:", err);
      toast({ title: "Error", description: "Failed to delete address. Please try again.", variant: "destructive" });
    },
  });

  // --- User Form Handlers ---
  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserSwitchChange = (checked: boolean) => {
    setUserForm((prev) => ({ ...prev, active: checked }));
  };

  // CORREÇÃO: handleScopeSelectChange agora espera uma string (um único ID de escopo)
  const handleScopeSelectChange = (selectedScopeId: string) => {
    setUserForm((prev) => ({
      ...prev,
      scopeIds: selectedScopeId ? [Number(selectedScopeId)] : [], // Converte para número e coloca em um array
    }));
  };

  const openCreateUserModal = () => {
    setEditingUser(null);
    setUserForm({
      email: "",
      name: "",
      phone: "",
      active: true,
      scopeIds: [],
    });
    setUserPassword("");
    setIsUserFormModalOpen(true);
  };

  const openEditUserModal = (user: UserResponseDTO) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      name: user.name,
      phone: user.phone,
      active: user.active,
      // CORREÇÃO: Para exibir o escopo selecionado, pegamos o primeiro ID do array
      scopeIds: user.scopes.length > 0 ? [user.scopes[0].id] : [],
    });
    setUserPassword(""); // Password is not pre-filled for security
    setIsUserFormModalOpen(true);
  };

  const closeUserFormModal = () => {
    setIsUserFormModalOpen(false);
    setEditingUser(null);
    setUserForm({
      email: "",
      name: "",
      phone: "",
      active: true,
      scopeIds: [],
    });
    setUserPassword("");
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userPayload: UserRequestDTO = {
      email: userForm.email,
      name: userForm.name,
      phone: userForm.phone,
      active: userForm.active,
      scopeIds: userForm.scopeIds,
    };

    try {
      if (editingUser) {
        await updateUserMutation.mutateAsync({ id: editingUser.id, data: userPayload });
        if (userPassword) { // If password field was filled, update password
          await updateUserPasswordMutation.mutateAsync({ id: editingUser.id, newPassword: userPassword });
        }
      } else {
        // For new user, password is required
        if (!userPassword) {
          toast({ title: "Error", description: "Password is required for new users.", variant: "destructive" });
          return;
        }
        await createUserMutation.mutateAsync({ ...userPayload, password: userPassword });
      }
    } catch (error) {
      // Mutations already handle their own errors and toasts, but this catch is for any sync errors
      console.error("Form submission error:", error);
    }
  };

   const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // CORREÇÃO FINAL: Verifica se o target é um HTMLInputElement e, se for,
    // usa uma asserção de tipo para acessar 'checked' com segurança.
    if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
      // Aqui, o TypeScript sabe que e.target é um HTMLInputElement
      setAddressForm((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked, // Asserção de tipo aqui
      }));
    } else {
      setAddressForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const openCreateAddressModal = () => {
    if (!editingUser) return;
    setEditingAddress(null);
    setAddressForm({
      street: "",
      number: "",
      complement: "",
      state: "",
      city: "",
      cep: "",
      isDefault: false,
      userId: editingUser.id,
    });
    setIsAddressFormModalOpen(true);
  };

  const openEditAddressModal = (address: AddressResponseDTO) => {
    if (!editingUser) return;
    setEditingAddress(address);
    setAddressForm({
      street: address.street,
      number: address.number,
      complement: address.complement,
      state: address.state,
      city: address.city,
      cep: address.cep,
      isDefault: address.isDefault,
      userId: editingUser.id,
    });
    setIsAddressFormModalOpen(true);
  };

  const closeAddressFormModal = () => {
    setIsAddressFormModalOpen(false);
    setEditingAddress(null);
    setAddressForm({
      street: "",
      number: "",
      complement: "",
      state: "",
      city: "",
      cep: "",
      isDefault: false,
      userId: 0,
    });
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: addressForm });
    } else {
      createAddressMutation.mutate(addressForm);
    }
  };

  if (isLoadingUsers || isLoadingScopes) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading user data...</span>
      </div>
    );
  }

  if (usersError || scopesError) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold text-destructive mb-4">Error loading data</h1>
          <p className="text-muted-foreground">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-12"
        >
          <h1 className="font-serif text-4xl font-bold text-foreground">User Management</h1>
          <Button onClick={openCreateUserModal} className="gap-2">
            <Plus className="w-5 h-5" />
            Add New User
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden"
        >
          {users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Phone
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Scopes
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {users.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-muted/20"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {user.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {user.scopes.map(s => s.name).join(", ") || "None"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                          user.active ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        )}>
                          {user.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditUserModal(user)}
                            disabled={updateUserMutation.isPending}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteUserMutation.mutate(user.id)}
                            disabled={deleteUserMutation.isPending}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            {deleteUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <User className="w-16 h-16 mx-auto mb-6 opacity-50" />
              <p className="text-xl font-serif">No users found. Start by adding a new one!</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* User Form Modal */}
      <Dialog open={isUserFormModalOpen} onOpenChange={setIsUserFormModalOpen}>
        <DialogContent className="sm:max-w-[700px] bg-card text-foreground rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-bold text-foreground">
              {editingUser ? "Edit User" : "Create New User"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingUser ? "Make changes to the user's profile and addresses here." : "Fill in the details to add a new user."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUserSubmit} className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={userForm.name}
                onChange={handleUserInputChange}
                className="col-span-3 bg-background border-border text-foreground"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={userForm.email}
                onChange={handleUserInputChange}
                className="col-span-3 bg-background border-border text-foreground"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                value={userForm.phone}
                onChange={handleUserInputChange}
                className="col-span-3 bg-background border-border text-foreground"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder={editingUser ? "Leave blank to keep current password" : "Enter password"}
                className="col-span-3 bg-background border-border text-foreground"
                required={!editingUser}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="scopes" className="text-right">
                Scope
              </Label>
              <Select
                onValueChange={handleScopeSelectChange}
                // CORREÇÃO: O valor deve ser uma string única, representando o ID do escopo selecionado
                // Se houver múltiplos escopos no userForm.scopeIds, pegamos o primeiro para exibir
                value={userForm.scopeIds && userForm.scopeIds.length > 0 ? userForm.scopeIds[0].toString() : ""}
                // REMOVIDO: a propriedade 'multiple'
              >
                <SelectTrigger className="col-span-3 bg-background border-border text-foreground">
                  <SelectValue placeholder="Select a scope" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  {scopes?.map((scope) => (
                    <SelectItem key={scope.id} value={scope.id.toString()}>
                      {scope.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="active" className="text-right">
                Active
              </Label>
              <Switch
                id="active"
                checked={userForm.active}
                onCheckedChange={handleUserSwitchChange}
                className="col-span-3"
              />
            </div>

            {/* Address Management Section (only for existing users) */}
            {editingUser && (
              <div className="col-span-full mt-8 border-t border-border/50 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-serif text-xl font-bold text-foreground">User Addresses</h3>
                  <Button variant="outline" size="sm" onClick={openCreateAddressModal} className="gap-1">
                    <Plus className="w-4 h-4" /> Add Address
                  </Button>
                </div>
                {isLoadingUserAddresses ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading addresses...</span>
                  </div>
                ) : userAddresses && userAddresses.length > 0 ? (
                  <div className="space-y-4">
                    {userAddresses.map((address) => (
                      <div key={address.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                        <div>
                          <p className="font-medium text-foreground">{address.street}, {address.number} {address.complement && `(${address.complement})`}</p>
                          <p className="text-sm text-muted-foreground">{address.city}, {address.state} - {address.cep}</p>
                          {address.isDefault && <span className="text-xs font-semibold text-primary mt-1">Default Address</span>}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditAddressModal(address)} className="text-muted-foreground hover:text-primary">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteAddressMutation.mutate(address.id)} className="text-muted-foreground hover:text-destructive">
                            {deleteAddressMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Home className="w-10 h-10 mx-auto mb-4 opacity-50" />
                    <p>No addresses found for this user.</p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={closeUserFormModal} type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={createUserMutation.isPending || updateUserMutation.isPending || updateUserPasswordMutation.isPending}>
                {createUserMutation.isPending || updateUserMutation.isPending || updateUserPasswordMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : editingUser ? (
                  "Save Changes"
                ) : (
                  "Create User"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Address Form Modal */}
      <Dialog open={isAddressFormModalOpen} onOpenChange={setIsAddressFormModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card text-foreground rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-bold text-foreground">
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingAddress ? "Update the address details." : "Enter the details for the new address."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddressSubmit} className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="street" className="text-right">Street</Label>
              <Input id="street" name="street" value={addressForm.street} onChange={handleAddressInputChange} className="col-span-3 bg-background border-border text-foreground" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="number" className="text-right">Number</Label>
              <Input id="number" name="number" value={addressForm.number} onChange={handleAddressInputChange} className="col-span-3 bg-background border-border text-foreground" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="complement" className="text-right">Complement</Label>
              <Input id="complement" name="complement" value={addressForm.complement || ""} onChange={handleAddressInputChange} className="col-span-3 bg-background border-border text-foreground" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="city" className="text-right">City</Label>
              <Input id="city" name="city" value={addressForm.city} onChange={handleAddressInputChange} className="col-span-3 bg-background border-border text-foreground" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="state" className="text-right">State</Label>
              <Input id="state" name="state" value={addressForm.state} onChange={handleAddressInputChange} className="col-span-3 bg-background border-border text-foreground" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cep" className="text-right">CEP</Label>
              <Input id="cep" name="cep" value={addressForm.cep} onChange={handleAddressInputChange} className="col-span-3 bg-background border-border text-foreground" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isDefault" className="text-right">Default</Label>
              <Switch id="isDefault" checked={addressForm.isDefault} onCheckedChange={(checked) => handleAddressInputChange({ target: { name: "isDefault", type: "checkbox", checked } } as React.ChangeEvent<HTMLInputElement>)} className="col-span-3" />
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={closeAddressFormModal} type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={createAddressMutation.isPending || updateAddressMutation.isPending}>
                {createAddressMutation.isPending || updateAddressMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : editingAddress ? (
                  "Save Changes"
                ) : (
                  "Add Address"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Placeholder icon for User, similar to Coffee in ProductManagement
const User = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);