import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || "us-east-1",
});

export async function publishToQueue(
  queueUrl: string,
  message: any,
): Promise<void> {
  await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
    }),
  );
}

export async function publishBatch(
  queueUrl: string,
  messages: any[],
): Promise<void> {
  // TODO: Implement SendMessageBatchCommand
  for (const message of messages) {
    await publishToQueue(queueUrl, message);
  }
}
