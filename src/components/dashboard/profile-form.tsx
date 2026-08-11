"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardContent, Input, Label } from "@/components/ui";
import type { CustomerProfile } from "@/lib/profiles/repository";

interface ProfileFormProps {
  profile: CustomerProfile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(profile.firstName ?? "");
  const [lastName, setLastName] = useState(profile.lastName ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/dashboard/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "profile",
          firstName,
          lastName,
          phone,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save profile.");

      setMessage("Profile updated successfully.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="mt-2"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile.email ?? ""} disabled className="mt-2 opacity-70" />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+14155551234"
              className="mt-2"
            />
          </div>
          {message && <p className="text-sm text-success">{message}</p>}
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" variant="gold" disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
