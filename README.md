# Otazumi API Server

Backend API server for the Otazumi mobile application. Provides authentication, user management, and cloud sync functionality.

## 🚀 Features

- ✅ User authentication (register, login, logout)
- ✅ Email verification
- ✅ Password reset functionality
- ✅ Profile management
- ✅ Cloud sync (favorites, watchlist, watch history)
- ✅ JWT-based authentication
- ✅ Rate limiting and security headers
- ✅ Daily signup limits
- ✅ PostgreSQL database with Drizzle ORM

## 📋 Prerequisites

- Node.js 18 or higher
- PostgreSQL database (NeonDB recommended)
- npm or yarn

## 🔧 Installation

1. **Clone or copy this directory**

```bash
cd api-server
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL` - Your NeonDB or PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

4. **Set up database schema**

```bash
# Push schema to database
npx drizzle-kit push:pg
```

## 🚀 Running the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| POST | `/api/auth/logout` | Logout user | ✅ |
| GET | `/api/auth/profile` | Get user profile | ✅ |
| PUT | `/api/auth/profile` | Update profile | ✅ |
| PUT | `/api/auth/password` | Change password | ✅ |
| POST | `/api/auth/forgot-password` | Request password reset | ❌ |
| POST | `/api/auth/reset-password` | Reset password | ❌ |
| POST | `/api/auth/verify-email` | Verify email | ❌ |
| POST | `/api/auth/resend-verification` | Resend verification | ✅ |
| DELETE | `/api/auth/account` | Delete account | ✅ |
| POST | `/api/auth/sync` | Sync user data | ✅ |
| GET | `/api/auth/data` | Fetch user data | ✅ |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health status |

## 📦 Deployment

### Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard

### Railway

1. Install Railway CLI:
```bash
npm i -g @railway/cli
```

2. Login and deploy:
```bash
railway login
railway init
railway up
```

3. Set environment variables:
```bash
railway variables set DATABASE_URL=your_database_url
railway variables set JWT_SECRET=your_jwt_secret
```

### Docker

1. Build image:
```bash
docker build -t otazumi-api .
```

2. Run container:
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=your_database_url \
  -e JWT_SECRET=your_jwt_secret \
  otazumi-api
```

Or use Docker Compose:
```bash
docker-compose up -d
```

### Heroku

1. Install Heroku CLI and login:
```bash
heroku login
```

2. Create app:
```bash
heroku create your-app-name
```

3. Set environment variables:
```bash
heroku config:set DATABASE_URL=your_database_url
heroku config:set JWT_SECRET=your_jwt_secret
```

4. Deploy:
```bash
git push heroku main
```

## 🔐 Security Features

- Helmet.js for security headers
- CORS protection
- Rate limiting on all endpoints
- Stricter rate limiting on auth endpoints
- Password hashing with bcrypt (10 rounds)
- JWT token authentication
- Input validation with express-validator
- Daily signup limits

## 🗄️ Database Schema

The database includes the following tables:

- **users** - User accounts
- **emailVerificationTokens** - Email verification tokens
- **passwordResetTokens** - Password reset tokens
- **favorites** - User favorites
- **watchlist** - User watchlist
- **watchHistory** - Watch history
- **dailySignups** - Daily signup counter

## 📧 Email Service

The email service is currently a mock implementation that logs to console. To integrate a real email service:

1. Choose a provider (SendGrid, Mailgun, AWS SES, Resend)
2. Update `services/emailService.js` with actual API calls
3. Add email service credentials to `.env`

Example with SendGrid:
```javascript
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: email,
  from: process.env.EMAIL_FROM,
  subject: 'Welcome to Otazumi',
  html: '...'
});
```

## 🧪 Testing

Test the API with curl:

```bash
# Health check
curl http://localhost:3000/health

# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get profile (replace TOKEN)
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

## 📝 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `development` | Environment |
| `DATABASE_URL` | **Yes** | - | PostgreSQL connection string |
| `JWT_SECRET` | **Yes** | - | JWT signing secret |
| `JWT_EXPIRES_IN` | No | `7d` | JWT expiration time |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origins |
| `RATE_LIMIT_MAX` | No | `100` | General rate limit |
| `RATE_LIMIT_AUTH_MAX` | No | `5` | Auth rate limit |
| `DAILY_SIGNUP_LIMIT` | No | `300` | Daily signups allowed |
| `FRONTEND_URL` | No | - | Frontend URL for emails |
| `EMAIL_FROM` | No | - | Email sender address |

## 🔗 Connecting Mobile App

After deploying, update your mobile app's `.env` file:

```env
API_URL=https://your-api-url.com/api
```

The mobile app will automatically connect to your backend.

## 📚 API Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "errors": [ ... ] // validation errors
}
```

## 🛠️ Development

**Database migrations:**
```bash
# Generate migration
npx drizzle-kit generate:pg

# Apply migration
npx drizzle-kit push:pg

# Open Drizzle Studio
npx drizzle-kit studio
```

**Code formatting:**
```bash
npm run format
```

**Linting:**
```bash
npm run lint
```

## 📄 License

This project is part of the Otazumi mobile application.

## 🤝 Support

For issues or questions, please contact the development team.

---

Made with ❤️ for Otazumi
