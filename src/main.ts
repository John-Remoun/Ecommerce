import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppModule } from './app.module';
import { PORT, ORIGINS, DB_URI } from './config';
import { AllExceptionsFilter } from './common/filter/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptor/transform.interceptor';

/**
 * Masks credentials in a MongoDB connection string before logging it, e.g.
 * "mongodb+srv://user:pass@cluster/db" -> "mongodb+srv://user:****@cluster/db"
 */
function maskUri(uri: string): string {
  return uri.replace(/(:\/\/[^:/]+:)([^@]+)(@)/, '$1****$3');
}

async function bootstrap() {
  console.log('APPLICATION_NAME =', process.env.APPLICATION_NAME);

  if (!DB_URI) {
    // Fail fast and loud instead of letting Mongoose attempt to connect
    // with `undefined` and produce a confusing low-level error.
    console.error(
      '❌ DB_URI is not set. Checked process.env.DB_URI after ConfigModule ' +
        'loaded .env.development / .env.production. Make sure the file exists ' +
        'next to package.json and DB_URI is defined in it — and make sure ' +
        "DB_URI isn't already exported as a shell/OS environment variable " +
        '(those always take precedence over .env files; run `env | grep DB_URI` ' +
        'to check).',
    );
    process.exit(1);
  }
  console.log('DB_URI =', maskUri(DB_URI));

  // rawBody: true is required so the Stripe webhook handler
  // (payment.controller.ts) can access req.rawBody for signature verification.
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Controllers declare @Controller({ path, version: '1' }), so URI versioning
  // must be enabled or those routes would never be reachable at /api/v1/...
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.enableCors({
    origin: ORIGINS ? ORIGINS.split(',') : true,
    credentials: true,
  });

  // Consistent { success, message, data } envelope on every response, and a
  // consistent { success: false, message, error, statusCode, path, timestamp }
  // envelope on every error, instead of Nest's raw default error shape.
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(PORT);

  // --- Connection diagnostics ---------------------------------------------
  // Prints exactly which mongod/database this process ended up talking to,
  // and what's actually in it right now. If you ever get a duplicate-key (or
  // any other) error that doesn't match what you see in `mongosh`, compare
  // your shell session against this output first — in the overwhelming
  // majority of cases it means mongosh and this app are connected to two
  // different MongoDB deployments (e.g. a local install AND a Docker
  // container both listening on 27017, or a stale DB_URI picked up from an
  // OS-level environment variable instead of your .env file — dotenv/
  // @nestjs/config never overrides a variable that's already set in
  // process.env).
  try {
    const connection = app.get<Connection>(getConnectionToken());
    console.log(
      `Mongo connection → host=${connection.host} port=${connection.port} db=${connection.name}`,
    );
    if (connection.db) {
      const collections = await connection.db.listCollections().toArray();
      if (collections.length === 0) {
        console.log(
          `Mongo: database "${connection.name}" has no collections yet.`,
        );
      } else {
        console.log(`Mongo: collections in "${connection.name}":`);
        for (const { name } of collections) {
          const count = await connection.db.collection(name).countDocuments();
          console.log(`  - ${name}: ${count} document(s)`);
        }
      }
    }
  } catch (err) {
    console.warn('Could not print Mongo connection diagnostics:', err);
  }
  // -------------------------------------------------------------------------

  console.log(`Server is running on Port ${PORT} 🚀`);
}
bootstrap();
