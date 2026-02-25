import axios, { type AxiosInstance } from "axios";

const ABACATEPAY_API_URL = "https://api.abacatepay.com/v1";

interface AbacatePayResponse<T> {
	data: T | null;
	error: string | null;
}

interface Customer {
	id: string;
	metadata: {
		name: string;
		cellphone: string;
		email: string;
		taxId: string;
	};
}

interface CreateCustomerRequest {
	name: string;
	cellphone: string;
	email: string;
	taxId: string;
}

interface Product {
	externalId: string;
	name: string;
	description?: string;
	quantity: number;
	price: number; // em centavos
}

interface CreateBillingRequest {
	frequency: "ONE_TIME" | "MULTIPLE_PAYMENTS";
	methods: ("PIX" | "CARD")[];
	products: Product[];
	returnUrl: string;
	completionUrl: string;
	customerId?: string;
	customer?: CreateCustomerRequest;
	couponCode?: string;
	allowCoupons?: boolean;
	metadata?: Record<string, any>;
}

interface Billing {
	id: string;
	url: string;
	amount: number; // em centavos
	status: "PENDING" | "PAID" | "EXPIRED" | "CANCELED";
	devMode: boolean;
	methods: ("PIX" | "CARD")[];
	products: Array<{
		id: string;
		externalId: string;
		quantity: number;
	}>;
	frequency: "ONE_TIME" | "MULTIPLE_PAYMENTS";
	nextBilling: string | null;
	customer: Customer;
	metadata?: Record<string, any>;
	externalId?: string;
	createdAt: string;
	updatedAt: string;
}

interface CreatePixQrCodeRequest {
	amount: number; // em centavos
	expiresIn?: number; // segundos
	description?: string;
	customer?: CreateCustomerRequest;
	metadata?: Record<string, any>;
}

interface PixQrCode {
	id: string;
	amount: number;
	status: "PENDING" | "PAID" | "EXPIRED";
	devMode: boolean;
	brCode: string;
	brCodeBase64: string;
	platformFee: number;
	createdAt: string;
	updatedAt: string;
	expiresAt: string;
	metadata?: Record<string, any>;
}

interface CreateWithdrawRequest {
	externalId: string;
	amount: number; // centavos, mínimo 350
	pix: { type: "CPF" | "CNPJ" | "PHONE" | "EMAIL" | "RANDOM" | "BR_CODE"; key: string };
	description?: string;
}

interface WithdrawTransaction {
	id: string;
	status: string;
	devMode: boolean;
	receiptUrl: string;
	kind: "WITHDRAW";
	amount: number;
	platformFee: number;
	externalId: string;
	createdAt: string;
	updatedAt: string;
}

interface CreateCouponRequest {
	code: string;
	notes?: string;
	maxRedeems: number; // -1 para ilimitado
	discountKind: "PERCENTAGE" | "FIXED";
	discount: number;
	metadata?: Record<string, any>;
}

interface Coupon {
	id: string;
	notes?: string;
	maxRedeems: number;
	redeemsCount: number;
	discountKind: "PERCENTAGE" | "FIXED";
	discount: number;
	devMode: boolean;
	status: "ACTIVE" | "INACTIVE";
	createdAt: string;
	updatedAt: string;
	metadata?: Record<string, any>;
}

class AbacatePayClient {
	private client: AxiosInstance;

	constructor() {
		this.client = axios.create({
			baseURL: ABACATEPAY_API_URL,
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
		});

		// Adicionar interceptor para injetar o token dinamicamente
		this.client.interceptors.request.use((config) => {
			const token = process.env.ABACATEPAY_API_TOKEN || "";
			if (token) {
				config.headers.Authorization = `Bearer ${token}`;
			}
			return config;
		});
	}

	// ============================================
	// SEGURANÇA
	// ============================================

	/**
	 * Verifica a assinatura do webhook enviada pela AbacatePay
	 * @param rawBody Corpo bruto da requisição
	 * @param signature Assinatura do header X-Webhook-Signature
	 * @returns true se a assinatura for válida
	 */
	verifyWebhookSignature(rawBody: string, signature: string): boolean {
		try {
			const crypto = require("node:crypto");
			// A chave pública/secret para HMAC pode vir do env
			const secret = process.env.ABACATEPAY_WEBHOOK_SECRET || "";

			if (!secret || !signature) return false;

			const bodyBuffer = Buffer.from(rawBody, "utf8");
			const expectedSig = crypto
				.createHmac("sha256", secret)
				.update(bodyBuffer)
				.digest("base64");

			const A = Buffer.from(expectedSig);
			const B = Buffer.from(signature);

			return A.length === B.length && crypto.timingSafeEqual(A, B);
		} catch (error) {
			console.error("[AbacatePay] Erro ao verificar assinatura:", error);
			return false;
		}
	}

	// ============================================
	// CLIENTES
	// ============================================

	async createCustomer(
		data: CreateCustomerRequest,
	): Promise<AbacatePayResponse<Customer>> {
		try {
			const response = await this.client.post<AbacatePayResponse<Customer>>(
				"/customer/create",
				data,
			);
			return response.data;
		} catch (error: any) {
			return {
				data: null,
				error: error.response?.data?.error || error.message,
			};
		}
	}

