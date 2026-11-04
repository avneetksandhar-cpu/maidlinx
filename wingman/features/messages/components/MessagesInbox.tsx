"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { conversations } from "@/features/messages/data/conversations";
import Image from "next/image";
import Link from "next/link";

export function MessagesInbox() {
  return (
    <AppShell showNav noPadding>
      <div className="px-5">
        <AppHeader title="Messages" />
      </div>
      <div className="flex flex-col px-5 pb-6">
        {conversations.map((thread) => {
          const preview = thread.messages[thread.messages.length - 1]?.body ?? thread.subtitle;
          return (
            <Link
              key={thread.id}
              href={`/messages/${thread.id}`}
              className="flex items-center gap-3 border-b border-border py-4"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border-gold bg-surface">
                {thread.avatarUrl ? (
                  <Image src={thread.avatarUrl} alt="" fill className="object-cover" sizes="48px" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-accent">
                    W
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-ink">{thread.name}</p>
                  {thread.active ? (
                    <span className="text-[10px] uppercase tracking-wide text-accent">Active now</span>
                  ) : null}
                </div>
                <p className="truncate text-sm text-ink-muted">{preview}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
