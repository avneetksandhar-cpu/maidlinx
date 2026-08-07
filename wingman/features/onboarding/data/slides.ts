export type OnboardingSlide = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  imageAlt: string;
};

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: "access",
    title: "Access the world's most exclusive experiences.",
    imageUrl:
      "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200&q=80&auto=format&fit=crop",
    imageAlt: "Luxury city skyline at night",
  },
  {
    id: "verified",
    title: "Verified hosts only.",
    subtitle: "Every experience is curated and vetted for quality and discretion.",
    imageUrl:
      "https://images.unsplash.com/photo-1567899378494-47b050a96232?w=1200&q=80&auto=format&fit=crop",
    imageAlt: "Luxury yacht on open water",
  },
  {
    id: "membership",
    title: "Membership unlocks access.",
    subtitle: "Join a private community with priority booking and concierge support.",
    imageUrl:
      "https://images.unsplash.com/photo-1571266028243-e68fdf9c2f94?w=1200&q=80&auto=format&fit=crop",
    imageAlt: "VIP club lounge interior",
  },
];
