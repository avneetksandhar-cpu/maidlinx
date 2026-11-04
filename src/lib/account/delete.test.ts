import { describe, expect, it } from "vitest";
import {
  ACCOUNT_DELETE_CONFIRM_PHRASE,
  accountDeletionConfirmed,
  anonymizedDeletedEmail,
} from "@/lib/account/delete";

describe("accountDeletionConfirmed", () => {
  it("requires exact DELETE phrase", () => {
    expect(accountDeletionConfirmed("DELETE")).toBe(true);
    expect(accountDeletionConfirmed(" DELETE ")).toBe(true);
    expect(accountDeletionConfirmed("delete")).toBe(false);
    expect(accountDeletionConfirmed("")).toBe(false);
    expect(accountDeletionConfirmed(null)).toBe(false);
  });

  it("exports the confirm phrase used by UI", () => {
    expect(ACCOUNT_DELETE_CONFIRM_PHRASE).toBe("DELETE");
  });
});

describe("anonymizedDeletedEmail", () => {
  it("builds a unique deleted mailbox per user id", () => {
    expect(anonymizedDeletedEmail("abc-123")).toBe("deleted-abc-123@deleted.maidlinx.invalid");
  });
});
