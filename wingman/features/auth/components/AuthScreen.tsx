"use client";

import { WingmanMark } from "@/components/brand/WingmanMark";
import { CustomerNav, CUSTOMER_NAV_OFFSET } from "@/components/layout/CustomerNav";
import { useKeyboardInset } from "@/components/ui/useKeyboardInset";
import { AuthFinePrint } from "@/features/auth/components/AuthFinePrint";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { trackProductEvent } from "@/lib/analytics/browser";

type Intent = "choose" | "customer" | "signin";

const CUSTOMER_STEPS = ["Name", "Email", "Phone", "Password", "Date of birth", "Age", "Terms"] as const;

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/discover";
  return value;
}

function AuthForm() {
  useKeyboardInset();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const nextPath = safeNext(searchParams.get("next"));
  const [intent, setIntent] = useState<Intent>(searchParams.get("mode") === "signin" ? "signin" : "choose");
  const [customerStep, setCustomerStep] = useState(0);
  const [held, setHeld] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [adult, setAdult] = useState(false);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountExists, setAccountExists] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [moreOptions, setMoreOptions] = useState(false);

  useEffect(() => {
    if (intent === "customer") trackProductEvent("signup_started");
  }, [intent]);

  function validateCustomerStep(step: number): string | null {
    if (step === 0 && name.trim().length < 2) return "Enter your name.";
    if (step === 1 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email address.";
    if (step === 2 && phone.replace(/\D/g, "").length < 10) return "Enter a phone number with at least 10 digits.";
    if (step === 3 && password.length < 10) return "Use a password with at least 10 characters.";
    if (step === 4) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob.trim());
      if (!match) return "Enter your date of birth.";
      const now = new Date();
      let age = now.getUTCFullYear() - Number(match[1]);
      const monthDelta = now.getUTCMonth() + 1 - Number(match[2]);
      if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < Number(match[3]))) age -= 1;
      if (age < 21) return "You must be 21 or older.";
    }
    if (step === 5 && !adult) return "Confirm you are 21 or older.";
    return null;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (intent === "customer" && customerStep < CUSTOMER_STEPS.length - 1) {
      const stepError = validateCustomerStep(customerStep);
      if (stepError) {
        setError(stepError);
        return;
      }
      setCustomerStep((value) => value + 1);
      return;
    }
    if (intent === "customer" && !adult) {
      setError("You must be 21 or older.");
      return;
    }
    setLoading(true);
    setAccountExists(false);
    try {
      const response = await fetch(intent === "signin" ? "/api/auth/login" : "/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          displayName: name,
          phone,
          dob,
          terms,
          intent: "customer",
          staySignedIn: intent === "signin" ? staySignedIn : true,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        const message = payload.error ?? "Something went wrong.";
        setAccountExists(response.status === 409);
        setError(message);
        return;
      }
      await refresh();
      if (intent === "signin") {
        const me = await fetch("/api/auth/me");
        if (me.ok) {
          const session = (await me.json()) as { user?: { role?: string } };
          if (session.user?.role === "admin" || session.user?.role === "owner") {
            router.replace("/operator/applicants");
            router.refresh();
            return;
          }
        }
      }
      if (intent === "customer") {
        setHeld(true);
        return;
      }
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (held) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#070B14] px-5 pb-36 pt-[max(2.5rem,env(safe-area-inset-top))] text-[#F4F1EB]">
        <Link href="/discover" aria-label="Discover"><WingmanMark size={32} priority /></Link>
        <h1 className="mt-10 text-[32px] font-medium leading-none">Your account is saved.</h1>
        <p className="mt-4 text-sm leading-6 text-[#C8C0B4]">Your account is ready. Bring a valid government-issued photo ID to the experience — entry may be refused if age or identity requirements are not satisfied. Payment still requires the in-person ID check. No email or phone code is sent.</p>
        <button type="button" onClick={() => router.replace(nextPath)} className="wm-press mt-8 h-12 bg-[#F4F1EB] text-sm font-semibold text-[#070B14]">{nextPath.startsWith("/cart") || nextPath.startsWith("/checkout") ? "Continue to payment" : "Continue"}</button>
        <AuthFinePrint />
        <CustomerNav />
      </main>
    );
  }

  if (intent === "choose") {
    return (
      <main className="relative min-h-dvh text-[#F4F1EB]">
        <div className="absolute inset-0 bg-black">
          <Image src="/photos/login-opening.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[center_72%]" />
          <div className="absolute inset-0 bg-black/55" />
        </div>
        <div
          className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-6"
          style={{ paddingTop: "max(2.75rem, env(safe-area-inset-top))", paddingBottom: CUSTOMER_NAV_OFFSET }}
        >
          <Link href="/discover" aria-label="Discover" className="mx-auto flex flex-col items-center">
            <WingmanMark size={22} priority />
            <span className="mt-3 text-[10px] font-medium tracking-[0.34em] text-[#F4F1EB]">WINGMAN</span>
          </Link>
          <section className="mt-14">
            <h1 className="text-center font-['Iowan_Old_Style',Palatino,Georgia,serif] text-[2.5rem] font-medium leading-none tracking-[-0.03em]">Log In</h1>
            <p className="mt-3 text-center text-[15px] text-[#F4F1EB]/80">Your night starts here.</p>
            <div className="mt-8 flex flex-col gap-3">
              <SocialSignIn onError={setError} />
              <button type="button" onClick={() => { setIntent("signin"); setError(null); }} className={outlineButtonClass}>
                <MailIcon />
                Continue with Email
              </button>
            </div>
            <button type="button" onClick={() => setMoreOptions((open) => !open)} className="mx-auto mt-6 block text-[13px] text-[#F4F1EB]/75" aria-expanded={moreOptions}>
              More sign-in options
            </button>
            {moreOptions ? (
              <div className="mt-4 flex flex-col gap-3">
                <SocialSignIn onError={setError} providers={["facebook", "linkedin"]} />
                <button type="button" onClick={() => { setIntent("customer"); setError(null); }} className="text-center text-[13px] text-[#F4F1EB]/80 underline-offset-4 hover:underline">
                  Create an account
                </button>
              </div>
            ) : null}
            {error ? <p className="mt-4 text-center text-sm text-[#C8B38B]">{error}</p> : null}
          </section>
          <p className="mb-3 mt-auto pt-10 text-center text-[11px] leading-5 text-[#F4F1EB]/60">
            By continuing, you agree to our{" "}
            <Link href="/legal/terms" className="underline underline-offset-2">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/legal/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
          </p>
        </div>
        <CustomerNav />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#070B14] px-5 pb-36 pt-[max(2.5rem,env(safe-area-inset-top))] text-[#F4F1EB]">
      <Link href="/discover" aria-label="Discover" className="flex items-center gap-2">
        <WingmanMark size={32} priority />
        <span className="text-[12px] font-semibold tracking-[0.22em]">WINGMAN</span>
      </Link>
      <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-3">
          <p className="text-xs tracking-[0.16em] text-[#C8B38B]">{intent === "customer" ? `${customerStep + 1} / ${CUSTOMER_STEPS.length}` : "Account"}</p>
          <h1 className="text-[28px] font-medium leading-none">
            {intent === "signin" ? "Sign in" : CUSTOMER_STEPS[customerStep]}
          </h1>
          <p className="text-sm text-[#C8C0B4]">
            {intent === "signin" ? "Welcome back." : "A short account for booking."}
          </p>
          {intent === "customer" && customerStep === 0 ? <Field label="Name" value={name} onChange={setName} autoComplete="name" /> : null}
          {intent !== "customer" || customerStep === 1 ? (intent === "customer" && customerStep !== 1 ? null : <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />) : null}
          {intent === "customer" && customerStep === 2 ? <Field label="Phone" type="tel" value={phone} onChange={setPhone} autoComplete="tel" /> : null}
          {intent === "customer" && customerStep === 4 ? <Field label="Date of birth" type="date" value={dob} onChange={setDob} /> : null}
          {intent === "signin" || (intent === "customer" && customerStep === 3) ? (
            <>
              <div className="relative">
                <Field label="Password" type={show ? "text" : "password"} value={password} onChange={setPassword} autoComplete={intent === "signin" ? "current-password" : "new-password"} />
                <button type="button" onClick={() => setShow((value) => !value)} className="absolute right-3 top-8 text-xs text-[#C8B38B]">{show ? "Hide" : "Show"}</button>
              </div>
              {intent === "customer" && customerStep === 3 ? (
                <p className="text-xs text-[#C8C0B4]">At least 10 characters. You will use this with your email to sign back in.</p>
              ) : null}
              {intent === "signin" ? (
                <label className="flex min-h-11 items-center gap-3 text-sm text-[#C8C0B4]">
                  <input type="checkbox" checked={staySignedIn} onChange={(event) => setStaySignedIn(event.target.checked)} className="h-6 w-6 shrink-0" />
                  Stay signed in
                </label>
              ) : null}
            </>
          ) : null}
          {intent === "customer" && customerStep === 5 ? (
            <label className="flex min-h-11 items-start gap-3 text-sm text-[#C8C0B4]">
              <input type="checkbox" checked={adult} onChange={(event) => setAdult(event.target.checked)} className="mt-0.5 h-6 w-6 shrink-0" />
              I confirm I am 21 or older.
            </label>
          ) : null}
          {intent === "customer" && customerStep === 6 ? (
            <label className="flex min-h-11 items-start gap-3 text-sm text-[#C8C0B4]">
              <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} className="mt-0.5 h-6 w-6 shrink-0" />
              I agree to the <Link href="/legal/terms" className="text-[#F4F1EB] underline">Terms</Link> and <Link href="/legal/privacy" className="text-[#F4F1EB] underline">Privacy Policy</Link>.
            </label>
          ) : null}
          {error ? <p className="text-sm text-[#C8B38B]">{error}</p> : null}
          <button type="submit" disabled={loading || (intent === "customer" && customerStep === 6 && !terms)} className="wm-press mt-2 h-12 bg-[#F4F1EB] text-sm font-semibold text-[#070B14] disabled:opacity-40">
            {loading ? "One second" : intent === "signin" ? "Sign in" : customerStep === CUSTOMER_STEPS.length - 1 ? "Create my account" : "Continue"}
          </button>
          {accountExists ? (
            <button type="button" onClick={() => { setIntent("signin"); setError(null); setAccountExists(false); }} className="h-12 rounded-2xl border border-[#F4F1EB]/20 text-sm font-semibold">
              Sign in
            </button>
          ) : null}
          {intent === "signin" ? <SocialSignIn onError={setError} /> : null}
          {intent === "signin" ? <Link href={`/auth/reset?next=${encodeURIComponent(nextPath)}`} className="text-sm text-[#C8C0B4]">Forgot password</Link> : null}
          {intent === "customer" ? (
            <button type="button" onClick={() => { setIntent("signin"); setError(null); }} className="text-sm text-[#C8C0B4]">Already have an account? Sign in</button>
          ) : null}
          <button type="button" onClick={() => (intent === "customer" && customerStep > 0 ? setCustomerStep((value) => value - 1) : setIntent("choose"))} className="text-left text-sm text-[#C8C0B4]">Back</button>
        </form>
      <AuthFinePrint />
      <CustomerNav />
    </main>
  );
}

