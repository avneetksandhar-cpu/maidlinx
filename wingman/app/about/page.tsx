import { CustomerNav, CUSTOMER_NAV_OFFSET } from "@/components/layout/CustomerNav";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Wingman",
};

const STEPS = [
  {
    n: "01",
    title: "Tell us what you want",
    body: "Choose your vibe, music, location, group size, date, and preferences.",
  },
  {
    n: "02",
    title: "Discover your matches",
    body: "Explore venues and experiences that fit your night.",
  },
  {
    n: "03",
    title: "Book your experience",
    body: "Choose a VIP Table or book a Wingman Experience.",
  },
] as const;

const TRUST = [
  { label: "Verified profiles" },
  { label: "Approved Wingmen" },
  { label: "Reviewed venue partners" },
  { label: "Secure payments" },
] as const;

export default function AboutPage() {
  return (
    <main className="min-h-dvh bg-[#09090D] text-[#F4F1EB]" style={{ paddingBottom: CUSTOMER_NAV_OFFSET }}>
      <section className="relative min-h-[88dvh]">
        <Image
          src="/photos/miami-night.jpg"
          alt="Miami skyline at night"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#09090D] to-transparent" />
        <div className="relative mx-auto flex min-h-[88dvh] w-full max-w-5xl flex-col justify-end px-5 pb-12 pt-16 sm:px-8">
          <p className="text-[11px] font-medium tracking-[0.28em] text-[#C8B38B]">WINGMAN</p>
          <p className="mt-4 text-[13px] text-[#F4F1EB]/75">People. Places. Experiences. Elevated.</p>
          <h1 className={`font-['Iowan_Old_Style',Palatino,Georgia,serif] mt-5 max-w-xl text-[2.6rem] font-medium leading-[1.05] tracking-[-0.03em] sm:text-6xl`}>
            Your night, figured out.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-7 text-[#F4F1EB]/80">
            Wingman helps you discover, book, and enjoy the right nightlife experience without having to plan every detail yourself.
          </p>
          <Link href="/search" className="mt-8 inline-flex h-12 w-fit items-center bg-[#F4F1EB] px-6 text-sm font-medium text-[#121212]">
            Find Your Night
          </Link>
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
        <section className="border-t border-white/10 py-16 sm:py-20">
          <h2 className={`font-['Iowan_Old_Style',Palatino,Georgia,serif] max-w-md text-4xl font-medium leading-tight tracking-[-0.03em]`}>
            More than finding a place.
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-7 text-[#C8C0B4]">
            Choose your vibe, date, group size, location, and preferences. Wingman helps match you with nightlife experiences that fit the night you actually want.
          </p>
        </section>

        <section className="border-t border-white/10 py-16 sm:py-20">
          <h2 className={`font-['Iowan_Old_Style',Palatino,Georgia,serif] text-4xl font-medium tracking-[-0.03em]`}>How It Works</h2>
          <ol className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {STEPS.map((step) => (
              <li key={step.n} className="grid gap-2 py-7 sm:grid-cols-[4.5rem_1fr] sm:gap-8">
                <p className="text-sm tracking-[0.16em] text-[#C8B38B]">{step.n}</p>
                <div>
                  <h3 className={`font-['Iowan_Old_Style',Palatino,Georgia,serif] text-2xl font-medium`}>{step.title}</h3>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-[#C8C0B4]">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-white/10 py-16 sm:py-20">
          <h2 className={`font-['Iowan_Old_Style',Palatino,Georgia,serif] text-4xl font-medium tracking-[-0.03em]`}>Two ways to book</h2>
          <div className="mt-10 grid gap-px bg-white/10 sm:grid-cols-2">
            <article className="bg-[#09090D] py-8 sm:pr-10">
              <p className="text-[11px] tracking-[0.2em] text-[#C8B38B]">VIP TABLE</p>
              <p className="mt-4 max-w-sm text-[15px] leading-7 text-[#F4F1EB]/85">
                Choose a venue, select a VIP table, and book it through Wingman.
              </p>
              <Link href="/venues" className="mt-6 inline-flex h-11 items-center border border-[#F4F1EB]/25 px-5 text-sm">
                Explore Tables
              </Link>
            </article>
            <article className="bg-[#09090D] py-8 sm:pl-10">
              <p className="text-[11px] tracking-[0.2em] text-[#C8B38B]">WINGMAN EXPERIENCE</p>
              <p className="mt-4 max-w-sm text-[15px] leading-7 text-[#F4F1EB]/85">
                Book the experience and an approved Wingman is assigned to help host and guide your night.
              </p>
              <Link href="/experiences" className="mt-6 inline-flex h-11 items-center border border-[#F4F1EB]/25 px-5 text-sm">
                Book a Wingman
              </Link>
            </article>
          </div>
          <p className="mt-8 text-sm text-[#C8C0B4]">You book the experience. We assign the Wingman.</p>
        </section>

        <section className="border-t border-white/10 py-16 sm:py-20">
          <p className="text-[11px] font-medium tracking-[0.22em] text-[#C8B38B]">Built Around Trust</p>
          <h2 className={`font-['Iowan_Old_Style',Palatino,Georgia,serif] mt-4 max-w-lg text-4xl font-medium leading-tight tracking-[-0.03em]`}>
            Real people. Verified profiles. Approved partners.
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-7 text-[#C8C0B4]">
            Wingman is built around trust. Users complete their profiles and verification, Wingmen are reviewed before approval, and venue partners are reviewed before joining the platform.
          </p>
          <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            {TRUST.map((item) => (
              <li key={item.label} className="flex items-start gap-2 text-sm text-[#F4F1EB]/85">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#C8B38B]" aria-hidden />
                {item.label}
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-white/10 py-16 sm:py-20">
          <h2 className={`font-['Iowan_Old_Style',Palatino,Georgia,serif] max-w-md text-4xl font-medium leading-tight tracking-[-0.03em]`}>
            Built for the people creating the night, too.
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-7 text-[#C8C0B4]">
            Wingman connects hospitality venues with customers who are actively looking to go out, book, and spend. Partners can showcase experiences, VIP tables, and availability directly on the platform.
          </p>
          <Link href="/venues/apply" className="mt-8 inline-flex h-12 items-center border border-[#F4F1EB]/30 px-6 text-sm">
            Partner With Wingman
          </Link>
        </section>

        <section className="border-t border-white/10 py-16 sm:py-24">
          <h2 className={`font-['Iowan_Old_Style',Palatino,Georgia,serif] max-w-xl text-4xl font-medium leading-tight tracking-[-0.03em] sm:text-5xl`}>
            Find your night. Choose your experience. Book it. Enjoy it.
          </h2>
          <p className="mt-4 text-sm text-[#C8B38B]">Miami is just the beginning.</p>
          <Link href="/discover" className="mt-8 inline-flex h-12 items-center bg-[#F4F1EB] px-6 text-sm font-medium text-[#121212]">
            Explore Wingman
          </Link>
        </section>
      </div>
      <CustomerNav />
    </main>
  );
}
