import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { Product } from 'src/model/product.model';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({
  timestamps: true,
  collection: 'Ecommerce_APP_REVIEWS',
})
export class Review {
  @Prop({ type: Types.ObjectId })
  _id!: Types.ObjectId | string;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  product!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user!: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1, max: 5 })
  rating!: number;

  @Prop({ type: String, trim: true, maxlength: 2000 })
  comment?: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

async function recalcProductRatings(
  productId: Types.ObjectId,
  reviewModel: Model<Review>,
) {
  const stats = await reviewModel.aggregate<{
    avgRating: number;
    nRating: number;
  }>([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        nRating: { $sum: 1 },
      },
    },
  ]);

  const productModel = reviewModel.db.model<Product>(Product.name);

  if (!stats.length) {
    await productModel.findByIdAndUpdate(productId, {
      ratingsAverage: 0,
      ratingsCount: 0,
    });
    return;
  }

  await productModel.findByIdAndUpdate(productId, {
    ratingsAverage: Math.round(stats[0].avgRating * 10) / 10,
    ratingsCount: stats[0].nRating,
  });
}

ReviewSchema.post('save', async function (doc: ReviewDocument) {
  const reviewModel = doc.constructor as Model<Review>;
  await recalcProductRatings(doc.product, reviewModel);
});

ReviewSchema.post('findOneAndUpdate', async function (doc: ReviewDocument) {
  if (!doc) return;
  await recalcProductRatings(doc.product, this.model as Model<Review>);
});

ReviewSchema.post('findOneAndDelete', async function (doc: ReviewDocument) {
  if (!doc) return;
  await recalcProductRatings(doc.product, this.model as Model<Review>);
});

ReviewSchema.post(
  'deleteOne',
  { document: true, query: false },
  async function (this: ReviewDocument) {
    await recalcProductRatings(this.product, this.constructor as Model<Review>);
  },
);