type SocialProvider = "apple" | "google" | "facebook" | "linkedin";

const primaryButtonClass = "flex h-12 w-full items-center justify-center gap-3 rounded-full bg-[#F4F1EB] text-[15px] font-medium text-[#141414]";
const outlineButtonClass = "flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[#F4F1EB]/40 bg-transparent text-[15px] font-medium text-[#F4F1EB]";
const charcoalButtonClass = "flex h-12 w-full items-center justify-center gap-3 rounded-full bg-[#1C1C1C] text-[15px] font-medium text-[#F4F1EB]";

function SocialSignIn({ onError, providers = ["apple", "google"] }: { onError: (message: string) => void; providers?: SocialProvider[] }) {
  async function start(provider: SocialProvider) {
    onError("");
    try {
      const response = await fetch(`/api/auth/oauth/${provider}`, { method: "POST" });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        onError(payload.error ?? "That sign-in is not turned on yet.");
        return;
      }
      window.location.assign(payload.url);
    } catch {
      onError("Network error. Try again.");
    }
  }

  const tone = providers.includes("apple") || providers.includes("google") ? primaryButtonClass : charcoalButtonClass;

  return (
    <>
      {providers.includes("apple") ? (
        <button type="button" onClick={() => void start("apple")} className={primaryButtonClass}>
          <AppleIcon />
          Continue with Apple
        </button>
      ) : null}
      {providers.includes("google") ? (
        <button type="button" onClick={() => void start("google")} className={primaryButtonClass}>
          <GoogleIcon />
          Continue with Google
        </button>
      ) : null}
      {providers.includes("facebook") ? (
        <button type="button" onClick={() => void start("facebook")} className={tone}>
          <FacebookIcon />
          Continue with Facebook
        </button>
      ) : null}
      {providers.includes("linkedin") ? (
        <button type="button" onClick={() => void start("linkedin")} className={tone}>
          <LinkedInIcon />
          Continue with LinkedIn
        </button>
      ) : null}
    </>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="shrink-0">
      <path fill="currentColor" d="M12.6 8.4c0-1.7 1.4-2.5 1.5-2.6-.8-1.2-2.1-1.3-2.5-1.4-1.1-.1-2.1.6-2.6.6s-1.4-.6-2.3-.6c-1.2 0-2.3.7-2.9 1.7-1.2 2.1-.3 5.3.9 7 .6.8 1.3 1.8 2.2 1.7.9 0 1.2-.6 2.3-.6s1.4.6 2.3.5c1 0 1.6-.8 2.2-1.7.7-1 1-1.9 1-2 .0 0-1.9-.7-1.9-2.6zM10.9 3.6c.5-.6.8-1.4.7-2.2-.7 0-1.5.5-2 .1-.5.6-.9 1.4-.8 2.2.8.1 1.6-.4 2.1-1.1z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="shrink-0">
      <path fill="#4285F4" d="M15.2 8.2c0-.5 0-1-.1-1.5H8v2.8h4c-.2 1-.7 1.8-1.5 2.4v2h2.4c1.4-1.3 2.3-3.2 2.3-5.7z" />
      <path fill="#34A853" d="M8 15.5c2 0 3.7-.7 5-1.8l-2.4-2c-.7.5-1.6.7-2.6.7-2 0-3.7-1.3-4.3-3.2H1.2v2c1.3 2.6 3.9 4.3 6.8 4.3z" />
      <path fill="#FBBC05" d="M3.7 9.2a4.6 4.6 0 0 1 0-2.4v-2H1.2a7.5 7.5 0 0 0 0 6.4l2.5-2z" />
      <path fill="#EA4335" d="M8 3.6c1.1 0 2.1.4 2.9 1.1l2.2-2.2C11.7 1.3 10 0.5 8 .5 5.1.5 2.5 2.2 1.2 4.8l2.5 2C4.3 4.9 6 3.6 8 3.6z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="shrink-0">
      <path fill="#1877F2" d="M15 8.02C15 4.15 11.87 1 8 1S1 4.15 1 8.02c0 3.5 2.56 6.41 5.91 6.93v-4.9H5.09V8.02h1.82V6.41c0-1.8 1.07-2.8 2.71-2.8.79 0 1.61.14 1.61.14v1.77H10.2c-.89 0-1.17.55-1.17 1.12v1.38h2l-.32 2.03H9.03v4.9C12.44 14.43 15 11.52 15 8.02z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="shrink-0">
      <path fill="#0A66C2" d="M13.6 1H2.4C1.6 1 1 1.6 1 2.4v11.2c0 .8.6 1.4 1.4 1.4h11.2c.8 0 1.4-.6 1.4-1.4V2.4c0-.8-.6-1.4-1.4-1.4zM5.1 13H3.1V6.3h2v6.7zM4.1 5.4c-.6 0-1.1-.5-1.1-1.1s.5-1.1 1.1-1.1 1.1.5 1.1 1.1-.5 1.1-1.1 1.1zM13 13h-2V9.7c0-.8 0-1.8-1.1-1.8s-1.3.9-1.3 1.8V13H6.6V6.3h1.9v.9h.1c.3-.5 1-1.1 2-1.1 2.1 0 2.5 1.4 2.5 3.2V13z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="shrink-0">
      <path fill="currentColor" d="M1.5 3.5h13v9h-13v-9zm1.2 1 5.3 3.6L13.3 4.5H2.7zm10.6 7V5.6L8 9.3 2.7 5.6V11.5h10.6z" />
    </svg>
  );
}

function Field({ label, value, onChange, type = "text", autoComplete }: { label: string; value: string; onChange: (value: string) => void; type?: string; autoComplete?: string }) {
  return (
    <label className="block text-xs text-[#8F877C]">
      {label}
      <input required type={type} inputMode={type === "tel" ? "tel" : type === "email" ? "email" : undefined} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-12 w-full border border-[#F4F1EB]/15 bg-transparent px-4 text-base text-[#F4F1EB] outline-none" />
    </label>
  );
}

export function AuthScreen() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-[#070B14]" />}>
      <AuthForm />
    </Suspense>
  );
}
