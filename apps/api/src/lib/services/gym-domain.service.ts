import { BaseGymDomainService } from "@gymrats/domain/services/gym/gym-domain.service";
import { getCachedJson, setCachedJson } from "@/lib/cache/resource-cache";

const GYM_DOMAIN_LIST_CACHE_TTL_SECONDS = 20;

function buildGymDomainCacheKey(
  gymId: string,
  resource: string,
  params?: Record<string, string | number | boolean | null | undefined>,
) {
  const query = Object.entries(params ?? {})
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&");

  return query.length > 0
    ? `gym:domain:${gymId}:${resource}:${query}`
    : `gym:domain:${gymId}:${resource}`;
}

export class GymDomainService extends BaseGymDomainService {
  static override async getMembers(
    gymId: string,
    filters: { status?: string; search?: string; fresh?: boolean },
  ) {
    const { status, search } = filters;
    const cacheKey = buildGymDomainCacheKey(gymId, "members", {
      status,
      search,
    });

    if (!filters.fresh) {
      const cached =
        await getCachedJson<
          Awaited<ReturnType<typeof BaseGymDomainService.getMembers>>
        >(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const memberships = await BaseGymDomainService.getMembers(gymId, {
      status,
      search,
    });
    await setCachedJson(
      cacheKey,
      memberships,
      GYM_DOMAIN_LIST_CACHE_TTL_SECONDS,
    );

    return memberships;
  }

  static override async getExpenses(
    gymId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      type?: string;
      limit?: number;
      fresh?: boolean;
    },
  ) {
    const { startDate, endDate, type, limit } = filters;
    const cacheKey = buildGymDomainCacheKey(gymId, "expenses", {
      startDate,
      endDate,
      type,
      limit,
    });

    if (!filters.fresh) {
      const cached =
        await getCachedJson<
          Awaited<ReturnType<typeof BaseGymDomainService.getExpenses>>
        >(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const expenses = await BaseGymDomainService.getExpenses(gymId, {
      startDate,
      endDate,
      type,
      limit,
    });
    await setCachedJson(cacheKey, expenses, GYM_DOMAIN_LIST_CACHE_TTL_SECONDS);

    return expenses;
  }

  static override async getPayments(
    gymId: string,
    filters: {
      status?: string;
      studentId?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      fresh?: boolean;
    },
  ) {
    const { status, studentId, startDate, endDate, limit } = filters;
    const cacheKey = buildGymDomainCacheKey(gymId, "payments", {
      status,
      studentId,
      startDate,
      endDate,
      limit,
    });

    if (!filters.fresh) {
      const cached =
        await getCachedJson<
          Awaited<ReturnType<typeof BaseGymDomainService.getPayments>>
        >(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const payments = await BaseGymDomainService.getPayments(gymId, {
      status,
      studentId,
      startDate,
      endDate,
      limit,
    });
    await setCachedJson(cacheKey, payments, GYM_DOMAIN_LIST_CACHE_TTL_SECONDS);

    return payments;
  }

  static override async getPlans(
    gymId: string,
    filters: { includeInactive?: boolean; fresh?: boolean },
  ) {
    const { includeInactive } = filters;
    const cacheKey = buildGymDomainCacheKey(gymId, "plans", {
      includeInactive,
    });

    if (!filters.fresh) {
      const cached =
        await getCachedJson<
          Awaited<ReturnType<typeof BaseGymDomainService.getPlans>>
        >(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const plans = await BaseGymDomainService.getPlans(gymId, {
      includeInactive,
    });
    await setCachedJson(cacheKey, plans, GYM_DOMAIN_LIST_CACHE_TTL_SECONDS);

    return plans;
  }
}
