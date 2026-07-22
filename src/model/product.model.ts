import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Brand } from './brand.model';
import { Category } from './category.model';

export type ProductDocument = HydratedDocument<Product>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: true,
  strictQuery: true,
  collection: 'Ecommerce_APP_PRODUCTS',
})
export class Product {
  @Prop({ type: Types.ObjectId })
  _id!: Types.ObjectId | string;

  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: String, required: true, unique: true, trim: true })
  slug!: string;

  @Prop({ type: String, required: true })
  description!: string;

  @Prop({ type: Number, required: true, min: 0 })
  price!: number;

  @Prop({ type: Number, required: false, min: 0 })
  discountPrice?: number;

  @Prop({ type: Types.ObjectId, ref: Category.name, required: true })
  category!: Types.ObjectId | string;

  @Prop({ type: Types.ObjectId, ref: Brand.name, required: true })
  brand!: Types.ObjectId | string;

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  stock!: number;

  @Prop({ type: String, required: true, unique: true, trim: true })
  sku!: string;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Number, default: 0, min: 0, max: 5 })
  ratingsAverage!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  ratingsCount!: number;

  @Prop({ type: Number, required: false, min: 0 })
  lowStockThreshold?: number;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ title: 'text', description: 'text' });
ProductSchema.index({ price: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ brand: 1 });

ProductSchema.pre('save', function (this: ProductDocument) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .replace(/-+/g, '-');
  }
});

ProductSchema.pre(
  ['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete'],
  function (this: any) {
    if (this.getOptions().withDeleted) return;

    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
      this.where({ deletedAt: null });
    }
  },
);

ProductSchema.pre(
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
  ProductSchema.pre(
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

export const ProductModel = MongooseModule.forFeature([
  { name: Product.name, schema: ProductSchema },
]);
