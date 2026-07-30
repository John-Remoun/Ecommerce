/* eslint-disable @typescript-eslint/require-await */
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthenticationModule } from './modules/authentication/authentication.module';
import { UserModule } from './modules/user/user.module';
import { ProductModule } from './modules/product/product.module';
import { CategoryModule } from './modules/category/category.module';
import { BrandModule } from './modules/brand/brand.module';
import { OrderModule } from './modules/order/order.module';
import { CartModule } from './modules/cart/cart.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ReviewModule } from './modules/review/review.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { SearchModule } from './modules/search/search.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { HealthModule } from './modules/health/health.module';
import { UploadModule } from './common/module/upload/upload.module';
import { RedisModule } from './common/module/redis/redis.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { UserModel } from './model/user.model';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development', '.env.production'],
      isGlobal: true,
    }),
    UserModel,

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URI'),
        serverSelectionTimeoutMS: 30000,
        onConnectionCreate: (connection: Connection) => {
          connection.on('connected', () => console.log('DB Is connected👌🤩'));
          connection.on('open', () => console.log('open'));
          connection.on('disconnected', () => console.log('disconnected'));
          connection.on('reconnected', () => console.log('reconnected'));
          connection.on('disconnecting', () => console.log('disconnecting'));

          return connection;
        },
      }),
      inject: [ConfigService],
    }),

    RedisModule,

    AuthenticationModule,
    UserModule,
    ProductModule,
    CategoryModule,
    BrandModule,
    OrderModule,
    CartModule,
    CouponModule,
    PaymentModule,
    ReviewModule,
    WishlistModule,
    SearchModule,
    NotificationModule,
    AuditLogModule,
    HealthModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
