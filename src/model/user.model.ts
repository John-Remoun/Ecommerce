import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Exclude } from 'class-transformer';
import { HydratedDocument, Types } from 'mongoose';
import { GenderEnum, ProviderEnum, RoleEnum } from 'src/common/enum';
import { Permission } from 'src/common/enum/permission.enum';
import { IUser } from 'src/common/interface/user.interface';
import { SecurityModule } from 'src/common/module/security/security.module';
import { SecurityService } from 'src/common/module/security/security.service';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: true,
  strictQuery: true,
  collection: 'Ecommerce_APP_USERS',
})
export class User implements IUser {

  @Prop({ type: String, required: true })
  firstName!: string;

  @Prop({ type: String, required: true })
  lastName!: string;

  username?: string;

  @Prop({ type: String, required: true })
  slug!: string;

  @Prop({ type: String, required: true, unique: true })
  email!: string;

  @Exclude()
  @Prop({ type: String, required: true })
  password!: string;

  @Prop({ type: String, required: true })
  phone?: string;

  @Prop({ type: String, required: false })
  profilePicture?: string;

  @Prop({ type: [String], required: false })
  profileCoverPicture?: string[];

  @Prop({
    type: String,
    enum: Object.values(GenderEnum),
    default: GenderEnum.MALE,
  })
  gender!: GenderEnum;

  @Prop({ type: String, enum: Object.values(RoleEnum), default: RoleEnum.USER })
  role!: RoleEnum;

  @Prop({ type: [String], enum: Object.values(Permission), default: [] })
  permissions?: Permission[];

  @Prop({ type: String, required: false, select: false })
  refreshTokenHash?: string;

  @Prop({ type: Date, required: false, select: false })
  refreshTokenExpiresAt?: Date;

  @Prop({ type: String, required: false, select: false })
  emailVerificationOtpHash?: string;

  @Prop({ type: Date, required: false, select: false })
  emailVerificationOtpExpiresAt?: Date;

  @Prop({ type: String, required: false, select: false })
  passwordResetTokenHash?: string;

  @Prop({ type: Date, required: false, select: false })
  passwordResetTokenExpiresAt?: Date;

  @Prop({
    type: String,
    enum: Object.values(ProviderEnum),
    default: ProviderEnum.SYSTEM,
  })
  provider!: ProviderEnum;

  @Prop({ type: Date })
  changeCredentialsTime?: Date;

  @Prop({ type: Date })
  DOB?: Date;

  @Prop({ type: Date })
  confirmEmail?: Date;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
  wishlist?: Types.ObjectId[];
}
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('username')
  .get(function (this: UserDocument) {
    return `${this.firstName ?? ''} ${this.lastName ?? ''}`.trim();
  })
  .set(function (this: UserDocument, value: string) {
    const [firstName, ...rest] = value.split(' ');
    this.firstName = firstName || this.firstName;
    this.lastName = rest.join(' ') || this.lastName;
  });

export const UserModel = MongooseModule.forFeatureAsync([
  {
    name: User.name,
    imports: [SecurityModule],
    useFactory: (securityService: SecurityService) => {
      //  save
      UserSchema.pre('save', async function (this: UserDocument) {
        // Hash password
        if (this.isModified('password') && this.password) {
          this.password = await securityService.generateHash({
            plaintext: this.password,
          });
        }

        if (this.phone && this.isModified('phone')) {
          this.phone = await securityService.generateEncryption(this.phone);
        }

        if (this.isModified('firstName') || this.isModified('lastName')) {
          const fullName = `${this.firstName} ${this.lastName}`;
          this.slug = fullName.replaceAll(/\s+/g, '-').toLowerCase();
        }
      });

      //  updateOne
      UserSchema.pre(
        'updateOne',
        { document: true, query: false },
        async function (this: UserDocument) {
          const update = this.updateOne() as Record<string, any>;
          const set = update?.$set ?? {};

          if (set.password) {
            set.password = await securityService.generateHash({
              plaintext: set.password,
            });
          }

          if (set.phone) {
            set.phone = await securityService.generateEncryption(set.phone);
          }

          const firstName = set.firstName ?? this.firstName;
          const lastName = set.lastName ?? this.lastName;
          if (set.firstName || set.lastName) {
            set.slug = `${firstName} ${lastName}`
              .replaceAll(/\s+/g, '-')
              .toLowerCase();
          }
        },
      );

      //  deleteOne
      UserSchema.pre(
        'deleteOne',
        { document: true, query: false },
        async function (this: UserDocument) {
          // Name-conflict guard example — you can adapt the condition to your needs
          const conflict = await this.model('User').findOne({
            slug: this.slug,
            _id: { $ne: this._id },
            deletedAt: null,
          });

          if (conflict) {
            throw new Error(
              `Name conflict: another user with slug "${this.slug}" already exists.`,
            );
          }

          this.deletedAt = new Date();
          await this.save();
        },
      );

      UserSchema.pre(
        ['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete'],
        function (this: any) {
          if (this.getOptions().withDeleted) return;

          const filter = this.getFilter();
          if (filter.deletedAt === undefined) {
            this.where({ deletedAt: null });
          }
        },
      );

      UserSchema.pre(
        ['updateOne', 'updateMany', 'findOneAndUpdate'],
        { document: false, query: true },
        async function (this: any) {
          const filter = this.getFilter();
          if (filter.deletedAt === undefined) {
            this.where({ deletedAt: null });
          }

          const update = this.getUpdate() as Record<string, any>;
          const set = update?.$set ?? {};

          if (set.password) {
            set.password = await securityService.generateHash({
              plaintext: set.password,
            });
            update.$set = set;
          }

          if (set.phone) {
            set.phone = await securityService.generateEncryption(set.phone);
            update.$set = set;
          }

          if (set.firstName || set.lastName) {
            const currentDoc = await this.model.findOne(filter).lean();
            const firstName = set.firstName ?? currentDoc?.firstName ?? '';
            const lastName = set.lastName ?? currentDoc?.lastName ?? '';
            set.slug = `${firstName} ${lastName}`
              .replaceAll(/\s+/g, '-')
              .toLowerCase();
            update.$set = set;
          }
        },
      );

      const DELETE_OPS = ['deleteOne', 'deleteMany'] as const;

      DELETE_OPS.forEach((op) => {
        UserSchema.pre(
          op,
          { document: false, query: true },
          async function (this: any) {
            const filter = this.getFilter();

            // Only operate on non-deleted documents
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
      return UserSchema;
    },
    inject: [SecurityService],
  },
]);
