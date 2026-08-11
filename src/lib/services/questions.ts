import {
  getServiceByLegacyType,
  getServiceBySlug,
  type MarketplaceService,
  type ServiceQuestion,
} from "@/config/services";

export type ServiceAnswerValue = string | number | boolean | string[];
export type ServiceAnswers = Record<string, ServiceAnswerValue>;

export function resolveServiceForQuestions(input: {
  serviceType?: string | null;
  serviceSlug?: string | null;
}): MarketplaceService | undefined {
  if (input.serviceSlug) return getServiceBySlug(input.serviceSlug);
  if (input.serviceType) return getServiceByLegacyType(input.serviceType);
  return undefined;
}

export function getRequiredQuestions(input: {
  serviceType?: string | null;
  serviceSlug?: string | null;
}): ServiceQuestion[] {
  return resolveServiceForQuestions(input)?.requiredQuestions ?? [];
}

export function validateServiceAnswers(
  questions: ServiceQuestion[],
  answers: ServiceAnswers | null | undefined,
): { ok: true } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const current = answers ?? {};

  for (const question of questions) {
    if (!question.required) continue;
    const value = current[question.id];
    // Unchecked checkboxes are a valid "no" for boolean questions.
    if (question.type === "boolean") {
      continue;
    }
    if (value === undefined || value === null || value === "") {
      errors[question.id] = `${question.label} is required.`;
      continue;
    }
    if (question.type === "number" && typeof value === "number") {
      if (question.min !== undefined && value < question.min) {
        errors[question.id] = `${question.label} must be at least ${question.min}.`;
      }
      if (question.max !== undefined && value > question.max) {
        errors[question.id] = `${question.label} must be at most ${question.max}.`;
      }
    }
  }

  return Object.keys(errors).length === 0 ? { ok: true } : { ok: false, errors };
}

/** Apply mapsTo fields from answers onto booking form primitives. */
export function mapAnswersToBookingFields(answers: ServiceAnswers): {
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  notes?: string;
  propertyType?: string;
} {
  const mapped: {
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    notes?: string;
    propertyType?: string;
  } = {};

  if (typeof answers.bedrooms === "number") mapped.bedrooms = answers.bedrooms;
  if (typeof answers.bathrooms === "number") mapped.bathrooms = answers.bathrooms;
  if (answers.squareFootage !== undefined) {
    mapped.squareFootage =
      typeof answers.squareFootage === "string"
        ? Number(answers.squareFootage)
        : Number(answers.squareFootage);
  }
  if (typeof answers.propertyType === "string") mapped.propertyType = answers.propertyType;
  if (typeof answers.notes === "string") mapped.notes = answers.notes;

  return mapped;
}
