import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: true,
  strictQuery: true,
  collection: 'Ecommerce_APP_CATEGORIES',
})
export class Category {
  @Prop({ type: Types.ObjectId })
  _id!: Types.ObjectId | string;

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, required: true, unique: true, trim: true })
  slug!: string;

  @Prop({ type: String, required: false })
  image?: string;

  @Prop({ type: Types.ObjectId, ref: Category.name, required: false })
  parent?: Types.ObjectId | string;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.pre('save', function (this: CategoryDocument) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .replace(/-+/g, '-');
  }
});

CategorySchema.pre(
  ['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete'],
  function (this: any) {
    if (this.getOptions().withDeleted) return;

    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
      this.where({ deletedAt: null });
    }
  },
);

CategorySchema.pre(
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
  CategorySchema.pre(
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

export const CategoryModel = MongooseModule.forFeature([
  { name: Category.name, schema: CategorySchema },
]);
