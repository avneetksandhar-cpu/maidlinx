"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardContent, Input, Label, Textarea } from "@/components/ui";
import type { ProfessionalProfile } from "@/lib/professionals/repository";

interface ProProfileFormProps {
  profile: ProfessionalProfile;
}

export function ProProfileForm({ profile }: ProProfileFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(profile.firstName ?? "");
  const [lastName, setLastName] = useState(profile.lastName ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [yearsExperience, setYearsExperience] = useState(
    profile.yearsExperience?.toString() ?? "",
  );
  const [serviceRadiusKm, setServiceRadiusKm] = useState(
    profile.serviceRadiusKm?.toString() ?? "25",
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/cleaner/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          bio,
          yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
          serviceRadiusKm: Number(serviceRadiusKm),
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
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-muted font-display text-xl font-semibold text-gold">
            {[firstName, lastName]
              .filter(Boolean)
              .map((n) => n[0])
              .join("")
              .toUpperCase() || "P"}
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-ink">
              {[firstName, lastName].filter(Boolean).join(" ") || "Professional"}
            </p>
            <p className="text-sm text-ink-muted">
              {profile.ratingAverage.toFixed(1)} ★ · {profile.ratingCount} reviews
              {profile.isVerified && " · Verified"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="pro-firstName">First name</Label>
                <Input
                  id="pro-firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="pro-lastName">Last name</Label>
                <Input
                  id="pro-lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="pro-email">Email</Label>
              <Input id="pro-email" value={profile.email ?? ""} disabled className="mt-2 opacity-70" />
            </div>

            <div>
              <Label htmlFor="pro-phone">Phone</Label>
              <Input
                id="pro-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+14155551234"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="pro-bio">Bio</Label>
              <Textarea
                id="pro-bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell customers about your experience..."
                className="mt-2"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="pro-experience">Years of experience</Label>
                <Input
                  id="pro-experience"
                  type="number"
                  min={0}
                  max={50}
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="pro-radius">Service radius (km)</Label>
                <Input
                  id="pro-radius"
                  type="number"
                  min={5}
                  max={100}
                  value={serviceRadiusKm}
                  onChange={(e) => setServiceRadiusKm(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            {message && <p className="text-sm text-success">{message}</p>}
            {error && <p className="text-sm text-error">{error}</p>}

            <Button type="submit" variant="gold" disabled={loading}>
              {loading ? "Saving..." : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
