// src/pages/UserManagement.tsx
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Home,
  KeyRound,
  Search,
  Users,
  Shield,
  ShieldCheck,
  UserPlus,
  UserCog,
  Key,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Mail,
  Star,
} from "lucide-react";
import { usersApi, scopesApi, addressesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type {
  UserRequestDTO,
  UserResponseDTO,
  ScopeResponseDTO,
  AddressRequestDTO,
  AddressResponseDTO,
} from "@/types";

// ── Tipos de filtro ────────────────────────────────────────────────────────────
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type ScopeFilter = "ALL" | string;

// ── Configuração de filtros de status ─────────────────────────────────────────
const STATUS_FILTER_CONFIG: {
  value: StatusFilter;
  label: string;
  activeClass: string;
  icon: React.ReactNode;
  badgeClass: string;
}[] = [
  {
    value: "ALL",
    label: "Todos",
    activeClass: "bg-stone-800 text-amber-50 border-stone-800",
    icon: <Users className="h-3.5 w-3.5" />,
    badgeClass: "bg-stone-200 text-stone-700",
  },
  {
    value: "ACTIVE",
    label: "Ativos",
    activeClass: "bg-emerald-700 text-emerald-50 border-emerald-700",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    badgeClass: "bg-emerald-100 text-emerald-800",
  },
  {
    value: "INACTIVE",
    label: "Inativos",
    activeClass: "bg-red-800 text-red-50 border-red-800",
    icon: <XCircle className="h-3.5 w-3.5" />,
    badgeClass: "bg-red-100 text-red-800",
  },
];

// ── Helper: badge de scope ─────────────────────────────────────────────────────
const getScopeBadgeClass = (scopeName: string) => {
  const name = scopeName.replace("SCOPE_", "").toUpperCase();
  if (name === "ADMIN")
    return "bg-indigo-50 text-indigo-700 border border-indigo-100";
  if (name === "MANAGER")
    return "bg-blue-50 text-blue-700 border border-blue-100";
  if (name === "DRIVER")
    return "bg-teal-50 text-teal-700 border border-teal-100";
  if (name === "USER")
    return "bg-stone-50 text-stone-700 border border-stone-200";
  return "bg-amber-50 text-amber-700 border border-amber-100";
};

// ── Helper: cor do avatar ──────────────────────────────────────────────────────
const getAvatarClass = (name: string) => {
  const colors = [
    "bg-indigo-100 text-indigo-700",
    "bg-teal-100 text-teal-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-blue-100 text-blue-700",
    "bg-stone-200 text-stone-700",
  ];
  return colors[name.charCodeAt(0) % colors.length];
};

// ── Métricas resumo ───────────────────────────────────────────────────────────
const METRIC_CONFIG = [
  {
    key: "total",
    label: "Total",
    icon: <Users className="h-4 w-4" />,
    colorClass: "text-stone-700",
    bgClass: "bg-stone-50 border-stone-100",
    iconBg: "bg-stone-100",
  },
  {
    key: "active",
    label: "Ativos",
    icon: <CheckCircle className="h-4 w-4" />,
    colorClass: "text-emerald-700",
    bgClass: "bg-emerald-50 border-emerald-100",
    iconBg: "bg-emerald-100",
  },
  {
    key: "inactive",
    label: "Inativos",
    icon: <XCircle className="h-4 w-4" />,
    colorClass: "text-red-700",
    bgClass: "bg-red-50 border-red-100",
    iconBg: "bg-red-100",
  },
  {
    key: "withAddress",
    label: "Com Endereço",
    icon: <MapPin className="h-4 w-4" />,
    colorClass: "text-indigo-700",
    bgClass: "bg-indigo-50 border-indigo-100",
    iconBg: "bg-indigo-100",
  },
];

// ── Componente Principal ───────────────────────────────────────────────────────
export default function UserManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ── Modais ───────────────────────────────────────────────────────────────────
  const [isUserFormModalOpen, setIsUserFormModalOpen] = useState(false);
  const [isAddressFormModalOpen, setIsAddressFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponseDTO | null>(null);
  const [editingAddress, setEditingAddress] = useState<AddressResponseDTO | null>(null);

  // ── Formulários ──────────────────────────────────────────────────────────────
  const [userForm, setUserForm] = useState<UserRequestDTO>({
    email: "",
    name: "",
    phone: "",
    active: true,
    scopeIds: [],
  });
  const [userPassword, setUserPassword] = useState("");
  const [addressForm, setAddressForm] = useState<AddressRequestDTO>({
    street: "",
    number: "",
    complement: "",
    state: "",
    city: "",
    cep: "",
    isDefault: false,
    userId: 0,
  });

  // ── Filtros ──────────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("ALL");

  // ── Cards expandidos (mobile) ─────────────────────────────────────────────
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const { data: users, isLoading: isLoadingUsers } = useQuery<UserResponseDTO[]>({
    queryKey: ["users"],
    queryFn: async () => (await usersApi.getAll()).data,
  });

  const { data: scopes, isLoading: isLoadingScopes } = useQuery<ScopeResponseDTO[]>({
    queryKey: ["scopes"],
    queryFn: async () => (await scopesApi.getAll()).data,
  });

  const { data: userAddresses, isLoading: isLoadingUserAddresses } = useQuery<AddressResponseDTO[]>({
    queryKey: ["userAddresses", editingUser?.id],
    queryFn: async () => {
      if (!editingUser?.id) return [];
      return (await addressesApi.getByUserId(editingUser.id)).data;
    },
    enabled: !!editingUser?.id,
  });

  // ── Métricas ─────────────────────────────────────────────────────────────────
  const metrics = useMemo(
    () => ({
      total: users?.length ?? 0,
      active: users?.filter((u) => u.active).length ?? 0,
      inactive: users?.filter((u) => !u.active).length ?? 0,
      withAddress: 0, // Preenchido por query separada se necessário
    }),
    [users]
  );

  // ── Filtragem combinada ───────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      const matchesSearch =
        !searchTerm ||
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone?.includes(searchTerm);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && u.active) ||
        (statusFilter === "INACTIVE" && !u.active);

      const matchesScope =
        scopeFilter === "ALL" ||
        u.scopes.some(
          (s) =>
            s.name === scopeFilter ||
            s.name === `SCOPE_${scopeFilter}` ||
            s.name.replace("SCOPE_", "") === scopeFilter
        );

      return matchesSearch && matchesStatus && matchesScope;
    });
  }, [users, searchTerm, statusFilter, scopeFilter]);

  const hasActiveFilters =
    statusFilter !== "ALL" || scopeFilter !== "ALL" || !!searchTerm;

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setScopeFilter("ALL");
  };

  const countByStatus = (s: StatusFilter) => {
    if (!users) return 0;
    if (s === "ALL") return users.length;
    if (s === "ACTIVE") return users.filter((u) => u.active).length;
    return users.filter((u) => !u.active).length;
  };

  const countByScope = (scopeName: string) => {
    if (!users) return 0;
    return users.filter((u) =>
      u.scopes.some(
        (s) =>
          s.name === scopeName ||
          s.name === `SCOPE_${scopeName}` ||
          s.name.replace("SCOPE_", "") === scopeName
      )
    ).length;
  };

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const createUserMutation = useMutation({
    mutationFn: (data: UserRequestDTO) => usersApi.create(data),
    onSuccess: () => {
      toast({ title: "Usuário criado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeUserFormModal();
    },
    onError: () =>
      toast({ title: "Erro ao criar usuário.", variant: "destructive" }),
  });

  const updateUserMutation = useMutation({
    mutationFn: (d: { id: number; data: UserRequestDTO }) =>
      usersApi.update(d.id, d.data),
    onSuccess: () => {
      toast({ title: "Usuário atualizado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeUserFormModal();
    },
    onError: () =>
      toast({ title: "Erro ao atualizar usuário.", variant: "destructive" }),
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (d: { id: number; newPassword: string }) =>
      usersApi.updatePassword(d.id, d.newPassword),
    onSuccess: () => toast({ title: "Senha atualizada com sucesso." }),
    onError: () =>
      toast({ title: "Erro ao atualizar senha.", variant: "destructive" }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      toast({ title: "Usuário removido." });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () =>
      toast({ title: "Erro ao remover usuário.", variant: "destructive" }),
  });

  const createAddressMutation = useMutation({
    mutationFn: (data: AddressRequestDTO) => addressesApi.create(data),
    onSuccess: () => {
      toast({ title: "Endereço adicionado." });
      queryClient.invalidateQueries({ queryKey: ["userAddresses", editingUser?.id] });
      closeAddressFormModal();
    },
    onError: () =>
      toast({ title: "Erro ao criar endereço.", variant: "destructive" }),
  });

  const updateAddressMutation = useMutation({
    mutationFn: (d: { id: number; data: AddressRequestDTO }) =>
      addressesApi.update(d.id, d.data),
    onSuccess: () => {
      toast({ title: "Endereço atualizado." });
      queryClient.invalidateQueries({ queryKey: ["userAddresses", editingUser?.id] });
      closeAddressFormModal();
    },
    onError: () =>
      toast({ title: "Erro ao atualizar endereço.", variant: "destructive" }),
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: number) => addressesApi.delete(id),
    onSuccess: () => {
      toast({ title: "Endereço removido." });
      queryClient.invalidateQueries({ queryKey: ["userAddresses", editingUser?.id] });
    },
    onError: () =>
      toast({ title: "Erro ao remover endereço.", variant: "destructive" }),
  });

  // ── Modal helpers ─────────────────────────────────────────────────────────────
  const openCreateUserModal = () => {
    setEditingUser(null);
    setUserForm({ email: "", name: "", phone: "", active: true, scopeIds: [] });
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
      scopeIds: user.scopes.length > 0 ? [user.scopes[0].id] : [],
    });
    setUserPassword("");
    setIsUserFormModalOpen(true);
  };

  const closeUserFormModal = () => {
    setIsUserFormModalOpen(false);
    setEditingUser(null);
    setUserForm({ email: "", name: "", phone: "", active: true, scopeIds: [] });
    setUserPassword("");
  };

  const openCreateAddressModal = () => {
    if (!editingUser) return;
    setEditingAddress(null);
    setAddressForm({
      street: "", number: "", complement: "", state: "",
      city: "", cep: "", isDefault: false, userId: editingUser.id,
    });
    setIsAddressFormModalOpen(true);
  };

  const openEditAddressModal = (address: AddressResponseDTO) => {
    if (!editingUser) return;
    setEditingAddress(address);
    setAddressForm({
      street: address.street, number: address.number,
      complement: address.complement, state: address.state,
      city: address.city, cep: address.cep,
      isDefault: address.isDefault, userId: editingUser.id,
    });
    setIsAddressFormModalOpen(true);
  };

  const closeAddressFormModal = () => {
    setIsAddressFormModalOpen(false);
    setEditingAddress(null);
    setAddressForm({
      street: "", number: "", complement: "", state: "",
      city: "", cep: "", isDefault: false, userId: 0,
    });
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateUserMutation.mutateAsync({ id: editingUser.id, data: userForm });
        if (userPassword) {
          await updatePasswordMutation.mutateAsync({ id: editingUser.id, newPassword: userPassword });
        }
      } else {
        if (!userPassword) {
          toast({ title: "Senha obrigatória para novos usuários.", variant: "destructive" });
          return;
        }
        await createUserMutation.mutateAsync({ ...userForm, password: userPassword });
      }
    } catch {
      // handled by mutations
    }
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: addressForm });
    } else {
      createAddressMutation.mutate(addressForm);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (isLoadingUsers || isLoadingScopes) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-stone-500" />
          <p className="text-stone-500 text-sm font-medium">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* ── Cabeçalho ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-serif text-4xl font-bold text-foreground tracking-tight">
              Gestão de Usuários
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              {filteredUsers.length > 0
                ? `${filteredUsers.length} usuário${filteredUsers.length !== 1 ? "s" : ""} encontrado${filteredUsers.length !== 1 ? "s" : ""}`
                : "Nenhum usuário cadastrado"}
            </p>
          </div>
          <button
            onClick={openCreateUserModal}
            className="inline-flex items-center gap-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-amber-50 px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Novo Usuário
          </button>
        </motion.div>

        {/* ── Cards de métricas ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {METRIC_CONFIG.map((m) => (
            <div
              key={m.key}
              className={cn(
                "rounded-2xl border p-4 flex flex-col gap-2 transition-all",
                m.bgClass
              )}
            >
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", m.iconBg)}>
                <span className={m.colorClass}>{m.icon}</span>
              </div>
              <div>
                <p className={cn("text-2xl font-black", m.colorClass)}>
                  {metrics[m.key as keyof typeof metrics]}
                </p>
                <p className={cn("text-xs font-semibold mt-0.5 opacity-80", m.colorClass)}>
                  {m.label}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Filtros ─────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-4"
        >
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-stone-200 bg-card text-foreground text-sm outline-none focus:ring-2 focus:ring-stone-300 placeholder:text-stone-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filtros em card */}
          <div className="bg-card rounded-2xl border border-border/60 p-5 sm:p-6 space-y-5 shadow-sm">

            {/* Status */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                Status
              </p>
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTER_CONFIG.map((f) => {
                  const isActive = statusFilter === f.value;
                  const count = countByStatus(f.value);
                  return (
                    <button
                      key={f.value}
                      onClick={() => setStatusFilter(f.value)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold border transition-all",
                        isActive
                          ? f.activeClass + " shadow-sm"
                          : "bg-background border-stone-200 text-stone-600 hover:border-stone-400 hover:bg-stone-50"
                      )}
                    >
                      {f.icon}
                      <span className="hidden sm:inline">{f.label}</span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-black",
                          isActive ? "bg-white/20 text-white" : f.badgeClass
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Permissões / Scopes */}
            {scopes && scopes.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Permissões
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setScopeFilter("ALL")}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-bold border transition-all",
                      scopeFilter === "ALL"
                        ? "bg-stone-800 text-amber-50 border-stone-800"
                        : "bg-background border-stone-200 text-stone-600 hover:bg-stone-50"
                    )}
                  >
                    Todos
                  </button>
                  {scopes.map((scope) => {
                    const displayName = scope.name.replace("SCOPE_", "");
                    const isActive = scopeFilter === displayName || scopeFilter === scope.name;
                    const count = countByScope(displayName);
                    return (
                      <button
                        key={scope.id}
                        onClick={() => setScopeFilter(isActive ? "ALL" : displayName)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all",
                          isActive
                            ? "bg-stone-800 text-amber-50 border-stone-800"
                            : "bg-background border-stone-200 text-stone-600 hover:bg-stone-50"
                        )}
                      >
                        {displayName}
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-black",
                            isActive ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"
                          )}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Badges de filtros ativos */}
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex flex-wrap items-center gap-2"
              >
                <span className="text-xs text-stone-500 font-medium">
                  Mostrando{" "}
                  <span className="font-black text-foreground">{filteredUsers.length}</span>{" "}
                  {filteredUsers.length === 1 ? "usuário" : "usuários"}
                </span>

                {statusFilter !== "ALL" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 px-3 py-1 text-xs font-bold">
                    {STATUS_FILTER_CONFIG.find((f) => f.value === statusFilter)?.label}
                    <button onClick={() => setStatusFilter("ALL")} className="hover:text-red-600 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {scopeFilter !== "ALL" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 px-3 py-1 text-xs font-bold">
                    {scopeFilter}
                    <button onClick={() => setScopeFilter("ALL")} className="hover:text-red-600 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                <button
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-stone-500 underline underline-offset-2 hover:text-red-600 transition-colors"
                >
                  Limpar tudo
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Tabela / Cards ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden"
        >
          {filteredUsers.length > 0 ? (
            <>
              {/* ── Desktop: tabela ─────────────────────────────────────────── */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-stone-50/80 text-left">
                      {["Usuário", "Contato", "Permissões", "Status", "Ações"].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-4 text-xs font-black uppercase tracking-wider text-stone-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredUsers.map((user) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-stone-50/50 transition-colors"
                      >
                        {/* Avatar + Nome */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 uppercase",
                                getAvatarClass(user.name)
                              )}
                            >
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{user.name}</p>
                              <p className="text-xs text-stone-400">ID #{user.id}</p>
                            </div>
                          </div>
                        </td>

                        {/* Contato */}
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <p className="text-xs text-stone-600 flex items-center gap-1">
                              <Mail className="h-3 w-3 text-stone-400" />
                              {user.email}
                            </p>
                            {user.phone && (
                              <p className="text-xs text-stone-500 flex items-center gap-1">
                                <Phone className="h-3 w-3 text-stone-400" />
                                {user.phone}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Scopes */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {user.scopes.length > 0 ? (
                              user.scopes.map((s) => (
                                <span
                                  key={s.id}
                                  className={cn(
                                    "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase",
                                    getScopeBadgeClass(s.name)
                                  )}
                                >
                                  {s.name.replace("SCOPE_", "")}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-stone-400">—</span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border",
                              user.active
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-red-50 text-red-700 border-red-100"
                            )}
                          >
                            {user.active
                              ? <><CheckCircle className="h-3 w-3" /> Ativo</>
                              : <><XCircle className="h-3 w-3" /> Inativo</>}
                          </span>
                        </td>

                        {/* Ações */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => openEditUserModal(user)}
                              className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Deseja realmente remover este usuário?")) {
                                  deleteUserMutation.mutate(user.id);
                                }
                              }}
                              disabled={deleteUserMutation.isPending}
                              className="p-2 rounded-xl text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Remover"
                            >
                              {deleteUserMutation.isPending
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile: cards expansíveis ───────────────────────────────── */}
              <div className="sm:hidden divide-y divide-border/50">
                {filteredUsers.map((user) => {
                  const isExpanded = expandedCardId === user.id;
                  return (
                    <div key={user.id} className="p-4">
                      {/* Linha principal */}
                      <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => setExpandedCardId(isExpanded ? null : user.id)}
                      >
                        {/* Avatar */}
                        <div
                          className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center font-black text-sm shrink-0 uppercase",
                            getAvatarClass(user.name)
                          )}
                        >
                          {user.name.charAt(0)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-foreground truncate">{user.name}</p>
                            <span
                              className={cn(
                                "shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                user.active
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : "bg-red-50 text-red-700 border-red-100"
                              )}
                            >
                              {user.active ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                          <p className="text-xs text-stone-400 truncate mt-0.5">{user.email}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {user.scopes.map((s) => (
                              <span
                                key={s.id}
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-[9px] font-black uppercase",
                                  getScopeBadgeClass(s.name)
                                )}
                              >
                                {s.name.replace("SCOPE_", "")}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Chevron */}
                        <div className="shrink-0 text-stone-400">
                          {isExpanded
                            ? <ChevronUp className="h-4 w-4" />
                            : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>

                      {/* Painel expandido */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 space-y-3">
                              {/* Detalhes de contato */}
                              <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-xl bg-stone-50 border border-stone-100 p-3">
                                  <p className="text-[9px] uppercase font-black text-stone-400 mb-1">E-mail</p>
                                  <p className="text-xs font-semibold text-foreground truncate">{user.email}</p>
                                </div>
                                <div className="rounded-xl bg-stone-50 border border-stone-100 p-3">
                                  <p className="text-[9px] uppercase font-black text-stone-400 mb-1">Telefone</p>
                                  <p className="text-xs font-semibold text-foreground">{user.phone || "—"}</p>
                                </div>
                              </div>

                              {/* Data de cadastro */}
                              {user.registerDate && (
                                <div className="rounded-xl bg-stone-50 border border-stone-100 p-3">
                                  <p className="text-[9px] uppercase font-black text-stone-400 mb-1">Cadastrado em</p>
                                  <p className="text-xs font-semibold text-foreground">
                                    {new Date(user.registerDate).toLocaleDateString("pt-BR", {
                                      day: "2-digit", month: "long", year: "numeric"
                                    })}
                                  </p>
                                </div>
                              )}

                              {/* Ações */}
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => openEditUserModal(user)}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-stone-200 bg-background text-stone-700 text-xs font-bold hover:bg-stone-50 transition-colors"
                                >
                                  <Edit className="h-3.5 w-3.5" /> Editar
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm("Deseja realmente remover este usuário?")) {
                                      deleteUserMutation.mutate(user.id);
                                    }
                                  }}
                                  disabled={deleteUserMutation.isPending}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-100 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
                                >
                                  {deleteUserMutation.isPending
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <><Trash2 className="h-3.5 w-3.5" /> Remover</>}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* ── Estado vazio ─────────────────────────────────────────────── */
            <div className="py-20 text-center">
              <div className="flex flex-col items-center gap-3 text-stone-400">
                <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center">
                  <Users className="w-6 h-6 opacity-50" />
                </div>
                <p className="font-serif text-lg font-semibold text-stone-500">
                  Nenhum usuário encontrado
                </p>
                <p className="text-xs">
                  {hasActiveFilters
                    ? "Tente remover ou combinar filtros diferentes."
                    : "Adicione o primeiro usuário ao sistema."}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-1 text-xs font-bold text-stone-600 underline underline-offset-2 hover:text-red-600 transition-colors"
                  >
                    Limpar todos os filtros
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Modal de Usuário                                                       */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isUserFormModalOpen} onOpenChange={setIsUserFormModalOpen}>
        <DialogContent className="sm:max-w-[680px] bg-card text-foreground rounded-2xl p-0 overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-border/50 bg-stone-50/80">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl font-bold text-foreground flex items-center gap-2">
                {editingUser
                  ? <><UserCog className="h-5 w-5 text-stone-500" /> Editar Usuário</>
                  : <><UserPlus className="h-5 w-5 text-stone-500" /> Novo Usuário</>}
              </DialogTitle>
              <DialogDescription className="text-stone-500 text-sm">
                {editingUser
                  ? "Atualize as informações do usuário abaixo."
                  : "Preencha os dados para criar um novo acesso."}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Body */}
          <form
            onSubmit={handleUserSubmit}
            className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto"
          >
            {/* Nome + Telefone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-stone-500">
                  Nome Completo
                </Label>
                <Input
                  value={userForm.name}
                  onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: João da Silva"
                  required
                  className="rounded-xl border-stone-200 bg-background focus:ring-stone-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-stone-500 flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Telefone
                </Label>
                <Input
                  value={userForm.phone}
                  onChange={(e) => setUserForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  className="rounded-xl border-stone-200 bg-background focus:ring-stone-300"
                />
              </div>
            </div>

            {/* E-mail */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-stone-500 flex items-center gap-1">
                <Mail className="h-3 w-3" /> E-mail
              </Label>
              <Input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@exemplo.com"
                required
                className="rounded-xl border-stone-200 bg-background focus:ring-stone-300"
              />
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-stone-500 flex items-center gap-1">
                <Key className="h-3 w-3" />
                {editingUser ? "Nova Senha (opcional)" : "Senha"}
              </Label>
              <Input
                type="password"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder={editingUser ? "Deixe em branco para não alterar" : "••••••••"}
                required={!editingUser}
                className="rounded-xl border-stone-200 bg-background focus:ring-stone-300"
              />
            </div>

            {/* Permissões */}
            {scopes && scopes.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-stone-500 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Permissões
                </Label>
                <div className="flex flex-wrap gap-2">
                  {scopes.map((scope) => {
                    const isSelected = userForm.scopeIds?.includes(scope.id);
                    return (
                      <button
                        key={scope.id}
                        type="button"
                        onClick={() => {
                          const current = userForm.scopeIds ?? [];
                          const updated = isSelected
                            ? current.filter((id) => id !== scope.id)
                            : [...current, scope.id];
                          setUserForm((p) => ({ ...p, scopeIds: updated }));
                        }}
                        className={cn(
                          "rounded-xl px-3.5 py-2 text-xs font-bold border transition-all",
                          isSelected
                            ? "bg-stone-800 text-amber-50 border-stone-800 shadow-sm"
                            : "bg-background border-stone-200 text-stone-600 hover:bg-stone-50"
                        )}
                      >
                        {scope.name.replace("SCOPE_", "")}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Status ativo */}
            <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-foreground">Usuário Ativo</p>
                <p className="text-xs text-stone-500">Permite ou bloqueia o acesso ao sistema</p>
              </div>
              <Switch
                checked={userForm.active}
                onCheckedChange={(v) => setUserForm((p) => ({ ...p, active: v }))}
              />
            </div>

            {/* ── Seção de Endereços (somente em edição) ─────────────────── */}
            {editingUser && (
              <div className="border-t border-dashed border-stone-200 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-stone-500" /> Endereços
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Gerencie os endereços deste usuário
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openCreateAddressModal}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-2 text-xs font-bold transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </button>
                </div>

                {isLoadingUserAddresses ? (
                  <div className="flex items-center justify-center py-6 text-stone-400">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span className="text-sm">Carregando endereços...</span>
                  </div>
                ) : userAddresses && userAddresses.length > 0 ? (
                  <div className="space-y-2">
                    {userAddresses.map((address) => (
                      <div
                        key={address.id}
                        className="flex items-start justify-between gap-3 p-4 rounded-xl border border-stone-100 bg-stone-50/80"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                            <Home className="h-4 w-4 text-stone-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-foreground truncate">
                                {address.street}, {address.number}
                                {address.complement && ` — ${address.complement}`}
                              </p>
                              {address.isDefault && (
                                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-black uppercase">
                                  <Star className="h-2.5 w-2.5" /> Padrão
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-500 mt-0.5">
                              {address.city}, {address.state} — CEP: {address.cep}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => openEditAddressModal(address)}
                            className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition-colors"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteAddressMutation.mutate(address.id)}
                            disabled={deleteAddressMutation.isPending}
                            className="p-1.5 rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            {deleteAddressMutation.isPending
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center rounded-xl border border-dashed border-stone-200">
                    <Home className="h-8 w-8 text-stone-300 mx-auto mb-2" />
                    <p className="text-sm text-stone-400 font-medium">
                      Nenhum endereço cadastrado
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <DialogFooter className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={closeUserFormModal}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 bg-background text-stone-700 text-sm font-bold hover:bg-stone-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={
                  createUserMutation.isPending ||
                  updateUserMutation.isPending ||
                  updatePasswordMutation.isPending
                }
                className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-amber-50 text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {(createUserMutation.isPending ||
                  updateUserMutation.isPending ||
                  updatePasswordMutation.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingUser ? (
                  "Salvar Alterações"
                ) : (
                  "Criar Usuário"
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Modal de Endereço                                                      */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isAddressFormModalOpen} onOpenChange={setIsAddressFormModalOpen}>
        <DialogContent className="sm:max-w-[520px] bg-card text-foreground rounded-2xl p-0 overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-border/50 bg-stone-50/80">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl font-bold text-foreground flex items-center gap-2">
                <MapPin className="h-5 w-5 text-stone-500" />
                {editingAddress ? "Editar Endereço" : "Novo Endereço"}
              </DialogTitle>
              <DialogDescription className="text-stone-500 text-sm">
                {editingAddress
                  ? "Atualize os dados do endereço."
                  : "Preencha os dados do novo endereço."}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Body */}
          <form
            onSubmit={handleAddressSubmit}
            className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto"
          >
            {/* Rua */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-stone-500">Rua / Logradouro</Label>
              <Input
                value={addressForm.street}
                onChange={(e) => setAddressForm((p) => ({ ...p, street: e.target.value }))}
                placeholder="Ex: Rua das Flores"
                required
                className="rounded-xl border-stone-200 bg-background focus:ring-stone-300"
              />
            </div>

            {/* Número + Complemento */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-stone-500">Número</Label>
                <Input
                  value={addressForm.number}
                  onChange={(e) => setAddressForm((p) => ({ ...p, number: e.target.value }))}
                  placeholder="Ex: 123"
                  required
                  className="rounded-xl border-stone-200 bg-background focus:ring-stone-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-stone-500">Complemento</Label>
                <Input
                  value={addressForm.complement ?? ""}
                  onChange={(e) => setAddressForm((p) => ({ ...p, complement: e.target.value }))}
                  placeholder="Apto, bloco..."
                  className="rounded-xl border-stone-200 bg-background focus:ring-stone-300"
                />
              </div>
            </div>

            {/* CEP + Cidade + Estado */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-stone-500">CEP</Label>
                <Input
                  value={addressForm.cep}
                  onChange={(e) => setAddressForm((p) => ({ ...p, cep: e.target.value }))}
                  placeholder="00000-000"
                  required
                  className="rounded-xl border-stone-200 bg-background focus:ring-stone-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-stone-500">Cidade</Label>
                <Input
                  value={addressForm.city}
                  onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))}
                  placeholder="Ex: São Paulo"
                  required
                  className="rounded-xl border-stone-200 bg-background focus:ring-stone-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-stone-500">Estado</Label>
                <Input
                  value={addressForm.state}
                  onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))}
                  placeholder="Ex: SP"
                  required
                  className="rounded-xl border-stone-200 bg-background focus:ring-stone-300"
                />
              </div>
            </div>

            {/* Endereço padrão */}
            <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-500" /> Endereço Padrão
                </p>
                <p className="text-xs text-stone-500">Usar como endereço principal do usuário</p>
              </div>
              <Switch
                checked={addressForm.isDefault}
                onCheckedChange={(v) => setAddressForm((p) => ({ ...p, isDefault: v }))}
              />
            </div>

          {/* Footer do modal de endereço */}
            <DialogFooter className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={closeAddressFormModal}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 bg-background text-stone-700 text-sm font-bold hover:bg-stone-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-amber-50 text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {(createAddressMutation.isPending || updateAddressMutation.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingAddress ? (
                  "Salvar Endereço"
                ) : (
                  "Adicionar Endereço"
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
