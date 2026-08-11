"use client";

import {
  getRequiredQuestions,
  mapAnswersToBookingFields,
  type ServiceAnswers,
} from "@/lib/services/questions";
import type { ServiceQuestion } from "@/config/services";
import { Input, Label, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

export type { ServiceAnswers };

interface DynamicServiceQuestionsProps {
  serviceType?: string;
  serviceSlug?: string;
  answers: ServiceAnswers;
  onChange: (answers: ServiceAnswers, mapped: Record<string, unknown>) => void;
  errors?: Record<string, string>;
  className?: string;
  /** When set, render these questions instead of the service catalog defaults. */
  questionsOverride?: ServiceQuestion[];
  hideLegend?: boolean;
}

export function DynamicServiceQuestions({
  serviceType,
  serviceSlug,
  answers,
  onChange,
  errors = {},
  className,
  questionsOverride,
  hideLegend = false,
}: DynamicServiceQuestionsProps) {
  const questions = questionsOverride ?? getRequiredQuestions({ serviceType, serviceSlug });
  if (questions.length === 0) return null;

  const update = (question: ServiceQuestion, raw: string | boolean) => {
    let value: string | number | boolean = raw;
    if (question.type === "number" && typeof raw === "string") {
      value = raw === "" ? 0 : Number(raw);
    }

    const nextAnswers = { ...answers, [question.id]: value };
    const mapped = mapAnswersToBookingFields(nextAnswers);
    onChange(nextAnswers, mapped);
  };

  return (
    <fieldset className={cn("space-y-4", className)}>
      {!hideLegend ? (
        <legend className="mb-1 block text-sm font-medium text-ink-muted">Job details</legend>
      ) : null}
      {questions.map((question) => (
        <div key={question.id}>
          <QuestionField
            question={question}
            value={answers[question.id]}
            onChange={(value) => update(question, value)}
          />
          {errors[question.id] ? (
            <p className="mt-1 text-sm text-error">{errors[question.id]}</p>
          ) : null}
        </div>
      ))}
    </fieldset>
  );
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: ServiceQuestion;
  value: string | number | boolean | string[] | undefined;
  onChange: (value: string | boolean) => void;
}) {
  if (question.type === "boolean") {
    const checked = Boolean(value);
    return (
      <label className="flex items-center gap-3 text-sm text-ink">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4 border-border"
        />
        <span>
          {question.label}
          {question.required ? " *" : ""}
        </span>
      </label>
    );
  }

  if (question.type === "select" && question.options) {
    return (
      <div>
        <Label htmlFor={question.id} required={question.required}>
          {question.label}
        </Label>
        <select
          id={question.id}
          value={value === undefined ? "" : String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1.5 w-full border border-border bg-surface px-3 py-2.5 text-sm text-ink"
        >
          <option value="" disabled>
            Select…
          </option>
          {question.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (question.type === "text") {
    return (
      <div>
        <Label htmlFor={question.id} required={question.required}>
          {question.label}
        </Label>
        <Textarea
          id={question.id}
          value={value === undefined ? "" : String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1.5"
          rows={3}
        />
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor={question.id} required={question.required}>
        {question.label}
      </Label>
      <Input
        id={question.id}
        type="number"
        min={question.min}
        max={question.max}
        value={value === undefined ? "" : String(value)}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5"
      />
    </div>
  );
}
