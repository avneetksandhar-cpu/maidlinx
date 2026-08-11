import {
  getServiceById,
  getServiceByLegacyType,
  getServiceBySlug,
  serviceSupportsMarket,
  type MarketplaceService,
  type ServiceQuestion,
} from "@/config/services";

export function resolveCatalogService(key: string | null | undefined): MarketplaceService | undefined {
  if (!key) return undefined;
  return getServiceById(key) ?? getServiceBySlug(key) ?? getServiceByLegacyType(key);
}

export function getRequiredQuestionsForService(serviceKey: string): ServiceQuestion[] {
  return resolveCatalogService(serviceKey)?.requiredQuestions ?? [];
}

export function validateServiceForMarket(
  serviceKey: string,
  marketId: string | null | undefined,
): { ok: true; service: MarketplaceService } | { ok: false; error: string } {
  const service = resolveCatalogService(serviceKey);
  if (!service || !service.active) {
    return { ok: false, error: "Service is not available." };
  }
  if (!marketId) {
    return { ok: false, error: "Market could not be resolved for this address." };
  }
  if (!serviceSupportsMarket(service, marketId)) {
    return { ok: false, error: "This service is not offered in the selected market." };
  }
  return { ok: true, service };
}

export function estimateServiceDurationMinutes(input: {
  serviceKey: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  extrasCount?: number;
}): number {
  const service = resolveCatalogService(input.serviceKey);
  const rules = service?.estimatedDurationRules ?? { baseMinutes: 120 };
  const bedrooms = input.bedrooms ?? 0;
  const bathrooms = input.bathrooms ?? 0;
  const squareFootage = input.squareFootage ?? 1000;
  const extrasCount = input.extrasCount ?? 0;

  const room =
    bedrooms * (rules.minutesPerBedroom ?? 0) + bathrooms * (rules.minutesPerBathroom ?? 0);
  const size =
    Math.max(0, Math.floor((squareFootage - 1000) / 500)) * (rules.minutesPerSizeTier ?? 0);
  const extras = extrasCount * (rules.minutesPerExtra ?? 0);
  return rules.baseMinutes + room + size + extras;
}
