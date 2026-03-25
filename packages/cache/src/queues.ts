import type { Job } from "bullmq";
import { Queue } from "bullmq";
import { redisConnection } from "./redis";

const defaultQueueOptions = {
  connection: redisConnection as never,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: 1000,
  },
};

let emailQueueInstance: Queue | null = null;
let webhookQueueInstance: Queue | null = null;
let planOperationQueueInstance: Queue | null = null;
let emailDeadLetterQueueInstance: Queue | null = null;
let webhookDeadLetterQueueInstance: Queue | null = null;
let planOperationDeadLetterQueueInstance: Queue | null = null;

function createLazyQueue(getInstance: () => Queue): Queue {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        const queue = getInstance();
        const value = Reflect.get(queue, prop);
        return typeof value === "function" ? value.bind(queue) : value;
      },
    },
  ) as Queue;
}

function getEmailQueue() {
  emailQueueInstance ??= new Queue("email-queue", defaultQueueOptions);
  return emailQueueInstance;
}

function getWebhookQueue() {
  webhookQueueInstance ??= new Queue("webhook-queue", defaultQueueOptions);
  return webhookQueueInstance;
}

function getPlanOperationQueue() {
  planOperationQueueInstance ??= new Queue("plan-operation-queue", {
    connection: redisConnection as never,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: {
        age: 60 * 60,
        count: 1000,
      },
      removeOnFail: 1000,
    },
  });
  return planOperationQueueInstance;
}

function getEmailDeadLetterQueue() {
  emailDeadLetterQueueInstance ??= new Queue(
    "email-queue-dlq",
    defaultQueueOptions,
  );
  return emailDeadLetterQueueInstance;
}

function getWebhookDeadLetterQueue() {
  webhookDeadLetterQueueInstance ??= new Queue(
    "webhook-queue-dlq",
    defaultQueueOptions,
  );
  return webhookDeadLetterQueueInstance;
}

function getPlanOperationDeadLetterQueue() {
  planOperationDeadLetterQueueInstance ??= new Queue(
    "plan-operation-queue-dlq",
    defaultQueueOptions,
  );
  return planOperationDeadLetterQueueInstance;
}

export const emailQueue = createLazyQueue(getEmailQueue);
export const webhookQueue = createLazyQueue(getWebhookQueue);
export const planOperationQueue = createLazyQueue(getPlanOperationQueue);
export const emailDeadLetterQueue = createLazyQueue(getEmailDeadLetterQueue);
export const webhookDeadLetterQueue = createLazyQueue(
  getWebhookDeadLetterQueue,
);
export const planOperationDeadLetterQueue = createLazyQueue(
  getPlanOperationDeadLetterQueue,
);

export async function pushToDeadLetterQueue(
  queueName: "email-queue" | "webhook-queue" | "plan-operation-queue",
  job: Job | undefined,
  error: Error,
) {
  if (!job) return;

  const deadLetterQueue =
    queueName === "email-queue"
      ? getEmailDeadLetterQueue()
      : queueName === "webhook-queue"
        ? getWebhookDeadLetterQueue()
        : getPlanOperationDeadLetterQueue();

  await deadLetterQueue.add(
    `${job.name}-dead-letter`,
    {
      originalJobId: job.id,
      originalQueue: queueName,
      payload: job.data,
      failedReason: error.message,
      attemptsMade: job.attemptsMade,
    },
    {
      removeOnComplete: 1000,
      removeOnFail: 1000,
    },
  );
}
