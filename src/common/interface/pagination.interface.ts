import { HydratedDocument } from 'mongoose';

export interface IPaginate<TRawDocument> {
  docs: HydratedDocument<TRawDocument>[];

  currentPage: number;

  pages: number;

  size: number;

  total: number;
}
