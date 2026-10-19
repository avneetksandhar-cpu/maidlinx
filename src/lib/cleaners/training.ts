/**
 * MaidLinx Academy — modules, completion, short assessment.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";
import { writeCleanerPlatformAudit } from "@/lib/cleaners/platform-audit";

export interface AcademyModule {
  id: string;
  title: string;
  summary: string;
  contentMd: string;
  sortOrder: number;
  required: boolean;
  estimatedMinutes: number;
}

export interface TrainingProgress {
  modules: AcademyModule[];
  completedModuleIds: string[];
  allRequiredComplete: boolean;
  trainingCompletedAt: string | null;
  assessmentPassedAt: string | null;
  latestAssessmentScore: number | null;
}

/** Short assessment — operational knowledge only (no protected characteristics). */
export const ACADEMY_ASSESSMENT = [
  {
    id: "q1",
    prompt: "When do you receive the full street address and access instructions?",
    choices: [
      { id: "a", label: "As soon as I sign up" },
      { id: "b", label: "Only after I am authorized/assigned to the job" },
      { id: "c", label: "Never — customers text them separately" },
    ],
    correctChoiceId: "b",
  },
  {
    id: "q2",
    prompt: "Before marking a job complete you must:",
    choices: [
      { id: "a", label: "Finish the checklist and upload before/after photos" },
      { id: "b", label: "Only tap Complete" },
      { id: "c", label: "Call the customer first" },
    ],
    correctChoiceId: "a",
  },
  {
    id: "q3",
    prompt: "If you will be late you should:",
    choices: [
      { id: "a", label: "Say nothing and hurry" },
      { id: "b", label: "Update status and communicate early through MaidLinx" },
      { id: "c", label: "Cancel without notice" },
    ],
    correctChoiceId: "b",
  },
  {
    id: "q4",
    prompt: "Customer access codes and private details may be:",
    choices: [
      { id: "a", label: "Posted on social media after the job" },
      { id: "b", label: "Shared only as needed to complete the authorized job" },
      { id: "c", label: "Saved to personal notes forever" },
    ],
    correctChoiceId: "b",
  },
] as const;

export const ASSESSMENT_PASS_SCORE = 75;

const FALLBACK_MODULES: AcademyModule[] = [
  {
    id: "academy_standards",
    title: "MaidLinx service standards",
    summary: "Reliability, respect, and quality.",
    contentMd:
      "# MaidLinx service standards\n\nArrive on time, protect privacy, complete checklist and photos.",
    sortOrder: 10,
    required: true,
    estimatedMinutes: 6,
  },
  {
    id: "academy_safety",
    title: "Safety and access",
    summary: "Safe entry and incident reporting.",
    contentMd: "# Safety and access\n\nFollow access instructions. Report hazards immediately.",
    sortOrder: 20,
    required: true,
    estimatedMinutes: 6,
  },
  {
    id: "academy_privacy",
    title: "Privacy and professionalism",
    summary: "What must never leave the job.",
    contentMd:
      "# Privacy\n\nAddresses/access codes only after assignment. No photographing people or mail.",
    sortOrder: 30,
    required: true,
    estimatedMinutes: 5,
  },
  {
    id: "academy_jobs",
    title: "Jobs, status updates, and payouts",
    summary: "Status ladder and Connect payouts.",
    contentMd:
      "# Jobs and payouts\n\nUpdate status honestly. Complete checklist/photos. Payouts via Stripe Connect.",
    sortOrder: 40,
    required: true,
    estimatedMinutes: 7,
  },
];

export async function listAcademyModules(): Promise<AcademyModule[]> {
  if (!hasAdminEnv()) return FALLBACK_MODULES;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("academy_modules")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    if (error.message.includes("academy_modules")) return FALLBACK_MODULES;
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      title: String(r.title),
      summary: String(r.summary),
      contentMd: String(r.content_md),
      sortOrder: Number(r.sort_order),
      required: Boolean(r.required),
      estimatedMinutes: Number(r.estimated_minutes),
    };
  });
}

