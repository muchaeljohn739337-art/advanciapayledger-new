import {
  EventBridgeClient,
  PutEventsCommand,
  PutEventsRequestEntry,
} from "@aws-sdk/client-eventbridge";

const eventBridgeClient = new EventBridgeClient({
  region: process.env.AWS_REGION || "us-east-1",
});

export interface PHISafeEvent {
  source: string;
  detailType: string;
  detail: Record<string, any>;
}

export async function publishPHISafeEvent(
  eventBusName: string,
  event: PHISafeEvent,
): Promise<void> {
  const entry: PutEventsRequestEntry = {
    Source: event.source,
    DetailType: event.detailType,
    Detail: JSON.stringify(event.detail),
    EventBusName: eventBusName,
  };

  await eventBridgeClient.send(
    new PutEventsCommand({
      Entries: [entry],
    }),
  );
}

export async function publishPHISafeEvents(
  eventBusName: string,
  events: PHISafeEvent[],
): Promise<void> {
  const entries: PutEventsRequestEntry[] = events.map((event) => ({
    Source: event.source,
    DetailType: event.detailType,
    Detail: JSON.stringify(event.detail),
    EventBusName: eventBusName,
  }));

  await eventBridgeClient.send(
    new PutEventsCommand({
      Entries: entries,
    }),
  );
}
