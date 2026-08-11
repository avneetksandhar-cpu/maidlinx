/**
 * Service catalog helpers for the single booking engine.
 */

export {
  BOOKING_SERVICE_IDS,
  MARKETPLACE_SERVICES,
  SERVICE_TILES,
  getActiveServices,
  getServiceById,
  getServiceByLegacyType,
  getServiceBySlug,
  getServicesForMarket,
  getServicesForTile,
  isQuoteOnlyService,
  serviceSupportsMarket,
  type BookingServiceId,
  type CleanerRequirements,
  type EstimatedDurationRules,
  type MarketplaceService,
  type ServiceQuestion,
  type ServiceTileKey,
} from "@/config/services";

export {
  estimateServiceDurationMinutes,
  getRequiredQuestionsForService,
  resolveCatalogService,
  validateServiceForMarket,
} from "@/lib/services/catalog";
