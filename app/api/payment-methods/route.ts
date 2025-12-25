import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 401 }
      );
    }

    const userId = session.userId;

    // Buscar métodos de pagamento do usuário
    const paymentMethods = await db.paymentMethod.findMany({
      where: {
        userId: userId,
      },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Transformar para formato esperado
    const formattedMethods = paymentMethods.map((method) => ({
      id: method.id,
      type: method.type as "credit-card" | "debit-card" | "pix",
      isDefault: method.isDefault,
      cardBrand: method.cardBrand || undefined,
      last4: method.last4 || undefined,
      expiryMonth: method.expiryMonth || undefined,
      expiryYear: method.expiryYear || undefined,
      holderName: method.holderName || undefined,
      pixKey: method.pixKey || undefined,
    }));

    return NextResponse.json({ paymentMethods: formattedMethods });
  } catch (error: any) {
    console.error("Erro ao buscar métodos de pagamento:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar métodos de pagamento" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 401 }
      );
    }

    const userId = session.userId;

    // Ler dados do body
    const body = await request.json();
    const {
      type,
      isDefault,
      cardBrand,
      last4,
      expiryMonth,
      expiryYear,
      holderName,
      pixKey,
      pixKeyType,
    } = body;

    // Validar dados
    if (!type || !["credit-card", "debit-card", "pix"].includes(type)) {
      return NextResponse.json(
        { error: "Tipo de pagamento inválido" },
        { status: 400 }
      );
    }

    // Se for cartão, validar campos obrigatórios
    if (type === "credit-card" || type === "debit-card") {
      if (!last4 || !cardBrand) {
        return NextResponse.json(
          { error: "Campos obrigatórios faltando para cartão" },
          { status: 400 }
        );
      }
    }

    // Se for PIX, validar campos obrigatórios
    if (type === "pix") {
      if (!pixKey || !pixKeyType) {
        return NextResponse.json(
          { error: "Campos obrigatórios faltando para PIX" },
          { status: 400 }
        );
      }
    }

    // Se for marcado como padrão, desmarcar outros
    if (isDefault) {
      await db.paymentMethod.updateMany({
        where: {
          userId: userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Criar método de pagamento
    const paymentMethod = await db.paymentMethod.create({
      data: {
        userId: userId,
        type: type,
        isDefault: isDefault || false,
        cardBrand: cardBrand || null,
        last4: last4 || null,
        expiryMonth: expiryMonth || null,
        expiryYear: expiryYear || null,
        holderName: holderName || null,
        pixKey: pixKey || null,
        pixKeyType: pixKeyType || null,
      },
    });

    return NextResponse.json({
      success: true,
      paymentMethod: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        isDefault: paymentMethod.isDefault,
        cardBrand: paymentMethod.cardBrand || undefined,
        last4: paymentMethod.last4 || undefined,
        expiryMonth: paymentMethod.expiryMonth || undefined,
        expiryYear: paymentMethod.expiryYear || undefined,
        holderName: paymentMethod.holderName || undefined,
        pixKey: paymentMethod.pixKey || undefined,
      },
    });
  } catch (error: any) {
    console.error("Erro ao criar método de pagamento:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar método de pagamento" },
      { status: 500 }
    );
  }
}

