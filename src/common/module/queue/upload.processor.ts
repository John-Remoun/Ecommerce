import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

export const UPLOAD_QUEUE = 'upload';

export interface UploadJobPayload {
  key: string;
  userId: string;
}

@Processor(UPLOAD_QUEUE)
export class UploadProcessor extends WorkerHost {
  private readonly logger = new Logger(UploadProcessor.name);

  async process(job: Job<UploadJobPayload>): Promise<void> {
    this.logger.log(
      `Processing upload job ${job.id} for key ${job.data.key} (user ${job.data.userId})`,
    );
    // Stub: wire image processing (sharp) here when ready
  }
}
