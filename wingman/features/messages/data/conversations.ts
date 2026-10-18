export type ChatMessage = {
  id: string;
  from: "user" | "host";
  body: string;
  time: string;
};

export type Conversation = {
  id: string;
  name: string;
  subtitle: string;
  avatarUrl?: string;
  active: boolean;
  messages: ChatMessage[];
};

export const conversations: Conversation[] = [
  {
    id: "wingman",
    name: "Your Wingman · Andres P",
    subtitle: "Assigned host · sample thread",
    active: true,
    messages: [
      {
        id: "c1",
        from: "host",
        body: "This is Andres P — the assigned host. Tell me the night. A listing is not a reserved table.",
        time: "9:14 PM",
      },
      {
        id: "c2",
        from: "user",
        body: "Clubs tonight if there’s a real listing, then whatever still fits.",
        time: "9:16 PM",
      },
      {
        id: "c3",
        from: "host",
        body: "Noted as context. The $500 path is the night service. Chat unlocks after a paid confirmation.",
        time: "9:17 PM",
      },
    ],
  },
];

export function getConversation(id: string) {
  return conversations.find((item) => item.id === id);
}
