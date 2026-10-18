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
    title: "Your person in Miami.",
    subtitle: "A trusted insider who knows your taste and organises the night.",
    imageUrl: "/photos/miami-night.jpg",
    imageAlt: "Miami skyline at night — licensed atmosphere",
  },
  {
    id: "verified",
    title: "One path to a finished plan.",
    subtitle: "You request. We confirm what is actually available. Then you pay.",
    imageUrl: "/photos/club-interior.jpg",
    imageAlt: "Bar pour under club lighting — licensed atmosphere",
  },
  {
    id: "experience",
    title: "A request is not a reservation.",
    subtitle: "Nothing is held until availability is confirmed and you pay.",
    imageUrl: "/photos/nightlife-crowd.jpg",
    imageAlt: "Nightlife energy under stage lights — licensed atmosphere",
  },
];
