// FILE NAME: Account.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Save, X, KeyRound, Plus, Trash2, MapPin, LogOut, LayoutDashboard } from "lucide-react"; // Adicionado LogOut e LayoutDashboard
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usersApi, addressesApi } from "@/lib/api";
import type { UserResponseDTO, UserRequestDTO, AddressResponseDTO, AddressRequestDTO } from "@/types";
import { Footer } from "@/components/Footer";
import { AddressForm } from "@/components/AddressForm";
import { Link, useNavigate } from "react-router-dom"; // Importar Link e useNavigate
import { useAuth } from "@/hooks/use-auth";

export default function Account() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: authUser, logout, isLoading: isLoadingAuth } = useAuth(); // Obter user e logout do useAuth
  const navigate = useNavigate();

  const userId = authUser?.id; // Usar o ID do usuário autenticado

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState<Partial<UserRequestDTO>>({});
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: "", // Mantido para compatibilidade, mas não usado no formulário atual
    newPassword: "",
    confirmNewPassword: "",
  });
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressResponseDTO | undefined>(undefined);

  // Fetch user data
  const { data: user, isLoading: isLoadingUser } = useQuery<UserResponseDTO>({
    queryKey: ["user", userId],
    queryFn: async () => (await usersApi.getById(userId!)).data, // Usar userId! para garantir que não é undefined
    enabled: !!userId, // Habilitar a query apenas se userId existir
  });

  // Fetch addresses
  const { data: addresses, isLoading: isLoadingAddresses } = useQuery<AddressResponseDTO[]>({
    queryKey: ["addresses", userId],
    queryFn: async () => (await addressesApi.getByUserId(userId!)).data, // Usar userId!
    enabled: !!userId, // Habilitar a query apenas se userId existir
  });

  useEffect(() => {
    if (user) {
      setProfileFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
      });
    }
  }, [user]);

  // Checa se o usuário é ADMIN
  const isAdmin = authUser?.scopes?.some(scope => scope.name === "ADMIN");
  // Checa se já existe algum endereço cadastrado
  const hasAddresses = addresses && addresses.length > 0;

  // Mutations for User Profile
  const updateUserMutation = useMutation({
    mutationFn: (data: UserRequestDTO) => usersApi.update(userId!, data), // Usar userId!
    onSuccess: () => {
      toast({ title: "Success", description: "Profile updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      setIsEditingProfile(false);
      // Atualiza o user no localStorage para refletir as mudanças no nome/email
      if (user) {
        const updatedUser = { ...user, ...profileFormData };
        localStorage.setItem("grao_user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("auth-changed")); // Notifica o AuthProvider
      }
    },
    onError: (error: any) => { // Tipagem mais genérica para erro
      toast({ title: "Error", description: `Failed to update profile: ${error.response?.data?.message || error.message}`, variant: "destructive" });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (newPassword: string) => usersApi.updatePassword(userId!, newPassword), // Usar userId!
    onSuccess: () => {
      toast({ title: "Success", description: "Password updated successfully." });
      setPasswordFormData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      setIsEditingPassword(false);
    },
    onError: (error: any) => { // Tipagem mais genérica para erro
      toast({ title: "Error", description: `Failed to update password: ${error.response?.data?.message || error.message}`, variant: "destructive" });
    },
  });

  // Mutations for Addresses
  const createAddressMutation = useMutation({
    mutationFn: (data: AddressRequestDTO) => addressesApi.create(data),
    onSuccess: () => {
      toast({ title: "Success", description: "Address added successfully." });
      queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
      setShowAddressForm(false);
    },
    onError: (error: any) => { // Tipagem mais genérica para erro
      toast({ title: "Error", description: `Failed to add address: ${error.response?.data?.message || error.message}`, variant: "destructive" });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AddressRequestDTO }) => addressesApi.update(id, data),
    onSuccess: () => {
      toast({ title: "Success", description: "Address updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
      setShowAddressForm(false);
      setEditingAddress(undefined);
    },
    onError: (error: any) => { // Tipagem mais genérica para erro
      toast({ title: "Error", description: `Failed to update address: ${error.response?.data?.message || error.message}`, variant: "destructive" });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: number) => addressesApi.delete(id),
    onSuccess: () => {
      toast({ title: "Success", description: "Address deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
    },
    onError: (error: any) => { // Tipagem mais genérica para erro
      toast({ title: "Error", description: `Failed to delete address: ${error.response?.data?.message || error.message}`, variant: "destructive" });
    },
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId) {
      updateUserMutation.mutate(profileFormData as UserRequestDTO);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordFormData.newPassword !== passwordFormData.confirmNewPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (userId) {
      updatePasswordMutation.mutate(passwordFormData.newPassword);
    }
  };

  const handleAddAddressClick = () => {
    setEditingAddress(undefined);
    setShowAddressForm(true);
  };

  const handleEditAddressClick = (address: AddressResponseDTO) => {
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  const handleSaveAddress = (data: AddressRequestDTO) => {
    if (!userId) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    const addressDataWithUserId = { ...data, userId: userId }; // Garante que userId é enviado
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: addressDataWithUserId });
    } else {
      createAddressMutation.mutate(addressDataWithUserId);
    }
  };

  const handleDeleteAddress = (id: number) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      deleteAddressMutation.mutate(id);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/"); // Redireciona para a página de login após o logout
  };

  if (isLoadingAuth || isLoadingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg text-muted-foreground">Loading account details...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="pt-28 pb-12 bg-muted/30 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-label">Sua Conta</span>
            <h1 className="section-title mb-8"> Gerenciar Perfil & Endereço</h1>
            <div className="flex flex-wrap gap-4 mt-6">
              {isAdmin && (
                <Link to="/dashboard/admin-dashboard" className="btn-hero-primary flex items-center gap-2 px-6 py-3 text-base">
                  <LayoutDashboard className="w-5 h-5" /> Dashboard
                </Link>
              )}
              <Button onClick={handleLogout} variant="destructive" className="flex items-center gap-2 px-6 py-3 text-base">
                <LogOut className="w-5 h-5" /> Logout
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* My Profile Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-serif text-3xl font-bold text-foreground">Meu Perfil</h2>
            {!isEditingProfile && (
              <Button variant="outline" onClick={() => setIsEditingProfile(true)}>
                <Pencil className="w-4 h-4 mr-2" /> Editar
              </Button>
            )}
          </div>

          {isLoadingUser ? (
            <div className="space-y-4">
              <div className="h-6 bg-muted animate-pulse rounded w-1/2" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
              <div className="h-4 bg-muted animate-pulse rounded w-2/5" />
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profileFormData.name || ""}
                  onChange={handleProfileChange}
                  disabled={!isEditingProfile || updateUserMutation.isPending}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-muted disabled:cursor-not-allowed transition-all"
                />
              </div>
            
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-muted-foreground mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={profileFormData.phone || ""}
                  onChange={handleProfileChange}
                  disabled={!isEditingProfile || updateUserMutation.isPending}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-muted disabled:cursor-not-allowed transition-all"
                />
              </div>

              {isEditingProfile && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-end gap-4 pt-4"
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditingProfile(false);
                      if (user) {
                        setProfileFormData({ name: user.name, email: user.email, phone: user.phone });
                      }
                    }}
                    disabled={updateUserMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-2" /> Cancelar
                  </Button>
                  <Button type="submit" disabled={updateUserMutation.isPending}>
                    {updateUserMutation.isPending ? "Saving..." : <Save className="w-4 h-4 mr-2" />} Save Changes
                  </Button>
                </motion.div>
              )}
            </form>
          )}
        </motion.section>

        {/* Change Password Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-serif text-3xl font-bold text-foreground">Trocar de Senha</h2>
            {!isEditingPassword && (
              <Button variant="outline" onClick={() => setIsEditingPassword(true)}>
                <KeyRound className="w-4 h-4 mr-2" /> Trocar de Senha
              </Button>
            )}
          </div>

          <AnimatePresence>
            {isEditingPassword && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handlePasswordSubmit}
                className="space-y-6 overflow-hidden"
              >
                {/* <div className="mt-4">
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-muted-foreground mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordFormData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    disabled={updatePasswordMutation.isPending}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-muted disabled:cursor-not-allowed"
                  />
                </div> */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-muted-foreground mb-2">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordFormData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    disabled={updatePasswordMutation.isPending}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-muted disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-muted-foreground mb-2">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    value={passwordFormData.confirmNewPassword}
                    onChange={handlePasswordChange}
                    required
                    disabled={updatePasswordMutation.isPending}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-muted disabled:cursor-not-allowed"
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditingPassword(false);
                      setPasswordFormData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
                    }}
                    disabled={updatePasswordMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-2" /> Cancelar
                  </Button>
                  <Button type="submit" disabled={updatePasswordMutation.isPending}>
                    {updatePasswordMutation.isPending ? "Updating..." : <Save className="w-4 h-4 mr-2" />} Update Password
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.section>

        {/* My Addresses Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-card p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-serif text-3xl font-bold text-foreground">Meu Endereço</h2>
            {/* Condicional para o botão "Add New Address" */}
            {!hasAddresses && !showAddressForm && (
              <Button onClick={handleAddAddressClick} disabled={showAddressForm}>
                <Plus className="w-4 h-4 mr-2" /> Adicionar Novo Endereço
              </Button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {showAddressForm && (
              <AddressForm
                key={editingAddress?.id || "new-address"}
                userId={userId!} // Passa o userId real
                address={editingAddress}
                onSave={handleSaveAddress}
                onCancel={() => {
                  setShowAddressForm(false);
                  setEditingAddress(undefined);
                }}
                isSaving={createAddressMutation.isPending || updateAddressMutation.isPending}
              />
            )}
          </AnimatePresence>

          {!showAddressForm && (
            isLoadingAddresses ? (
              <div className="space-y-4 mt-8">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : addresses && addresses.length > 0 ? (
              <div className="space-y-6 mt-8">
                {addresses.map((address) => (
                  <motion.div
                    key={address.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-background rounded-xl border border-border shadow-sm"
                  >
                    <div className="flex-1 mb-4 sm:mb-0">
                      <p className="font-semibold text-lg text-foreground">
                        {address.street}, {address.number} {address.complement && `(${address.complement})`}
                      </p>
                      <p className="text-muted-foreground">
                        {address.city}, {address.state} - {address.cep}
                      </p>
                      {address.isDefault && (
                        <span className="mt-2 inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                          <MapPin className="w-3 h-3" /> Default
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" size="sm" onClick={() => handleEditAddressClick(address)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteAddress(address.id)} disabled={deleteAddressMutation.isPending}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 glass-card border-dashed mt-8">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-xl text-muted-foreground font-serif">Nenhum endereço encontrado. Cadastre seu endereço!</p>
              </div>
            )
          )}
        </motion.section>
      </main>

      <Footer />
    </div>
  );
}