/**
 * OneSignal push notification service stub.
 */

export type PushPayload = {
  title: string;
  message: string;
  userIds?: string[];
};

export async function sendPushNotification(_payload: PushPayload): Promise<void> {
  // TODO: integrate OneSignal REST API
}