	async listCustomers(): Promise<AbacatePayResponse<Customer[]>> {
		try {
			const response =
				await this.client.get<AbacatePayResponse<Customer[]>>("/customer/list");
			return response.data;
		} catch (error: any) {
			return {
				data: null,
				error: error.response?.data?.error || error.message,
			};
		}
	}

	// ============================================
	// COBRANÇAS
	// ============================================

	async createBilling(
		data: CreateBillingRequest,
	): Promise<AbacatePayResponse<Billing>> {
		try {
			const token = process.env.ABACATEPAY_API_TOKEN;
			if (!token) {
				return { data: null, error: "ABACATEPAY_API_TOKEN não configurado no .env" };
			}

			console.log("[AbacatePay] Criando billing:", {
				frequency: data.frequency,
				methods: data.methods,
				productsCount: data.products.length,
				hasCustomer: !!data.customer,
				hasCustomerId: !!data.customerId,
			});

			const response = await this.client.post<AbacatePayResponse<Billing>>(
				"/billing/create",
				data,
			);

			console.log("[AbacatePay] Resposta recebida:", {
				status: response.status,
				hasData: !!response.data?.data,
				hasError: !!response.data?.error,
				error: response.data?.error,
			});

			return response.data;
		} catch (error: any) {
			console.error("[AbacatePay] Erro ao criar billing:", {
				message: error.message,
				response: error.response?.data,
				status: error.response?.status,
				stack: error.stack,
			});

			return {
				data: null,
				error:
					error.response?.data?.error ||
					error.message ||
					"Internal Server Error",
			};
		}
	}

	async getBilling(id: string): Promise<AbacatePayResponse<Billing>> {
		try {
			const response = await this.client.get<AbacatePayResponse<Billing>>(
				`/billing/get?id=${id}`,
			);
			return response.data;
		} catch (error: any) {
			return {
				data: null,
				error: error.response?.data?.error || error.message,
			};
		}
	}

	async listBillings(): Promise<AbacatePayResponse<Billing[]>> {
		try {
			const response =
				await this.client.get<AbacatePayResponse<Billing[]>>("/billing/list");
			return response.data;
		} catch (error: any) {
			return {
				data: null,
				error: error.response?.data?.error || error.message,
			};
		}
	}

	// ============================================
	// PIX QRCODE
	// ============================================

	async createPixQrCode(
		data: CreatePixQrCodeRequest,
	): Promise<AbacatePayResponse<PixQrCode>> {
		try {
			const response = await this.client.post<AbacatePayResponse<PixQrCode>>(
				"/pixQrCode/create",
				data,
			);
			return response.data;
		} catch (error: any) {
			return {
				data: null,
				error: error.response?.data?.error || error.message,
			};
		}
	}

	async checkPixQrCodeStatus(
		id: string,
	): Promise<AbacatePayResponse<{ status: string; expiresAt: string }>> {
		try {
			const response = await this.client.get<
				AbacatePayResponse<{ status: string; expiresAt: string }>
			>(`/pixQrCode/check?id=${id}`);
			return response.data;
		} catch (error: any) {
			return {
				data: null,
				error: error.response?.data?.error || error.message,
			};
		}
	}

	async simulatePixPayment(
		id: string,
		metadata?: Record<string, any>,
	): Promise<AbacatePayResponse<PixQrCode>> {
		try {
			const response = await this.client.post<AbacatePayResponse<PixQrCode>>(
				`/pixQrCode/simulate-payment?id=${id}`,
				{ metadata: metadata || {} },
			);
			return response.data;
		} catch (error: any) {
			return {
				data: null,
				error: error.response?.data?.error || error.message,
			};
		}
	}

	// ============================================
	// WITHDRAW
	// ============================================

	/**
	 * Cria um saque para transferir valores da conta para uma chave PIX.
	 * Valor mínimo: 350 centavos (R$ 3,50).
	 */
	async createWithdraw(
		data: CreateWithdrawRequest,
	): Promise<AbacatePayResponse<WithdrawTransaction>> {
		try {
			const response = await this.client.post<
				AbacatePayResponse<WithdrawTransaction>
			>("/withdraw/create", {
				externalId: data.externalId,
				method: "PIX",
				amount: data.amount,
				pix: data.pix,
				description: data.description,
			});
			return response.data;
		} catch (error: any) {
			return {
				data: null,
				error: error.response?.data?.error || error.message,
			};
		}
	}

	// ============================================
	// CUPONS
	// ============================================

	async createCoupon(
		data: CreateCouponRequest,
	): Promise<AbacatePayResponse<Coupon>> {
		try {
			const response = await this.client.post<AbacatePayResponse<Coupon>>(
				"/coupon/create",
				{ data },
			);
			return response.data;
		} catch (error: any) {
			return {
				data: null,
				error: error.response?.data?.error || error.message,
			};
		}
	}

	async listCoupons(): Promise<AbacatePayResponse<Coupon[]>> {
		try {
			const response =
				await this.client.get<AbacatePayResponse<Coupon[]>>("/coupon/list");
			return response.data;
		} catch (error: any) {
			return {
				data: null,
				error: error.response?.data?.error || error.message,
			};
		}
	}
}

export const abacatePay = new AbacatePayClient();

export type {
	Customer,
	CreateCustomerRequest,
	Billing,
	CreateBillingRequest,
	PixQrCode,
	CreatePixQrCodeRequest,
	CreateWithdrawRequest,
	WithdrawTransaction,
	Coupon,
	CreateCouponRequest,
};
