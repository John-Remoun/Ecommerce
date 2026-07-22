import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BrandDocument = HydratedDocument<Brand>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: true,
  strictQuery: true,
  collection: 'Ecommerce_APP_BRANDS',
})
export class Brand {
  @Prop({ type: Types.ObjectId })
  _id!: Types.ObjectId | string;

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, required: true, unique: true, trim: true })
  slug!: string;

  @Prop({ type: String, required: false })
  logo?: string;

  @Prop({ type: String, required: false })
  description?: string;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);

BrandSchema.pre('save', function (this: BrandDocument) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .replace(/-+/g, '-');
  }
});

BrandSchema.pre(
  ['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete'],
  function (this: any) {
    if (this.getOptions().withDeleted) return;

    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
      this.where({ deletedAt: null });
    }
  },
);

BrandSchema.pre(
  ['updateOne', 'updateMany', 'findOneAndUpdate'],
  { document: false, query: true },
  function (this: any) {
    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
      this.where({ deletedAt: null });
    }
  },
);

(['deleteOne', 'deleteMany'] as const).forEach((op) => {
  BrandSchema.pre(
    op,
    { document: false, query: true },
    async function (this: any) {
      const filter = this.getFilter();
      const softFilter = { ...filter, deletedAt: null };

      if (op === 'deleteOne') {
        await this.model.updateOne(softFilter, {
          $set: { deletedAt: new Date() },
        });
      } else {
        await this.model.updateMany(softFilter, {
          $set: { deletedAt: new Date() },
        });
      }

      this.setQuery({ _id: null });
    },
  );
});

export const BrandModel = MongooseModule.forFeature([
  { name: Brand.name, schema: BrandSchema },
]);
