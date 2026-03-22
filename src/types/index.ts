export enum TimeRange {
    FIFTEEN_MINUTES = "15 minutos",
    THIRTY_MINUTES = "30 minutos",
    ONE_HOUR = "1 hora",
    TWO_HOURS = "2 horas",
}

export enum TimePeriod {
    TODAY = "TODAY",
    YESTERDAY = "YESTERDAY",
    THIS_WEEK = "THIS_WEEK",
    LAST_WEEK = "LAST_WEEK",
    THIS_MONTH = "THIS_MONTH",
    LAST_MONTH = "LAST_MONTH",
    CUSTOM = "CUSTOM",
    ALL = "ALL"
}

export enum PaymentStatus {
    PENDING = "PENDING",
    COMPLETE = "COMPLETE",
    FAILED = "FAILED",
    CANCELED = "CANCELED",
    PAID = "PAID",
}

export enum PaymentMethod {
    PIX = "PIX",
    CREDIT_CARD = "CREDIT_CARD",
    DEBIT_CARD = "DEBIT_CARD",
}


export enum OrderStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    CANCELED = "CANCELED",
    PAID = "PAID",
    PROCESSING = "PROCESSING",
    SENDED = "SENDED",
    RECUSE = "RECUSE",
}

// --- DTOs de Resposta (Response DTOs) ---

export interface ScopeResponseDTO {
    id: number;
    name: string;
    description: string;
}

export interface PaymentResponseDTO {
    id: number;
    orderId: number;
    dateCreated: string;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    txId: string;
    totalPrice: number;
    mpPaymentId: string;
    mpPreferenceId: string;
    qrCodeBase64: string;
    qrCodeText: string;
    paymentUrl: string;
    dateOfExpiration: string;
    dateApproved: string | null;
}

export interface UserResponseDTO {
    id: number;
    email: string;
    name: string;
    phone: string;
    registerDate: string;
    active: boolean;
    scopes: ScopeResponseDTO[];
}

export interface AuthResponseDTO {
    token: string; // Corresponde ao 'token' do seu AuthResponseDTO.java
    user: UserResponseDTO; // Corresponde ao 'user' do seu AuthResponseDTO.java
}

export interface CategoryResponseDTO {
    id: number;
    name: string;
    description: string;
}

export interface ProductResponseDTO {
    id: number;
    name: string;
    description: string;
    storage: number;
    imageUrl: string;
    registerDate: string; // LocalDateTime no Java -> string ISO 8601 no TypeScript
    price: number; // BigDecimal no Java -> number no TypeScript
    active: boolean;
    category: CategoryResponseDTO;
}

export interface OrderItemResponseDTO {
    id: number;
    productId: number;
    productName: string;
    quantity: number;
    priceAtTime: number; // BigDecimal no Java -> number no TypeScript
    subtotal: number; // BigDecimal no Java -> number no TypeScript
}

export interface PaymentResponseDTO {
    id: number;
    orderId: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    txId: string;
    totalPrice: number; 
}

export interface OrderResponseDTO {
    id: number;
    userId: number;
    userEmail: string;
    items: OrderItemResponseDTO[];
    orderStatus: OrderStatus;
    paymentMethod: PaymentMethod;
    payment: PaymentResponseDTO;
    orderDate: string; 
    totalPrice: number; 
}

export interface AddressResponseDTO {
    id: number;
    street: string;
    number: string;
    complement: string;
    state: string;
    city: string;
    cep: string;
    isDefault: boolean;
    userId: number;
}

export interface ExpenseResponseDTO {
    id: number;
    name: string;
    price: number;
    date: string;
}

// Nova interface para o FinancialReport
export interface FinancialReportResponseDTO {
    totalRevenue: number; // Corresponde a totalRevenue no Java
    totalExpenses: number;
    totalOrders: number;
    completedOrders: number;
    canceledOrders: number;
    pendingOrders: number;
    processingOrders: number; // Este campo estava faltando ou não estava sendo reconhecido
    netProfit: number;
    revenueByCategory: { [key: string]: number };
    revenueByProduct: { [key: string]: number };
    quantitySoldByProduct: { [key: string]: number };
    quantitySoldByCategory: { [key: string]: number };
    revenueByPaymentMethod: { [key: string]: number }; // Adicionado na versão completa
}

export interface TopItemDTO {
  name: string;
  value: number;
}

export interface UserLoginRequestDTO {
    email: string;
    password: string;
}

export interface ExpenseRequestDTO {
    name: string;
    price: number;
}

export interface ScopeRequestDTO{
    name: string;
    description: string;
}

export interface UserRegisterRequestDTO {
    email: string;
    name: string;
    phone: string;
    password: string;
    cpf: string
}

export interface UserRequestDTO { 
    email: string;
    name: string;
    phone: string;
    cpf: string;
    password?: string; 
    active?: boolean;
    scopeIds?: number[];
}

export interface CategoryRequestDTO {
    name: string;
    description?: string;
}

export interface ProductRequestDTO {
    name: string;
    description: string;
    storage: number;
    price: number; // BigDecimal no Java -> number no TypeScript
    active: boolean;
    categoryId: number; // Assumindo que o backend espera o ID da categoria
    // imageUrl não está aqui, pois é enviado como MultipartFile
}

export interface OrderItemRequestDTO {
    productId: number;
    quantity: number;
}

export interface OrderRequestDTO {
    paymentMethod: PaymentMethod;
    items: OrderItemRequestDTO[];
}

export interface AddressRequestDTO {
    street: string;
    number: string;
    complement?: string;
    state: string;
    city: string;
    cep: string;
    isDefault?: boolean;
    userId: number;
}


export interface PageableResponse<T> {
    content: T[];
    pageable: {
        pageNumber: number;
        pageSize: number;
        sort: {
            empty: boolean;
            sorted: boolean;
            unsorted: boolean;
        };
        offset: number;
        paged: boolean;
        unpaged: boolean;
    };
    last: boolean;
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    sort: {
        empty: boolean;
        sorted: boolean;
        unsorted: boolean;
    };
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}