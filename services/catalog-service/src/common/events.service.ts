import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';

export const EXCHANGE = 'netflix.events';

type Handler = (payload: any) => Promise<void>;

/**
 * Small RabbitMQ wrapper: one topic exchange, durable queues per consumer,
 * automatic reconnect so the service survives the broker restarting.
 */
@Injectable()
export class EventsService implements OnModuleDestroy {
  private readonly log = new Logger(EventsService.name);
  private readonly url = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';
  private conn?: amqp.Connection;
  private channel?: amqp.Channel;
  private subscriptions: { queue: string; key: string; handler: Handler }[] = [];
  private closing = false;

  constructor() {
    this.connect();
  }

  private async connect() {
    try {
      this.conn = await amqp.connect(this.url);
      this.channel = await this.conn.createChannel();
      await this.channel.assertExchange(EXCHANGE, 'topic', { durable: true });
      this.conn.on('close', () => this.retry());
      this.conn.on('error', () => undefined);
      for (const s of this.subscriptions) await this.bind(s.queue, s.key, s.handler);
      this.log.log('Connected to RabbitMQ');
    } catch (e) {
      this.log.warn(`RabbitMQ not reachable (${(e as Error).message}), retrying in 5s`);
      this.retry();
    }
  }

  private retry() {
    this.channel = undefined;
    if (!this.closing) setTimeout(() => this.connect(), 5000);
  }

  private async bind(queue: string, key: string, handler: Handler) {
    const ch = this.channel!;
    await ch.assertQueue(queue, { durable: true });
    await ch.bindQueue(queue, EXCHANGE, key);
    await ch.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        await handler(JSON.parse(msg.content.toString()));
        ch.ack(msg);
      } catch (e) {
        this.log.error(`Handler for ${key} failed: ${(e as Error).message}`);
        ch.nack(msg, false, false); // drop poison messages instead of looping forever
      }
    });
    this.log.log(`Consuming ${key} -> ${queue}`);
  }

  async subscribe(queue: string, key: string, handler: Handler) {
    this.subscriptions.push({ queue, key, handler });
    if (this.channel) await this.bind(queue, key, handler);
  }

  publish(key: string, payload: object) {
    if (!this.channel) {
      this.log.warn(`Broker down, dropping event ${key}`);
      return;
    }
    const body = { ...payload, occurredAt: new Date().toISOString() };
    this.channel.publish(EXCHANGE, key, Buffer.from(JSON.stringify(body)), {
      contentType: 'application/json',
      persistent: true,
    });
  }

  async onModuleDestroy() {
    this.closing = true;
    await this.conn?.close().catch(() => undefined);
  }
}