export async function getTrainingProgress(cleanerId: string): Promise<TrainingProgress> {
  const modules = await listAcademyModules();
  if (!hasAdminEnv()) {
    return {
      modules,
      completedModuleIds: [],
      allRequiredComplete: false,
      trainingCompletedAt: null,
      assessmentPassedAt: null,
      latestAssessmentScore: null,
    };
  }

  const supabase = createAdminClient();
  const [{ data: progress }, { data: pro }, { data: attempts }] = await Promise.all([
    supabase
      .from("cleaner_training_progress")
      .select("module_id")
      .eq("cleaner_id", cleanerId),
    supabase
      .from("professionals")
      .select("training_completed_at, assessment_passed_at")
      .eq("id", cleanerId)
      .maybeSingle(),
    supabase
      .from("cleaner_assessment_attempts")
      .select("score, passed, created_at")
      .eq("cleaner_id", cleanerId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const completedModuleIds = (progress ?? []).map((p) =>
    String((p as Record<string, unknown>).module_id),
  );
  const requiredIds = modules.filter((m) => m.required).map((m) => m.id);
  const allRequiredComplete = requiredIds.every((id) => completedModuleIds.includes(id));
  const proRow = (pro ?? {}) as Record<string, unknown>;
  const latest = attempts?.[0] as Record<string, unknown> | undefined;

  return {
    modules,
    completedModuleIds,
    allRequiredComplete,
    trainingCompletedAt: proRow.training_completed_at
      ? String(proRow.training_completed_at)
      : null,
    assessmentPassedAt: proRow.assessment_passed_at
      ? String(proRow.assessment_passed_at)
      : null,
    latestAssessmentScore: latest ? Number(latest.score) : null,
  };
}

export async function completeAcademyModule(input: {
  cleanerId: string;
  moduleId: string;
  actorId: string;
}): Promise<TrainingProgress> {
  if (!hasAdminEnv()) throw new Error("Database not configured.");
  const modules = await listAcademyModules();
  if (!modules.some((m) => m.id === input.moduleId)) {
    throw new Error("Unknown academy module.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("cleaner_training_progress").upsert(
    {
      cleaner_id: input.cleanerId,
      module_id: input.moduleId,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "cleaner_id,module_id" },
  );
  if (error) throw new Error(error.message);

  const progress = await getTrainingProgress(input.cleanerId);
  if (progress.allRequiredComplete && !progress.trainingCompletedAt) {
    await supabase
      .from("professionals")
      .update({
        training_completed_at: new Date().toISOString(),
        platform_stage: "TRAINING",
      })
      .eq("id", input.cleanerId);
  }

  await writeCleanerPlatformAudit({
    actorId: input.actorId,
    actorRole: "cleaner",
    action: "training.module_complete",
    cleanerId: input.cleanerId,
    metadata: { moduleId: input.moduleId },
  });

  return getTrainingProgress(input.cleanerId);
}

export function scoreAssessment(
  answers: Record<string, string>,
): { score: number; passed: boolean; correct: number; total: number } {
  let correct = 0;
  for (const q of ACADEMY_ASSESSMENT) {
    if (answers[q.id] === q.correctChoiceId) correct += 1;
  }
  const total = ACADEMY_ASSESSMENT.length;
  const score = Math.round((correct / total) * 100);
  return { score, passed: score >= ASSESSMENT_PASS_SCORE, correct, total };
}

export async function submitAssessment(input: {
  cleanerId: string;
  actorId: string;
  answers: Record<string, string>;
}): Promise<{
  score: number;
  passed: boolean;
  progress: TrainingProgress;
}> {
  if (!hasAdminEnv()) throw new Error("Database not configured.");
  const progressBefore = await getTrainingProgress(input.cleanerId);
  if (!progressBefore.allRequiredComplete) {
    throw new Error("Complete all required Academy modules before the assessment.");
  }

  const result = scoreAssessment(input.answers);
  const supabase = createAdminClient();
  const { error } = await supabase.from("cleaner_assessment_attempts").insert({
    cleaner_id: input.cleanerId,
    score: result.score,
    passed: result.passed,
    answers: input.answers as unknown as Json,
  });
  if (error) throw new Error(error.message);

  if (result.passed) {
    await supabase
      .from("professionals")
      .update({
        assessment_passed_at: new Date().toISOString(),
        training_completed_at:
          progressBefore.trainingCompletedAt ?? new Date().toISOString(),
      })
      .eq("id", input.cleanerId);
  }

  await writeCleanerPlatformAudit({
    actorId: input.actorId,
    actorRole: "cleaner",
    action: result.passed ? "training.assessment_passed" : "training.assessment_failed",
    cleanerId: input.cleanerId,
    metadata: { score: result.score, passed: result.passed },
  });

  return {
    score: result.score,
    passed: result.passed,
    progress: await getTrainingProgress(input.cleanerId),
  };
}

/** Public quiz payload without correct answers. */
export function publicAssessmentQuestions() {
  return ACADEMY_ASSESSMENT.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    choices: q.choices.map((c) => ({ id: c.id, label: c.label })),
  }));
}
