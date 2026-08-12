"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

interface Module {
  id: string;
  title: string;
  summary: string;
  contentMd: string;
  estimatedMinutes: number;
}

interface Question {
  id: string;
  prompt: string;
  choices: Array<{ id: string; label: string }>;
}

interface Progress {
  modules: Module[];
  completedModuleIds: string[];
  allRequiredComplete: boolean;
  assessmentPassedAt: string | null;
  assessment: Question[];
}

export function CleanerTrainingPanel() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cleaner/training")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.data) setProgress(json.data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function reload() {
    const res = await fetch("/api/cleaner/training");
    const json = await res.json();
    if (res.ok) setProgress(json.data);
  }

  async function completeModule(moduleId: string) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cleaner/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete_module", moduleId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setProgress((p) =>
        p
          ? {
              ...p,
              ...json.data,
              assessment: p.assessment,
            }
          : p,
      );
      setMessage("Module marked complete.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function submitAssessment() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cleaner/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit_assessment", answers }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setMessage(
        json.data.passed
          ? `Passed with score ${json.data.score}.`
          : `Score ${json.data.score} — need 75% to pass. Retry after reviewing modules.`,
      );
      await reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (!progress) return <div className="h-48 animate-pulse rounded-xl bg-border" />;

  return (
    <div className="space-y-5">
      {progress.modules.map((mod) => {
        const done = progress.completedModuleIds.includes(mod.id);
        return (
          <article key={mod.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-semibold text-navy">{mod.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  {mod.summary} · ~{mod.estimatedMinutes} min
                </p>
              </div>
              <span className={done ? "text-sm text-success" : "text-sm text-ink-muted"}>
                {done ? "Complete" : "Required"}
              </span>
            </div>
            <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-ink">
              {mod.contentMd}
            </pre>
            {!done && (
              <Button
                className="mt-3"
                size="sm"
                disabled={loading}
                onClick={() => completeModule(mod.id)}
              >
                Mark complete
              </Button>
            )}
          </article>
        );
      })}

      <section className="rounded-xl border border-border bg-surface p-4">
        <h3 className="font-display text-base font-semibold text-navy">Short assessment</h3>
        <p className="mt-1 text-sm text-ink-muted">
          Pass with 75%+ after all modules. Operational knowledge only.
        </p>
        {!progress.allRequiredComplete ? (
          <p className="mt-3 text-sm text-ink-muted">Complete all modules first.</p>
        ) : progress.assessmentPassedAt ? (
          <p className="mt-3 text-sm text-success">Assessment passed.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {progress.assessment.map((q) => (
              <fieldset key={q.id} className="space-y-2">
                <legend className="text-sm font-medium text-ink">{q.prompt}</legend>
                {q.choices.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === c.id}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: c.id }))}
                    />
                    {c.label}
                  </label>
                ))}
              </fieldset>
            ))}
            <Button disabled={loading} onClick={submitAssessment}>
              Submit assessment
            </Button>
          </div>
        )}
      </section>

      {message && <p className="text-sm text-ink-muted">{message}</p>}
    </div>
  );
}
