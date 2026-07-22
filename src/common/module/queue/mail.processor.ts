import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

export const MAIL_QUEUE = 'mail';

export interface MailJobPayload {
  to: string;
  subject: string;
  template?: string;
  context?: Record<string, unknown>;
}

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  async process(job: Job<MailJobPayload>): Promise<void> {
    this.logger.log(
      `Processing mail job ${job.id} for ${job.data.to} (${job.data.subject})`,
    );
    // Stub: wire MailService.sendTemplate() here when ready
  }
}
