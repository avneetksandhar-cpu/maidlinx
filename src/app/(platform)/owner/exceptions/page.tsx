import { AdminHeader } from "@/components/admin/admin-header";
import { requireOwnerAnalyticsAccess } from "@/lib/ai/session";
import { listOpenAiExceptions } from "@/lib/owner/exceptions";
import { OwnerExceptionActions } from "@/components/owner/owner-exception-actions";

export const metadata = { title: "Owner · Exceptions" };

export default async function OwnerExceptionsPage() {
  await requireOwnerAnalyticsAccess();
  const inbox = await listOpenAiExceptions(100);

  return (
    <>
      <AdminHeader
        title="Exceptions inbox"
        description="AI OS exceptions + open dispatch exceptions. Acknowledge / resolve AI rows only (dispatch stays in ops admin)."
        badge="Inbox"
      />

      {!inbox.available && (
        <p className="mb-4 text-sm text-ink-muted">{inbox.gapReason}</p>
      )}

      {inbox.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface px-4 py-8 text-sm text-ink-muted">
          No open exceptions — honest empty state.
        </p>
      ) : (
        <ul className="grid gap-3">
          {inbox.items.map((item) => (
            <li
              key={`${item.source}-${item.id}`}
              className="rounded-xl border border-border bg-surface p-4 shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-ink">{item.summary}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-ink-subtle">
                    {item.source} · {item.exceptionType} · {item.severity} · {item.status}
                  </p>
                  {item.entityId && (
                    <p className="mt-1 text-xs text-ink-muted">
                      {item.entityType}/{item.entityId}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-ink-subtle">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                {item.source === "ai_exceptions" && (
                  <OwnerExceptionActions id={item.id} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
