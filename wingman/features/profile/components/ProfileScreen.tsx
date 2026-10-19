"use client";

import {
  BookingsIcon,
  ChevronRightIcon,
  CrownIcon,
  MessagesIcon,
  ProfileIcon,
} from "@/components/icons";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fadeUpShort, listItemVariants, staggerList } from "@/lib/animations";
import { formatUsd } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import type { AccountBooking, AccountCard, AccountInvoice } from "@/features/profile/types";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

function money(cents: number | null | undefined) {
  if (cents == null) return null;
  return formatUsd(cents / 100);
}

function when(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function ProfileScreen() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<AccountBooking[]>([]);
  const [upcoming, setUpcoming] = useState<AccountBooking | null>(null);
  const [invoices, setInvoices] = useState<AccountInvoice[]>([]);
  const [cards, setCards] = useState<AccountCard[]>([]);
  const [contacts, setContacts] = useState<
    Array<{ id: string; name: string; phone: string | null; email: string | null }>
  >([]);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [supportSubject, setSupportSubject] = useState("");
  const [supportNotes, setSupportNotes] = useState("");
  const [supportNote, setSupportNote] = useState<string | null>(null);
  const [supportBusy, setSupportBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setBookings([]);
      setUpcoming(null);
      setInvoices([]);
      setCards([]);
      setContacts([]);
      return;
    }
    void Promise.all([
      fetch("/api/account/me"),
      fetch("/api/account/bookings"),
      fetch("/api/account/invoices"),
      fetch("/api/account/payment-methods"),
    ])
      .then(async ([meRes, bookingsRes, invoicesRes, cardsRes]) => {
        const me = (await meRes.json()) as {
          error?: string;
          emergencyContacts?: Array<{
            id: string;
            name: string;
            phone: string | null;
            email: string | null;
          }>;
        };
        const nights = (await bookingsRes.json()) as {
          error?: string;
          upcoming?: AccountBooking[];
          past?: AccountBooking[];
          bookings?: AccountBooking[];
        };
        const paid = (await invoicesRes.json()) as { error?: string; invoices?: AccountInvoice[] };
        const methods = (await cardsRes.json()) as { error?: string; methods?: AccountCard[] };
        if (!meRes.ok || !bookingsRes.ok || !invoicesRes.ok || !cardsRes.ok) {
          setAccountError(me.error ?? nights.error ?? paid.error ?? methods.error ?? "Could not load your account.");
          return;
        }
        setContacts(me.emergencyContacts ?? []);
        setBookings(nights.bookings ?? []);
        setUpcoming(nights.upcoming?.[0] ?? null);
        setInvoices(paid.invoices ?? []);
        setCards(methods.methods ?? []);
      })
      .catch(() => setAccountError("Could not load your account."));
  }, [user]);

  const name = user?.displayName || user?.email || "Account";
  const receipts = invoices;

  async function onLogout() {
    await logout();
    router.push("/auth");
    router.refresh();
  }

  async function onSupport(event: FormEvent) {
    event.preventDefault();
    setSupportBusy(true);
    setSupportNote(null);
    const response = await fetch("/api/account/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: supportSubject,
        notes: supportNotes || undefined,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    setSupportBusy(false);
    if (!response.ok) {
      setSupportNote(payload.error ?? "Could not open a case.");
      return;
    }
    setSupportSubject("");
    setSupportNotes("");
    setSupportNote("Case opened. We will follow up in this account.");
  }

  if (!loading && !user) {
    return (
      <AppShell showNav noPadding>
        <div className="px-5">
          <AppHeader showMenu />
          <h1 className="font-display text-3xl text-ink">Account</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Sign in to see your nights, receipts, and payment method.
          </p>
          <div className="mt-6 space-y-3">
            <Link href="/auth?next=/profile">
              <Button fullWidth size="lg">
                Sign in
              </Button>
            </Link>
            <Link href="/book">
              <Button fullWidth variant="outline">
                Book $500
              </Button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showNav noPadding>
      <div className="px-5 pb-8">
        <AppHeader showMenu showNotifications />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUpShort}
          custom={0}
          className="flex flex-col items-center pt-1 text-center"
        >
          <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-accent/40 bg-surface text-2xl text-accent">
            {(name[0] ?? "W").toUpperCase()}
          </div>
          <h1 className="mt-4 font-display text-3xl text-ink">{loading ? "Loading…" : name}</h1>
          {user?.email ? <p className="mt-1 text-sm text-ink-subtle">{user.email}</p> : null}
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-accent">Member</p>
        </motion.div>

        {upcoming ? (
          <Card className="mt-6" variant="elevated">
            <p className="text-label text-accent">Upcoming night</p>
            <p className="mt-2 font-display text-xl text-ink">{upcoming.title}</p>
            <p className="mt-1 text-sm text-ink-muted">
              {when(upcoming.startsAt) ?? "Date to confirm"} · {upcoming.status.replaceAll("_", " ")}
            </p>
            <Link href={`/requests/${upcoming.id}`} className="mt-4 block">
              <Button fullWidth size="sm">
                Open night
              </Button>
            </Link>
          </Card>
        ) : null}

        <section className="mt-6">
          <h2 className="font-display text-xl text-ink">Past bookings</h2>
          {accountError ? <p className="mt-2 text-sm text-rose-300">{accountError}</p> : null}
          {bookings.length === 0 && !accountError ? (
            <EmptyNights />
          ) : (
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={staggerList}
              className="mt-3 space-y-3"
            >
              {bookings.map((item) => (
                <motion.li key={item.id} variants={listItemVariants(false)}>
                  <BookingRow item={item} />
                </motion.li>
              ))}
            </motion.ul>
          )}
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl text-ink">Invoices / receipts</h2>
          {receipts.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">
              No paid receipts yet. A receipt appears after a confirmed payment.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {receipts.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/receipts/${item.bookingId}`}
                    className="block rounded-2xl border border-border bg-surface px-4 py-4 hover:border-accent/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-accent">
                          {item.testLabel ? `${item.testLabel} · ` : ""}
                          {when(item.paidAt ?? item.createdAt)}
                        </p>
                        <p className="mt-1 text-ink">{item.title}</p>
                        {item.last4 ? (
                          <p className="mt-1 text-xs text-ink-subtle">
                            {item.brand ? `${item.brand} ` : "Card "}····{item.last4}
                          </p>
                        ) : null}
                      </div>
                      <p className="font-display text-lg text-ink">{money(item.amountCents)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl text-ink">Payment method</h2>
          <Card className="mt-3" padding="sm">
            {cards[0]?.last4 ? (
              <p className="text-sm text-ink">
                {cards[0].brand ? `${cards[0].brand} ` : "Card "}····
                {cards[0].last4}
                <span className="mt-1 block text-xs text-ink-subtle">
                  Saved securely. Wingman does not store the full number.
                </span>
              </p>
            ) : (
              <p className="text-sm text-ink-muted">
                No card on file. Cards stay at Stripe Checkout — Wingman never stores the number.
              </p>
            )}
          </Card>
        </section>

        {contacts.length > 0 ? (
          <section className="mt-8">
            <h2 className="font-display text-xl text-ink">Emergency contact</h2>
            <ul className="mt-3 space-y-2">
              {contacts.map((contact) => (
                <li key={contact.id} className="rounded-2xl border border-border bg-surface px-4 py-3">
                  <p className="text-sm text-ink">{contact.name}</p>
                  {contact.phone ? <p className="text-xs text-ink-subtle">{contact.phone}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-8">
          <h2 className="font-display text-xl text-ink">Support / incident</h2>
          <form onSubmit={onSupport} className="mt-3 space-y-3">
            <input
              required
              value={supportSubject}
              onChange={(event) => setSupportSubject(event.target.value)}
              placeholder="What happened?"
              className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-ink placeholder:text-ink-subtle"
            />
            <textarea
              value={supportNotes}
              onChange={(event) => setSupportNotes(event.target.value)}
              placeholder="Optional details"
              rows={3}
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-subtle"
            />
            {supportNote ? <p className="text-sm text-ink-muted">{supportNote}</p> : null}
            <Button type="submit" variant="outline" fullWidth disabled={supportBusy}>
              {supportBusy ? "Opening…" : "Open a case"}
            </Button>
          </form>
        </section>

        <nav className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface">
          <MenuRow href="/policies" label="Terms & cancellation" icon={<ProfileIcon className="h-5 w-5" />} />
          <MenuRow href="/messages" label="Messages" icon={<MessagesIcon className="h-5 w-5" />} />
          {user?.role === "partner" || user?.role === "admin" || user?.role === "owner" ? (
            <MenuRow href="/partner" label="Partner desk" icon={<ProfileIcon className="h-5 w-5" />} />
          ) : null}
          {user?.role === "admin" || user?.role === "owner" ? (
            <MenuRow href="/admin" label="Admin" icon={<ProfileIcon className="h-5 w-5" />} />
          ) : null}
          {user?.role === "owner" ? (
            <MenuRow href="/owner" label="Owner" icon={<CrownIcon className="h-5 w-5" />} last />
          ) : (
            <MenuRow href="/bookings" label="All requests" icon={<BookingsIcon className="h-5 w-5" />} last />
          )}
        </nav>

        <div className="py-6">
          <Button variant="outline" size="lg" fullWidth onClick={onLogout}>
            Sign out
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function EmptyNights() {
  return (
    <div className="mt-3 py-8">
      <p className="font-display text-2xl text-ink">Your next night starts here.</p>
      <p className="mt-2 text-sm text-ink-muted">No plans yet. Let’s fix that.</p>
      <div className="mt-5 space-y-3">
        <Link href="/plan" className="block">
          <Button fullWidth>Plan my night</Button>
        </Link>
        <Link href="/venues/apply" className="block text-center text-sm text-ink-subtle">
          List your venue
        </Link>
      </div>
    </div>
  );
}

function bookAgainHref(item: AccountBooking) {
  const params = new URLSearchParams({ repeat: item.id, source: "again" });
  if (item.eventExternalId) params.set("eventId", item.eventExternalId);
  if (item.title) params.set("name", item.title);
  return `/book?${params.toString()}`;
}

function BookingRow({ item }: { item: AccountBooking }) {
  const amount = money(item.amountCents);
  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-4">
      <Link href={`/requests/${item.id}`} className="block hover:text-accent">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-accent">
              {item.testLabel ? `${item.testLabel} · ` : ""}
              {item.status.replaceAll("_", " ")}
            </p>
            <p className="mt-1 text-ink">{item.title}</p>
            <p className="mt-1 text-xs text-ink-subtle">{when(item.startsAt ?? item.createdAt)}</p>
          </div>
          {amount ? <p className="text-sm text-ink-muted">{amount}</p> : null}
        </div>
      </Link>
      {item.canBookAgain !== false ? (
        <Link href={bookAgainHref(item)} className="mt-3 block">
          <Button size="sm" fullWidth>
            Book again · $500
          </Button>
        </Link>
      ) : null}
    </div>
  );
}

function MenuRow({
  href,
  label,
  icon,
  last,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  last?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-4 text-sm text-ink hover:bg-white/5 ${last ? "" : "border-b border-border"}`}
    >
      <span className="text-accent">{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronRightIcon className="text-ink-subtle" />
    </Link>
  );
}
