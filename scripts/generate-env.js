// One-off helper used to scaffold a local .env.development file with
// randomly generated secrets. Not part of the runtime application.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const hex = (bytes) => crypto.randomBytes(bytes).toString('hex');

const env = `# ==========================================================
# Local development environment variables
# Generated automatically - replace placeholder values as needed
# ==========================================================

APPLICATION_NAME=Ecommerce
PORT=3000

# MongoDB connection string
# Local MongoDB: mongodb://localhost:27017/ecommerce
# MongoDB Atlas: mongodb+srv://<user>:<password>@<cluster>/ecommerce
DB_URI=mongodb://localhost:27017/ecommerce

# ---- JWT secrets (auto-generated, safe for local dev) ----
User_TOKEN_SECRET_KEY=${hex(32)}
User_REFRESH_TOKEN_SECRET_KEY=${hex(32)}
System_TOKEN_SECRET_KEY=${hex(32)}
System_REFRESH_TOKEN_SECRET_KEY=${hex(32)}

ACCESS_EXPIRES_IN=1800
REFRESH_EXPIRES_IN=31536000

# ---- Password hashing ----
SALT_ROUND=10

# ---- Field-level encryption (used for phone numbers) ----
ENC_KEY=${hex(32)}
ENC_BYTE=${hex(16)}
ENC_IV_LENGTH=16

# ---- CORS ----
# Comma separated list of allowed origins, e.g. http://localhost:5173,https://myapp.com
ORIGINS=http://localhost:3000

CLIENT_IDS=

# ---- Email (Gmail SMTP app password) ----
EMAIL_APP=your-email@gmail.com
EMAIL_APP_PASSWORD=your-gmail-app-password

# ---- Social links (optional, shown in app metadata) ----
FACEBOOK_LINK=
INSTAGRAM_LINK=
TWITTER_LINK=

# ---- Redis (used for caching / BullMQ queues) ----
REDIS_URI=redis://localhost:6379

# ---- AWS S3 (file uploads) ----
S3_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
S3_ACCESS_KEY_ID=your-access-key-id
S3_ACCESS_SECRET_KEY=your-secret-access-key
S3_EXPIRES_IN=120

# ---- Stripe (payments) ----
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# ---- Email verification enforcement ----
REQUIRE_EMAIL_VERIFICATION=false
`;

const outPath = path.join(__dirname, '..', '.env.development');
fs.writeFileSync(outPath, env);
console.log('Wrote', outPath);
