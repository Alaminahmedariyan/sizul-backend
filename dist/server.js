var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/app.ts
import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express2 from "express";
import helmet from "helmet";

// src/app/config/index.ts
import "dotenv/config";
import { z } from "zod";
var envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5e3),
  CLIENT_URL: z.string().min(1).default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
  BETTER_AUTH_SECRET: z.string().min(
    32,
    "BETTER_AUTH_SECRET must be at least 32 characters."
  ).optional(),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:5000"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  REDIS_URL: z.string().min(1).optional(),
  STRIPE_PRODUCT_ID: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  BKASH_BASE_URL: z.string().url().optional(),
  BKASH_USERNAME: z.string().optional(),
  BKASH_PASSWORD: z.string().optional(),
  BKASH_APP_KEY: z.string().optional(),
  BKASH_APP_SECRET: z.string().optional(),
  BKASH_CALLBACK_URL: z.string().url().optional(),
  SSLCOMMERZ_STORE_ID: z.string().optional(),
  SSLCOMMERZ_STORE_PASSWORD: z.string().optional(),
  SSLCOMMERZ_IS_LIVE: z.coerce.boolean().default(false),
  SUPER_ADMIN_NAME: z.string().optional(),
  SUPER_ADMIN_EMAIL: z.string().email(),
  SUPER_ADMIN_PASSWORD: z.string().min(8),
  HCAPTCHA_SECRET_KEY: z.string().optional()
});
var parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "\u274C Invalid or missing environment variables:"
  );
  console.error(
    parsed.error.flatten().fieldErrors
  );
  process.exit(1);
}
var env = parsed.data;
if (env.NODE_ENV === "production" && !env.BETTER_AUTH_SECRET) {
  console.error(
    "\u274C BETTER_AUTH_SECRET is required in production."
  );
  process.exit(1);
}
var clientUrls = env.CLIENT_URL.split(",").map((url) => url.trim()).filter(Boolean);
for (const clientUrl of clientUrls) {
  const result = z.string().url().safeParse(clientUrl);
  if (!result.success) {
    console.error(
      `\u274C Invalid CLIENT_URL value: ${clientUrl}`
    );
    process.exit(1);
  }
}
var config = {
  app: {
    env: env.NODE_ENV,
    port: env.PORT,
    clientUrl: env.CLIENT_URL
  },
  database: {
    url: env.DATABASE_URL
  },
  betterAuth: {
    secret: env.BETTER_AUTH_SECRET,
    url: env.BETTER_AUTH_URL
  },
  oauth: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET
    }
  },
  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET
  },
  email: {
    resendApiKey: env.RESEND_API_KEY,
    from: env.EMAIL_FROM,
    smtpUser: env.SMTP_USER,
    smtpPassword: env.SMTP_PASSWORD
  },
  redis: {
    url: env.REDIS_URL
  },
  stripe: {
    productId: env.STRIPE_PRODUCT_ID,
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET
  },
  bkash: {
    baseUrl: env.BKASH_BASE_URL,
    username: env.BKASH_USERNAME,
    password: env.BKASH_PASSWORD,
    appKey: env.BKASH_APP_KEY,
    appSecret: env.BKASH_APP_SECRET,
    callbackUrl: env.BKASH_CALLBACK_URL
  },
  sslcommerz: {
    storeId: env.SSLCOMMERZ_STORE_ID,
    storePassword: env.SSLCOMMERZ_STORE_PASSWORD,
    isLive: env.SSLCOMMERZ_IS_LIVE
  },
  superAdmin: {
    email: env.SUPER_ADMIN_EMAIL,
    password: env.SUPER_ADMIN_PASSWORD,
    name: env.SUPER_ADMIN_NAME ?? "Super Admin"
  },
  captcha: {
    hcaptchaSecretKey: env.HCAPTCHA_SECRET_KEY
  }
};
var config_default = config;

// src/app/middlewares/forceHttps.ts
var forceHttps = (req, res, next) => {
  const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
  if (!isSecure) {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }
  next();
};

// src/app/middlewares/rateLimiters.ts
import rateLimit from "express-rate-limit";
import { StatusCodes } from "http-status-codes";
var makeLimiter = (windowMs, limit, message) => rateLimit({
  windowMs,
  limit,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, statusCode: StatusCodes.TOO_MANY_REQUESTS, message }
});
var generalRateLimiter = makeLimiter(15 * 60 * 1e3, 300, "Too many requests. Please try again later.");
var authRateLimiter = makeLimiter(15 * 60 * 1e3, 10, "Too many login attempts. Please try again in 15 minutes.");
var publicRateLimiter = makeLimiter(15 * 60 * 1e3, 20, "Too many requests. Please try again later.");

// src/app/middlewares/globalErrorHandler.ts
import { StatusCodes as StatusCodes4 } from "http-status-codes";
import { ZodError } from "zod";

// src/app/errors/handleZodError.ts
import { StatusCodes as StatusCodes2 } from "http-status-codes";
var handleZodError = (error) => {
  return {
    statusCode: StatusCodes2.BAD_REQUEST,
    message: "Validation failed",
    details: error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message
    }))
  };
};

// src/app/errors/handlePrismaError.ts
import { StatusCodes as StatusCodes3 } from "http-status-codes";

// src/generated/prisma/client.ts
import "process";
import * as path from "path";
import { fileURLToPath } from "url";
import "@prisma/client/runtime/client";

// src/generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config2 = {
  "previewFeatures": [],
  "clientVersion": "7.10.0",
  "engineVersion": "0edf323efd1d98336f3f0a68684b56f689b900d3",
  "activeProvider": "postgresql",
  "inlineSchema": '// ============================================================\n// GENERATOR & DATASOURCE\n// ============================================================\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../src/generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\n// ============================================================\n// ENUMS\n// ============================================================\n\nenum ContentStatus {\n  DRAFT\n  PUBLISHED\n  ARCHIVED\n}\n\nenum LeadStatus {\n  NEW\n  CONTACTED\n  QUALIFIED\n  PROPOSAL_SENT\n  NEGOTIATING\n  CONVERTED\n  LOST\n}\n\nenum LeadPriority {\n  LOW\n  MEDIUM\n  HIGH\n  URGENT\n}\n\nenum LeadSource {\n  WEBSITE\n  REFERRAL\n  SOCIAL_MEDIA\n  EMAIL_CAMPAIGN\n  PHONE\n  WALK_IN\n  OTHER\n}\n\nenum LeadActivityType {\n  CREATED\n  UPDATED\n  ASSIGNED\n  CONTACTED\n  EMAIL_SENT\n  CALL_MADE\n  MEETING_SCHEDULED\n  NOTE_ADDED\n  STATUS_CHANGED\n  PROPOSAL_SENT\n  CONVERTED\n  LOST\n}\n\nenum ConsultationStatus {\n  PENDING\n  CONFIRMED\n  COMPLETED\n  CANCELLED\n  NO_SHOW\n}\n\nenum FileCategory {\n  IMAGE\n  VIDEO\n  DOCUMENT\n  AUDIO\n  OTHER\n}\n\nenum ProjectType {\n  CLIENT_PROJECT\n  INTERNAL_PROJECT\n  RESEARCH\n  MAINTENANCE\n}\n\nenum ProjectStatus {\n  PLANNING\n  IN_PROGRESS\n  ON_HOLD\n  REVIEW\n  COMPLETED\n  CANCELLED\n}\n\nenum ProjectMemberRole {\n  LEAD\n  MEMBER\n  REVIEWER\n  OBSERVER\n}\n\nenum MilestoneStatus {\n  PENDING\n  IN_PROGRESS\n  COMPLETED\n  BLOCKED\n}\n\nenum TaskStatus {\n  TODO\n  IN_PROGRESS\n  IN_REVIEW\n  BLOCKED\n  COMPLETED\n  CANCELLED\n}\n\nenum TaskPriority {\n  LOW\n  MEDIUM\n  HIGH\n  URGENT\n}\n\nenum ProposalStatus {\n  DRAFT\n  SENT\n  VIEWED\n  ACCEPTED\n  REJECTED\n  EXPIRED\n}\n\nenum ClientAppreciationType {\n  THANK_YOU_NOTE\n  GIFT\n  REFERRAL\n  BONUS\n  TESTIMONIAL\n  OTHER\n}\n\nenum ContactMessageStatus {\n  UNREAD\n  READ\n  REPLIED\n  ARCHIVED\n  SPAM\n}\n\nenum NotificationType {\n  LEAD_NEW\n  LEAD_ASSIGNED\n  LEAD_STATUS_CHANGED\n  PROPOSAL_SENT\n  PROPOSAL_ACCEPTED\n  PROPOSAL_REJECTED\n  PROJECT_UPDATE\n  TASK_ASSIGNED\n  TASK_DUE\n  CONSULTATION_SCHEDULED\n  MESSAGE_RECEIVED\n  REVIEW_RECEIVED\n  SEO_REPORT\n  SYSTEM\n}\n\nenum NotificationEntityType {\n  LEAD\n  PROPOSAL\n  PROJECT\n  TASK\n  CONSULTATION\n  MESSAGE\n  REVIEW\n  USER\n}\n\nenum UserRole {\n  ADMIN\n  STAFF\n  CLIENT\n}\n\nenum UserStatus {\n  ACTIVE\n  INACTIVE\n  SUSPENDED\n}\n\nenum StaffRole {\n  OWNER\n  MANAGER\n  DEVELOPER\n  DESIGNER\n  MARKETING\n  SALES\n  SUPPORT\n}\n\nenum StaffStatus {\n  ACTIVE\n  INACTIVE\n  ON_LEAVE\n  TERMINATED\n}\n\nenum PricingPlanBillingInterval {\n  ONE_TIME\n  MONTHLY\n  QUARTERLY\n  YEARLY\n  CUSTOM\n}\n\n// ----- SEO Deliverables -----\nenum RankingSearchEngine {\n  GOOGLE\n  BING\n}\n\nenum RankingDevice {\n  DESKTOP\n  MOBILE\n}\n\nenum CitationStatus {\n  PENDING\n  SUBMITTED\n  LIVE\n  REJECTED\n}\n\nenum BacklinkStatus {\n  PROSPECTING\n  OUTREACH_SENT\n  NEGOTIATING\n  ACQUIRED\n  LIVE\n  REMOVED\n}\n\nenum ReviewPlatform {\n  GOOGLE\n  FACEBOOK\n  YELP\n  TRUSTPILOT\n  OTHER\n}\n\nenum CallStatus {\n  COMPLETED\n  MISSED\n  VOICEMAIL\n}\n\nenum PaymentProvider {\n  STRIPE\n  BKASH\n  SSLCOMMERZ\n  MANUAL\n}\n\nenum PaymentStatus {\n  PENDING\n  PROCESSING\n  SUCCEEDED\n  FAILED\n  REFUNDED\n  CANCELLED\n}\n\n// ============================================================\n// AUTHENTICATION (Better Auth)\n// ============================================================\n\nmodel Session {\n  id        String   @id\n  expiresAt DateTime\n  token     String   @unique\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  ipAddress String?\n  userAgent String?\n\n  userId String\n  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@index([expiresAt])\n  @@map("sessions")\n}\n\nmodel Account {\n  id         String  @id\n  accountId  String\n  providerId String\n  userId     String\n  issuer     String?\n\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?   @db.Text\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([providerId, accountId])\n  @@index([userId])\n  @@map("accounts")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([identifier])\n  @@index([expiresAt])\n  @@map("verifications")\n}\n\nmodel TwoFactor {\n  id          String @id @default(cuid())\n  secret      String\n  backupCodes String\n  userId      String\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@map("two_factors")\n}\n\n// ============================================================\n// USERS\n// ============================================================\n\nmodel User {\n  id               String     @id @default(cuid())\n  email            String     @unique\n  emailVerified    Boolean    @default(false)\n  name             String?\n  image            String?\n  role             UserRole   @default(CLIENT)\n  status           UserStatus @default(ACTIVE)\n  passwordHash     String?\n  lastLoginAt      DateTime?\n  twoFactorEnabled Boolean    @default(false)\n  twoFactorSecret  String?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  sessions       Session[]\n  accounts       Account[]\n  twoFactors     TwoFactor[]\n  blogPosts      BlogPost[]     @relation("BlogAuthor")\n  leadActivities LeadActivity[] @relation("LeadActivityCreator")\n  proposals      Proposal[]     @relation("ProposalCreator")\n  notifications  Notification[]\n  staffProfile   Staff?\n  clientProfile  Client?\n\n  @@index([email])\n  @@index([role])\n  @@index([status])\n  @@map("users")\n}\n\n// ============================================================\n// STAFF\n// ============================================================\n\nmodel Staff {\n  id          String      @id @default(cuid())\n  userId      String?     @unique\n  employeeId  String?     @unique\n  fullName    String\n  email       String      @unique\n  phone       String?\n  role        StaffRole   @default(SUPPORT)\n  status      StaffStatus @default(ACTIVE)\n  designation String?\n  department  String?\n  bio         String?     @db.Text\n  avatar      String?\n  hireDate    DateTime?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)\n\n  assignedLeads         Lead[]          @relation("LeadAssignedTo")\n  assignedConsultations Consultation[]  @relation("ConsultationAssignedTo")\n  assignedTasks         ProjectTask[]   @relation("TaskAssignee")\n  projectMemberships    ProjectMember[]\n\n  @@index([email])\n  @@index([role])\n  @@index([status])\n  @@map("staff")\n}\n\n// ============================================================\n// SERVICES\n// ============================================================\n\nmodel Service {\n  id             String   @id @default(cuid())\n  slug           String   @unique\n  name           String\n  shortName      String?\n  tagline        String?\n  description    String?  @db.Text\n  icon           String?\n  coverImage     String?\n  features       Json?\n  process        Json?\n  startingPrice  Decimal? @db.Decimal(12, 2)\n  currency       String   @default("USD")\n  isActive       Boolean  @default(true)\n  isFeatured     Boolean  @default(false)\n  order          Int      @default(0)\n  seoTitle       String?\n  seoDescription String?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  portfolioItems PortfolioService[]\n  caseStudyItems CaseStudyService[]\n  leads          Lead[]\n  consultations  Consultation[]\n  proposalItems  ProposalItem[]\n  pricingPlans   PricingPlan[]\n  projects       Project[]\n\n  @@index([isActive])\n  @@index([isFeatured])\n  @@map("services")\n}\n\n// ============================================================\n// PRICING PLANS\n// ============================================================\n\nmodel PricingPlan {\n  id              String                     @id @default(cuid())\n  serviceId       String\n  slug            String                     @unique\n  name            String\n  description     String?                    @db.Text\n  price           Decimal                    @db.Decimal(12, 2)\n  currency        String                     @default("USD")\n  billingInterval PricingPlanBillingInterval @default(ONE_TIME)\n  features        Json?\n  isPopular       Boolean                    @default(false)\n  isActive        Boolean                    @default(true)\n  order           Int                        @default(0)\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  service       Service        @relation(fields: [serviceId], references: [id], onDelete: Cascade)\n  proposalItems ProposalItem[]\n\n  @@index([serviceId])\n  @@index([isActive])\n  @@map("pricing_plans")\n}\n\n// ============================================================\n// PORTFOLIO\n// ============================================================\n\nmodel Portfolio {\n  id             String        @id @default(cuid())\n  title          String\n  slug           String        @unique\n  clientName     String?\n  industry       String?\n  location       String?\n  websiteUrl     String?\n  coverImage     String?\n  description    String?       @db.Text\n  technologies   Json?\n  duration       String?\n  results        Json?\n  seoTitle       String?\n  seoDescription String?\n  status         ContentStatus @default(DRAFT)\n  isFeatured     Boolean       @default(false)\n  publishedAt    DateTime?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  images   PortfolioImage[]\n  services PortfolioService[]\n\n  @@index([status])\n  @@index([isFeatured])\n  @@index([publishedAt])\n  @@map("portfolio")\n}\n\nmodel PortfolioImage {\n  id          String  @id @default(cuid())\n  portfolioId String\n  url         String\n  publicId    String?\n  altText     String?\n  caption     String?\n  order       Int     @default(0)\n\n  createdAt DateTime @default(now())\n\n  portfolio Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)\n\n  @@index([portfolioId])\n  @@map("portfolio_images")\n}\n\nmodel PortfolioService {\n  id          String @id @default(cuid())\n  portfolioId String\n  serviceId   String\n\n  portfolio Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)\n  service   Service   @relation(fields: [serviceId], references: [id], onDelete: Cascade)\n\n  @@unique([portfolioId, serviceId])\n  @@index([portfolioId])\n  @@index([serviceId])\n  @@map("portfolio_services")\n}\n\n// ============================================================\n// CASE STUDIES\n// ============================================================\n\nmodel CaseStudy {\n  id             String        @id @default(cuid())\n  title          String\n  slug           String        @unique\n  clientName     String?\n  industry       String?\n  location       String?\n  coverImage     String?\n  problem        String?       @db.Text\n  strategy       String?       @db.Text\n  implementation String?       @db.Text\n  results        String?       @db.Text\n  metrics        Json?\n  seoTitle       String?\n  seoDescription String?\n  status         ContentStatus @default(DRAFT)\n  isFeatured     Boolean       @default(false)\n  publishedAt    DateTime?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  services CaseStudyService[]\n\n  @@index([status])\n  @@index([isFeatured])\n  @@index([publishedAt])\n  @@map("case_studies")\n}\n\nmodel CaseStudyService {\n  id          String @id @default(cuid())\n  caseStudyId String\n  serviceId   String\n\n  caseStudy CaseStudy @relation(fields: [caseStudyId], references: [id], onDelete: Cascade)\n  service   Service   @relation(fields: [serviceId], references: [id], onDelete: Cascade)\n\n  @@unique([caseStudyId, serviceId])\n  @@index([caseStudyId])\n  @@index([serviceId])\n  @@map("case_study_services")\n}\n\n// ============================================================\n// TESTIMONIALS\n// ============================================================\n\nmodel Testimonial {\n  id          String        @id @default(cuid())\n  clientName  String\n  clientRole  String?\n  companyName String?\n  clientImage String?\n  content     String        @db.Text\n  rating      Int           @default(5)\n  serviceName String?\n  status      ContentStatus @default(DRAFT)\n  isFeatured  Boolean       @default(false)\n  publishedAt DateTime?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([status])\n  @@index([isFeatured])\n  @@map("testimonials")\n}\n\n// ============================================================\n// FAQ\n// ============================================================\n\nmodel FAQ {\n  id       String  @id @default(cuid())\n  question String\n  answer   String  @db.Text\n  category String?\n  isActive Boolean @default(true)\n  order    Int     @default(0)\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([category])\n  @@index([isActive])\n  @@index([order])\n  @@map("faqs")\n}\n\n// ============================================================\n// BLOG\n// ============================================================\n\nmodel BlogCategory {\n  id          String  @id @default(cuid())\n  name        String\n  slug        String  @unique\n  description String? @db.Text\n  isActive    Boolean @default(true)\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  posts BlogPost[]\n\n  @@index([isActive])\n  @@map("blog_categories")\n}\n\nmodel BlogPost {\n  id             String        @id @default(cuid())\n  categoryId     String?\n  authorId       String?\n  title          String\n  slug           String        @unique\n  excerpt        String?       @db.Text\n  content        String        @db.Text\n  featuredImage  String?\n  seoTitle       String?\n  seoDescription String?\n  canonicalUrl   String?\n  schemaMarkup   Json?\n  status         ContentStatus @default(DRAFT)\n  publishedAt    DateTime?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  category BlogCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull)\n  author   User?         @relation("BlogAuthor", fields: [authorId], references: [id], onDelete: SetNull)\n  tags     BlogPostTag[]\n\n  @@index([categoryId])\n  @@index([authorId])\n  @@index([status])\n  @@index([publishedAt])\n  @@map("blog_posts")\n}\n\nmodel BlogTag {\n  id   String @id @default(cuid())\n  name String\n  slug String @unique\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  posts BlogPostTag[]\n\n  @@map("blog_tags")\n}\n\nmodel BlogPostTag {\n  id     String @id @default(cuid())\n  postId String\n  tagId  String\n\n  post BlogPost @relation(fields: [postId], references: [id], onDelete: Cascade)\n  tag  BlogTag  @relation(fields: [tagId], references: [id], onDelete: Cascade)\n\n  @@unique([postId, tagId])\n  @@index([postId])\n  @@index([tagId])\n  @@map("blog_post_tags")\n}\n\n// ============================================================\n// MEDIA\n// ============================================================\n\nmodel Media {\n  id       String       @id @default(cuid())\n  fileName String\n  url      String\n  publicId String?\n  mimeType String?\n  size     Int?\n  category FileCategory @default(IMAGE)\n  altText  String?\n  caption  String?\n  width    Int?\n  height   Int?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([category])\n  @@index([fileName])\n  @@map("media")\n}\n\n// ============================================================\n// LEAD MANAGEMENT\n// ============================================================\n\nmodel Lead {\n  id              String       @id @default(cuid())\n  serviceId       String?\n  clientId        String?\n  name            String\n  email           String\n  phone           String?\n  company         String?\n  website         String?\n  location        String?\n  budget          String?\n  timeline        String?\n  message         String?      @db.Text\n  status          LeadStatus   @default(NEW)\n  priority        LeadPriority @default(MEDIUM)\n  source          LeadSource   @default(WEBSITE)\n  followUpAt      DateTime?\n  assignedStaffId String?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  service       Service? @relation(fields: [serviceId], references: [id], onDelete: SetNull)\n  client        Client?  @relation(fields: [clientId], references: [id], onDelete: SetNull)\n  assignedStaff Staff?   @relation("LeadAssignedTo", fields: [assignedStaffId], references: [id], onDelete: SetNull)\n\n  notes         LeadNote[]\n  activities    LeadActivity[]\n  consultations Consultation[]\n  proposals     Proposal[]\n\n  @@index([serviceId])\n  @@index([clientId])\n  @@index([status])\n  @@index([priority])\n  @@index([source])\n  @@index([assignedStaffId])\n  @@index([followUpAt])\n  @@index([createdAt])\n  @@map("leads")\n}\n\nmodel LeadNote {\n  id      String @id @default(cuid())\n  leadId  String\n  content String @db.Text\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  lead Lead @relation(fields: [leadId], references: [id], onDelete: Cascade)\n\n  @@index([leadId])\n  @@map("lead_notes")\n}\n\nmodel LeadActivity {\n  id          String           @id @default(cuid())\n  leadId      String\n  type        LeadActivityType\n  description String           @db.Text\n  metadata    Json?\n  createdById String?\n\n  createdAt DateTime @default(now())\n\n  lead      Lead  @relation(fields: [leadId], references: [id], onDelete: Cascade)\n  createdBy User? @relation("LeadActivityCreator", fields: [createdById], references: [id], onDelete: SetNull)\n\n  @@index([leadId])\n  @@index([type])\n  @@index([createdById])\n  @@index([createdAt])\n  @@map("lead_activities")\n}\n\n// ============================================================\n// CONSULTATION\n// ============================================================\n\nmodel Consultation {\n  id              String             @id @default(cuid())\n  leadId          String\n  serviceId       String?\n  preferredDate   DateTime?\n  preferredTime   String?\n  status          ConsultationStatus @default(PENDING)\n  notes           String?            @db.Text\n  assignedStaffId String?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  lead          Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)\n  service       Service? @relation(fields: [serviceId], references: [id], onDelete: SetNull)\n  assignedStaff Staff?   @relation("ConsultationAssignedTo", fields: [assignedStaffId], references: [id], onDelete: SetNull)\n\n  @@index([leadId])\n  @@index([serviceId])\n  @@index([assignedStaffId])\n  @@index([status])\n  @@index([preferredDate])\n  @@map("consultations")\n}\n\n// ============================================================\n// CLIENT\n// ============================================================\n\nmodel Client {\n  id       String  @id @default(cuid())\n  userId   String? @unique\n  name     String\n  email    String  @unique\n  phone    String?\n  company  String?\n  website  String?\n  location String?\n  notes    String? @db.Text\n  isActive Boolean @default(true)\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  user          User?                @relation(fields: [userId], references: [id], onDelete: SetNull)\n  leads         Lead[]\n  projects      Project[]\n  proposals     Proposal[]\n  reviews       ClientReview[]\n  appreciations ClientAppreciation[]\n  payments      Payment[]\n\n  @@index([name])\n  @@index([company])\n  @@index([isActive])\n  @@map("clients")\n}\n\n// ============================================================\n// PROJECT\n// ============================================================\n\nmodel Project {\n  id          String        @id @default(cuid())\n  clientId    String?\n  serviceId   String?\n  name        String\n  slug        String        @unique\n  projectType ProjectType   @default(CLIENT_PROJECT)\n  status      ProjectStatus @default(PLANNING)\n  description String?       @db.Text\n  budget      Decimal?      @db.Decimal(12, 2)\n  currency    String        @default("USD")\n  startDate   DateTime?\n  deadline    DateTime?\n  completedAt DateTime?\n  progress    Int           @default(0)\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  client        Client?              @relation(fields: [clientId], references: [id], onDelete: SetNull)\n  service       Service?             @relation(fields: [serviceId], references: [id], onDelete: SetNull)\n  members       ProjectMember[]\n  milestones    ProjectMilestone[]\n  tasks         ProjectTask[]\n  files         ProjectFile[]\n  reviews       ClientReview[]\n  appreciations ClientAppreciation[]\n  proposals     Proposal[]\n\n  keywordRankings       KeywordRanking[]\n  backlinks             Backlink[]\n  citations             Citation[]\n  googleBusinessProfile GoogleBusinessProfile?\n  seoAudits             SEOAudit[]\n  performanceReports    PerformanceReport[]\n  reviewMonitors        ReviewMonitor[]\n  serviceAreas          ServiceArea[]\n  callLogs              CallLog[]\n  trackingConfig        TrackingConfig?\n\n  @@index([clientId])\n  @@index([serviceId])\n  @@index([status])\n  @@index([projectType])\n  @@index([deadline])\n  @@map("projects")\n}\n\n// ============================================================\n// PROJECT MEMBERS\n// ============================================================\n\nmodel ProjectMember {\n  id        String            @id @default(cuid())\n  projectId String\n  staffId   String\n  role      ProjectMemberRole @default(MEMBER)\n\n  createdAt DateTime @default(now())\n\n  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)\n  staff   Staff   @relation(fields: [staffId], references: [id], onDelete: Cascade)\n\n  @@unique([projectId, staffId])\n  @@index([projectId])\n  @@index([staffId])\n  @@map("project_members")\n}\n\n// ============================================================\n// PROJECT MILESTONE\n// ============================================================\n\nmodel ProjectMilestone {\n  id          String          @id @default(cuid())\n  projectId   String\n  title       String\n  description String?         @db.Text\n  status      MilestoneStatus @default(PENDING)\n  startDate   DateTime?\n  dueDate     DateTime?\n  completedAt DateTime?\n  order       Int             @default(0)\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  project Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)\n  tasks   ProjectTask[]\n\n  @@index([projectId])\n  @@index([status])\n  @@index([dueDate])\n  @@map("project_milestones")\n}\n\n// ============================================================\n// PROJECT TASK\n// ============================================================\n\nmodel ProjectTask {\n  id              String       @id @default(cuid())\n  projectId       String\n  milestoneId     String?\n  assignedStaffId String?\n  title           String\n  description     String?      @db.Text\n  status          TaskStatus   @default(TODO)\n  priority        TaskPriority @default(MEDIUM)\n  dueDate         DateTime?\n  completedAt     DateTime?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  project       Project           @relation(fields: [projectId], references: [id], onDelete: Cascade)\n  milestone     ProjectMilestone? @relation(fields: [milestoneId], references: [id], onDelete: SetNull)\n  assignedStaff Staff?            @relation("TaskAssignee", fields: [assignedStaffId], references: [id], onDelete: SetNull)\n\n  @@index([projectId])\n  @@index([milestoneId])\n  @@index([assignedStaffId])\n  @@index([status])\n  @@index([priority])\n  @@index([dueDate])\n  @@map("project_tasks")\n}\n\n// ============================================================\n// PROJECT FILE\n// ============================================================\n\nmodel ProjectFile {\n  id          String       @id @default(cuid())\n  projectId   String\n  fileName    String\n  fileUrl     String\n  publicId    String?\n  mimeType    String?\n  size        Int?\n  category    FileCategory @default(DOCUMENT)\n  description String?\n\n  createdAt DateTime @default(now())\n\n  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)\n\n  @@index([projectId])\n  @@index([category])\n  @@map("project_files")\n}\n\n// ============================================================\n// PROPOSALS\n// ============================================================\n\nmodel Proposal {\n  id             String         @id @default(cuid())\n  leadId         String?\n  clientId       String?\n  projectId      String?\n  proposalNumber String         @unique\n  title          String\n  introduction   String?        @db.Text\n  terms          String?        @db.Text\n  notes          String?        @db.Text\n  subtotal       Decimal        @db.Decimal(12, 2)\n  discount       Decimal        @default(0) @db.Decimal(12, 2)\n  tax            Decimal        @default(0) @db.Decimal(12, 2)\n  total          Decimal        @db.Decimal(12, 2)\n  currency       String         @default("USD")\n  status         ProposalStatus @default(DRAFT)\n  validUntil     DateTime?\n  sentAt         DateTime?\n  viewedAt       DateTime?\n  acceptedAt     DateTime?\n  rejectedAt     DateTime?\n  createdById    String\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  lead      Lead?          @relation(fields: [leadId], references: [id], onDelete: SetNull)\n  client    Client?        @relation(fields: [clientId], references: [id], onDelete: SetNull)\n  project   Project?       @relation(fields: [projectId], references: [id], onDelete: SetNull)\n  createdBy User           @relation("ProposalCreator", fields: [createdById], references: [id], onDelete: Restrict)\n  items     ProposalItem[]\n  payments  Payment[]\n\n  @@index([leadId])\n  @@index([clientId])\n  @@index([projectId])\n  @@index([createdById])\n  @@index([status])\n  @@index([validUntil])\n  @@index([createdAt])\n  @@map("proposals")\n}\n\nmodel ProposalItem {\n  id            String  @id @default(cuid())\n  proposalId    String\n  serviceId     String?\n  pricingPlanId String?\n  title         String\n  description   String? @db.Text\n  quantity      Int     @default(1)\n  unitPrice     Decimal @db.Decimal(12, 2)\n  total         Decimal @db.Decimal(12, 2)\n\n  createdAt DateTime @default(now())\n\n  proposal    Proposal     @relation(fields: [proposalId], references: [id], onDelete: Cascade)\n  service     Service?     @relation(fields: [serviceId], references: [id], onDelete: SetNull)\n  pricingPlan PricingPlan? @relation(fields: [pricingPlanId], references: [id], onDelete: SetNull)\n\n  @@index([proposalId])\n  @@index([serviceId])\n  @@index([pricingPlanId])\n  @@map("proposal_items")\n}\n\n// ============================================================\n// PAYMENTS\n// ============================================================\n\nmodel Payment {\n  id                String          @id @default(cuid())\n  proposalId        String?\n  clientId          String?\n  provider          PaymentProvider\n  providerPaymentId String?         @unique\n  amount            Decimal         @db.Decimal(12, 2)\n  currency          String          @default("USD")\n  status            PaymentStatus   @default(PENDING)\n  method            String?\n  paidAt            DateTime?\n  metadata          Json?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  proposal Proposal? @relation(fields: [proposalId], references: [id], onDelete: SetNull)\n  client   Client?   @relation(fields: [clientId], references: [id], onDelete: SetNull)\n\n  @@index([proposalId])\n  @@index([clientId])\n  @@index([status])\n  @@index([provider])\n  @@map("payments")\n}\n\n// ============================================================\n// CLIENT REVIEWS\n// ============================================================\n\nmodel ClientReview {\n  id             String  @id @default(cuid())\n  clientId       String\n  projectId      String?\n  rating         Int     @default(5)\n  title          String?\n  content        String  @db.Text\n  serviceQuality Int?\n  communication  Int?\n  delivery       Int?\n  isApproved     Boolean @default(false)\n  isFeatured     Boolean @default(false)\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  client  Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)\n  project Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)\n\n  @@index([clientId])\n  @@index([projectId])\n  @@index([rating])\n  @@index([isApproved])\n  @@index([isFeatured])\n  @@map("client_reviews")\n}\n\n// ============================================================\n// CLIENT APPRECIATION\n// ============================================================\n\nmodel ClientAppreciation {\n  id          String                 @id @default(cuid())\n  clientId    String\n  projectId   String?\n  type        ClientAppreciationType\n  amount      Decimal?               @db.Decimal(12, 2)\n  currency    String?\n  title       String?\n  description String?                @db.Text\n  receivedAt  DateTime               @default(now())\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  client  Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)\n  project Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)\n\n  @@index([clientId])\n  @@index([projectId])\n  @@index([type])\n  @@index([receivedAt])\n  @@map("client_appreciations")\n}\n\n// ============================================================\n// CONTACT MESSAGES\n// ============================================================\n\nmodel ContactMessage {\n  id        String               @id @default(cuid())\n  name      String\n  email     String\n  phone     String?\n  company   String?\n  subject   String?\n  message   String               @db.Text\n  status    ContactMessageStatus @default(UNREAD)\n  repliedAt DateTime?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([email])\n  @@index([status])\n  @@index([createdAt])\n  @@map("contact_messages")\n}\n\n// ============================================================\n// NOTIFICATIONS\n// ============================================================\n\nmodel Notification {\n  id         String                  @id @default(cuid())\n  userId     String\n  type       NotificationType\n  entityType NotificationEntityType?\n  entityId   String?\n  title      String\n  message    String                  @db.Text\n  isRead     Boolean                 @default(false)\n  readAt     DateTime?\n\n  createdAt DateTime @default(now())\n\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@index([isRead])\n  @@index([type])\n  @@index([createdAt])\n  @@index([entityType, entityId])\n  @@map("notifications")\n}\n\n// ============================================================\n// SITE SETTINGS\n// ============================================================\n\nmodel SiteSetting {\n  id          String  @id @default(cuid())\n  key         String  @unique\n  value       String? @db.Text\n  description String?\n\n  updatedAt DateTime @updatedAt\n\n  @@map("site_settings")\n}\n\n// ============================================================\n// SEO DELIVERABLES & REPORTING\n// ============================================================\n\nmodel KeywordRanking {\n  id           String              @id @default(cuid())\n  projectId    String\n  keyword      String\n  targetUrl    String?\n  searchEngine RankingSearchEngine @default(GOOGLE)\n  device       RankingDevice       @default(DESKTOP)\n  location     String?\n  rank         Int?\n  previousRank Int?\n  checkedAt    DateTime            @default(now())\n\n  createdAt DateTime @default(now())\n\n  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)\n\n  @@index([projectId])\n  @@index([keyword])\n  @@index([checkedAt])\n  @@map("keyword_rankings")\n}\n\nmodel Backlink {\n  id              String         @id @default(cuid())\n  projectId       String\n  sourceUrl       String\n  targetUrl       String\n  anchorText      String?\n  domainAuthority Int?\n  status          BacklinkStatus @default(PROSPECTING)\n  acquiredAt      DateTime?\n  notes           String?        @db.Text\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)\n\n  @@index([projectId])\n  @@index([status])\n  @@map("backlinks")\n}\n\nmodel Citation {\n  id            String         @id @default(cuid())\n  projectId     String\n  directoryName String\n  url           String?\n  status        CitationStatus @default(PENDING)\n  submittedAt   DateTime?\n  notes         String?        @db.Text\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)\n\n  @@index([projectId])\n  @@index([status])\n  @@map("citations")\n}\n\nmodel GoogleBusinessProfile {\n  id              String    @id @default(cuid())\n  projectId       String    @unique\n  businessName    String\n  gbpUrl          String?\n  category        String?\n  address         String?\n  phone           String?\n  isVerified      Boolean   @default(false)\n  lastOptimizedAt DateTime?\n  notes           String?   @db.Text\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)\n\n  @@map("google_business_profiles")\n}\n\nmodel SEOAudit {\n  id        String   @id @default(cuid())\n  projectId String\n  title     String?\n  auditDate DateTime @default(now())\n  score     Int?\n  issues    Json?\n  reportUrl String?\n  summary   String?  @db.Text\n\n  createdAt DateTime @default(now())\n\n  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)\n\n  @@index([projectId])\n  @@index([auditDate])\n  @@map("seo_audits")\n}\n\nmodel PerformanceReport {\n  id               String        @id @default(cuid())\n  projectId        String\n  pageUrl          String\n  device           RankingDevice @default(MOBILE)\n  performanceScore Int?\n  seoScore         Int?\n  metrics          Json?\n  reportUrl        String?\n  checkedAt        DateTime      @default(now())\n\n  createdAt DateTime @default(now())\n\n  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)\n\n  @@index([projectId])\n  @@index([checkedAt])\n  @@map("performance_reports")\n}\n\nmodel ReviewMonitor {\n  id          String         @id @default(cuid())\n  projectId   String\n  platform    ReviewPlatform @default(GOOGLE)\n  rating      Decimal?       @db.Decimal(2, 1)\n  reviewCount Int?\n  checkedAt   DateTime       @default(now())\n\n  createdAt DateTime @default(now())\n\n  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)\n\n  @@index([projectId])\n  @@index([platform])\n  @@map("review_monitors")\n}\n\nmodel ServiceArea {\n  id          String    @id @default(cuid())\n  projectId   String\n  city        String\n  state       String?\n  slug        String\n  pageUrl     String?\n  publishedAt DateTime?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)\n\n  @@unique([projectId, slug])\n  @@index([projectId])\n  @@map("service_areas")\n}\n\nmodel CallLog {\n  id            String     @id @default(cuid())\n  projectId     String\n  twilioCallSid String?    @unique\n  fromNumber    String\n  toNumber      String?\n  duration      Int?\n  recordingUrl  String?\n  status        CallStatus @default(COMPLETED)\n  receivedAt    DateTime   @default(now())\n\n  createdAt DateTime @default(now())\n\n  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)\n\n  @@index([projectId])\n  @@index([receivedAt])\n  @@map("call_logs")\n}\n\nmodel TrackingConfig {\n  id               String  @id @default(cuid())\n  projectId        String  @unique\n  ga4MeasurementId String?\n  gtmContainerId   String?\n  metaPixelId      String?\n  whatsappNumber   String?\n  conversionGoals  Json?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)\n\n  @@map("tracking_configs")\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  },
  "parameterizationSchema": {
    "strings": [],
    "graph": ""
  }
};
config2.runtimeDataModel = JSON.parse('{"models":{"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"sessions","schema":null},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"issuer","kind":"scalar","type":"String"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"}],"dbName":"accounts","schema":null},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verifications","schema":null},"TwoFactor":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"secret","kind":"scalar","type":"String"},{"name":"backupCodes","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"TwoFactorToUser"}],"dbName":"two_factors","schema":null},"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"name","kind":"scalar","type":"String"},{"name":"image","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"UserRole"},{"name":"status","kind":"enum","type":"UserStatus"},{"name":"passwordHash","kind":"scalar","type":"String"},{"name":"lastLoginAt","kind":"scalar","type":"DateTime"},{"name":"twoFactorEnabled","kind":"scalar","type":"Boolean"},{"name":"twoFactorSecret","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"},{"name":"twoFactors","kind":"object","type":"TwoFactor","relationName":"TwoFactorToUser"},{"name":"blogPosts","kind":"object","type":"BlogPost","relationName":"BlogAuthor"},{"name":"leadActivities","kind":"object","type":"LeadActivity","relationName":"LeadActivityCreator"},{"name":"proposals","kind":"object","type":"Proposal","relationName":"ProposalCreator"},{"name":"notifications","kind":"object","type":"Notification","relationName":"NotificationToUser"},{"name":"staffProfile","kind":"object","type":"Staff","relationName":"StaffToUser"},{"name":"clientProfile","kind":"object","type":"Client","relationName":"ClientToUser"}],"dbName":"users","schema":null},"Staff":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"employeeId","kind":"scalar","type":"String"},{"name":"fullName","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"StaffRole"},{"name":"status","kind":"enum","type":"StaffStatus"},{"name":"designation","kind":"scalar","type":"String"},{"name":"department","kind":"scalar","type":"String"},{"name":"bio","kind":"scalar","type":"String"},{"name":"avatar","kind":"scalar","type":"String"},{"name":"hireDate","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"StaffToUser"},{"name":"assignedLeads","kind":"object","type":"Lead","relationName":"LeadAssignedTo"},{"name":"assignedConsultations","kind":"object","type":"Consultation","relationName":"ConsultationAssignedTo"},{"name":"assignedTasks","kind":"object","type":"ProjectTask","relationName":"TaskAssignee"},{"name":"projectMemberships","kind":"object","type":"ProjectMember","relationName":"ProjectMemberToStaff"}],"dbName":"staff","schema":null},"Service":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"shortName","kind":"scalar","type":"String"},{"name":"tagline","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"icon","kind":"scalar","type":"String"},{"name":"coverImage","kind":"scalar","type":"String"},{"name":"features","kind":"scalar","type":"Json"},{"name":"process","kind":"scalar","type":"Json"},{"name":"startingPrice","kind":"scalar","type":"Decimal"},{"name":"currency","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"isFeatured","kind":"scalar","type":"Boolean"},{"name":"order","kind":"scalar","type":"Int"},{"name":"seoTitle","kind":"scalar","type":"String"},{"name":"seoDescription","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"portfolioItems","kind":"object","type":"PortfolioService","relationName":"PortfolioServiceToService"},{"name":"caseStudyItems","kind":"object","type":"CaseStudyService","relationName":"CaseStudyServiceToService"},{"name":"leads","kind":"object","type":"Lead","relationName":"LeadToService"},{"name":"consultations","kind":"object","type":"Consultation","relationName":"ConsultationToService"},{"name":"proposalItems","kind":"object","type":"ProposalItem","relationName":"ProposalItemToService"},{"name":"pricingPlans","kind":"object","type":"PricingPlan","relationName":"PricingPlanToService"},{"name":"projects","kind":"object","type":"Project","relationName":"ProjectToService"}],"dbName":"services","schema":null},"PricingPlan":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"serviceId","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"price","kind":"scalar","type":"Decimal"},{"name":"currency","kind":"scalar","type":"String"},{"name":"billingInterval","kind":"enum","type":"PricingPlanBillingInterval"},{"name":"features","kind":"scalar","type":"Json"},{"name":"isPopular","kind":"scalar","type":"Boolean"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"order","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"service","kind":"object","type":"Service","relationName":"PricingPlanToService"},{"name":"proposalItems","kind":"object","type":"ProposalItem","relationName":"PricingPlanToProposalItem"}],"dbName":"pricing_plans","schema":null},"Portfolio":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"clientName","kind":"scalar","type":"String"},{"name":"industry","kind":"scalar","type":"String"},{"name":"location","kind":"scalar","type":"String"},{"name":"websiteUrl","kind":"scalar","type":"String"},{"name":"coverImage","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"technologies","kind":"scalar","type":"Json"},{"name":"duration","kind":"scalar","type":"String"},{"name":"results","kind":"scalar","type":"Json"},{"name":"seoTitle","kind":"scalar","type":"String"},{"name":"seoDescription","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"ContentStatus"},{"name":"isFeatured","kind":"scalar","type":"Boolean"},{"name":"publishedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"images","kind":"object","type":"PortfolioImage","relationName":"PortfolioToPortfolioImage"},{"name":"services","kind":"object","type":"PortfolioService","relationName":"PortfolioToPortfolioService"}],"dbName":"portfolio","schema":null},"PortfolioImage":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"portfolioId","kind":"scalar","type":"String"},{"name":"url","kind":"scalar","type":"String"},{"name":"publicId","kind":"scalar","type":"String"},{"name":"altText","kind":"scalar","type":"String"},{"name":"caption","kind":"scalar","type":"String"},{"name":"order","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"portfolio","kind":"object","type":"Portfolio","relationName":"PortfolioToPortfolioImage"}],"dbName":"portfolio_images","schema":null},"PortfolioService":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"portfolioId","kind":"scalar","type":"String"},{"name":"serviceId","kind":"scalar","type":"String"},{"name":"portfolio","kind":"object","type":"Portfolio","relationName":"PortfolioToPortfolioService"},{"name":"service","kind":"object","type":"Service","relationName":"PortfolioServiceToService"}],"dbName":"portfolio_services","schema":null},"CaseStudy":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"clientName","kind":"scalar","type":"String"},{"name":"industry","kind":"scalar","type":"String"},{"name":"location","kind":"scalar","type":"String"},{"name":"coverImage","kind":"scalar","type":"String"},{"name":"problem","kind":"scalar","type":"String"},{"name":"strategy","kind":"scalar","type":"String"},{"name":"implementation","kind":"scalar","type":"String"},{"name":"results","kind":"scalar","type":"String"},{"name":"metrics","kind":"scalar","type":"Json"},{"name":"seoTitle","kind":"scalar","type":"String"},{"name":"seoDescription","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"ContentStatus"},{"name":"isFeatured","kind":"scalar","type":"Boolean"},{"name":"publishedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"services","kind":"object","type":"CaseStudyService","relationName":"CaseStudyToCaseStudyService"}],"dbName":"case_studies","schema":null},"CaseStudyService":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"caseStudyId","kind":"scalar","type":"String"},{"name":"serviceId","kind":"scalar","type":"String"},{"name":"caseStudy","kind":"object","type":"CaseStudy","relationName":"CaseStudyToCaseStudyService"},{"name":"service","kind":"object","type":"Service","relationName":"CaseStudyServiceToService"}],"dbName":"case_study_services","schema":null},"Testimonial":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"clientName","kind":"scalar","type":"String"},{"name":"clientRole","kind":"scalar","type":"String"},{"name":"companyName","kind":"scalar","type":"String"},{"name":"clientImage","kind":"scalar","type":"String"},{"name":"content","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"serviceName","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"ContentStatus"},{"name":"isFeatured","kind":"scalar","type":"Boolean"},{"name":"publishedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"testimonials","schema":null},"FAQ":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"question","kind":"scalar","type":"String"},{"name":"answer","kind":"scalar","type":"String"},{"name":"category","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"order","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"faqs","schema":null},"BlogCategory":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"posts","kind":"object","type":"BlogPost","relationName":"BlogCategoryToBlogPost"}],"dbName":"blog_categories","schema":null},"BlogPost":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"authorId","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"excerpt","kind":"scalar","type":"String"},{"name":"content","kind":"scalar","type":"String"},{"name":"featuredImage","kind":"scalar","type":"String"},{"name":"seoTitle","kind":"scalar","type":"String"},{"name":"seoDescription","kind":"scalar","type":"String"},{"name":"canonicalUrl","kind":"scalar","type":"String"},{"name":"schemaMarkup","kind":"scalar","type":"Json"},{"name":"status","kind":"enum","type":"ContentStatus"},{"name":"publishedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"category","kind":"object","type":"BlogCategory","relationName":"BlogCategoryToBlogPost"},{"name":"author","kind":"object","type":"User","relationName":"BlogAuthor"},{"name":"tags","kind":"object","type":"BlogPostTag","relationName":"BlogPostToBlogPostTag"}],"dbName":"blog_posts","schema":null},"BlogTag":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"posts","kind":"object","type":"BlogPostTag","relationName":"BlogPostTagToBlogTag"}],"dbName":"blog_tags","schema":null},"BlogPostTag":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"postId","kind":"scalar","type":"String"},{"name":"tagId","kind":"scalar","type":"String"},{"name":"post","kind":"object","type":"BlogPost","relationName":"BlogPostToBlogPostTag"},{"name":"tag","kind":"object","type":"BlogTag","relationName":"BlogPostTagToBlogTag"}],"dbName":"blog_post_tags","schema":null},"Media":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"fileName","kind":"scalar","type":"String"},{"name":"url","kind":"scalar","type":"String"},{"name":"publicId","kind":"scalar","type":"String"},{"name":"mimeType","kind":"scalar","type":"String"},{"name":"size","kind":"scalar","type":"Int"},{"name":"category","kind":"enum","type":"FileCategory"},{"name":"altText","kind":"scalar","type":"String"},{"name":"caption","kind":"scalar","type":"String"},{"name":"width","kind":"scalar","type":"Int"},{"name":"height","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"media","schema":null},"Lead":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"serviceId","kind":"scalar","type":"String"},{"name":"clientId","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"company","kind":"scalar","type":"String"},{"name":"website","kind":"scalar","type":"String"},{"name":"location","kind":"scalar","type":"String"},{"name":"budget","kind":"scalar","type":"String"},{"name":"timeline","kind":"scalar","type":"String"},{"name":"message","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"LeadStatus"},{"name":"priority","kind":"enum","type":"LeadPriority"},{"name":"source","kind":"enum","type":"LeadSource"},{"name":"followUpAt","kind":"scalar","type":"DateTime"},{"name":"assignedStaffId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"service","kind":"object","type":"Service","relationName":"LeadToService"},{"name":"client","kind":"object","type":"Client","relationName":"ClientToLead"},{"name":"assignedStaff","kind":"object","type":"Staff","relationName":"LeadAssignedTo"},{"name":"notes","kind":"object","type":"LeadNote","relationName":"LeadToLeadNote"},{"name":"activities","kind":"object","type":"LeadActivity","relationName":"LeadToLeadActivity"},{"name":"consultations","kind":"object","type":"Consultation","relationName":"ConsultationToLead"},{"name":"proposals","kind":"object","type":"Proposal","relationName":"LeadToProposal"}],"dbName":"leads","schema":null},"LeadNote":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"leadId","kind":"scalar","type":"String"},{"name":"content","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"lead","kind":"object","type":"Lead","relationName":"LeadToLeadNote"}],"dbName":"lead_notes","schema":null},"LeadActivity":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"leadId","kind":"scalar","type":"String"},{"name":"type","kind":"enum","type":"LeadActivityType"},{"name":"description","kind":"scalar","type":"String"},{"name":"metadata","kind":"scalar","type":"Json"},{"name":"createdById","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"lead","kind":"object","type":"Lead","relationName":"LeadToLeadActivity"},{"name":"createdBy","kind":"object","type":"User","relationName":"LeadActivityCreator"}],"dbName":"lead_activities","schema":null},"Consultation":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"leadId","kind":"scalar","type":"String"},{"name":"serviceId","kind":"scalar","type":"String"},{"name":"preferredDate","kind":"scalar","type":"DateTime"},{"name":"preferredTime","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"ConsultationStatus"},{"name":"notes","kind":"scalar","type":"String"},{"name":"assignedStaffId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"lead","kind":"object","type":"Lead","relationName":"ConsultationToLead"},{"name":"service","kind":"object","type":"Service","relationName":"ConsultationToService"},{"name":"assignedStaff","kind":"object","type":"Staff","relationName":"ConsultationAssignedTo"}],"dbName":"consultations","schema":null},"Client":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"company","kind":"scalar","type":"String"},{"name":"website","kind":"scalar","type":"String"},{"name":"location","kind":"scalar","type":"String"},{"name":"notes","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"ClientToUser"},{"name":"leads","kind":"object","type":"Lead","relationName":"ClientToLead"},{"name":"projects","kind":"object","type":"Project","relationName":"ClientToProject"},{"name":"proposals","kind":"object","type":"Proposal","relationName":"ClientToProposal"},{"name":"reviews","kind":"object","type":"ClientReview","relationName":"ClientToClientReview"},{"name":"appreciations","kind":"object","type":"ClientAppreciation","relationName":"ClientToClientAppreciation"},{"name":"payments","kind":"object","type":"Payment","relationName":"ClientToPayment"}],"dbName":"clients","schema":null},"Project":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"clientId","kind":"scalar","type":"String"},{"name":"serviceId","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"projectType","kind":"enum","type":"ProjectType"},{"name":"status","kind":"enum","type":"ProjectStatus"},{"name":"description","kind":"scalar","type":"String"},{"name":"budget","kind":"scalar","type":"Decimal"},{"name":"currency","kind":"scalar","type":"String"},{"name":"startDate","kind":"scalar","type":"DateTime"},{"name":"deadline","kind":"scalar","type":"DateTime"},{"name":"completedAt","kind":"scalar","type":"DateTime"},{"name":"progress","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"client","kind":"object","type":"Client","relationName":"ClientToProject"},{"name":"service","kind":"object","type":"Service","relationName":"ProjectToService"},{"name":"members","kind":"object","type":"ProjectMember","relationName":"ProjectToProjectMember"},{"name":"milestones","kind":"object","type":"ProjectMilestone","relationName":"ProjectToProjectMilestone"},{"name":"tasks","kind":"object","type":"ProjectTask","relationName":"ProjectToProjectTask"},{"name":"files","kind":"object","type":"ProjectFile","relationName":"ProjectToProjectFile"},{"name":"reviews","kind":"object","type":"ClientReview","relationName":"ClientReviewToProject"},{"name":"appreciations","kind":"object","type":"ClientAppreciation","relationName":"ClientAppreciationToProject"},{"name":"proposals","kind":"object","type":"Proposal","relationName":"ProjectToProposal"},{"name":"keywordRankings","kind":"object","type":"KeywordRanking","relationName":"KeywordRankingToProject"},{"name":"backlinks","kind":"object","type":"Backlink","relationName":"BacklinkToProject"},{"name":"citations","kind":"object","type":"Citation","relationName":"CitationToProject"},{"name":"googleBusinessProfile","kind":"object","type":"GoogleBusinessProfile","relationName":"GoogleBusinessProfileToProject"},{"name":"seoAudits","kind":"object","type":"SEOAudit","relationName":"ProjectToSEOAudit"},{"name":"performanceReports","kind":"object","type":"PerformanceReport","relationName":"PerformanceReportToProject"},{"name":"reviewMonitors","kind":"object","type":"ReviewMonitor","relationName":"ProjectToReviewMonitor"},{"name":"serviceAreas","kind":"object","type":"ServiceArea","relationName":"ProjectToServiceArea"},{"name":"callLogs","kind":"object","type":"CallLog","relationName":"CallLogToProject"},{"name":"trackingConfig","kind":"object","type":"TrackingConfig","relationName":"ProjectToTrackingConfig"}],"dbName":"projects","schema":null},"ProjectMember":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"projectId","kind":"scalar","type":"String"},{"name":"staffId","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"ProjectMemberRole"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"project","kind":"object","type":"Project","relationName":"ProjectToProjectMember"},{"name":"staff","kind":"object","type":"Staff","relationName":"ProjectMemberToStaff"}],"dbName":"project_members","schema":null},"ProjectMilestone":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"projectId","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"MilestoneStatus"},{"name":"startDate","kind":"scalar","type":"DateTime"},{"name":"dueDate","kind":"scalar","type":"DateTime"},{"name":"completedAt","kind":"scalar","type":"DateTime"},{"name":"order","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"project","kind":"object","type":"Project","relationName":"ProjectToProjectMilestone"},{"name":"tasks","kind":"object","type":"ProjectTask","relationName":"ProjectMilestoneToProjectTask"}],"dbName":"project_milestones","schema":null},"ProjectTask":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"projectId","kind":"scalar","type":"String"},{"name":"milestoneId","kind":"scalar","type":"String"},{"name":"assignedStaffId","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"TaskStatus"},{"name":"priority","kind":"enum","type":"TaskPriority"},{"name":"dueDate","kind":"scalar","type":"DateTime"},{"name":"completedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"project","kind":"object","type":"Project","relationName":"ProjectToProjectTask"},{"name":"milestone","kind":"object","type":"ProjectMilestone","relationName":"ProjectMilestoneToProjectTask"},{"name":"assignedStaff","kind":"object","type":"Staff","relationName":"TaskAssignee"}],"dbName":"project_tasks","schema":null},"ProjectFile":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"projectId","kind":"scalar","type":"String"},{"name":"fileName","kind":"scalar","type":"String"},{"name":"fileUrl","kind":"scalar","type":"String"},{"name":"publicId","kind":"scalar","type":"String"},{"name":"mimeType","kind":"scalar","type":"String"},{"name":"size","kind":"scalar","type":"Int"},{"name":"category","kind":"enum","type":"FileCategory"},{"name":"description","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"project","kind":"object","type":"Project","relationName":"ProjectToProjectFile"}],"dbName":"project_files","schema":null},"Proposal":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"leadId","kind":"scalar","type":"String"},{"name":"clientId","kind":"scalar","type":"String"},{"name":"projectId","kind":"scalar","type":"String"},{"name":"proposalNumber","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"introduction","kind":"scalar","type":"String"},{"name":"terms","kind":"scalar","type":"String"},{"name":"notes","kind":"scalar","type":"String"},{"name":"subtotal","kind":"scalar","type":"Decimal"},{"name":"discount","kind":"scalar","type":"Decimal"},{"name":"tax","kind":"scalar","type":"Decimal"},{"name":"total","kind":"scalar","type":"Decimal"},{"name":"currency","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"ProposalStatus"},{"name":"validUntil","kind":"scalar","type":"DateTime"},{"name":"sentAt","kind":"scalar","type":"DateTime"},{"name":"viewedAt","kind":"scalar","type":"DateTime"},{"name":"acceptedAt","kind":"scalar","type":"DateTime"},{"name":"rejectedAt","kind":"scalar","type":"DateTime"},{"name":"createdById","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"lead","kind":"object","type":"Lead","relationName":"LeadToProposal"},{"name":"client","kind":"object","type":"Client","relationName":"ClientToProposal"},{"name":"project","kind":"object","type":"Project","relationName":"ProjectToProposal"},{"name":"createdBy","kind":"object","type":"User","relationName":"ProposalCreator"},{"name":"items","kind":"object","type":"ProposalItem","relationName":"ProposalToProposalItem"},{"name":"payments","kind":"object","type":"Payment","relationName":"PaymentToProposal"}],"dbName":"proposals","schema":null},"ProposalItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"proposalId","kind":"scalar","type":"String"},{"name":"serviceId","kind":"scalar","type":"String"},{"name":"pricingPlanId","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"unitPrice","kind":"scalar","type":"Decimal"},{"name":"total","kind":"scalar","type":"Decimal"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"proposal","kind":"object","type":"Proposal","relationName":"ProposalToProposalItem"},{"name":"service","kind":"object","type":"Service","relationName":"ProposalItemToService"},{"name":"pricingPlan","kind":"object","type":"PricingPlan","relationName":"PricingPlanToProposalItem"}],"dbName":"proposal_items","schema":null},"Payment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"proposalId","kind":"scalar","type":"String"},{"name":"clientId","kind":"scalar","type":"String"},{"name":"provider","kind":"enum","type":"PaymentProvider"},{"name":"providerPaymentId","kind":"scalar","type":"String"},{"name":"amount","kind":"scalar","type":"Decimal"},{"name":"currency","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"PaymentStatus"},{"name":"method","kind":"scalar","type":"String"},{"name":"paidAt","kind":"scalar","type":"DateTime"},{"name":"metadata","kind":"scalar","type":"Json"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"proposal","kind":"object","type":"Proposal","relationName":"PaymentToProposal"},{"name":"client","kind":"object","type":"Client","relationName":"ClientToPayment"}],"dbName":"payments","schema":null},"ClientReview":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"clientId","kind":"scalar","type":"String"},{"name":"projectId","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"title","kind":"scalar","type":"String"},{"name":"content","kind":"scalar","type":"String"},{"name":"serviceQuality","kind":"scalar","type":"Int"},{"name":"communication","kind":"scalar","type":"Int"},{"name":"delivery","kind":"scalar","type":"Int"},{"name":"isApproved","kind":"scalar","type":"Boolean"},{"name":"isFeatured","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"client","kind":"object","type":"Client","relationName":"ClientToClientReview"},{"name":"project","kind":"object","type":"Project","relationName":"ClientReviewToProject"}],"dbName":"client_reviews","schema":null},"ClientAppreciation":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"clientId","kind":"scalar","type":"String"},{"name":"projectId","kind":"scalar","type":"String"},{"name":"type","kind":"enum","type":"ClientAppreciationType"},{"name":"amount","kind":"scalar","type":"Decimal"},{"name":"currency","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"receivedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"client","kind":"object","type":"Client","relationName":"ClientToClientAppreciation"},{"name":"project","kind":"object","type":"Project","relationName":"ClientAppreciationToProject"}],"dbName":"client_appreciations","schema":null},"ContactMessage":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"company","kind":"scalar","type":"String"},{"name":"subject","kind":"scalar","type":"String"},{"name":"message","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"ContactMessageStatus"},{"name":"repliedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"contact_messages","schema":null},"Notification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"type","kind":"enum","type":"NotificationType"},{"name":"entityType","kind":"enum","type":"NotificationEntityType"},{"name":"entityId","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"message","kind":"scalar","type":"String"},{"name":"isRead","kind":"scalar","type":"Boolean"},{"name":"readAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"NotificationToUser"}],"dbName":"notifications","schema":null},"SiteSetting":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"key","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"site_settings","schema":null},"KeywordRanking":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"projectId","kind":"scalar","type":"String"},{"name":"keyword","kind":"scalar","type":"String"},{"name":"targetUrl","kind":"scalar","type":"String"},{"name":"searchEngine","kind":"enum","type":"RankingSearchEngine"},{"name":"device","kind":"enum","type":"RankingDevice"},{"name":"location","kind":"scalar","type":"String"},{"name":"rank","kind":"scalar","type":"Int"},{"name":"previousRank","kind":"scalar","type":"Int"},{"name":"checkedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"project","kind":"object","type":"Project","relationName":"KeywordRankingToProject"}],"dbName":"keyword_rankings","schema":null},"Backlink":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"projectId","kind":"scalar","type":"String"},{"name":"sourceUrl","kind":"scalar","type":"String"},{"name":"targetUrl","kind":"scalar","type":"String"},{"name":"anchorText","kind":"scalar","type":"String"},{"name":"domainAuthority","kind":"scalar","type":"Int"},{"name":"status","kind":"enum","type":"BacklinkStatus"},{"name":"acquiredAt","kind":"scalar","type":"DateTime"},{"name":"notes","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"project","kind":"object","type":"Project","relationName":"BacklinkToProject"}],"dbName":"backlinks","schema":null},"Citation":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"projectId","kind":"scalar","type":"String"},{"name":"directoryName","kind":"scalar","type":"String"},{"name":"url","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"CitationStatus"},{"name":"submittedAt","kind":"scalar","type":"DateTime"},{"name":"notes","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"project","kind":"object","type":"Project","relationName":"CitationToProject"}],"dbName":"citations","schema":null},"GoogleBusinessProfile":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"projectId","kind":"scalar","type":"String"},{"name":"businessName","kind":"scalar","type":"String"},{"name":"gbpUrl","kind":"scalar","type":"String"},{"name":"category","kind":"scalar","type":"String"},{"name":"address","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"isVerified","kind":"scalar","type":"Boolean"},{"name":"lastOptimizedAt","kind":"scalar","type":"DateTime"},{"name":"notes","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"project","kind":"object","type":"Project","relationName":"GoogleBusinessProfileToProject"}],"dbName":"google_business_profiles","schema":null},"SEOAudit":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"projectId","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"auditDate","kind":"scalar","type":"DateTime"},{"name":"score","kind":"scalar","type":"Int"},{"name":"issues","kind":"scalar","type":"Json"},{"name":"reportUrl","kind":"scalar","type":"String"},{"name":"summary","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"project","kind":"object","type":"Project","relationName":"ProjectToSEOAudit"}],"dbName":"seo_audits","schema":null},"PerformanceReport":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"projectId","kind":"scalar","type":"String"},{"name":"pageUrl","kind":"scalar","type":"String"},{"name":"device","kind":"enum","type":"RankingDevice"},{"name":"performanceScore","kind":"scalar","type":"Int"},{"name":"seoScore","kind":"scalar","type":"Int"},{"name":"metrics","kind":"scalar","type":"Json"},{"name":"reportUrl","kind":"scalar","type":"String"},{"name":"checkedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"project","kind":"object","type":"Project","relationName":"PerformanceReportToProject"}],"dbName":"performance_reports","schema":null},"ReviewMonitor":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"projectId","kind":"scalar","type":"String"},{"name":"platform","kind":"enum","type":"ReviewPlatform"},{"name":"rating","kind":"scalar","type":"Decimal"},{"name":"reviewCount","kind":"scalar","type":"Int"},{"name":"checkedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"project","kind":"object","type":"Project","relationName":"ProjectToReviewMonitor"}],"dbName":"review_monitors","schema":null},"ServiceArea":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"projectId","kind":"scalar","type":"String"},{"name":"city","kind":"scalar","type":"String"},{"name":"state","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"pageUrl","kind":"scalar","type":"String"},{"name":"publishedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"project","kind":"object","type":"Project","relationName":"ProjectToServiceArea"}],"dbName":"service_areas","schema":null},"CallLog":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"projectId","kind":"scalar","type":"String"},{"name":"twilioCallSid","kind":"scalar","type":"String"},{"name":"fromNumber","kind":"scalar","type":"String"},{"name":"toNumber","kind":"scalar","type":"String"},{"name":"duration","kind":"scalar","type":"Int"},{"name":"recordingUrl","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"CallStatus"},{"name":"receivedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"project","kind":"object","type":"Project","relationName":"CallLogToProject"}],"dbName":"call_logs","schema":null},"TrackingConfig":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"projectId","kind":"scalar","type":"String"},{"name":"ga4MeasurementId","kind":"scalar","type":"String"},{"name":"gtmContainerId","kind":"scalar","type":"String"},{"name":"metaPixelId","kind":"scalar","type":"String"},{"name":"whatsappNumber","kind":"scalar","type":"String"},{"name":"conversionGoals","kind":"scalar","type":"Json"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"project","kind":"object","type":"Project","relationName":"ProjectToTrackingConfig"}],"dbName":"tracking_configs","schema":null}},"enums":{},"types":{}}');
config2.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","sessions","user","accounts","twoFactors","posts","_count","category","author","post","tag","tags","blogPosts","portfolio","images","services","service","portfolioItems","caseStudy","caseStudyItems","leads","lead","assignedLeads","assignedConsultations","projects","client","project","createdBy","proposal","proposalItems","pricingPlan","items","payments","proposals","reviews","appreciations","staff","members","tasks","milestones","files","keywordRankings","backlinks","citations","googleBusinessProfile","seoAudits","performanceReports","reviewMonitors","serviceAreas","callLogs","trackingConfig","milestone","assignedStaff","assignedTasks","projectMemberships","consultations","pricingPlans","notes","activities","leadActivities","notifications","staffProfile","clientProfile","Session.findUnique","Session.findUniqueOrThrow","Session.findFirst","Session.findFirstOrThrow","Session.findMany","data","Session.createOne","Session.createMany","Session.createManyAndReturn","Session.updateOne","Session.updateMany","Session.updateManyAndReturn","create","update","Session.upsertOne","Session.deleteOne","Session.deleteMany","having","_min","_max","Session.groupBy","Session.aggregate","Account.findUnique","Account.findUniqueOrThrow","Account.findFirst","Account.findFirstOrThrow","Account.findMany","Account.createOne","Account.createMany","Account.createManyAndReturn","Account.updateOne","Account.updateMany","Account.updateManyAndReturn","Account.upsertOne","Account.deleteOne","Account.deleteMany","Account.groupBy","Account.aggregate","Verification.findUnique","Verification.findUniqueOrThrow","Verification.findFirst","Verification.findFirstOrThrow","Verification.findMany","Verification.createOne","Verification.createMany","Verification.createManyAndReturn","Verification.updateOne","Verification.updateMany","Verification.updateManyAndReturn","Verification.upsertOne","Verification.deleteOne","Verification.deleteMany","Verification.groupBy","Verification.aggregate","TwoFactor.findUnique","TwoFactor.findUniqueOrThrow","TwoFactor.findFirst","TwoFactor.findFirstOrThrow","TwoFactor.findMany","TwoFactor.createOne","TwoFactor.createMany","TwoFactor.createManyAndReturn","TwoFactor.updateOne","TwoFactor.updateMany","TwoFactor.updateManyAndReturn","TwoFactor.upsertOne","TwoFactor.deleteOne","TwoFactor.deleteMany","TwoFactor.groupBy","TwoFactor.aggregate","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","User.upsertOne","User.deleteOne","User.deleteMany","User.groupBy","User.aggregate","Staff.findUnique","Staff.findUniqueOrThrow","Staff.findFirst","Staff.findFirstOrThrow","Staff.findMany","Staff.createOne","Staff.createMany","Staff.createManyAndReturn","Staff.updateOne","Staff.updateMany","Staff.updateManyAndReturn","Staff.upsertOne","Staff.deleteOne","Staff.deleteMany","Staff.groupBy","Staff.aggregate","Service.findUnique","Service.findUniqueOrThrow","Service.findFirst","Service.findFirstOrThrow","Service.findMany","Service.createOne","Service.createMany","Service.createManyAndReturn","Service.updateOne","Service.updateMany","Service.updateManyAndReturn","Service.upsertOne","Service.deleteOne","Service.deleteMany","_avg","_sum","Service.groupBy","Service.aggregate","PricingPlan.findUnique","PricingPlan.findUniqueOrThrow","PricingPlan.findFirst","PricingPlan.findFirstOrThrow","PricingPlan.findMany","PricingPlan.createOne","PricingPlan.createMany","PricingPlan.createManyAndReturn","PricingPlan.updateOne","PricingPlan.updateMany","PricingPlan.updateManyAndReturn","PricingPlan.upsertOne","PricingPlan.deleteOne","PricingPlan.deleteMany","PricingPlan.groupBy","PricingPlan.aggregate","Portfolio.findUnique","Portfolio.findUniqueOrThrow","Portfolio.findFirst","Portfolio.findFirstOrThrow","Portfolio.findMany","Portfolio.createOne","Portfolio.createMany","Portfolio.createManyAndReturn","Portfolio.updateOne","Portfolio.updateMany","Portfolio.updateManyAndReturn","Portfolio.upsertOne","Portfolio.deleteOne","Portfolio.deleteMany","Portfolio.groupBy","Portfolio.aggregate","PortfolioImage.findUnique","PortfolioImage.findUniqueOrThrow","PortfolioImage.findFirst","PortfolioImage.findFirstOrThrow","PortfolioImage.findMany","PortfolioImage.createOne","PortfolioImage.createMany","PortfolioImage.createManyAndReturn","PortfolioImage.updateOne","PortfolioImage.updateMany","PortfolioImage.updateManyAndReturn","PortfolioImage.upsertOne","PortfolioImage.deleteOne","PortfolioImage.deleteMany","PortfolioImage.groupBy","PortfolioImage.aggregate","PortfolioService.findUnique","PortfolioService.findUniqueOrThrow","PortfolioService.findFirst","PortfolioService.findFirstOrThrow","PortfolioService.findMany","PortfolioService.createOne","PortfolioService.createMany","PortfolioService.createManyAndReturn","PortfolioService.updateOne","PortfolioService.updateMany","PortfolioService.updateManyAndReturn","PortfolioService.upsertOne","PortfolioService.deleteOne","PortfolioService.deleteMany","PortfolioService.groupBy","PortfolioService.aggregate","CaseStudy.findUnique","CaseStudy.findUniqueOrThrow","CaseStudy.findFirst","CaseStudy.findFirstOrThrow","CaseStudy.findMany","CaseStudy.createOne","CaseStudy.createMany","CaseStudy.createManyAndReturn","CaseStudy.updateOne","CaseStudy.updateMany","CaseStudy.updateManyAndReturn","CaseStudy.upsertOne","CaseStudy.deleteOne","CaseStudy.deleteMany","CaseStudy.groupBy","CaseStudy.aggregate","CaseStudyService.findUnique","CaseStudyService.findUniqueOrThrow","CaseStudyService.findFirst","CaseStudyService.findFirstOrThrow","CaseStudyService.findMany","CaseStudyService.createOne","CaseStudyService.createMany","CaseStudyService.createManyAndReturn","CaseStudyService.updateOne","CaseStudyService.updateMany","CaseStudyService.updateManyAndReturn","CaseStudyService.upsertOne","CaseStudyService.deleteOne","CaseStudyService.deleteMany","CaseStudyService.groupBy","CaseStudyService.aggregate","Testimonial.findUnique","Testimonial.findUniqueOrThrow","Testimonial.findFirst","Testimonial.findFirstOrThrow","Testimonial.findMany","Testimonial.createOne","Testimonial.createMany","Testimonial.createManyAndReturn","Testimonial.updateOne","Testimonial.updateMany","Testimonial.updateManyAndReturn","Testimonial.upsertOne","Testimonial.deleteOne","Testimonial.deleteMany","Testimonial.groupBy","Testimonial.aggregate","FAQ.findUnique","FAQ.findUniqueOrThrow","FAQ.findFirst","FAQ.findFirstOrThrow","FAQ.findMany","FAQ.createOne","FAQ.createMany","FAQ.createManyAndReturn","FAQ.updateOne","FAQ.updateMany","FAQ.updateManyAndReturn","FAQ.upsertOne","FAQ.deleteOne","FAQ.deleteMany","FAQ.groupBy","FAQ.aggregate","BlogCategory.findUnique","BlogCategory.findUniqueOrThrow","BlogCategory.findFirst","BlogCategory.findFirstOrThrow","BlogCategory.findMany","BlogCategory.createOne","BlogCategory.createMany","BlogCategory.createManyAndReturn","BlogCategory.updateOne","BlogCategory.updateMany","BlogCategory.updateManyAndReturn","BlogCategory.upsertOne","BlogCategory.deleteOne","BlogCategory.deleteMany","BlogCategory.groupBy","BlogCategory.aggregate","BlogPost.findUnique","BlogPost.findUniqueOrThrow","BlogPost.findFirst","BlogPost.findFirstOrThrow","BlogPost.findMany","BlogPost.createOne","BlogPost.createMany","BlogPost.createManyAndReturn","BlogPost.updateOne","BlogPost.updateMany","BlogPost.updateManyAndReturn","BlogPost.upsertOne","BlogPost.deleteOne","BlogPost.deleteMany","BlogPost.groupBy","BlogPost.aggregate","BlogTag.findUnique","BlogTag.findUniqueOrThrow","BlogTag.findFirst","BlogTag.findFirstOrThrow","BlogTag.findMany","BlogTag.createOne","BlogTag.createMany","BlogTag.createManyAndReturn","BlogTag.updateOne","BlogTag.updateMany","BlogTag.updateManyAndReturn","BlogTag.upsertOne","BlogTag.deleteOne","BlogTag.deleteMany","BlogTag.groupBy","BlogTag.aggregate","BlogPostTag.findUnique","BlogPostTag.findUniqueOrThrow","BlogPostTag.findFirst","BlogPostTag.findFirstOrThrow","BlogPostTag.findMany","BlogPostTag.createOne","BlogPostTag.createMany","BlogPostTag.createManyAndReturn","BlogPostTag.updateOne","BlogPostTag.updateMany","BlogPostTag.updateManyAndReturn","BlogPostTag.upsertOne","BlogPostTag.deleteOne","BlogPostTag.deleteMany","BlogPostTag.groupBy","BlogPostTag.aggregate","Media.findUnique","Media.findUniqueOrThrow","Media.findFirst","Media.findFirstOrThrow","Media.findMany","Media.createOne","Media.createMany","Media.createManyAndReturn","Media.updateOne","Media.updateMany","Media.updateManyAndReturn","Media.upsertOne","Media.deleteOne","Media.deleteMany","Media.groupBy","Media.aggregate","Lead.findUnique","Lead.findUniqueOrThrow","Lead.findFirst","Lead.findFirstOrThrow","Lead.findMany","Lead.createOne","Lead.createMany","Lead.createManyAndReturn","Lead.updateOne","Lead.updateMany","Lead.updateManyAndReturn","Lead.upsertOne","Lead.deleteOne","Lead.deleteMany","Lead.groupBy","Lead.aggregate","LeadNote.findUnique","LeadNote.findUniqueOrThrow","LeadNote.findFirst","LeadNote.findFirstOrThrow","LeadNote.findMany","LeadNote.createOne","LeadNote.createMany","LeadNote.createManyAndReturn","LeadNote.updateOne","LeadNote.updateMany","LeadNote.updateManyAndReturn","LeadNote.upsertOne","LeadNote.deleteOne","LeadNote.deleteMany","LeadNote.groupBy","LeadNote.aggregate","LeadActivity.findUnique","LeadActivity.findUniqueOrThrow","LeadActivity.findFirst","LeadActivity.findFirstOrThrow","LeadActivity.findMany","LeadActivity.createOne","LeadActivity.createMany","LeadActivity.createManyAndReturn","LeadActivity.updateOne","LeadActivity.updateMany","LeadActivity.updateManyAndReturn","LeadActivity.upsertOne","LeadActivity.deleteOne","LeadActivity.deleteMany","LeadActivity.groupBy","LeadActivity.aggregate","Consultation.findUnique","Consultation.findUniqueOrThrow","Consultation.findFirst","Consultation.findFirstOrThrow","Consultation.findMany","Consultation.createOne","Consultation.createMany","Consultation.createManyAndReturn","Consultation.updateOne","Consultation.updateMany","Consultation.updateManyAndReturn","Consultation.upsertOne","Consultation.deleteOne","Consultation.deleteMany","Consultation.groupBy","Consultation.aggregate","Client.findUnique","Client.findUniqueOrThrow","Client.findFirst","Client.findFirstOrThrow","Client.findMany","Client.createOne","Client.createMany","Client.createManyAndReturn","Client.updateOne","Client.updateMany","Client.updateManyAndReturn","Client.upsertOne","Client.deleteOne","Client.deleteMany","Client.groupBy","Client.aggregate","Project.findUnique","Project.findUniqueOrThrow","Project.findFirst","Project.findFirstOrThrow","Project.findMany","Project.createOne","Project.createMany","Project.createManyAndReturn","Project.updateOne","Project.updateMany","Project.updateManyAndReturn","Project.upsertOne","Project.deleteOne","Project.deleteMany","Project.groupBy","Project.aggregate","ProjectMember.findUnique","ProjectMember.findUniqueOrThrow","ProjectMember.findFirst","ProjectMember.findFirstOrThrow","ProjectMember.findMany","ProjectMember.createOne","ProjectMember.createMany","ProjectMember.createManyAndReturn","ProjectMember.updateOne","ProjectMember.updateMany","ProjectMember.updateManyAndReturn","ProjectMember.upsertOne","ProjectMember.deleteOne","ProjectMember.deleteMany","ProjectMember.groupBy","ProjectMember.aggregate","ProjectMilestone.findUnique","ProjectMilestone.findUniqueOrThrow","ProjectMilestone.findFirst","ProjectMilestone.findFirstOrThrow","ProjectMilestone.findMany","ProjectMilestone.createOne","ProjectMilestone.createMany","ProjectMilestone.createManyAndReturn","ProjectMilestone.updateOne","ProjectMilestone.updateMany","ProjectMilestone.updateManyAndReturn","ProjectMilestone.upsertOne","ProjectMilestone.deleteOne","ProjectMilestone.deleteMany","ProjectMilestone.groupBy","ProjectMilestone.aggregate","ProjectTask.findUnique","ProjectTask.findUniqueOrThrow","ProjectTask.findFirst","ProjectTask.findFirstOrThrow","ProjectTask.findMany","ProjectTask.createOne","ProjectTask.createMany","ProjectTask.createManyAndReturn","ProjectTask.updateOne","ProjectTask.updateMany","ProjectTask.updateManyAndReturn","ProjectTask.upsertOne","ProjectTask.deleteOne","ProjectTask.deleteMany","ProjectTask.groupBy","ProjectTask.aggregate","ProjectFile.findUnique","ProjectFile.findUniqueOrThrow","ProjectFile.findFirst","ProjectFile.findFirstOrThrow","ProjectFile.findMany","ProjectFile.createOne","ProjectFile.createMany","ProjectFile.createManyAndReturn","ProjectFile.updateOne","ProjectFile.updateMany","ProjectFile.updateManyAndReturn","ProjectFile.upsertOne","ProjectFile.deleteOne","ProjectFile.deleteMany","ProjectFile.groupBy","ProjectFile.aggregate","Proposal.findUnique","Proposal.findUniqueOrThrow","Proposal.findFirst","Proposal.findFirstOrThrow","Proposal.findMany","Proposal.createOne","Proposal.createMany","Proposal.createManyAndReturn","Proposal.updateOne","Proposal.updateMany","Proposal.updateManyAndReturn","Proposal.upsertOne","Proposal.deleteOne","Proposal.deleteMany","Proposal.groupBy","Proposal.aggregate","ProposalItem.findUnique","ProposalItem.findUniqueOrThrow","ProposalItem.findFirst","ProposalItem.findFirstOrThrow","ProposalItem.findMany","ProposalItem.createOne","ProposalItem.createMany","ProposalItem.createManyAndReturn","ProposalItem.updateOne","ProposalItem.updateMany","ProposalItem.updateManyAndReturn","ProposalItem.upsertOne","ProposalItem.deleteOne","ProposalItem.deleteMany","ProposalItem.groupBy","ProposalItem.aggregate","Payment.findUnique","Payment.findUniqueOrThrow","Payment.findFirst","Payment.findFirstOrThrow","Payment.findMany","Payment.createOne","Payment.createMany","Payment.createManyAndReturn","Payment.updateOne","Payment.updateMany","Payment.updateManyAndReturn","Payment.upsertOne","Payment.deleteOne","Payment.deleteMany","Payment.groupBy","Payment.aggregate","ClientReview.findUnique","ClientReview.findUniqueOrThrow","ClientReview.findFirst","ClientReview.findFirstOrThrow","ClientReview.findMany","ClientReview.createOne","ClientReview.createMany","ClientReview.createManyAndReturn","ClientReview.updateOne","ClientReview.updateMany","ClientReview.updateManyAndReturn","ClientReview.upsertOne","ClientReview.deleteOne","ClientReview.deleteMany","ClientReview.groupBy","ClientReview.aggregate","ClientAppreciation.findUnique","ClientAppreciation.findUniqueOrThrow","ClientAppreciation.findFirst","ClientAppreciation.findFirstOrThrow","ClientAppreciation.findMany","ClientAppreciation.createOne","ClientAppreciation.createMany","ClientAppreciation.createManyAndReturn","ClientAppreciation.updateOne","ClientAppreciation.updateMany","ClientAppreciation.updateManyAndReturn","ClientAppreciation.upsertOne","ClientAppreciation.deleteOne","ClientAppreciation.deleteMany","ClientAppreciation.groupBy","ClientAppreciation.aggregate","ContactMessage.findUnique","ContactMessage.findUniqueOrThrow","ContactMessage.findFirst","ContactMessage.findFirstOrThrow","ContactMessage.findMany","ContactMessage.createOne","ContactMessage.createMany","ContactMessage.createManyAndReturn","ContactMessage.updateOne","ContactMessage.updateMany","ContactMessage.updateManyAndReturn","ContactMessage.upsertOne","ContactMessage.deleteOne","ContactMessage.deleteMany","ContactMessage.groupBy","ContactMessage.aggregate","Notification.findUnique","Notification.findUniqueOrThrow","Notification.findFirst","Notification.findFirstOrThrow","Notification.findMany","Notification.createOne","Notification.createMany","Notification.createManyAndReturn","Notification.updateOne","Notification.updateMany","Notification.updateManyAndReturn","Notification.upsertOne","Notification.deleteOne","Notification.deleteMany","Notification.groupBy","Notification.aggregate","SiteSetting.findUnique","SiteSetting.findUniqueOrThrow","SiteSetting.findFirst","SiteSetting.findFirstOrThrow","SiteSetting.findMany","SiteSetting.createOne","SiteSetting.createMany","SiteSetting.createManyAndReturn","SiteSetting.updateOne","SiteSetting.updateMany","SiteSetting.updateManyAndReturn","SiteSetting.upsertOne","SiteSetting.deleteOne","SiteSetting.deleteMany","SiteSetting.groupBy","SiteSetting.aggregate","KeywordRanking.findUnique","KeywordRanking.findUniqueOrThrow","KeywordRanking.findFirst","KeywordRanking.findFirstOrThrow","KeywordRanking.findMany","KeywordRanking.createOne","KeywordRanking.createMany","KeywordRanking.createManyAndReturn","KeywordRanking.updateOne","KeywordRanking.updateMany","KeywordRanking.updateManyAndReturn","KeywordRanking.upsertOne","KeywordRanking.deleteOne","KeywordRanking.deleteMany","KeywordRanking.groupBy","KeywordRanking.aggregate","Backlink.findUnique","Backlink.findUniqueOrThrow","Backlink.findFirst","Backlink.findFirstOrThrow","Backlink.findMany","Backlink.createOne","Backlink.createMany","Backlink.createManyAndReturn","Backlink.updateOne","Backlink.updateMany","Backlink.updateManyAndReturn","Backlink.upsertOne","Backlink.deleteOne","Backlink.deleteMany","Backlink.groupBy","Backlink.aggregate","Citation.findUnique","Citation.findUniqueOrThrow","Citation.findFirst","Citation.findFirstOrThrow","Citation.findMany","Citation.createOne","Citation.createMany","Citation.createManyAndReturn","Citation.updateOne","Citation.updateMany","Citation.updateManyAndReturn","Citation.upsertOne","Citation.deleteOne","Citation.deleteMany","Citation.groupBy","Citation.aggregate","GoogleBusinessProfile.findUnique","GoogleBusinessProfile.findUniqueOrThrow","GoogleBusinessProfile.findFirst","GoogleBusinessProfile.findFirstOrThrow","GoogleBusinessProfile.findMany","GoogleBusinessProfile.createOne","GoogleBusinessProfile.createMany","GoogleBusinessProfile.createManyAndReturn","GoogleBusinessProfile.updateOne","GoogleBusinessProfile.updateMany","GoogleBusinessProfile.updateManyAndReturn","GoogleBusinessProfile.upsertOne","GoogleBusinessProfile.deleteOne","GoogleBusinessProfile.deleteMany","GoogleBusinessProfile.groupBy","GoogleBusinessProfile.aggregate","SEOAudit.findUnique","SEOAudit.findUniqueOrThrow","SEOAudit.findFirst","SEOAudit.findFirstOrThrow","SEOAudit.findMany","SEOAudit.createOne","SEOAudit.createMany","SEOAudit.createManyAndReturn","SEOAudit.updateOne","SEOAudit.updateMany","SEOAudit.updateManyAndReturn","SEOAudit.upsertOne","SEOAudit.deleteOne","SEOAudit.deleteMany","SEOAudit.groupBy","SEOAudit.aggregate","PerformanceReport.findUnique","PerformanceReport.findUniqueOrThrow","PerformanceReport.findFirst","PerformanceReport.findFirstOrThrow","PerformanceReport.findMany","PerformanceReport.createOne","PerformanceReport.createMany","PerformanceReport.createManyAndReturn","PerformanceReport.updateOne","PerformanceReport.updateMany","PerformanceReport.updateManyAndReturn","PerformanceReport.upsertOne","PerformanceReport.deleteOne","PerformanceReport.deleteMany","PerformanceReport.groupBy","PerformanceReport.aggregate","ReviewMonitor.findUnique","ReviewMonitor.findUniqueOrThrow","ReviewMonitor.findFirst","ReviewMonitor.findFirstOrThrow","ReviewMonitor.findMany","ReviewMonitor.createOne","ReviewMonitor.createMany","ReviewMonitor.createManyAndReturn","ReviewMonitor.updateOne","ReviewMonitor.updateMany","ReviewMonitor.updateManyAndReturn","ReviewMonitor.upsertOne","ReviewMonitor.deleteOne","ReviewMonitor.deleteMany","ReviewMonitor.groupBy","ReviewMonitor.aggregate","ServiceArea.findUnique","ServiceArea.findUniqueOrThrow","ServiceArea.findFirst","ServiceArea.findFirstOrThrow","ServiceArea.findMany","ServiceArea.createOne","ServiceArea.createMany","ServiceArea.createManyAndReturn","ServiceArea.updateOne","ServiceArea.updateMany","ServiceArea.updateManyAndReturn","ServiceArea.upsertOne","ServiceArea.deleteOne","ServiceArea.deleteMany","ServiceArea.groupBy","ServiceArea.aggregate","CallLog.findUnique","CallLog.findUniqueOrThrow","CallLog.findFirst","CallLog.findFirstOrThrow","CallLog.findMany","CallLog.createOne","CallLog.createMany","CallLog.createManyAndReturn","CallLog.updateOne","CallLog.updateMany","CallLog.updateManyAndReturn","CallLog.upsertOne","CallLog.deleteOne","CallLog.deleteMany","CallLog.groupBy","CallLog.aggregate","TrackingConfig.findUnique","TrackingConfig.findUniqueOrThrow","TrackingConfig.findFirst","TrackingConfig.findFirstOrThrow","TrackingConfig.findMany","TrackingConfig.createOne","TrackingConfig.createMany","TrackingConfig.createManyAndReturn","TrackingConfig.updateOne","TrackingConfig.updateMany","TrackingConfig.updateManyAndReturn","TrackingConfig.upsertOne","TrackingConfig.deleteOne","TrackingConfig.deleteMany","TrackingConfig.groupBy","TrackingConfig.aggregate","AND","OR","NOT","id","projectId","ga4MeasurementId","gtmContainerId","metaPixelId","whatsappNumber","conversionGoals","createdAt","updatedAt","equals","in","notIn","lt","lte","gt","gte","not","string_contains","string_starts_with","string_ends_with","array_starts_with","array_ends_with","array_contains","contains","startsWith","endsWith","twilioCallSid","fromNumber","toNumber","duration","recordingUrl","CallStatus","status","receivedAt","city","state","slug","pageUrl","publishedAt","ReviewPlatform","platform","rating","reviewCount","checkedAt","RankingDevice","device","performanceScore","seoScore","metrics","reportUrl","title","auditDate","score","issues","summary","businessName","gbpUrl","address","phone","isVerified","lastOptimizedAt","directoryName","url","CitationStatus","submittedAt","sourceUrl","targetUrl","anchorText","domainAuthority","BacklinkStatus","acquiredAt","keyword","RankingSearchEngine","searchEngine","location","rank","previousRank","key","value","description","userId","NotificationType","type","NotificationEntityType","entityType","entityId","message","isRead","readAt","name","email","company","subject","ContactMessageStatus","repliedAt","clientId","ClientAppreciationType","amount","currency","content","serviceQuality","communication","delivery","isApproved","isFeatured","proposalId","PaymentProvider","provider","providerPaymentId","PaymentStatus","method","paidAt","metadata","serviceId","pricingPlanId","quantity","unitPrice","total","leadId","proposalNumber","introduction","terms","subtotal","discount","tax","ProposalStatus","validUntil","sentAt","viewedAt","acceptedAt","rejectedAt","createdById","fileName","fileUrl","publicId","mimeType","size","FileCategory","milestoneId","assignedStaffId","TaskStatus","TaskPriority","priority","dueDate","completedAt","MilestoneStatus","startDate","order","staffId","ProjectMemberRole","role","ProjectType","projectType","ProjectStatus","budget","deadline","progress","website","isActive","every","some","none","preferredDate","preferredTime","ConsultationStatus","LeadActivityType","timeline","LeadStatus","LeadPriority","LeadSource","source","followUpAt","altText","caption","width","height","postId","tagId","categoryId","authorId","excerpt","featuredImage","seoTitle","seoDescription","canonicalUrl","schemaMarkup","ContentStatus","question","answer","clientName","clientRole","companyName","clientImage","serviceName","caseStudyId","industry","coverImage","problem","strategy","implementation","results","portfolioId","websiteUrl","technologies","price","PricingPlanBillingInterval","billingInterval","features","isPopular","shortName","tagline","icon","process","startingPrice","employeeId","fullName","StaffRole","StaffStatus","designation","department","bio","avatar","hireDate","emailVerified","image","UserRole","UserStatus","passwordHash","lastLoginAt","twoFactorEnabled","twoFactorSecret","secret","backupCodes","identifier","expiresAt","accountId","providerId","issuer","accessToken","refreshToken","idToken","accessTokenExpiresAt","refreshTokenExpiresAt","scope","password","token","ipAddress","userAgent","projectId_slug","projectId_staffId","caseStudyId_serviceId","portfolioId_serviceId","postId_tagId","providerId_accountId","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","increment","decrement","multiply","divide"]'),
  graph: "vRi3A4AGDAQAAMwMACDJBgAApQ0AMMoGAAADABDLBgAApQ0AMMwGAQAAAAHTBkAA9QoAIdQGQAD1CgAhnAcBAJMLACG2CEAA9QoAIcEIAQAAAAHCCAEA8woAIcMIAQDzCgAhAQAAAAEAIAwEAADMDAAgyQYAAKUNADDKBgAAAwAQywYAAKUNADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACGcBwEAkwsAIbYIQAD1CgAhwQgBAJMLACHCCAEA8woAIcMIAQDzCgAhAwQAAIASACDCCAAApg0AIMMIAACmDQAgAwAAAAMAIAEAAAQAMAIAAAEAIBIEAADMDAAgyQYAAKQNADDKBgAABgAQywYAAKQNADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACGcBwEAkwsAIbcIAQCTCwAhuAgBAJMLACG5CAEA8woAIboIAQDzCgAhuwgBAPMKACG8CAEA8woAIb0IQACVCwAhvghAAJULACG_CAEA8woAIcAIAQDzCgAhCQQAAIASACC5CAAApg0AILoIAACmDQAguwgAAKYNACC8CAAApg0AIL0IAACmDQAgvggAAKYNACC_CAAApg0AIMAIAACmDQAgEwQAAMwMACDJBgAApA0AMMoGAAAGABDLBgAApA0AMMwGAQAAAAHTBkAA9QoAIdQGQAD1CgAhnAcBAJMLACG3CAEAkwsAIbgIAQCTCwAhuQgBAPMKACG6CAEA8woAIbsIAQDzCgAhvAgBAPMKACG9CEAAlQsAIb4IQACVCwAhvwgBAPMKACHACAEA8woAIckIAACjDQAgAwAAAAYAIAEAAAcAMAIAAAgAIAoEAADMDAAgyQYAAKINADDKBgAACgAQywYAAKINADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACGcBwEAkwsAIbMIAQCTCwAhtAgBAJMLACEBBAAAgBIAIAoEAADMDAAgyQYAAKINADDKBgAACgAQywYAAKINADDMBgEAAAAB0wZAAPUKACHUBkAA9QoAIZwHAQCTCwAhswgBAJMLACG0CAEAkwsAIQMAAAAKACABAAALADACAAAMACAWCQAAoQ0AIAoAAOQLACANAACFDAAgyQYAAKANADDKBgAADgAQywYAAKANADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACHsBgAAkgyHCCLwBgEAkwsAIfIGQACVCwAh_gYBAJMLACGvBwEAkwsAIf4HAQDzCgAh_wcBAPMKACGACAEA8woAIYEIAQDzCgAhgggBAPMKACGDCAEA8woAIYQIAQDzCgAhhQgAAPQKACAMCQAA6xUAIAoAAIASACANAAC4EgAg8gYAAKYNACD-BwAApg0AIP8HAACmDQAggAgAAKYNACCBCAAApg0AIIIIAACmDQAggwgAAKYNACCECAAApg0AIIUIAACmDQAgFgkAAKENACAKAADkCwAgDQAAhQwAIMkGAACgDQAwygYAAA4AEMsGAACgDQAwzAYBAAAAAdMGQAD1CgAh1AZAAPUKACHsBgAAkgyHCCLwBgEAAAAB8gZAAJULACH-BgEAkwsAIa8HAQCTCwAh_gcBAPMKACH_BwEA8woAIYAIAQDzCgAhgQgBAPMKACGCCAEA8woAIYMIAQDzCgAhhAgBAPMKACGFCAAA9AoAIAMAAAAOACABAAAPADACAAAQACALBwAAjAwAIMkGAACLDAAwygYAABIAEMsGAACLDAAwzAYBAJMLACHTBkAA9QoAIdQGQAD1CgAh8AYBAJMLACGbBwEA8woAIaUHAQCTCwAh6gcgAJQLACEBAAAAEgAgAwAAAA4AIAEAAA8AMAIAABAAIAEAAAAOACAZAwAAvQwAIAUAAL4MACAGAAC_DAAgDgAAjAwAICMAAOcLACA9AADADAAgPgAAwQwAID8AAMIMACBAAADDDAAgyQYAALoMADDKBgAAFgAQywYAALoMADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACHsBgAAvAyvCCKlBwEA8woAIaYHAQCTCwAh4gcAALsMrggiqwggAJQLACGsCAEA8woAIa8IAQDzCgAhsAhAAJULACGxCCAAlAsAIbIIAQDzCgAhAQAAABYAIAgLAACeDQAgDAAAnw0AIMkGAACdDQAwygYAABgAEMsGAACdDQAwzAYBAJMLACH8BwEAkwsAIf0HAQCTCwAhAgsAAOkVACAMAADqFQAgCQsAAJ4NACAMAACfDQAgyQYAAJ0NADDKBgAAGAAQywYAAJ0NADDMBgEAAAAB_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_ACABAAAAFgAgAwAAADYAIAEAADcAMAIAADgAIAMAAAA6ACABAAA7ADACAAA8ACASHAAA9goAIDUAAIsNACA2AADCDAAgyQYAAIgNADDKBgAARAAQywYAAIgNADDMBgEAkwsAIc0GAQCTCwAh0wZAAPUKACHUBkAA9QoAIewGAACJDdkHIv4GAQCTCwAhmwcBAPMKACHWBwEA8woAIdcHAQDzCgAh2gcAAIoN2gci2wdAAJULACHcB0AAlQsAIQgcAACvDQAgNQAA5RUAIDYAAMEVACCbBwAApg0AINYHAACmDQAg1wcAAKYNACDbBwAApg0AINwHAACmDQAgEhwAAPYKACA1AACLDQAgNgAAwgwAIMkGAACIDQAwygYAAEQAEMsGAACIDQAwzAYBAAAAAc0GAQCTCwAh0wZAAPUKACHUBkAA9QoAIewGAACJDdkHIv4GAQCTCwAhmwcBAPMKACHWBwEA8woAIdcHAQDzCgAh2gcAAIoN2gci2wdAAJULACHcB0AAlQsAIQMAAABEACABAABFADACAABGACAWBAAA5AsAIBYAAOULACAaAADmCwAgIgAA6gsAICMAAOcLACAkAADoCwAgJQAA6QsAIDsBAPMKACHJBgAA4wsAMMoGAABIABDLBgAA4wsAMMwGAQCTCwAh0wZAAPUKACHUBkAA9QoAIYYHAQDzCgAhlgcBAPMKACGcBwEA8woAIaUHAQCTCwAhpgcBAJMLACGnBwEA8woAIekHAQDzCgAh6gcgAJQLACEBAAAASAAgAQAAABYAIAMAAAA2ACABAAA3ADACAAA4ACAmEgAA9AwAIBsAAMMMACAjAADnCwAgJAAA6AsAICUAAOkLACAnAACyDAAgKAAAsQwAICkAAPwMACAqAAD9DAAgKwAA_gwAICwAAP8MACAtAACADQAgLgAAgQ0AIC8AAIINACAwAACDDQAgMQAAhA0AIDIAAIUNACAzAACGDQAgNAAAhw0AIMkGAAD5DAAwygYAAEwAEMsGAAD5DAAwzAYBAJMLACHTBkAA9QoAIdQGQAD1CgAh7AYAAPsM5gci8AYBAJMLACGbBwEA8woAIaUHAQCTCwAhqwcBAPMKACGuBwEAkwsAIb0HAQDzCgAh3AdAAJULACHeB0AAlQsAIeQHAAD6DOQHIuYHEACjDAAh5wdAAJULACHoBwIAjwwAIRoSAADWFQAgGwAAwhUAICMAAIMSACAkAACEEgAgJQAAhRIAICcAAM8UACAoAADOFAAgKQAA2RUAICoAANoVACArAADbFQAgLAAA3BUAIC0AAN0VACAuAADeFQAgLwAA3xUAIDAAAOAVACAxAADhFQAgMgAA4hUAIDMAAOMVACA0AADkFQAgmwcAAKYNACCrBwAApg0AIL0HAACmDQAg3AcAAKYNACDeBwAApg0AIOYHAACmDQAg5wcAAKYNACAmEgAA9AwAIBsAAMMMACAjAADnCwAgJAAA6AsAICUAAOkLACAnAACyDAAgKAAAsQwAICkAAPwMACAqAAD9DAAgKwAA_gwAICwAAP8MACAtAACADQAgLgAAgQ0AIC8AAIINACAwAACDDQAgMQAAhA0AIDIAAIUNACAzAACGDQAgNAAAhw0AIMkGAAD5DAAwygYAAEwAEMsGAAD5DAAwzAYBAAAAAdMGQAD1CgAh1AZAAPUKACHsBgAA-wzmByLwBgEAAAABmwcBAPMKACGlBwEAkwsAIasHAQDzCgAhrgcBAJMLACG9BwEA8woAIdwHQACVCwAh3gdAAJULACHkBwAA-gzkByLmBxAAowwAIecHQACVCwAh6AcCAI8MACEDAAAATAAgAQAATQAwAgAATgAgIBcAAPgMACAbAADDDAAgHAAA7AwAIB0AAMwMACAhAAClDAAgIgAA6gsAIDsBAPMKACHJBgAA9gwAMMoGAABQABDLBgAA9gwAMMwGAQCTCwAhzQYBAPMKACHTBkAA9QoAIdQGQAD1CgAh7AYAAPcMygci_gYBAJMLACGrBwEA8woAIa4HAQCTCwAhwQcQANAMACHCBwEA8woAIcMHAQCTCwAhxAcBAPMKACHFBwEA8woAIcYHEADQDAAhxwcQANAMACHIBxAA0AwAIcoHQACVCwAhywdAAJULACHMB0AAlQsAIc0HQACVCwAhzgdAAJULACHPBwEAkwsAIREXAADVFQAgGwAAwhUAIBwAAK8NACAdAACAEgAgIQAAmRQAICIAAIYSACA7AACmDQAgzQYAAKYNACCrBwAApg0AIMIHAACmDQAgxAcAAKYNACDFBwAApg0AIMoHAACmDQAgywcAAKYNACDMBwAApg0AIM0HAACmDQAgzgcAAKYNACAgFwAA-AwAIBsAAMMMACAcAADsDAAgHQAAzAwAICEAAKUMACAiAADqCwAgOwEA8woAIckGAAD2DAAwygYAAFAAEMsGAAD2DAAwzAYBAAAAAc0GAQDzCgAh0wZAAPUKACHUBkAA9QoAIewGAAD3DMoHIv4GAQCTCwAhqwcBAPMKACGuBwEAkwsAIcEHEADQDAAhwgcBAPMKACHDBwEAAAABxAcBAPMKACHFBwEA8woAIcYHEADQDAAhxwcQANAMACHIBxAA0AwAIcoHQACVCwAhywdAAJULACHMB0AAlQsAIc0HQACVCwAhzgdAAJULACHPBwEAkwsAIQMAAABQACABAABRADACAABSACABAAAANgAgAQAAAEgAIAEAAABMACAQEgAA9AwAIB4AAPMMACAgAAD1DAAgyQYAAPIMADDKBgAAVwAQywYAAPIMADDMBgEAkwsAIdMGQAD1CgAh_gYBAJMLACGbBwEA8woAIbUHAQCTCwAhvQcBAPMKACG-BwEA8woAIb8HAgCPDAAhwAcQANAMACHBBxAA0AwAIQYSAADWFQAgHgAA1xUAICAAANgVACCbBwAApg0AIL0HAACmDQAgvgcAAKYNACAQEgAA9AwAIB4AAPMMACAgAAD1DAAgyQYAAPIMADDKBgAAVwAQywYAAPIMADDMBgEAAAAB0wZAAPUKACH-BgEAkwsAIZsHAQDzCgAhtQcBAJMLACG9BwEA8woAIb4HAQDzCgAhvwcCAI8MACHABxAA0AwAIcEHEADQDAAhAwAAAFcAIAEAAFgAMAIAAFkAIAEAAAAjACATEgAA0gwAIB8AAKUMACDJBgAAzwwAMMoGAABcABDLBgAAzwwAMMwGAQCTCwAh0wZAAPUKACHUBkAA9QoAIfAGAQCTCwAhmwcBAPMKACGlBwEAkwsAIa4HAQCTCwAhvQcBAJMLACHfBwIAjwwAIeoHIACUCwAhmAgQANAMACGaCAAA0QyaCCKbCAAA9AoAIJwIIACUCwAhAQAAAFwAIAMAAABXACABAABYADACAABZACABAAAAVwAgEhsAAMMMACAeAADxDAAgyQYAAO4MADDKBgAAYAAQywYAAO4MADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACHsBgAA8Ay6ByKrBwEA8woAIa0HEADQDAAhrgcBAJMLACG1BwEA8woAIbcHAADvDLcHIrgHAQDzCgAhugcBAPMKACG7B0AAlQsAIbwHAAD0CgAgCBsAAMIVACAeAADXFQAgqwcAAKYNACC1BwAApg0AILgHAACmDQAgugcAAKYNACC7BwAApg0AILwHAACmDQAgEhsAAMMMACAeAADxDAAgyQYAAO4MADDKBgAAYAAQywYAAO4MADDMBgEAAAAB0wZAAPUKACHUBkAA9QoAIewGAADwDLoHIqsHAQDzCgAhrQcQANAMACGuBwEAkwsAIbUHAQDzCgAhtwcAAO8MtwciuAcBAAAAAboHAQDzCgAhuwdAAJULACG8BwAA9AoAIAMAAABgACABAABhADACAABiACABAAAAUAAgAQAAAEgAIAEAAABXACABAAAAYAAgEhsAAOsMACAcAADsDAAgyQYAAO0MADDKBgAAaAAQywYAAO0MADDMBgEAkwsAIc0GAQDzCgAh0wZAAPUKACHUBkAA9QoAIfUGAgCPDAAh_gYBAPMKACGrBwEAkwsAIa8HAQCTCwAhsAcCAIAMACGxBwIAgAwAIbIHAgCADAAhswcgAJQLACG0ByAAlAsAIQcbAADCFQAgHAAArw0AIM0GAACmDQAg_gYAAKYNACCwBwAApg0AILEHAACmDQAgsgcAAKYNACASGwAA6wwAIBwAAOwMACDJBgAA7QwAMMoGAABoABDLBgAA7QwAMMwGAQAAAAHNBgEA8woAIdMGQAD1CgAh1AZAAPUKACH1BgIAjwwAIf4GAQDzCgAhqwcBAJMLACGvBwEAkwsAIbAHAgCADAAhsQcCAIAMACGyBwIAgAwAIbMHIACUCwAhtAcgAJQLACEDAAAAaAAgAQAAaQAwAgAAagAgAQAAAEwAIBAbAADrDAAgHAAA7AwAIMkGAADpDAAwygYAAG0AEMsGAADpDAAwzAYBAJMLACHNBgEA8woAIdMGQAD1CgAh1AZAAPUKACHtBkAA9QoAIf4GAQDzCgAhmwcBAPMKACGeBwAA6gytByKrBwEAkwsAIa0HEACjDAAhrgcBAPMKACEHGwAAwhUAIBwAAK8NACDNBgAApg0AIP4GAACmDQAgmwcAAKYNACCtBwAApg0AIK4HAACmDQAgEBsAAOsMACAcAADsDAAgyQYAAOkMADDKBgAAbQAQywYAAOkMADDMBgEAAAABzQYBAPMKACHTBkAA9QoAIdQGQAD1CgAh7QZAAPUKACH-BgEA8woAIZsHAQDzCgAhngcAAOoMrQciqwcBAJMLACGtBxAAowwAIa4HAQDzCgAhAwAAAG0AIAEAAG4AMAIAAG8AIAEAAABMACADAAAAYAAgAQAAYQAwAgAAYgAgAQAAADYAIAEAAABMACABAAAAUAAgAQAAAGgAIAEAAABtACABAAAAYAAgAQAAACMAIAocAAD2CgAgJgAA6AwAIMkGAADmDAAwygYAAHoAEMsGAADmDAAwzAYBAJMLACHNBgEAkwsAIdMGQAD1CgAh4AcBAJMLACHiBwAA5wziByICHAAArw0AICYAAMEVACALHAAA9goAICYAAOgMACDJBgAA5gwAMMoGAAB6ABDLBgAA5gwAMMwGAQAAAAHNBgEAkwsAIdMGQAD1CgAh4AcBAJMLACHiBwAA5wziByLFCAAA5QwAIAMAAAB6ACABAAB7ADACAAB8ACAQHAAA9goAICgAALEMACDJBgAA4wwAMMoGAAB-ABDLBgAA4wwAMMwGAQCTCwAhzQYBAJMLACHTBkAA9QoAIdQGQAD1CgAh7AYAAOQM3gci_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_QYBAPMKACH-BgEA8woAIf8GQAD1CgAhgAcCAIAMACGBBwAA9AoAIIIHAQDzCgAhBhwAAK8NACD9BgAApg0AIP4GAACmDQAggAcAAKYNACCBBwAApg0AIIIHAACmDQAgDRwAAPYKACDJBgAA2wwAMMoGAACaAQAQywYAANsMADDMBgEAAAABzQYBAJMLACHTBkAA9QoAIf0GAQDzCgAh_gYBAPMKACH_BkAA9QoAIYAHAgCADAAhgQcAAPQKACCCBwEA8woAIQMAAACaAQAgAQAAmwEAMAIAAJwBACAOHAAA9goAIMkGAADZDAAwygYAAJ4BABDLBgAA2QwAMMwGAQCTCwAhzQYBAJMLACHTBkAA9QoAIfEGAQCTCwAh9wZAAPUKACH5BgAA2gz5BiL6BgIAgAwAIfsGAgCADAAh_AYAAPQKACD9BgEA8woAIQUcAACvDQAg-gYAAKYNACD7BgAApg0AIPwGAACmDQAg_QYAAKYNACAOHAAA9goAIMkGAADZDAAwygYAAJ4BABDLBgAA2QwAMMwGAQAAAAHNBgEAkwsAIdMGQAD1CgAh8QYBAJMLACH3BkAA9QoAIfkGAADaDPkGIvoGAgCADAAh-wYCAIAMACH8BgAA9AoAIP0GAQDzCgAhAwAAAJ4BACABAACfAQAwAgAAoAEAIAscAAD2CgAgyQYAANcMADDKBgAAogEAEMsGAADXDAAwzAYBAJMLACHNBgEAkwsAIdMGQAD1CgAh9AYAANgM9AYi9QYQAKMMACH2BgIAgAwAIfcGQAD1CgAhAxwAAK8NACD1BgAApg0AIPYGAACmDQAgCxwAAPYKACDJBgAA1wwAMMoGAACiAQAQywYAANcMADDMBgEAAAABzQYBAJMLACHTBkAA9QoAIfQGAADYDPQGIvUGEACjDAAh9gYCAIAMACH3BkAA9QoAIQMAAACiAQAgAQAAowEAMAIAAKQBACANHAAA9goAIMkGAADWDAAwygYAAKYBABDLBgAA1gwAMMwGAQCTCwAhzQYBAJMLACHTBkAA9QoAIdQGQAD1CgAh7gYBAJMLACHvBgEA8woAIfAGAQCTCwAh8QYBAPMKACHyBkAAlQsAIQQcAACvDQAg7wYAAKYNACDxBgAApg0AIPIGAACmDQAgDhwAAPYKACDJBgAA1gwAMMoGAACmAQAQywYAANYMADDMBgEAAAABzQYBAJMLACHTBkAA9QoAIdQGQAD1CgAh7gYBAJMLACHvBgEA8woAIfAGAQCTCwAh8QYBAPMKACHyBkAAlQsAIcQIAADVDAAgAwAAAKYBACABAACnAQAwAgAAqAEAIA4cAAD2CgAgyQYAANMMADDKBgAAqgEAEMsGAADTDAAwzAYBAJMLACHNBgEAkwsAIdMGQAD1CgAh5gYBAPMKACHnBgEAkwsAIegGAQDzCgAh6QYCAIAMACHqBgEA8woAIewGAADUDOwGIu0GQAD1CgAhBRwAAK8NACDmBgAApg0AIOgGAACmDQAg6QYAAKYNACDqBgAApg0AIA4cAAD2CgAgyQYAANMMADDKBgAAqgEAEMsGAADTDAAwzAYBAAAAAc0GAQCTCwAh0wZAAPUKACHmBgEAAAAB5wYBAJMLACHoBgEA8woAIekGAgCADAAh6gYBAPMKACHsBgAA1AzsBiLtBkAA9QoAIQMAAACqAQAgAQAAqwEAMAIAAKwBACANHAAA9goAIMkGAADyCgAwygYAAK4BABDLBgAA8goAMMwGAQCTCwAhzQYBAJMLACHOBgEA8woAIc8GAQDzCgAh0AYBAPMKACHRBgEA8woAIdIGAAD0CgAg0wZAAPUKACHUBkAA9QoAIQEAAACuAQAgAQAAAHoAIAEAAAB-ACABAAAARAAgAQAAAIUBACABAAAAaAAgAQAAAG0AIAEAAABQACABAAAAjAEAIAEAAACQAQAgAQAAAJQBACABAAAAmgEAIAEAAACeAQAgAQAAAKIBACABAAAApgEAIAEAAACqAQAgAQAAAH4AIAEAAAA_ACADAAAAegAgAQAAewAwAgAAfAAgAQAAADYAIAEAAAA6ACABAAAARAAgAQAAAHoAIAMAAABXACABAABYADACAABZACAEEgAA1hUAIB8AAJkUACCbBwAApg0AIJsIAACmDQAgExIAANIMACAfAAClDAAgyQYAAM8MADDKBgAAXAAQywYAAM8MADDMBgEAAAAB0wZAAPUKACHUBkAA9QoAIfAGAQAAAAGbBwEA8woAIaUHAQCTCwAhrgcBAJMLACG9BwEAkwsAId8HAgCPDAAh6gcgAJQLACGYCBAA0AwAIZoIAADRDJoIIpsIAAD0CgAgnAggAJQLACEDAAAAXAAgAQAAxwEAMAIAAMgBACADAAAATAAgAQAATQAwAgAATgAgAQAAACUAIAEAAAAwACABAAAANgAgAQAAADoAIAEAAABXACABAAAAXAAgAQAAAEwAIAEAAABIACABAAAAPwAgCRcAAM4MACDJBgAAzQwAMMoGAADUAQAQywYAAM0MADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACGvBwEAkwsAIcIHAQCTCwAhARcAANUVACAJFwAAzgwAIMkGAADNDAAwygYAANQBABDLBgAAzQwAMMwGAQAAAAHTBkAA9QoAIdQGQAD1CgAhrwcBAJMLACHCBwEAkwsAIQMAAADUAQAgAQAA1QEAMAIAANYBACADAAAAHwAgAQAAIAAwAgAAIQAgAwAAADoAIAEAADsAMAIAADwAIAMAAABQACABAABRADACAABSACABAAAA1AEAIAEAAAAfACABAAAAOgAgAQAAAFAAIAEAAAAWACADAAAAUAAgAQAAUQAwAgAAUgAgDgQAAMwMACDJBgAAyQwAMMoGAADhAQAQywYAAMkMADDMBgEAkwsAIdMGQAD1CgAh_gYBAJMLACGcBwEAkwsAIZ4HAADKDJ4HIqAHAADLDKAHI6EHAQDzCgAhogcBAJMLACGjByAAlAsAIaQHQACVCwAhBAQAAIASACCgBwAApg0AIKEHAACmDQAgpAcAAKYNACAOBAAAzAwAIMkGAADJDAAwygYAAOEBABDLBgAAyQwAMMwGAQAAAAHTBkAA9QoAIf4GAQCTCwAhnAcBAJMLACGeBwAAygyeByKgBwAAywygByOhBwEA8woAIaIHAQCTCwAhowcgAJQLACGkB0AAlQsAIQMAAADhAQAgAQAA4gEAMAIAAOMBACABAAAAPwAgAQAAAEgAIAEAAAADACABAAAABgAgAQAAAAoAIAEAAAAOACABAAAAHwAgAQAAAFAAIAEAAADhAQAgAQAAAAEAIAMAAAADACABAAAEADACAAABACADAAAAAwAgAQAABAAwAgAAAQAgAwAAAAMAIAEAAAQAMAIAAAEAIAkEAADUFQAgzAYBAAAAAdMGQAAAAAHUBkAAAAABnAcBAAAAAbYIQAAAAAHBCAEAAAABwggBAAAAAcMIAQAAAAEBRgAA8gEAIAjMBgEAAAAB0wZAAAAAAdQGQAAAAAGcBwEAAAABtghAAAAAAcEIAQAAAAHCCAEAAAABwwgBAAAAAQFGAAD0AQAwAUYAAPQBADAJBAAA0xUAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIZwHAQCqDQAhtghAAKwNACHBCAEAqg0AIcIIAQCrDQAhwwgBAKsNACECAAAAAQAgRgAA9wEAIAjMBgEAqg0AIdMGQACsDQAh1AZAAKwNACGcBwEAqg0AIbYIQACsDQAhwQgBAKoNACHCCAEAqw0AIcMIAQCrDQAhAgAAAAMAIEYAAPkBACACAAAAAwAgRgAA-QEAIAMAAAABACBNAADyAQAgTgAA9wEAIAEAAAABACABAAAAAwAgBQgAANAVACBTAADSFQAgVAAA0RUAIMIIAACmDQAgwwgAAKYNACALyQYAAMgMADDKBgAAgAIAEMsGAADIDAAwzAYBAOUKACHTBkAA6AoAIdQGQADoCgAhnAcBAOUKACG2CEAA6AoAIcEIAQDlCgAhwggBAOYKACHDCAEA5goAIQMAAAADACABAAD_AQAwUgAAgAIAIAMAAAADACABAAAEADACAAABACABAAAACAAgAQAAAAgAIAMAAAAGACABAAAHADACAAAIACADAAAABgAgAQAABwAwAgAACAAgAwAAAAYAIAEAAAcAMAIAAAgAIA8EAADPFQAgzAYBAAAAAdMGQAAAAAHUBkAAAAABnAcBAAAAAbcIAQAAAAG4CAEAAAABuQgBAAAAAboIAQAAAAG7CAEAAAABvAgBAAAAAb0IQAAAAAG-CEAAAAABvwgBAAAAAcAIAQAAAAEBRgAAiAIAIA7MBgEAAAAB0wZAAAAAAdQGQAAAAAGcBwEAAAABtwgBAAAAAbgIAQAAAAG5CAEAAAABuggBAAAAAbsIAQAAAAG8CAEAAAABvQhAAAAAAb4IQAAAAAG_CAEAAAABwAgBAAAAAQFGAACKAgAwAUYAAIoCADAPBAAAzhUAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIZwHAQCqDQAhtwgBAKoNACG4CAEAqg0AIbkIAQCrDQAhuggBAKsNACG7CAEAqw0AIbwIAQCrDQAhvQhAALwNACG-CEAAvA0AIb8IAQCrDQAhwAgBAKsNACECAAAACAAgRgAAjQIAIA7MBgEAqg0AIdMGQACsDQAh1AZAAKwNACGcBwEAqg0AIbcIAQCqDQAhuAgBAKoNACG5CAEAqw0AIboIAQCrDQAhuwgBAKsNACG8CAEAqw0AIb0IQAC8DQAhvghAALwNACG_CAEAqw0AIcAIAQCrDQAhAgAAAAYAIEYAAI8CACACAAAABgAgRgAAjwIAIAMAAAAIACBNAACIAgAgTgAAjQIAIAEAAAAIACABAAAABgAgCwgAAMsVACBTAADNFQAgVAAAzBUAILkIAACmDQAguggAAKYNACC7CAAApg0AILwIAACmDQAgvQgAAKYNACC-CAAApg0AIL8IAACmDQAgwAgAAKYNACARyQYAAMcMADDKBgAAlgIAEMsGAADHDAAwzAYBAOUKACHTBkAA6AoAIdQGQADoCgAhnAcBAOUKACG3CAEA5QoAIbgIAQDlCgAhuQgBAOYKACG6CAEA5goAIbsIAQDmCgAhvAgBAOYKACG9CEAA_woAIb4IQAD_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_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_MBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAAnxSmCCKGBwEAqw0AIZwHAQCrDQAhpgcBAKoNACHiBwAAnhSlCCKiCAEAqw0AIaMIAQCqDQAhpggBAKsNACGnCAEAqw0AIagIAQCrDQAhqQgBAKsNACGqCEAAvA0AIQIAAAA_ACBGAADvAgAgAgAAAD8AIEYAAO8CACABAAAAFgAgAwAAAOACACBNAADnAgAgTgAA7QIAIAEAAADgAgAgAQAAAD8AIAsIAACbFAAgUwAAnRQAIFQAAJwUACCGBwAApg0AIJwHAACmDQAgoggAAKYNACCmCAAApg0AIKcIAACmDQAgqAgAAKYNACCpCAAApg0AIKoIAACmDQAgEskGAACnDAAwygYAAPcCABDLBgAApwwAMMwGAQDlCgAh0wZAAOgKACHUBkAA6AoAIewGAACpDKYIIoYHAQDmCgAhnAcBAOYKACGmBwEA5QoAIeIHAACoDKUIIqIIAQDmCgAhowgBAOUKACGmCAEA5goAIacIAQDmCgAhqAgBAOYKACGpCAEA5goAIaoIQAD_CgAhAwAAAD8AIAEAAPYCADBSAAD3AgAgAwAAAD8AIAEAAOMCADACAADgAgAgHRMAAJwMACAVAACWDAAgFgAA5QsAIBoAAOYLACAfAAClDAAgOQAApAwAIDoAAKYMACDJBgAAogwAMMoGAAAjABDLBgAAogwAMMwGAQAAAAHTBkAA9QoAIdQGQAD1CgAh8AYBAAAAAZsHAQDzCgAhpQcBAJMLACGuBwEAkwsAIbQHIACUCwAh3wcCAI8MACHqByAAlAsAIYIIAQDzCgAhgwgBAPMKACGQCAEA8woAIZsIAAD0CgAgnQgBAPMKACGeCAEA8woAIZ8IAQDzCgAhoAgAAPQKACChCBAAowwAIQEAAAD6AgAgAQAAAPoCACAREwAArxMAIBUAAIATACAWAACBEgAgGgAAghIAIB8AAJkUACA5AACYFAAgOgAAmhQAIJsHAACmDQAggggAAKYNACCDCAAApg0AIJAIAACmDQAgmwgAAKYNACCdCAAApg0AIJ4IAACmDQAgnwgAAKYNACCgCAAApg0AIKEIAACmDQAgAwAAACMAIAEAAP0CADACAAD6AgAgAwAAACMAIAEAAP0CADACAAD6AgAgAwAAACMAIAEAAP0CADACAAD6AgAgGhMAAJEUACAVAACSFAAgFgAAkxQAIBoAAJcUACAfAACVFAAgOQAAlBQAIDoAAJYUACDMBgEAAAAB0wZAAAAAAdQGQAAAAAHwBgEAAAABmwcBAAAAAaUHAQAAAAGuBwEAAAABtAcgAAAAAd8HAgAAAAHqByAAAAABgggBAAAAAYMIAQAAAAGQCAEAAAABmwiAAAAAAZ0IAQAAAAGeCAEAAAABnwgBAAAAAaAIgAAAAAGhCBAAAAABAUYAAIEDACATzAYBAAAAAdMGQAAAAAHUBkAAAAAB8AYBAAAAAZsHAQAAAAGlBwEAAAABrgcBAAAAAbQHIAAAAAHfBwIAAAAB6gcgAAAAAYIIAQAAAAGDCAEAAAABkAgBAAAAAZsIgAAAAAGdCAEAAAABnggBAAAAAZ8IAQAAAAGgCIAAAAABoQgQAAAAAQFGAACDAwAwAUYAAIMDADAaEwAAyBMAIBUAAMkTACAWAADKEwAgGgAAzhMAIB8AAMwTACA5AADLEwAgOgAAzRMAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIfAGAQCqDQAhmwcBAKsNACGlBwEAqg0AIa4HAQCqDQAhtAcgANoNACHfBwIAkA4AIeoHIADaDQAhgggBAKsNACGDCAEAqw0AIZAIAQCrDQAhmwiAAAAAAZ0IAQCrDQAhnggBAKsNACGfCAEAqw0AIaAIgAAAAAGhCBAAxQ0AIQIAAAD6AgAgRgAAhgMAIBPMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHwBgEAqg0AIZsHAQCrDQAhpQcBAKoNACGuBwEAqg0AIbQHIADaDQAh3wcCAJAOACHqByAA2g0AIYIIAQCrDQAhgwgBAKsNACGQCAEAqw0AIZsIgAAAAAGdCAEAqw0AIZ4IAQCrDQAhnwgBAKsNACGgCIAAAAABoQgQAMUNACECAAAAIwAgRgAAiAMAIAIAAAAjACBGAACIAwAgAwAAAPoCACBNAACBAwAgTgAAhgMAIAEAAAD6AgAgAQAAACMAIA8IAADDEwAgUwAAxhMAIFQAAMUTACC1AQAAxBMAILYBAADHEwAgmwcAAKYNACCCCAAApg0AIIMIAACmDQAgkAgAAKYNACCbCAAApg0AIJ0IAACmDQAgnggAAKYNACCfCAAApg0AIKAIAACmDQAgoQgAAKYNACAWyQYAAKEMADDKBgAAjwMAEMsGAAChDAAwzAYBAOUKACHTBkAA6AoAIdQGQADoCgAh8AYBAOUKACGbBwEA5goAIaUHAQDlCgAhrgcBAOUKACG0ByAAjwsAId8HAgC2CwAh6gcgAI8LACGCCAEA5goAIYMIAQDmCgAhkAgBAOYKACGbCAAA5woAIJ0IAQDmCgAhnggBAOYKACGfCAEA5goAIaAIAADnCgAgoQgQAIQLACEDAAAAIwAgAQAAjgMAMFIAAI8DACADAAAAIwAgAQAA_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_gYBAAAAAZYHAQAAAAGbBwEAAAABtAcgAAAAAYIIAQAAAAGDCAEAAAABiQgBAAAAAY8IAQAAAAGQCAEAAAABlAiAAAAAAZYIAQAAAAGXCIAAAAABAUYAALIDADABRgAAsgMAMBUQAACSEwAgEQAAkxMAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIekGAQCrDQAh7AYAALwShwgi8AYBAKoNACHyBkAAvA0AIf4GAQCqDQAhlgcBAKsNACGbBwEAqw0AIbQHIADaDQAhgggBAKsNACGDCAEAqw0AIYkIAQCrDQAhjwgBAKsNACGQCAEAqw0AIZQIgAAAAAGWCAEAqw0AIZcIgAAAAAECAAAAqAMAIEYAALUDACATzAYBAKoNACHTBkAArA0AIdQGQACsDQAh6QYBAKsNACHsBgAAvBKHCCLwBgEAqg0AIfIGQAC8DQAh_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_AaAAAAAAf4GAQAAAAGWBwEAAAABtAcgAAAAAYIIAQAAAAGDCAEAAAABiQgBAAAAAY8IAQAAAAGQCAEAAAABkQgBAAAAAZIIAQAAAAGTCAEAAAABlAgBAAAAAQFGAAD1AwAgE8wGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAAhwgC8AYBAAAAAfIGQAAAAAH8BoAAAAAB_gYBAAAAAZYHAQAAAAG0ByAAAAABgggBAAAAAYMIAQAAAAGJCAEAAAABjwgBAAAAAZAIAQAAAAGRCAEAAAABkggBAAAAAZMIAQAAAAGUCAEAAAABAUYAAPcDADABRgAA9wMAMBQRAADyEgAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAALwShwgi8AYBAKoNACHyBkAAvA0AIfwGgAAAAAH-BgEAqg0AIZYHAQCrDQAhtAcgANoNACGCCAEAqw0AIYMIAQCrDQAhiQgBAKsNACGPCAEAqw0AIZAIAQCrDQAhkQgBAKsNACGSCAEAqw0AIZMIAQCrDQAhlAgBAKsNACECAAAA7QMAIEYAAPoDACATzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAALwShwgi8AYBAKoNACHyBkAAvA0AIfwGgAAAAAH-BgEAqg0AIZYHAQCrDQAhtAcgANoNACGCCAEAqw0AIYMIAQCrDQAhiQgBAKsNACGPCAEAqw0AIZAIAQCrDQAhkQgBAKsNACGSCAEAqw0AIZMIAQCrDQAhlAgBAKsNACECAAAA8AMAIEYAAPwDACACAAAA8AMAIEYAAPwDACADAAAA7QMAIE0AAPUDACBOAAD6AwAgAQAAAO0DACABAAAA8AMAIA8IAADvEgAgUwAA8RIAIFQAAPASACDyBgAApg0AIPwGAACmDQAglgcAAKYNACCCCAAApg0AIIMIAACmDQAgiQgAAKYNACCPCAAApg0AIJAIAACmDQAgkQgAAKYNACCSCAAApg0AIJMIAACmDQAglAgAAKYNACAWyQYAAJQMADDKBgAAgwQAEMsGAACUDAAwzAYBAOUKACHTBkAA6AoAIdQGQADoCgAh7AYAAIcMhwgi8AYBAOUKACHyBkAA_woAIfwGAADnCgAg_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_woAIfUGAgC2CwAhrwcBAOUKACG0ByAAjwsAIYkIAQDlCgAhiggBAOYKACGLCAEA5goAIYwIAQDmCgAhjQgBAOYKACEDAAAAnwQAIAEAALEEADBSAACyBAAgAwAAAJ8EACABAACgBAAwAgAAnAQAIAsJAQDzCgAhyQYAAI4MADDKBgAAuAQAEMsGAACODAAwzAYBAAAAAdMGQAD1CgAh1AZAAPUKACHfBwIAjwwAIeoHIACUCwAhhwgBAJMLACGICAEAkwsAIQEAAAC1BAAgAQAAALUEACALCQEA8woAIckGAACODAAwygYAALgEABDLBgAAjgwAMMwGAQCTCwAh0wZAAPUKACHUBkAA9QoAId8HAgCPDAAh6gcgAJQLACGHCAEAkwsAIYgIAQCTCwAhAQkAAKYNACADAAAAuAQAIAEAALkEADACAAC1BAAgAwAAALgEACABAAC5BAAwAgAAtQQAIAMAAAC4BAAgAQAAuQQAMAIAALUEACAICQEAAAABzAYBAAAAAdMGQAAAAAHUBkAAAAAB3wcCAAAAAeoHIAAAAAGHCAEAAAABiAgBAAAAAQFGAAC9BAAgCAkBAAAAAcwGAQAAAAHTBkAAAAAB1AZAAAAAAd8HAgAAAAHqByAAAAABhwgBAAAAAYgIAQAAAAEBRgAAvwQAMAFGAAC_BAAwCAkBAKsNACHMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHfBwIAkA4AIeoHIADaDQAhhwgBAKoNACGICAEAqg0AIQIAAAC1BAAgRgAAwgQAIAgJAQCrDQAhzAYBAKoNACHTBkAArA0AIdQGQACsDQAh3wcCAJAOACHqByAA2g0AIYcIAQCqDQAhiAgBAKoNACECAAAAuAQAIEYAAMQEACACAAAAuAQAIEYAAMQEACADAAAAtQQAIE0AAL0EACBOAADCBAAgAQAAALUEACABAAAAuAQAIAYIAADeEgAgCQAApg0AIFMAAOESACBUAADgEgAgtQEAAN8SACC2AQAA4hIAIAsJAQDmCgAhyQYAAI0MADDKBgAAywQAEMsGAACNDAAwzAYBAOUKACHTBkAA6AoAIdQGQADoCgAh3wcCALYLACHqByAAjwsAIYcIAQDlCgAhiAgBAOUKACEDAAAAuAQAIAEAAMoEADBSAADLBAAgAwAAALgEACABAAC5BAAwAgAAtQQAIAsHAACMDAAgyQYAAIsMADDKBgAAEgAQywYAAIsMADDMBgEAAAAB0wZAAPUKACHUBkAA9QoAIfAGAQAAAAGbBwEA8woAIaUHAQCTCwAh6gcgAJQLACEBAAAAzgQAIAEAAADOBAAgAgcAAN0SACCbBwAApg0AIAMAAAASACABAADRBAAwAgAAzgQAIAMAAAASACABAADRBAAwAgAAzgQAIAMAAAASACABAADRBAAwAgAAzgQAIAgHAADcEgAgzAYBAAAAAdMGQAAAAAHUBkAAAAAB8AYBAAAAAZsHAQAAAAGlBwEAAAAB6gcgAAAAAQFGAADVBAAgB8wGAQAAAAHTBkAAAAAB1AZAAAAAAfAGAQAAAAGbBwEAAAABpQcBAAAAAeoHIAAAAAEBRgAA1wQAMAFGAADXBAAwCAcAAM8SACDMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHwBgEAqg0AIZsHAQCrDQAhpQcBAKoNACHqByAA2g0AIQIAAADOBAAgRgAA2gQAIAfMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHwBgEAqg0AIZsHAQCrDQAhpQcBAKoNACHqByAA2g0AIQIAAAASACBGAADcBAAgAgAAABIAIEYAANwEACADAAAAzgQAIE0AANUEACBOAADaBAAgAQAAAM4EACABAAAAEgAgBAgAAMwSACBTAADOEgAgVAAAzRIAIJsHAACmDQAgCskGAACKDAAwygYAAOMEABDLBgAAigwAMMwGAQDlCgAh0wZAAOgKACHUBkAA6AoAIfAGAQDlCgAhmwcBAOYKACGlBwEA5QoAIeoHIACPCwAhAwAAABIAIAEAAOIEADBSAADjBAAgAwAAABIAIAEAANEEADACAADOBAAgAQAAABAAIAEAAAAQACADAAAADgAgAQAADwAwAgAAEAAgAwAAAA4AIAEAAA8AMAIAABAAIAMAAAAOACABAAAPADACAAAQACATCQAAyRIAIAoAAMoSACANAADLEgAgzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAACHCALwBgEAAAAB8gZAAAAAAf4GAQAAAAGvBwEAAAAB_gcBAAAAAf8HAQAAAAGACAEAAAABgQgBAAAAAYIIAQAAAAGDCAEAAAABhAgBAAAAAYUIgAAAAAEBRgAA6wQAIBDMBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAIcIAvAGAQAAAAHyBkAAAAAB_gYBAAAAAa8HAQAAAAH-BwEAAAAB_wcBAAAAAYAIAQAAAAGBCAEAAAABgggBAAAAAYMIAQAAAAGECAEAAAABhQiAAAAAAQFGAADtBAAwAUYAAO0EADABAAAAEgAgAQAAABYAIBMJAAC9EgAgCgAAvhIAIA0AAL8SACDMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAAvBKHCCLwBgEAqg0AIfIGQAC8DQAh_gYBAKoNACGvBwEAqg0AIf4HAQCrDQAh_wcBAKsNACGACAEAqw0AIYEIAQCrDQAhgggBAKsNACGDCAEAqw0AIYQIAQCrDQAhhQiAAAAAAQIAAAAQACBGAADyBAAgEMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAAC8EocIIvAGAQCqDQAh8gZAALwNACH-BgEAqg0AIa8HAQCqDQAh_gcBAKsNACH_BwEAqw0AIYAIAQCrDQAhgQgBAKsNACGCCAEAqw0AIYMIAQCrDQAhhAgBAKsNACGFCIAAAAABAgAAAA4AIEYAAPQEACACAAAADgAgRgAA9AQAIAEAAAASACABAAAAFgAgAwAAABAAIE0AAOsEACBOAADyBAAgAQAAABAAIAEAAAAOACAMCAAAuRIAIFMAALsSACBUAAC6EgAg8gYAAKYNACD-BwAApg0AIP8HAACmDQAggAgAAKYNACCBCAAApg0AIIIIAACmDQAggwgAAKYNACCECAAApg0AIIUIAACmDQAgE8kGAACGDAAwygYAAP0EABDLBgAAhgwAMMwGAQDlCgAh0wZAAOgKACHUBkAA6AoAIewGAACHDIcIIvAGAQDlCgAh8gZAAP8KACH-BgEA5QoAIa8HAQDlCgAh_gcBAOYKACH_BwEA5goAIYAIAQDmCgAhgQgBAOYKACGCCAEA5goAIYMIAQDmCgAhhAgBAOYKACGFCAAA5woAIAMAAAAOACABAAD8BAAwUgAA_QQAIAMAAAAOACABAAAPADACAAAQACAJBwAAhQwAIMkGAACEDAAwygYAAIMFABDLBgAAhAwAMMwGAQAAAAHTBkAA9QoAIdQGQAD1CgAh8AYBAAAAAaUHAQCTCwAhAQAAAIAFACABAAAAgAUAIAkHAACFDAAgyQYAAIQMADDKBgAAgwUAEMsGAACEDAAwzAYBAJMLACHTBkAA9QoAIdQGQAD1CgAh8AYBAJMLACGlBwEAkwsAIQEHAAC4EgAgAwAAAIMFACABAACEBQAwAgAAgAUAIAMAAACDBQAgAQAAhAUAMAIAAIAFACADAAAAgwUAIAEAAIQFADACAACABQAgBgcAALcSACDMBgEAAAAB0wZAAAAAAdQGQAAAAAHwBgEAAAABpQcBAAAAAQFGAACIBQAgBcwGAQAAAAHTBkAAAAAB1AZAAAAAAfAGAQAAAAGlBwEAAAABAUYAAIoFADABRgAAigUAMAYHAACqEgAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh8AYBAKoNACGlBwEAqg0AIQIAAACABQAgRgAAjQUAIAXMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHwBgEAqg0AIaUHAQCqDQAhAgAAAIMFACBGAACPBQAgAgAAAIMFACBGAACPBQAgAwAAAIAFACBNAACIBQAgTgAAjQUAIAEAAACABQAgAQAAAIMFACADCAAApxIAIFMAAKkSACBUAACoEgAgCMkGAACDDAAwygYAAJYFABDLBgAAgwwAMMwGAQDlCgAh0wZAAOgKACHUBkAA6AoAIfAGAQDlCgAhpQcBAOUKACEDAAAAgwUAIAEAAJUFADBSAACWBQAgAwAAAIMFACABAACEBQAwAgAAgAUAIAEAAAAaACABAAAAGgAgAwAAABgAIAEAABkAMAIAABoAIAMAAAAYACABAAAZADACAAAaACADAAAAGAAgAQAAGQAwAgAAGgAgBQsAAKUSACAMAACmEgAgzAYBAAAAAfwHAQAAAAH9BwEAAAABAUYAAJ4FACADzAYBAAAAAfwHAQAAAAH9BwEAAAABAUYAAKAFADABRgAAoAUAMAULAACjEgAgDAAApBIAIMwGAQCqDQAh_AcBAKoNACH9BwEAqg0AIQIAAAAaACBGAACjBQAgA8wGAQCqDQAh_AcBAKoNACH9BwEAqg0AIQIAAAAYACBGAAClBQAgAgAAABgAIEYAAKUFACADAAAAGgAgTQAAngUAIE4AAKMFACABAAAAGgAgAQAAABgAIAMIAACgEgAgUwAAohIAIFQAAKESACAGyQYAAIIMADDKBgAArAUAEMsGAACCDAAwzAYBAOUKACH8BwEA5QoAIf0HAQDlCgAhAwAAABgAIAEAAKsFADBSAACsBQAgAwAAABgAIAEAABkAMAIAABoAIBAJAACBDNYHIskGAAD_CwAwygYAALIFABDLBgAA_wsAMMwGAQAAAAHTBkAA9QoAIdQGQAD1CgAhigcBAJMLACHQBwEAkwsAIdIHAQDzCgAh0wcBAPMKACHUBwIAgAwAIfgHAQDzCgAh-QcBAPMKACH6BwIAgAwAIfsHAgCADAAhAQAAAK8FACABAAAArwUAIBAJAACBDNYHIskGAAD_CwAwygYAALIFABDLBgAA_wsAMMwGAQCTCwAh0wZAAPUKACHUBkAA9QoAIYoHAQCTCwAh0AcBAJMLACHSBwEA8woAIdMHAQDzCgAh1AcCAIAMACH4BwEA8woAIfkHAQDzCgAh-gcCAIAMACH7BwIAgAwAIQfSBwAApg0AINMHAACmDQAg1AcAAKYNACD4BwAApg0AIPkHAACmDQAg-gcAAKYNACD7BwAApg0AIAMAAACyBQAgAQAAswUAMAIAAK8FACADAAAAsgUAIAEAALMFADACAACvBQAgAwAAALIFACABAACzBQAwAgAArwUAIA0JAAAA1gcCzAYBAAAAAdMGQAAAAAHUBkAAAAABigcBAAAAAdAHAQAAAAHSBwEAAAAB0wcBAAAAAdQHAgAAAAH4BwEAAAAB-QcBAAAAAfoHAgAAAAH7BwIAAAABAUYAALcFACANCQAAANYHAswGAQAAAAHTBkAAAAAB1AZAAAAAAYoHAQAAAAHQBwEAAAAB0gcBAAAAAdMHAQAAAAHUBwIAAAAB-AcBAAAAAfkHAQAAAAH6BwIAAAAB-wcCAAAAAQFGAAC5BQAwAUYAALkFADANCQAA2w7WByLMBgEAqg0AIdMGQACsDQAh1AZAAKwNACGKBwEAqg0AIdAHAQCqDQAh0gcBAKsNACHTBwEAqw0AIdQHAgC1DQAh-AcBAKsNACH5BwEAqw0AIfoHAgC1DQAh-wcCALUNACECAAAArwUAIEYAALwFACANCQAA2w7WByLMBgEAqg0AIdMGQACsDQAh1AZAAKwNACGKBwEAqg0AIdAHAQCqDQAh0gcBAKsNACHTBwEAqw0AIdQHAgC1DQAh-AcBAKsNACH5BwEAqw0AIfoHAgC1DQAh-wcCALUNACECAAAAsgUAIEYAAL4FACACAAAAsgUAIEYAAL4FACADAAAArwUAIE0AALcFACBOAAC8BQAgAQAAAK8FACABAAAAsgUAIAwIAACbEgAgUwAAnhIAIFQAAJ0SACC1AQAAnBIAILYBAACfEgAg0gcAAKYNACDTBwAApg0AINQHAACmDQAg-AcAAKYNACD5BwAApg0AIPoHAACmDQAg-wcAAKYNACAQCQAAyQvWByLJBgAA_gsAMMoGAADFBQAQywYAAP4LADDMBgEA5QoAIdMGQADoCgAh1AZAAOgKACGKBwEA5QoAIdAHAQDlCgAh0gcBAOYKACHTBwEA5goAIdQHAgD4CgAh-AcBAOYKACH5BwEA5goAIfoHAgD4CgAh-wcCAPgKACEDAAAAsgUAIAEAAMQFADBSAADFBQAgAwAAALIFACABAACzBQAwAgAArwUAIAEAAAA4ACABAAAAOAAgAwAAADYAIAEAADcAMAIAADgAIAMAAAA2ACABAAA3ADACAAA4ACADAAAANgAgAQAANwAwAgAAOAAgGhIAAPMRACAbAACaEgAgIwAA-BEAIDYAAPQRACA5AAD3EQAgOwAA9REAIDwAAPYRACDMBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAPQHAoYHAQAAAAGWBwEAAAABogcBAAAAAaUHAQAAAAGmBwEAAAABpwcBAAAAAasHAQAAAAG9BwEAAAAB1wcBAAAAAdoHAAAA9QcC5gcBAAAAAekHAQAAAAHyBwEAAAAB9gcAAAD2BwL3B0AAAAABAUYAAM0FACATzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAAD0BwKGBwEAAAABlgcBAAAAAaIHAQAAAAGlBwEAAAABpgcBAAAAAacHAQAAAAGrBwEAAAABvQcBAAAAAdcHAQAAAAHaBwAAAPUHAuYHAQAAAAHpBwEAAAAB8gcBAAAAAfYHAAAA9gcC9wdAAAAAAQFGAADPBQAwAUYAAM8FADABAAAAIwAgAQAAAEgAIAEAAAA_ACAaEgAAtxEAIBsAAJkSACAjAAC8EQAgNgAAuBEAIDkAALsRACA7AAC5EQAgPAAAuhEAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACzEfQHIoYHAQCrDQAhlgcBAKsNACGiBwEAqw0AIaUHAQCqDQAhpgcBAKoNACGnBwEAqw0AIasHAQCrDQAhvQcBAKsNACHXBwEAqw0AIdoHAAC0EfUHIuYHAQCrDQAh6QcBAKsNACHyBwEAqw0AIfYHAAC1EfYHIvcHQAC8DQAhAgAAADgAIEYAANUFACATzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAALMR9AcihgcBAKsNACGWBwEAqw0AIaIHAQCrDQAhpQcBAKoNACGmBwEAqg0AIacHAQCrDQAhqwcBAKsNACG9BwEAqw0AIdcHAQCrDQAh2gcAALQR9Qci5gcBAKsNACHpBwEAqw0AIfIHAQCrDQAh9gcAALUR9gci9wdAALwNACECAAAANgAgRgAA1wUAIAIAAAA2ACBGAADXBQAgAQAAACMAIAEAAABIACABAAAAPwAgAwAAADgAIE0AAM0FACBOAADVBQAgAQAAADgAIAEAAAA2ACAOCAAAlhIAIFMAAJgSACBUAACXEgAghgcAAKYNACCWBwAApg0AIKIHAACmDQAgpwcAAKYNACCrBwAApg0AIL0HAACmDQAg1wcAAKYNACDmBwAApg0AIOkHAACmDQAg8gcAAKYNACD3BwAApg0AIBbJBgAA9AsAMMoGAADhBQAQywYAAPQLADDMBgEA5QoAIdMGQADoCgAh1AZAAOgKACHsBgAA9Qv0ByKGBwEA5goAIZYHAQDmCgAhogcBAOYKACGlBwEA5QoAIaYHAQDlCgAhpwcBAOYKACGrBwEA5goAIb0HAQDmCgAh1wcBAOYKACHaBwAA9gv1ByLmBwEA5goAIekHAQDmCgAh8gcBAOYKACH2BwAA9wv2ByL3B0AA_woAIQMAAAA2ACABAADgBQAwUgAA4QUAIAMAAAA2ACABAAA3ADACAAA4ACABAAAA1gEAIAEAAADWAQAgAwAAANQBACABAADVAQAwAgAA1gEAIAMAAADUAQAgAQAA1QEAMAIAANYBACADAAAA1AEAIAEAANUBADACAADWAQAgBhcAAJUSACDMBgEAAAAB0wZAAAAAAdQGQAAAAAGvBwEAAAABwgcBAAAAAQFGAADpBQAgBcwGAQAAAAHTBkAAAAAB1AZAAAAAAa8HAQAAAAHCBwEAAAABAUYAAOsFADABRgAA6wUAMAYXAACUEgAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAhrwcBAKoNACHCBwEAqg0AIQIAAADWAQAgRgAA7gUAIAXMBgEAqg0AIdMGQACsDQAh1AZAAKwNACGvBwEAqg0AIcIHAQCqDQAhAgAAANQBACBGAADwBQAgAgAAANQBACBGAADwBQAgAwAAANYBACBNAADpBQAgTgAA7gUAIAEAAADWAQAgAQAAANQBACADCAAAkRIAIFMAAJMSACBUAACSEgAgCMkGAADzCwAwygYAAPcFABDLBgAA8wsAMMwGAQDlCgAh0wZAAOgKACHUBkAA6AoAIa8HAQDlCgAhwgcBAOUKACEDAAAA1AEAIAEAAPYFADBSAAD3BQAgAwAAANQBACABAADVAQAwAgAA1gEAIAEAAAAhACABAAAAIQAgAwAAAB8AIAEAACAAMAIAACEAIAMAAAAfACABAAAgADACAAAhACADAAAAHwAgAQAAIAAwAgAAIQAgCRcAAJASACAdAADlEQAgzAYBAAAAAdMGQAAAAAGbBwEAAAABngcAAADyBwK8B4AAAAABwgcBAAAAAc8HAQAAAAEBRgAA_wUAIAfMBgEAAAAB0wZAAAAAAZsHAQAAAAGeBwAAAPIHArwHgAAAAAHCBwEAAAABzwcBAAAAAQFGAACBBgAwAUYAAIEGADABAAAAFgAgCRcAAI8SACAdAADjEQAgzAYBAKoNACHTBkAArA0AIZsHAQCqDQAhngcAAOER8gcivAeAAAAAAcIHAQCqDQAhzwcBAKsNACECAAAAIQAgRgAAhQYAIAfMBgEAqg0AIdMGQACsDQAhmwcBAKoNACGeBwAA4RHyByK8B4AAAAABwgcBAKoNACHPBwEAqw0AIQIAAAAfACBGAACHBgAgAgAAAB8AIEYAAIcGACABAAAAFgAgAwAAACEAIE0AAP8FACBOAACFBgAgAQAAACEAIAEAAAAfACAFCAAAjBIAIFMAAI4SACBUAACNEgAgvAcAAKYNACDPBwAApg0AIArJBgAA7wsAMMoGAACPBgAQywYAAO8LADDMBgEA5QoAIdMGQADoCgAhmwcBAOUKACGeBwAA8AvyByK8BwAA5woAIMIHAQDlCgAhzwcBAOYKACEDAAAAHwAgAQAAjgYAMFIAAI8GACADAAAAHwAgAQAAIAAwAgAAIQAgAQAAADwAIAEAAAA8ACADAAAAOgAgAQAAOwAwAgAAPAAgAwAAADoAIAEAADsAMAIAADwAIAMAAAA6ACABAAA7ADACAAA8ACANEgAA1REAIBcAAIsSACA2AADWEQAgOwEAAAABzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAADxBwK9BwEAAAABwgcBAAAAAdcHAQAAAAHuB0AAAAAB7wcBAAAAAQFGAACXBgAgCjsBAAAAAcwGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAA8QcCvQcBAAAAAcIHAQAAAAHXBwEAAAAB7gdAAAAAAe8HAQAAAAEBRgAAmQYAMAFGAACZBgAwAQAAACMAIAEAAAA_ACANEgAA0hEAIBcAAIoSACA2AADTEQAgOwEAqw0AIcwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAADQEfEHIr0HAQCrDQAhwgcBAKoNACHXBwEAqw0AIe4HQAC8DQAh7wcBAKsNACECAAAAPAAgRgAAngYAIAo7AQCrDQAhzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAANAR8QcivQcBAKsNACHCBwEAqg0AIdcHAQCrDQAh7gdAALwNACHvBwEAqw0AIQIAAAA6ACBGAACgBgAgAgAAADoAIEYAAKAGACABAAAAIwAgAQAAAD8AIAMAAAA8ACBNAACXBgAgTgAAngYAIAEAAAA8ACABAAAAOgAgCAgAAIcSACA7AACmDQAgUwAAiRIAIFQAAIgSACC9BwAApg0AINcHAACmDQAg7gcAAKYNACDvBwAApg0AIA07AQDmCgAhyQYAAOsLADDKBgAAqQYAEMsGAADrCwAwzAYBAOUKACHTBkAA6AoAIdQGQADoCgAh7AYAAOwL8QcivQcBAOYKACHCBwEA5QoAIdcHAQDmCgAh7gdAAP8KACHvBwEA5goAIQMAAAA6ACABAACoBgAwUgAAqQYAIAMAAAA6ACABAAA7ADACAAA8ACAWBAAA5AsAIBYAAOULACAaAADmCwAgIgAA6gsAICMAAOcLACAkAADoCwAgJQAA6QsAIDsBAPMKACHJBgAA4wsAMMoGAABIABDLBgAA4wsAMMwGAQAAAAHTBkAA9QoAIdQGQAD1CgAhhgcBAPMKACGWBwEA8woAIZwHAQAAAAGlBwEAkwsAIaYHAQAAAAGnBwEA8woAIekHAQDzCgAh6gcgAJQLACEBAAAArAYAIAEAAACsBgAgDQQAAIASACAWAACBEgAgGgAAghIAICIAAIYSACAjAACDEgAgJAAAhBIAICUAAIUSACA7AACmDQAghgcAAKYNACCWBwAApg0AIJwHAACmDQAgpwcAAKYNACDpBwAApg0AIAMAAABIACABAACvBgAwAgAArAYAIAMAAABIACABAACvBgAwAgAArAYAIAMAAABIACABAACvBgAwAgAArAYAIBMEAAD5EQAgFgAA-hEAIBoAAPsRACAiAAD_EQAgIwAA_BEAICQAAP0RACAlAAD-EQAgOwEAAAABzAYBAAAAAdMGQAAAAAHUBkAAAAABhgcBAAAAAZYHAQAAAAGcBwEAAAABpQcBAAAAAaYHAQAAAAGnBwEAAAAB6QcBAAAAAeoHIAAAAAEBRgAAswYAIAw7AQAAAAHMBgEAAAAB0wZAAAAAAdQGQAAAAAGGBwEAAAABlgcBAAAAAZwHAQAAAAGlBwEAAAABpgcBAAAAAacHAQAAAAHpBwEAAAAB6gcgAAAAAQFGAAC1BgAwAUYAALUGADABAAAAFgAgEwQAAPIQACAWAADzEAAgGgAA9BAAICIAAPgQACAjAAD1EAAgJAAA9hAAICUAAPcQACA7AQCrDQAhzAYBAKoNACHTBkAArA0AIdQGQACsDQAhhgcBAKsNACGWBwEAqw0AIZwHAQCrDQAhpQcBAKoNACGmBwEAqg0AIacHAQCrDQAh6QcBAKsNACHqByAA2g0AIQIAAACsBgAgRgAAuQYAIAw7AQCrDQAhzAYBAKoNACHTBkAArA0AIdQGQACsDQAhhgcBAKsNACGWBwEAqw0AIZwHAQCrDQAhpQcBAKoNACGmBwEAqg0AIacHAQCrDQAh6QcBAKsNACHqByAA2g0AIQIAAABIACBGAAC7BgAgAgAAAEgAIEYAALsGACABAAAAFgAgAwAAAKwGACBNAACzBgAgTgAAuQYAIAEAAACsBgAgAQAAAEgAIAkIAADvEAAgOwAApg0AIFMAAPEQACBUAADwEAAghgcAAKYNACCWBwAApg0AIJwHAACmDQAgpwcAAKYNACDpBwAApg0AIA87AQDmCgAhyQYAAOILADDKBgAAwwYAEMsGAADiCwAwzAYBAOUKACHTBkAA6AoAIdQGQADoCgAhhgcBAOYKACGWBwEA5goAIZwHAQDmCgAhpQcBAOUKACGmBwEA5QoAIacHAQDmCgAh6QcBAOYKACHqByAAjwsAIQMAAABIACABAADCBgAwUgAAwwYAIAMAAABIACABAACvBgAwAgAArAYAIAEAAABOACABAAAATgAgAwAAAEwAIAEAAE0AMAIAAE4AIAMAAABMACABAABNADACAABOACADAAAATAAgAQAATQAwAgAATgAgIxIAAN0QACAbAADcEAAgIwAA5BAAICQAAOIQACAlAADjEAAgJwAA3hAAICgAAOAQACApAADfEAAgKgAA4RAAICsAAOUQACAsAADmEAAgLQAA5xAAIC4AAOgQACAvAADpEAAgMAAA6hAAIDEAAOsQACAyAADsEAAgMwAA7RAAIDQAAO4QACDMBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAOYHAvAGAQAAAAGbBwEAAAABpQcBAAAAAasHAQAAAAGuBwEAAAABvQcBAAAAAdwHQAAAAAHeB0AAAAAB5AcAAADkBwLmBxAAAAAB5wdAAAAAAegHAgAAAAEBRgAAywYAIBDMBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAOYHAvAGAQAAAAGbBwEAAAABpQcBAAAAAasHAQAAAAGuBwEAAAABvQcBAAAAAdwHQAAAAAHeB0AAAAAB5AcAAADkBwLmBxAAAAAB5wdAAAAAAegHAgAAAAEBRgAAzQYAMAFGAADNBgAwAQAAAEgAIAEAAAAjACAjEgAAjw8AIBsAAI4PACAjAACWDwAgJAAAlA8AICUAAJUPACAnAACQDwAgKAAAkg8AICkAAJEPACAqAACTDwAgKwAAlw8AICwAAJgPACAtAACZDwAgLgAAmg8AIC8AAJsPACAwAACcDwAgMQAAnQ8AIDIAAJ4PACAzAACfDwAgNAAAoA8AIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACND-YHIvAGAQCqDQAhmwcBAKsNACGlBwEAqg0AIasHAQCrDQAhrgcBAKoNACG9BwEAqw0AIdwHQAC8DQAh3gdAALwNACHkBwAAjA_kByLmBxAAxQ0AIecHQAC8DQAh6AcCAJAOACECAAAATgAgRgAA0gYAIBDMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAAjQ_mByLwBgEAqg0AIZsHAQCrDQAhpQcBAKoNACGrBwEAqw0AIa4HAQCqDQAhvQcBAKsNACHcB0AAvA0AId4HQAC8DQAh5AcAAIwP5Aci5gcQAMUNACHnB0AAvA0AIegHAgCQDgAhAgAAAEwAIEYAANQGACACAAAATAAgRgAA1AYAIAEAAABIACABAAAAIwAgAwAAAE4AIE0AAMsGACBOAADSBgAgAQAAAE4AIAEAAABMACAMCAAAhw8AIFMAAIoPACBUAACJDwAgtQEAAIgPACC2AQAAiw8AIJsHAACmDQAgqwcAAKYNACC9BwAApg0AINwHAACmDQAg3gcAAKYNACDmBwAApg0AIOcHAACmDQAgE8kGAADbCwAwygYAAN0GABDLBgAA2wsAMMwGAQDlCgAh0wZAAOgKACHUBkAA6AoAIewGAADdC-YHIvAGAQDlCgAhmwcBAOYKACGlBwEA5QoAIasHAQDmCgAhrgcBAOUKACG9BwEA5goAIdwHQAD_CgAh3gdAAP8KACHkBwAA3AvkByLmBxAAhAsAIecHQAD_CgAh6AcCALYLACEDAAAATAAgAQAA3AYAMFIAAN0GACADAAAATAAgAQAATQAwAgAATgAgAQAAAHwAIAEAAAB8ACADAAAAegAgAQAAewAwAgAAfAAgAwAAAHoAIAEAAHsAMAIAAHwAIAMAAAB6ACABAAB7ADACAAB8ACAHHAAAhQ8AICYAAIYPACDMBgEAAAABzQYBAAAAAdMGQAAAAAHgBwEAAAAB4gcAAADiBwIBRgAA5QYAIAXMBgEAAAABzQYBAAAAAdMGQAAAAAHgBwEAAAAB4gcAAADiBwIBRgAA5wYAMAFGAADnBgAwBxwAAIMPACAmAACEDwAgzAYBAKoNACHNBgEAqg0AIdMGQACsDQAh4AcBAKoNACHiBwAAgg_iByICAAAAfAAgRgAA6gYAIAXMBgEAqg0AIc0GAQCqDQAh0wZAAKwNACHgBwEAqg0AIeIHAACCD-IHIgIAAAB6ACBGAADsBgAgAgAAAHoAIEYAAOwGACADAAAAfAAgTQAA5QYAIE4AAOoGACABAAAAfAAgAQAAAHoAIAMIAAD_DgAgUwAAgQ8AIFQAAIAPACAIyQYAANcLADDKBgAA8wYAEMsGAADXCwAwzAYBAOUKACHNBgEA5QoAIdMGQADoCgAh4AcBAOUKACHiBwAA2AviByIDAAAAegAgAQAA8gYAMFIAAPMGACADAAAAegAgAQAAewAwAgAAfAAgAQAAAIABACABAAAAgAEAIAMAAAB-ACABAAB_ADACAACAAQAgAwAAAH4AIAEAAH8AMAIAAIABACADAAAAfgAgAQAAfwAwAgAAgAEAIA0cAAD9DgAgKAAA_g4AIMwGAQAAAAHNBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAN4HAv4GAQAAAAGbBwEAAAAB2wdAAAAAAdwHQAAAAAHeB0AAAAAB3wcCAAAAAQFGAAD7BgAgC8wGAQAAAAHNBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAN4HAv4GAQAAAAGbBwEAAAAB2wdAAAAAAdwHQAAAAAHeB0AAAAAB3wcCAAAAAQFGAAD9BgAwAUYAAP0GADANHAAA7w4AICgAAPAOACDMBgEAqg0AIc0GAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAADuDt4HIv4GAQCqDQAhmwcBAKsNACHbB0AAvA0AIdwHQAC8DQAh3gdAALwNACHfBwIAkA4AIQIAAACAAQAgRgAAgAcAIAvMBgEAqg0AIc0GAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAADuDt4HIv4GAQCqDQAhmwcBAKsNACHbB0AAvA0AIdwHQAC8DQAh3gdAALwNACHfBwIAkA4AIQIAAAB-ACBGAACCBwAgAgAAAH4AIEYAAIIHACADAAAAgAEAIE0AAPsGACBOAACABwAgAQAAAIABACABAAAAfgAgCQgAAOkOACBTAADsDgAgVAAA6w4AILUBAADqDgAgtgEAAO0OACCbBwAApg0AINsHAACmDQAg3AcAAKYNACDeBwAApg0AIA7JBgAA0wsAMMoGAACJBwAQywYAANMLADDMBgEA5QoAIc0GAQDlCgAh0wZAAOgKACHUBkAA6AoAIewGAADUC94HIv4GAQDlCgAhmwcBAOYKACHbB0AA_woAIdwHQAD_CgAh3gdAAP8KACHfBwIAtgsAIQMAAAB-ACABAACIBwAwUgAAiQcAIAMAAAB-ACABAAB_ADACAACAAQAgAQAAAEYAIAEAAABGACADAAAARAAgAQAARQAwAgAARgAgAwAAAEQAIAEAAEUAMAIAAEYAIAMAAABEACABAABFADACAABGACAPHAAA5g4AIDUAAOcOACA2AADoDgAgzAYBAAAAAc0GAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAA2QcC_gYBAAAAAZsHAQAAAAHWBwEAAAAB1wcBAAAAAdoHAAAA2gcC2wdAAAAAAdwHQAAAAAEBRgAAkQcAIAzMBgEAAAABzQYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAADZBwL-BgEAAAABmwcBAAAAAdYHAQAAAAHXBwEAAAAB2gcAAADaBwLbB0AAAAAB3AdAAAAAAQFGAACTBwAwAUYAAJMHADABAAAAfgAgAQAAAD8AIA8cAADjDgAgNQAA5A4AIDYAAOUOACDMBgEAqg0AIc0GAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAADhDtkHIv4GAQCqDQAhmwcBAKsNACHWBwEAqw0AIdcHAQCrDQAh2gcAAOIO2gci2wdAALwNACHcB0AAvA0AIQIAAABGACBGAACYBwAgDMwGAQCqDQAhzQYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAAOEO2Qci_gYBAKoNACGbBwEAqw0AIdYHAQCrDQAh1wcBAKsNACHaBwAA4g7aByLbB0AAvA0AIdwHQAC8DQAhAgAAAEQAIEYAAJoHACACAAAARAAgRgAAmgcAIAEAAAB-ACABAAAAPwAgAwAAAEYAIE0AAJEHACBOAACYBwAgAQAAAEYAIAEAAABEACAICAAA3g4AIFMAAOAOACBUAADfDgAgmwcAAKYNACDWBwAApg0AINcHAACmDQAg2wcAAKYNACDcBwAApg0AIA_JBgAAzAsAMMoGAACjBwAQywYAAMwLADDMBgEA5QoAIc0GAQDlCgAh0wZAAOgKACHUBkAA6AoAIewGAADNC9kHIv4GAQDlCgAhmwcBAOYKACHWBwEA5goAIdcHAQDmCgAh2gcAAM4L2gci2wdAAP8KACHcB0AA_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_gYBAKoNACGrBwEAqw0AIa4HAQCqDQAhwQcQAJsOACHCBwEAqw0AIcMHAQCqDQAhxAcBAKsNACHFBwEAqw0AIcYHEACbDgAhxwcQAJsOACHIBxAAmw4AIcoHQAC8DQAhywdAALwNACHMB0AAvA0AIc0HQAC8DQAhzgdAALwNACHPBwEAqg0AIQIAAABQACBGAADLBwAgAgAAAFAAIEYAAMsHACABAAAANgAgAQAAAEgAIAEAAABMACADAAAAUgAgTQAAwQcAIE4AAMkHACABAAAAUgAgAQAAAFAAIBAIAACsDgAgOwAApg0AIFMAAK8OACBUAACuDgAgtQEAAK0OACC2AQAAsA4AIM0GAACmDQAgqwcAAKYNACDCBwAApg0AIMQHAACmDQAgxQcAAKYNACDKBwAApg0AIMsHAACmDQAgzAcAAKYNACDNBwAApg0AIM4HAACmDQAgGjsBAOYKACHJBgAAxAsAMMoGAADVBwAQywYAAMQLADDMBgEA5QoAIc0GAQDmCgAh0wZAAOgKACHUBkAA6AoAIewGAADFC8oHIv4GAQDlCgAhqwcBAOYKACGuBwEA5QoAIcEHEAC7CwAhwgcBAOYKACHDBwEA5QoAIcQHAQDmCgAhxQcBAOYKACHGBxAAuwsAIccHEAC7CwAhyAcQALsLACHKB0AA_woAIcsHQAD_CgAhzAdAAP8KACHNB0AA_woAIc4HQAD_CgAhzwcBAOUKACEDAAAAUAAgAQAA1AcAMFIAANUHACADAAAAUAAgAQAAUQAwAgAAUgAgAQAAAFkAIAEAAABZACADAAAAVwAgAQAAWAAwAgAAWQAgAwAAAFcAIAEAAFgAMAIAAFkAIAMAAABXACABAABYADACAABZACANEgAAqg4AIB4AAKkOACAgAACrDgAgzAYBAAAAAdMGQAAAAAH-BgEAAAABmwcBAAAAAbUHAQAAAAG9BwEAAAABvgcBAAAAAb8HAgAAAAHABxAAAAABwQcQAAAAAQFGAADdBwAgCswGAQAAAAHTBkAAAAAB_gYBAAAAAZsHAQAAAAG1BwEAAAABvQcBAAAAAb4HAQAAAAG_BwIAAAABwAcQAAAAAcEHEAAAAAEBRgAA3wcAMAFGAADfBwAwAQAAACMAIAEAAABcACANEgAApw4AIB4AAKYOACAgAACoDgAgzAYBAKoNACHTBkAArA0AIf4GAQCqDQAhmwcBAKsNACG1BwEAqg0AIb0HAQCrDQAhvgcBAKsNACG_BwIAkA4AIcAHEACbDgAhwQcQAJsOACECAAAAWQAgRgAA5AcAIArMBgEAqg0AIdMGQACsDQAh_gYBAKoNACGbBwEAqw0AIbUHAQCqDQAhvQcBAKsNACG-BwEAqw0AIb8HAgCQDgAhwAcQAJsOACHBBxAAmw4AIQIAAABXACBGAADmBwAgAgAAAFcAIEYAAOYHACABAAAAIwAgAQAAAFwAIAMAAABZACBNAADdBwAgTgAA5AcAIAEAAABZACABAAAAVwAgCAgAAKEOACBTAACkDgAgVAAAow4AILUBAACiDgAgtgEAAKUOACCbBwAApg0AIL0HAACmDQAgvgcAAKYNACANyQYAAMMLADDKBgAA7wcAEMsGAADDCwAwzAYBAOUKACHTBkAA6AoAIf4GAQDlCgAhmwcBAOYKACG1BwEA5QoAIb0HAQDmCgAhvgcBAOYKACG_BwIAtgsAIcAHEAC7CwAhwQcQALsLACEDAAAAVwAgAQAA7gcAMFIAAO8HACADAAAAVwAgAQAAWAAwAgAAWQAgAQAAAGIAIAEAAABiACADAAAAYAAgAQAAYQAwAgAAYgAgAwAAAGAAIAEAAGEAMAIAAGIAIAMAAABgACABAABhADACAABiACAPGwAAoA4AIB4AAJ8OACDMBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAALoHAqsHAQAAAAGtBxAAAAABrgcBAAAAAbUHAQAAAAG3BwAAALcHArgHAQAAAAG6BwEAAAABuwdAAAAAAbwHgAAAAAEBRgAA9wcAIA3MBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAALoHAqsHAQAAAAGtBxAAAAABrgcBAAAAAbUHAQAAAAG3BwAAALcHArgHAQAAAAG6BwEAAAABuwdAAAAAAbwHgAAAAAEBRgAA-QcAMAFGAAD5BwAwAQAAAFAAIAEAAABIACAPGwAAng4AIB4AAJ0OACDMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAAnA66ByKrBwEAqw0AIa0HEACbDgAhrgcBAKoNACG1BwEAqw0AIbcHAACaDrcHIrgHAQCrDQAhugcBAKsNACG7B0AAvA0AIbwHgAAAAAECAAAAYgAgRgAA_gcAIA3MBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAAnA66ByKrBwEAqw0AIa0HEACbDgAhrgcBAKoNACG1BwEAqw0AIbcHAACaDrcHIrgHAQCrDQAhugcBAKsNACG7B0AAvA0AIbwHgAAAAAECAAAAYAAgRgAAgAgAIAIAAABgACBGAACACAAgAQAAAFAAIAEAAABIACADAAAAYgAgTQAA9wcAIE4AAP4HACABAAAAYgAgAQAAAGAAIAsIAACVDgAgUwAAmA4AIFQAAJcOACC1AQAAlg4AILYBAACZDgAgqwcAAKYNACC1BwAApg0AILgHAACmDQAgugcAAKYNACC7BwAApg0AILwHAACmDQAgEMkGAAC5CwAwygYAAIkIABDLBgAAuQsAMMwGAQDlCgAh0wZAAOgKACHUBkAA6AoAIewGAAC8C7oHIqsHAQDmCgAhrQcQALsLACGuBwEA5QoAIbUHAQDmCgAhtwcAALoLtwciuAcBAOYKACG6BwEA5goAIbsHQAD_CgAhvAcAAOcKACADAAAAYAAgAQAAiAgAMFIAAIkIACADAAAAYAAgAQAAYQAwAgAAYgAgAQAAAGoAIAEAAABqACADAAAAaAAgAQAAaQAwAgAAagAgAwAAAGgAIAEAAGkAMAIAAGoAIAMAAABoACABAABpADACAABqACAPGwAAkw4AIBwAAJQOACDMBgEAAAABzQYBAAAAAdMGQAAAAAHUBkAAAAAB9QYCAAAAAf4GAQAAAAGrBwEAAAABrwcBAAAAAbAHAgAAAAGxBwIAAAABsgcCAAAAAbMHIAAAAAG0ByAAAAABAUYAAJEIACANzAYBAAAAAc0GAQAAAAHTBkAAAAAB1AZAAAAAAfUGAgAAAAH-BgEAAAABqwcBAAAAAa8HAQAAAAGwBwIAAAABsQcCAAAAAbIHAgAAAAGzByAAAAABtAcgAAAAAQFGAACTCAAwAUYAAJMIADABAAAATAAgDxsAAJEOACAcAACSDgAgzAYBAKoNACHNBgEAqw0AIdMGQACsDQAh1AZAAKwNACH1BgIAkA4AIf4GAQCrDQAhqwcBAKoNACGvBwEAqg0AIbAHAgC1DQAhsQcCALUNACGyBwIAtQ0AIbMHIADaDQAhtAcgANoNACECAAAAagAgRgAAlwgAIA3MBgEAqg0AIc0GAQCrDQAh0wZAAKwNACHUBkAArA0AIfUGAgCQDgAh_gYBAKsNACGrBwEAqg0AIa8HAQCqDQAhsAcCALUNACGxBwIAtQ0AIbIHAgC1DQAhswcgANoNACG0ByAA2g0AIQIAAABoACBGAACZCAAgAgAAAGgAIEYAAJkIACABAAAATAAgAwAAAGoAIE0AAJEIACBOAACXCAAgAQAAAGoAIAEAAABoACAKCAAAiw4AIFMAAI4OACBUAACNDgAgtQEAAIwOACC2AQAAjw4AIM0GAACmDQAg_gYAAKYNACCwBwAApg0AILEHAACmDQAgsgcAAKYNACAQyQYAALULADDKBgAAoQgAEMsGAAC1CwAwzAYBAOUKACHNBgEA5goAIdMGQADoCgAh1AZAAOgKACH1BgIAtgsAIf4GAQDmCgAhqwcBAOUKACGvBwEA5QoAIbAHAgD4CgAhsQcCAPgKACGyBwIA-AoAIbMHIACPCwAhtAcgAI8LACEDAAAAaAAgAQAAoAgAMFIAAKEIACADAAAAaAAgAQAAaQAwAgAAagAgAQAAAG8AIAEAAABvACADAAAAbQAgAQAAbgAwAgAAbwAgAwAAAG0AIAEAAG4AMAIAAG8AIAMAAABtACABAABuADACAABvACANGwAAiQ4AIBwAAIoOACDMBgEAAAABzQYBAAAAAdMGQAAAAAHUBkAAAAAB7QZAAAAAAf4GAQAAAAGbBwEAAAABngcAAACtBwKrBwEAAAABrQcQAAAAAa4HAQAAAAEBRgAAqQgAIAvMBgEAAAABzQYBAAAAAdMGQAAAAAHUBkAAAAAB7QZAAAAAAf4GAQAAAAGbBwEAAAABngcAAACtBwKrBwEAAAABrQcQAAAAAa4HAQAAAAEBRgAAqwgAMAFGAACrCAAwAQAAAEwAIA0bAACHDgAgHAAAiA4AIMwGAQCqDQAhzQYBAKsNACHTBkAArA0AIdQGQACsDQAh7QZAAKwNACH-BgEAqw0AIZsHAQCrDQAhngcAAIYOrQciqwcBAKoNACGtBxAAxQ0AIa4HAQCrDQAhAgAAAG8AIEYAAK8IACALzAYBAKoNACHNBgEAqw0AIdMGQACsDQAh1AZAAKwNACHtBkAArA0AIf4GAQCrDQAhmwcBAKsNACGeBwAAhg6tByKrBwEAqg0AIa0HEADFDQAhrgcBAKsNACECAAAAbQAgRgAAsQgAIAIAAABtACBGAACxCAAgAQAAAEwAIAMAAABvACBNAACpCAAgTgAArwgAIAEAAABvACABAAAAbQAgCggAAIEOACBTAACEDgAgVAAAgw4AILUBAACCDgAgtgEAAIUOACDNBgAApg0AIP4GAACmDQAgmwcAAKYNACCtBwAApg0AIK4HAACmDQAgDskGAACxCwAwygYAALkIABDLBgAAsQsAMMwGAQDlCgAhzQYBAOYKACHTBkAA6AoAIdQGQADoCgAh7QZAAOgKACH-BgEA5goAIZsHAQDmCgAhngcAALILrQciqwcBAOUKACGtBxAAhAsAIa4HAQDmCgAhAwAAAG0AIAEAALgIADBSAAC5CAAgAwAAAG0AIAEAAG4AMAIAAG8AIA7JBgAArwsAMMoGAAC_CAAQywYAAK8LADDMBgEAAAAB0wZAAPUKACHUBkAA9QoAIewGAACwC6oHIoYHAQDzCgAhogcBAJMLACGlBwEAkwsAIaYHAQCTCwAhpwcBAPMKACGoBwEA8woAIaoHQACVCwAhAQAAALwIACABAAAAvAgAIA7JBgAArwsAMMoGAAC_CAAQywYAAK8LADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACHsBgAAsAuqByKGBwEA8woAIaIHAQCTCwAhpQcBAJMLACGmBwEAkwsAIacHAQDzCgAhqAcBAPMKACGqB0AAlQsAIQSGBwAApg0AIKcHAACmDQAgqAcAAKYNACCqBwAApg0AIAMAAAC_CAAgAQAAwAgAMAIAALwIACADAAAAvwgAIAEAAMAIADACAAC8CAAgAwAAAL8IACABAADACAAwAgAAvAgAIAvMBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAKoHAoYHAQAAAAGiBwEAAAABpQcBAAAAAaYHAQAAAAGnBwEAAAABqAcBAAAAAaoHQAAAAAEBRgAAxAgAIAvMBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAKoHAoYHAQAAAAGiBwEAAAABpQcBAAAAAaYHAQAAAAGnBwEAAAABqAcBAAAAAaoHQAAAAAEBRgAAxggAMAFGAADGCAAwC8wGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACADqoHIoYHAQCrDQAhogcBAKoNACGlBwEAqg0AIaYHAQCqDQAhpwcBAKsNACGoBwEAqw0AIaoHQAC8DQAhAgAAALwIACBGAADJCAAgC8wGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACADqoHIoYHAQCrDQAhogcBAKoNACGlBwEAqg0AIaYHAQCqDQAhpwcBAKsNACGoBwEAqw0AIaoHQAC8DQAhAgAAAL8IACBGAADLCAAgAgAAAL8IACBGAADLCAAgAwAAALwIACBNAADECAAgTgAAyQgAIAEAAAC8CAAgAQAAAL8IACAHCAAA_Q0AIFMAAP8NACBUAAD-DQAghgcAAKYNACCnBwAApg0AIKgHAACmDQAgqgcAAKYNACAOyQYAAKsLADDKBgAA0ggAEMsGAACrCwAwzAYBAOUKACHTBkAA6AoAIdQGQADoCgAh7AYAAKwLqgcihgcBAOYKACGiBwEA5QoAIaUHAQDlCgAhpgcBAOUKACGnBwEA5goAIagHAQDmCgAhqgdAAP8KACEDAAAAvwgAIAEAANEIADBSAADSCAAgAwAAAL8IACABAADACAAwAgAAvAgAIAEAAADjAQAgAQAAAOMBACADAAAA4QEAIAEAAOIBADACAADjAQAgAwAAAOEBACABAADiAQAwAgAA4wEAIAMAAADhAQAgAQAA4gEAMAIAAOMBACALBAAA_A0AIMwGAQAAAAHTBkAAAAAB_gYBAAAAAZwHAQAAAAGeBwAAAJ4HAqAHAAAAoAcDoQcBAAAAAaIHAQAAAAGjByAAAAABpAdAAAAAAQFGAADaCAAgCswGAQAAAAHTBkAAAAAB_gYBAAAAAZwHAQAAAAGeBwAAAJ4HAqAHAAAAoAcDoQcBAAAAAaIHAQAAAAGjByAAAAABpAdAAAAAAQFGAADcCAAwAUYAANwIADALBAAA-w0AIMwGAQCqDQAh0wZAAKwNACH-BgEAqg0AIZwHAQCqDQAhngcAAPkNngcioAcAAPoNoAcjoQcBAKsNACGiBwEAqg0AIaMHIADaDQAhpAdAALwNACECAAAA4wEAIEYAAN8IACAKzAYBAKoNACHTBkAArA0AIf4GAQCqDQAhnAcBAKoNACGeBwAA-Q2eByKgBwAA-g2gByOhBwEAqw0AIaIHAQCqDQAhowcgANoNACGkB0AAvA0AIQIAAADhAQAgRgAA4QgAIAIAAADhAQAgRgAA4QgAIAMAAADjAQAgTQAA2ggAIE4AAN8IACABAAAA4wEAIAEAAADhAQAgBggAAPYNACBTAAD4DQAgVAAA9w0AIKAHAACmDQAgoQcAAKYNACCkBwAApg0AIA3JBgAApAsAMMoGAADoCAAQywYAAKQLADDMBgEA5QoAIdMGQADoCgAh_gYBAOUKACGcBwEA5QoAIZ4HAAClC54HIqAHAACmC6AHI6EHAQDmCgAhogcBAOUKACGjByAAjwsAIaQHQAD_CgAhAwAAAOEBACABAADnCAAwUgAA6AgAIAMAAADhAQAgAQAA4gEAMAIAAOMBACAIyQYAAKMLADDKBgAA7ggAEMsGAACjCwAwzAYBAAAAAdQGQAD1CgAhmQcBAAAAAZoHAQDzCgAhmwcBAPMKACEBAAAA6wgAIAEAAADrCAAgCMkGAACjCwAwygYAAO4IABDLBgAAowsAMMwGAQCTCwAh1AZAAPUKACGZBwEAkwsAIZoHAQDzCgAhmwcBAPMKACECmgcAAKYNACCbBwAApg0AIAMAAADuCAAgAQAA7wgAMAIAAOsIACADAAAA7ggAIAEAAO8IADACAADrCAAgAwAAAO4IACABAADvCAAwAgAA6wgAIAXMBgEAAAAB1AZAAAAAAZkHAQAAAAGaBwEAAAABmwcBAAAAAQFGAADzCAAgBcwGAQAAAAHUBkAAAAABmQcBAAAAAZoHAQAAAAGbBwEAAAABAUYAAPUIADABRgAA9QgAMAXMBgEAqg0AIdQGQACsDQAhmQcBAKoNACGaBwEAqw0AIZsHAQCrDQAhAgAAAOsIACBGAAD4CAAgBcwGAQCqDQAh1AZAAKwNACGZBwEAqg0AIZoHAQCrDQAhmwcBAKsNACECAAAA7ggAIEYAAPoIACACAAAA7ggAIEYAAPoIACADAAAA6wgAIE0AAPMIACBOAAD4CAAgAQAAAOsIACABAAAA7ggAIAUIAADzDQAgUwAA9Q0AIFQAAPQNACCaBwAApg0AIJsHAACmDQAgCMkGAACiCwAwygYAAIEJABDLBgAAogsAMMwGAQDlCgAh1AZAAOgKACGZBwEA5QoAIZoHAQDmCgAhmwcBAOYKACEDAAAA7ggAIAEAAIAJADBSAACBCQAgAwAAAO4IACABAADvCAAwAgAA6wgAIAEAAACOAQAgAQAAAI4BACADAAAAjAEAIAEAAI0BADACAACOAQAgAwAAAIwBACABAACNAQAwAgAAjgEAIAMAAACMAQAgAQAAjQEAMAIAAI4BACAMHAAA8g0AIMwGAQAAAAHNBgEAAAAB0wZAAAAAAfcGQAAAAAH5BgAAAPkGAo4HAQAAAAGTBwEAAAABlQcAAACVBwKWBwEAAAABlwcCAAAAAZgHAgAAAAEBRgAAiQkAIAvMBgEAAAABzQYBAAAAAdMGQAAAAAH3BkAAAAAB-QYAAAD5BgKOBwEAAAABkwcBAAAAAZUHAAAAlQcClgcBAAAAAZcHAgAAAAGYBwIAAAABAUYAAIsJADABRgAAiwkAMAwcAADxDQAgzAYBAKoNACHNBgEAqg0AIdMGQACsDQAh9wZAAKwNACH5BgAAzQ35BiKOBwEAqw0AIZMHAQCqDQAhlQcAAPANlQcilgcBAKsNACGXBwIAtQ0AIZgHAgC1DQAhAgAAAI4BACBGAACOCQAgC8wGAQCqDQAhzQYBAKoNACHTBkAArA0AIfcGQACsDQAh-QYAAM0N-QYijgcBAKsNACGTBwEAqg0AIZUHAADwDZUHIpYHAQCrDQAhlwcCALUNACGYBwIAtQ0AIQIAAACMAQAgRgAAkAkAIAIAAACMAQAgRgAAkAkAIAMAAACOAQAgTQAAiQkAIE4AAI4JACABAAAAjgEAIAEAAACMAQAgCQgAAOsNACBTAADuDQAgVAAA7Q0AILUBAADsDQAgtgEAAO8NACCOBwAApg0AIJYHAACmDQAglwcAAKYNACCYBwAApg0AIA7JBgAAngsAMMoGAACXCQAQywYAAJ4LADDMBgEA5QoAIc0GAQDlCgAh0wZAAOgKACH3BkAA6AoAIfkGAACKC_kGIo4HAQDmCgAhkwcBAOUKACGVBwAAnwuVByKWBwEA5goAIZcHAgD4CgAhmAcCAPgKACEDAAAAjAEAIAEAAJYJADBSAACXCQAgAwAAAIwBACABAACNAQAwAgAAjgEAIAEAAACSAQAgAQAAAJIBACADAAAAkAEAIAEAAJEBADACAACSAQAgAwAAAJABACABAACRAQAwAgAAkgEAIAMAAACQAQAgAQAAkQEAMAIAAJIBACAMHAAA6g0AIDsBAAAAAcwGAQAAAAHNBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAJIHAo0HAQAAAAGOBwEAAAABjwcBAAAAAZAHAgAAAAGSB0AAAAABAUYAAJ8JACALOwEAAAABzAYBAAAAAc0GAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAAkgcCjQcBAAAAAY4HAQAAAAGPBwEAAAABkAcCAAAAAZIHQAAAAAEBRgAAoQkAMAFGAAChCQAwDBwAAOkNACA7AQCrDQAhzAYBAKoNACHNBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAA6A2SByKNBwEAqg0AIY4HAQCqDQAhjwcBAKsNACGQBwIAtQ0AIZIHQAC8DQAhAgAAAJIBACBGAACkCQAgCzsBAKsNACHMBgEAqg0AIc0GAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAADoDZIHIo0HAQCqDQAhjgcBAKoNACGPBwEAqw0AIZAHAgC1DQAhkgdAALwNACECAAAAkAEAIEYAAKYJACACAAAAkAEAIEYAAKYJACADAAAAkgEAIE0AAJ8JACBOAACkCQAgAQAAAJIBACABAAAAkAEAIAkIAADjDQAgOwAApg0AIFMAAOYNACBUAADlDQAgtQEAAOQNACC2AQAA5w0AII8HAACmDQAgkAcAAKYNACCSBwAApg0AIA47AQDmCgAhyQYAAJoLADDKBgAArQkAEMsGAACaCwAwzAYBAOUKACHNBgEA5QoAIdMGQADoCgAh1AZAAOgKACHsBgAAmwuSByKNBwEA5QoAIY4HAQDlCgAhjwcBAOYKACGQBwIA-AoAIZIHQAD_CgAhAwAAAJABACABAACsCQAwUgAArQkAIAMAAACQAQAgAQAAkQEAMAIAAJIBACABAAAAlgEAIAEAAACWAQAgAwAAAJQBACABAACVAQAwAgAAlgEAIAMAAACUAQAgAQAAlQEAMAIAAJYBACADAAAAlAEAIAEAAJUBADACAACWAQAgChwAAOINACA7AQAAAAHMBgEAAAABzQYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAACMBwKJBwEAAAABigcBAAAAAYwHQAAAAAEBRgAAtQkAIAk7AQAAAAHMBgEAAAABzQYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAACMBwKJBwEAAAABigcBAAAAAYwHQAAAAAEBRgAAtwkAMAFGAAC3CQAwChwAAOENACA7AQCrDQAhzAYBAKoNACHNBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAA4A2MByKJBwEAqg0AIYoHAQCrDQAhjAdAALwNACECAAAAlgEAIEYAALoJACAJOwEAqw0AIcwGAQCqDQAhzQYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAAOANjAciiQcBAKoNACGKBwEAqw0AIYwHQAC8DQAhAgAAAJQBACBGAAC8CQAgAgAAAJQBACBGAAC8CQAgAwAAAJYBACBNAAC1CQAgTgAAugkAIAEAAACWAQAgAQAAAJQBACAGCAAA3Q0AIDsAAKYNACBTAADfDQAgVAAA3g0AIIoHAACmDQAgjAcAAKYNACAMOwEA5goAIckGAACWCwAwygYAAMMJABDLBgAAlgsAMMwGAQDlCgAhzQYBAOUKACHTBkAA6AoAIdQGQADoCgAh7AYAAJcLjAciiQcBAOUKACGKBwEA5goAIYwHQAD_CgAhAwAAAJQBACABAADCCQAwUgAAwwkAIAMAAACUAQAgAQAAlQEAMAIAAJYBACAQCQEA8woAIRwAAPYKACA7AQDzCgAhyQYAAJILADDKBgAAmAEAEMsGAACSCwAwzAYBAAAAAc0GAQAAAAHTBkAA9QoAIdQGQAD1CgAhgwcBAJMLACGEBwEA8woAIYUHAQDzCgAhhgcBAPMKACGHByAAlAsAIYgHQACVCwAhAQAAAMYJACABAAAAxgkAIAcJAACmDQAgHAAArw0AIDsAAKYNACCEBwAApg0AIIUHAACmDQAghgcAAKYNACCIBwAApg0AIAMAAACYAQAgAQAAyQkAMAIAAMYJACADAAAAmAEAIAEAAMkJADACAADGCQAgAwAAAJgBACABAADJCQAwAgAAxgkAIA0JAQAAAAEcAADcDQAgOwEAAAABzAYBAAAAAc0GAQAAAAHTBkAAAAAB1AZAAAAAAYMHAQAAAAGEBwEAAAABhQcBAAAAAYYHAQAAAAGHByAAAAABiAdAAAAAAQFGAADNCQAgDAkBAAAAATsBAAAAAcwGAQAAAAHNBgEAAAAB0wZAAAAAAdQGQAAAAAGDBwEAAAABhAcBAAAAAYUHAQAAAAGGBwEAAAABhwcgAAAAAYgHQAAAAAEBRgAAzwkAMAFGAADPCQAwDQkBAKsNACEcAADbDQAgOwEAqw0AIcwGAQCqDQAhzQYBAKoNACHTBkAArA0AIdQGQACsDQAhgwcBAKoNACGEBwEAqw0AIYUHAQCrDQAhhgcBAKsNACGHByAA2g0AIYgHQAC8DQAhAgAAAMYJACBGAADSCQAgDAkBAKsNACE7AQCrDQAhzAYBAKoNACHNBgEAqg0AIdMGQACsDQAh1AZAAKwNACGDBwEAqg0AIYQHAQCrDQAhhQcBAKsNACGGBwEAqw0AIYcHIADaDQAhiAdAALwNACECAAAAmAEAIEYAANQJACACAAAAmAEAIEYAANQJACADAAAAxgkAIE0AAM0JACBOAADSCQAgAQAAAMYJACABAAAAmAEAIAkIAADXDQAgCQAApg0AIDsAAKYNACBTAADZDQAgVAAA2A0AIIQHAACmDQAghQcAAKYNACCGBwAApg0AIIgHAACmDQAgDwkBAOYKACE7AQDmCgAhyQYAAI4LADDKBgAA2wkAEMsGAACOCwAwzAYBAOUKACHNBgEA5QoAIdMGQADoCgAh1AZAAOgKACGDBwEA5QoAIYQHAQDmCgAhhQcBAOYKACGGBwEA5goAIYcHIACPCwAhiAdAAP8KACEDAAAAmAEAIAEAANoJADBSAADbCQAgAwAAAJgBACABAADJCQAwAgAAxgkAIAEAAACcAQAgAQAAAJwBACADAAAAmgEAIAEAAJsBADACAACcAQAgAwAAAJoBACABAACbAQAwAgAAnAEAIAMAAACaAQAgAQAAmwEAMAIAAJwBACAKHAAA1g0AIMwGAQAAAAHNBgEAAAAB0wZAAAAAAf0GAQAAAAH-BgEAAAAB_wZAAAAAAYAHAgAAAAGBB4AAAAABggcBAAAAAQFGAADjCQAgCcwGAQAAAAHNBgEAAAAB0wZAAAAAAf0GAQAAAAH-BgEAAAAB_wZAAAAAAYAHAgAAAAGBB4AAAAABggcBAAAAAQFGAADlCQAwAUYAAOUJADAKHAAA1Q0AIMwGAQCqDQAhzQYBAKoNACHTBkAArA0AIf0GAQCrDQAh_gYBAKsNACH_BkAArA0AIYAHAgC1DQAhgQeAAAAAAYIHAQCrDQAhAgAAAJwBACBGAADoCQAgCcwGAQCqDQAhzQYBAKoNACHTBkAArA0AIf0GAQCrDQAh_gYBAKsNACH_BkAArA0AIYAHAgC1DQAhgQeAAAAAAYIHAQCrDQAhAgAAAJoBACBGAADqCQAgAgAAAJoBACBGAADqCQAgAwAAAJwBACBNAADjCQAgTgAA6AkAIAEAAACcAQAgAQAAAJoBACAKCAAA0A0AIFMAANMNACBUAADSDQAgtQEAANENACC2AQAA1A0AIP0GAACmDQAg_gYAAKYNACCABwAApg0AIIEHAACmDQAgggcAAKYNACAMyQYAAI0LADDKBgAA8QkAEMsGAACNCwAwzAYBAOUKACHNBgEA5QoAIdMGQADoCgAh_QYBAOYKACH-BgEA5goAIf8GQADoCgAhgAcCAPgKACGBBwAA5woAIIIHAQDmCgAhAwAAAJoBACABAADwCQAwUgAA8QkAIAMAAACaAQAgAQAAmwEAMAIAAJwBACABAAAAoAEAIAEAAACgAQAgAwAAAJ4BACABAACfAQAwAgAAoAEAIAMAAACeAQAgAQAAnwEAMAIAAKABACADAAAAngEAIAEAAJ8BADACAACgAQAgCxwAAM8NACDMBgEAAAABzQYBAAAAAdMGQAAAAAHxBgEAAAAB9wZAAAAAAfkGAAAA-QYC-gYCAAAAAfsGAgAAAAH8BoAAAAAB_QYBAAAAAQFGAAD5CQAgCswGAQAAAAHNBgEAAAAB0wZAAAAAAfEGAQAAAAH3BkAAAAAB-QYAAAD5BgL6BgIAAAAB-wYCAAAAAfwGgAAAAAH9BgEAAAABAUYAAPsJADABRgAA-wkAMAscAADODQAgzAYBAKoNACHNBgEAqg0AIdMGQACsDQAh8QYBAKoNACH3BkAArA0AIfkGAADNDfkGIvoGAgC1DQAh-wYCALUNACH8BoAAAAAB_QYBAKsNACECAAAAoAEAIEYAAP4JACAKzAYBAKoNACHNBgEAqg0AIdMGQACsDQAh8QYBAKoNACH3BkAArA0AIfkGAADNDfkGIvoGAgC1DQAh-wYCALUNACH8BoAAAAAB_QYBAKsNACECAAAAngEAIEYAAIAKACACAAAAngEAIEYAAIAKACADAAAAoAEAIE0AAPkJACBOAAD-CQAgAQAAAKABACABAAAAngEAIAkIAADIDQAgUwAAyw0AIFQAAMoNACC1AQAAyQ0AILYBAADMDQAg-gYAAKYNACD7BgAApg0AIPwGAACmDQAg_QYAAKYNACANyQYAAIkLADDKBgAAhwoAEMsGAACJCwAwzAYBAOUKACHNBgEA5QoAIdMGQADoCgAh8QYBAOUKACH3BkAA6AoAIfkGAACKC_kGIvoGAgD4CgAh-wYCAPgKACH8BgAA5woAIP0GAQDmCgAhAwAAAJ4BACABAACGCgAwUgAAhwoAIAMAAACeAQAgAQAAnwEAMAIAAKABACABAAAApAEAIAEAAACkAQAgAwAAAKIBACABAACjAQAwAgAApAEAIAMAAACiAQAgAQAAowEAMAIAAKQBACADAAAAogEAIAEAAKMBADACAACkAQAgCBwAAMcNACDMBgEAAAABzQYBAAAAAdMGQAAAAAH0BgAAAPQGAvUGEAAAAAH2BgIAAAAB9wZAAAAAAQFGAACPCgAgB8wGAQAAAAHNBgEAAAAB0wZAAAAAAfQGAAAA9AYC9QYQAAAAAfYGAgAAAAH3BkAAAAABAUYAAJEKADABRgAAkQoAMAgcAADGDQAgzAYBAKoNACHNBgEAqg0AIdMGQACsDQAh9AYAAMQN9AYi9QYQAMUNACH2BgIAtQ0AIfcGQACsDQAhAgAAAKQBACBGAACUCgAgB8wGAQCqDQAhzQYBAKoNACHTBkAArA0AIfQGAADEDfQGIvUGEADFDQAh9gYCALUNACH3BkAArA0AIQIAAACiAQAgRgAAlgoAIAIAAACiAQAgRgAAlgoAIAMAAACkAQAgTQAAjwoAIE4AAJQKACABAAAApAEAIAEAAACiAQAgBwgAAL8NACBTAADCDQAgVAAAwQ0AILUBAADADQAgtgEAAMMNACD1BgAApg0AIPYGAACmDQAgCskGAACCCwAwygYAAJ0KABDLBgAAggsAMMwGAQDlCgAhzQYBAOUKACHTBkAA6AoAIfQGAACDC_QGIvUGEACECwAh9gYCAPgKACH3BkAA6AoAIQMAAACiAQAgAQAAnAoAMFIAAJ0KACADAAAAogEAIAEAAKMBADACAACkAQAgAQAAAKgBACABAAAAqAEAIAMAAACmAQAgAQAApwEAMAIAAKgBACADAAAApgEAIAEAAKcBADACAACoAQAgAwAAAKYBACABAACnAQAwAgAAqAEAIAocAAC-DQAgzAYBAAAAAc0GAQAAAAHTBkAAAAAB1AZAAAAAAe4GAQAAAAHvBgEAAAAB8AYBAAAAAfEGAQAAAAHyBkAAAAABAUYAAKUKACAJzAYBAAAAAc0GAQAAAAHTBkAAAAAB1AZAAAAAAe4GAQAAAAHvBgEAAAAB8AYBAAAAAfEGAQAAAAHyBkAAAAABAUYAAKcKADABRgAApwoAMAocAAC9DQAgzAYBAKoNACHNBgEAqg0AIdMGQACsDQAh1AZAAKwNACHuBgEAqg0AIe8GAQCrDQAh8AYBAKoNACHxBgEAqw0AIfIGQAC8DQAhAgAAAKgBACBGAACqCgAgCcwGAQCqDQAhzQYBAKoNACHTBkAArA0AIdQGQACsDQAh7gYBAKoNACHvBgEAqw0AIfAGAQCqDQAh8QYBAKsNACHyBkAAvA0AIQIAAACmAQAgRgAArAoAIAIAAACmAQAgRgAArAoAIAMAAACoAQAgTQAApQoAIE4AAKoKACABAAAAqAEAIAEAAACmAQAgBggAALkNACBTAAC7DQAgVAAAug0AIO8GAACmDQAg8QYAAKYNACDyBgAApg0AIAzJBgAA_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_AwAICoAAP0MACArAAD-DAAgLAAA_wwAIC0AAIANACAuAACBDQAgLwAAgg0AIDAAAIMNACAxAACEDQAgMgAAhQ0AIDMAAIYNACA0AACHDQAgyQYAAPkMADDKBgAATAAQywYAAPkMADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACHsBgAA-wzmByLwBgEAkwsAIZsHAQDzCgAhpQcBAJMLACGrBwEA8woAIa4HAQCTCwAhvQcBAPMKACHcB0AAlQsAId4HQACVCwAh5AcAAPoM5Aci5gcQAKMMACHnB0AAlQsAIegHAgCPDAAhyggAAEwAIMsIAABMACANyQYAAPcKADDKBgAAyQoAEMsGAAD3CgAwzAYBAOUKACHNBgEA5QoAIdMGQADoCgAh5gYBAOYKACHnBgEA5QoAIegGAQDmCgAh6QYCAPgKACHqBgEA5goAIewGAAD5CuwGIu0GQADoCgAhDQgAAOwKACBTAADsCgAgVAAA7AoAILUBAAD9CgAgtgEAAOwKACDVBgIAAAAB1gYCAAAABdcGAgAAAAXYBgIAAAAB2QYCAAAAAdoGAgAAAAHbBgIAAAAB3AYCAPwKACEHCAAA6goAIFMAAPsKACBUAAD7CgAg1QYAAADsBgLWBgAAAOwGCNcGAAAA7AYI3AYAAPoK7AYiBwgAAOoKACBTAAD7CgAgVAAA-woAINUGAAAA7AYC1gYAAADsBgjXBgAAAOwGCNwGAAD6CuwGIgTVBgAAAOwGAtYGAAAA7AYI1wYAAADsBgjcBgAA-wrsBiINCAAA7AoAIFMAAOwKACBUAADsCgAgtQEAAP0KACC2AQAA7AoAINUGAgAAAAHWBgIAAAAF1wYCAAAABdgGAgAAAAHZBgIAAAAB2gYCAAAAAdsGAgAAAAHcBgIA_AoAIQjVBggAAAAB1gYIAAAABdcGCAAAAAXYBggAAAAB2QYIAAAAAdoGCAAAAAHbBggAAAAB3AYIAP0KACEMyQYAAP4KADDKBgAAswoAEMsGAAD-CgAwzAYBAOUKACHNBgEA5QoAIdMGQADoCgAh1AZAAOgKACHuBgEA5QoAIe8GAQDmCgAh8AYBAOUKACHxBgEA5goAIfIGQAD_CgAhCwgAAOwKACBTAACBCwAgVAAAgQsAINUGQAAAAAHWBkAAAAAF1wZAAAAABdgGQAAAAAHZBkAAAAAB2gZAAAAAAdsGQAAAAAHcBkAAgAsAIQsIAADsCgAgUwAAgQsAIFQAAIELACDVBkAAAAAB1gZAAAAABdcGQAAAAAXYBkAAAAAB2QZAAAAAAdoGQAAAAAHbBkAAAAAB3AZAAIALACEI1QZAAAAAAdYGQAAAAAXXBkAAAAAF2AZAAAAAAdkGQAAAAAHaBkAAAAAB2wZAAAAAAdwGQACBCwAhCskGAACCCwAwygYAAJ0KABDLBgAAggsAMMwGAQDlCgAhzQYBAOUKACHTBkAA6AoAIfQGAACDC_QGIvUGEACECwAh9gYCAPgKACH3BkAA6AoAIQcIAADqCgAgUwAAiAsAIFQAAIgLACDVBgAAAPQGAtYGAAAA9AYI1wYAAAD0BgjcBgAAhwv0BiINCAAA7AoAIFMAAIYLACBUAACGCwAgtQEAAIYLACC2AQAAhgsAINUGEAAAAAHWBhAAAAAF1wYQAAAABdgGEAAAAAHZBhAAAAAB2gYQAAAAAdsGEAAAAAHcBhAAhQsAIQ0IAADsCgAgUwAAhgsAIFQAAIYLACC1AQAAhgsAILYBAACGCwAg1QYQAAAAAdYGEAAAAAXXBhAAAAAF2AYQAAAAAdkGEAAAAAHaBhAAAAAB2wYQAAAAAdwGEACFCwAhCNUGEAAAAAHWBhAAAAAF1wYQAAAABdgGEAAAAAHZBhAAAAAB2gYQAAAAAdsGEAAAAAHcBhAAhgsAIQcIAADqCgAgUwAAiAsAIFQAAIgLACDVBgAAAPQGAtYGAAAA9AYI1wYAAAD0BgjcBgAAhwv0BiIE1QYAAAD0BgLWBgAAAPQGCNcGAAAA9AYI3AYAAIgL9AYiDckGAACJCwAwygYAAIcKABDLBgAAiQsAMMwGAQDlCgAhzQYBAOUKACHTBkAA6AoAIfEGAQDlCgAh9wZAAOgKACH5BgAAigv5BiL6BgIA-AoAIfsGAgD4CgAh_AYAAOcKACD9BgEA5goAIQcIAADqCgAgUwAAjAsAIFQAAIwLACDVBgAAAPkGAtYGAAAA-QYI1wYAAAD5BgjcBgAAiwv5BiIHCAAA6goAIFMAAIwLACBUAACMCwAg1QYAAAD5BgLWBgAAAPkGCNcGAAAA-QYI3AYAAIsL-QYiBNUGAAAA-QYC1gYAAAD5BgjXBgAAAPkGCNwGAACMC_kGIgzJBgAAjQsAMMoGAADxCQAQywYAAI0LADDMBgEA5QoAIc0GAQDlCgAh0wZAAOgKACH9BgEA5goAIf4GAQDmCgAh_wZAAOgKACGABwIA-AoAIYEHAADnCgAgggcBAOYKACEPCQEA5goAITsBAOYKACHJBgAAjgsAMMoGAADbCQAQywYAAI4LADDMBgEA5QoAIc0GAQDlCgAh0wZAAOgKACHUBkAA6AoAIYMHAQDlCgAhhAcBAOYKACGFBwEA5goAIYYHAQDmCgAhhwcgAI8LACGIB0AA_woAIQUIAADqCgAgUwAAkQsAIFQAAJELACDVBiAAAAAB3AYgAJALACEFCAAA6goAIFMAAJELACBUAACRCwAg1QYgAAAAAdwGIACQCwAhAtUGIAAAAAHcBiAAkQsAIRAJAQDzCgAhHAAA9goAIDsBAPMKACHJBgAAkgsAMMoGAACYAQAQywYAAJILADDMBgEAkwsAIc0GAQCTCwAh0wZAAPUKACHUBkAA9QoAIYMHAQCTCwAhhAcBAPMKACGFBwEA8woAIYYHAQDzCgAhhwcgAJQLACGIB0AAlQsAIQvVBgEAAAAB1gYBAAAABNcGAQAAAATYBgEAAAAB2QYBAAAAAdoGAQAAAAHbBgEAAAAB3AYBAPEKACHjBgEAAAAB5AYBAAAAAeUGAQAAAAEC1QYgAAAAAdwGIACRCwAhCNUGQAAAAAHWBkAAAAAF1wZAAAAABdgGQAAAAAHZBkAAAAAB2gZAAAAAAdsGQAAAAAHcBkAAgQsAIQw7AQDmCgAhyQYAAJYLADDKBgAAwwkAEMsGAACWCwAwzAYBAOUKACHNBgEA5QoAIdMGQADoCgAh1AZAAOgKACHsBgAAlwuMByKJBwEA5QoAIYoHAQDmCgAhjAdAAP8KACEHCAAA6goAIFMAAJkLACBUAACZCwAg1QYAAACMBwLWBgAAAIwHCNcGAAAAjAcI3AYAAJgLjAciBwgAAOoKACBTAACZCwAgVAAAmQsAINUGAAAAjAcC1gYAAACMBwjXBgAAAIwHCNwGAACYC4wHIgTVBgAAAIwHAtYGAAAAjAcI1wYAAACMBwjcBgAAmQuMByIOOwEA5goAIckGAACaCwAwygYAAK0JABDLBgAAmgsAMMwGAQDlCgAhzQYBAOUKACHTBkAA6AoAIdQGQADoCgAh7AYAAJsLkgcijQcBAOUKACGOBwEA5QoAIY8HAQDmCgAhkAcCAPgKACGSB0AA_woAIQcIAADqCgAgUwAAnQsAIFQAAJ0LACDVBgAAAJIHAtYGAAAAkgcI1wYAAACSBwjcBgAAnAuSByIHCAAA6goAIFMAAJ0LACBUAACdCwAg1QYAAACSBwLWBgAAAJIHCNcGAAAAkgcI3AYAAJwLkgciBNUGAAAAkgcC1gYAAACSBwjXBgAAAJIHCNwGAACdC5IHIg7JBgAAngsAMMoGAACXCQAQywYAAJ4LADDMBgEA5QoAIc0GAQDlCgAh0wZAAOgKACH3BkAA6AoAIfkGAACKC_kGIo4HAQDmCgAhkwcBAOUKACGVBwAAnwuVByKWBwEA5goAIZcHAgD4CgAhmAcCAPgKACEHCAAA6goAIFMAAKELACBUAAChCwAg1QYAAACVBwLWBgAAAJUHCNcGAAAAlQcI3AYAAKALlQciBwgAAOoKACBTAAChCwAgVAAAoQsAINUGAAAAlQcC1gYAAACVBwjXBgAAAJUHCNwGAACgC5UHIgTVBgAAAJUHAtYGAAAAlQcI1wYAAACVBwjcBgAAoQuVByIIyQYAAKILADDKBgAAgQkAEMsGAACiCwAwzAYBAOUKACHUBkAA6AoAIZkHAQDlCgAhmgcBAOYKACGbBwEA5goAIQjJBgAAowsAMMoGAADuCAAQywYAAKMLADDMBgEAkwsAIdQGQAD1CgAhmQcBAJMLACGaBwEA8woAIZsHAQDzCgAhDckGAACkCwAwygYAAOgIABDLBgAApAsAMMwGAQDlCgAh0wZAAOgKACH-BgEA5QoAIZwHAQDlCgAhngcAAKULngcioAcAAKYLoAcjoQcBAOYKACGiBwEA5QoAIaMHIACPCwAhpAdAAP8KACEHCAAA6goAIFMAAKoLACBUAACqCwAg1QYAAACeBwLWBgAAAJ4HCNcGAAAAngcI3AYAAKkLngciBwgAAOwKACBTAACoCwAgVAAAqAsAINUGAAAAoAcD1gYAAACgBwnXBgAAAKAHCdwGAACnC6AHIwcIAADsCgAgUwAAqAsAIFQAAKgLACDVBgAAAKAHA9YGAAAAoAcJ1wYAAACgBwncBgAApwugByME1QYAAACgBwPWBgAAAKAHCdcGAAAAoAcJ3AYAAKgLoAcjBwgAAOoKACBTAACqCwAgVAAAqgsAINUGAAAAngcC1gYAAACeBwjXBgAAAJ4HCNwGAACpC54HIgTVBgAAAJ4HAtYGAAAAngcI1wYAAACeBwjcBgAAqgueByIOyQYAAKsLADDKBgAA0ggAEMsGAACrCwAwzAYBAOUKACHTBkAA6AoAIdQGQADoCgAh7AYAAKwLqgcihgcBAOYKACGiBwEA5QoAIaUHAQDlCgAhpgcBAOUKACGnBwEA5goAIagHAQDmCgAhqgdAAP8KACEHCAAA6goAIFMAAK4LACBUAACuCwAg1QYAAACqBwLWBgAAAKoHCNcGAAAAqgcI3AYAAK0LqgciBwgAAOoKACBTAACuCwAgVAAArgsAINUGAAAAqgcC1gYAAACqBwjXBgAAAKoHCNwGAACtC6oHIgTVBgAAAKoHAtYGAAAAqgcI1wYAAACqBwjcBgAArguqByIOyQYAAK8LADDKBgAAvwgAEMsGAACvCwAwzAYBAJMLACHTBkAA9QoAIdQGQAD1CgAh7AYAALALqgcihgcBAPMKACGiBwEAkwsAIaUHAQCTCwAhpgcBAJMLACGnBwEA8woAIagHAQDzCgAhqgdAAJULACEE1QYAAACqBwLWBgAAAKoHCNcGAAAAqgcI3AYAAK4LqgciDskGAACxCwAwygYAALkIABDLBgAAsQsAMMwGAQDlCgAhzQYBAOYKACHTBkAA6AoAIdQGQADoCgAh7QZAAOgKACH-BgEA5goAIZsHAQDmCgAhngcAALILrQciqwcBAOUKACGtBxAAhAsAIa4HAQDmCgAhBwgAAOoKACBTAAC0CwAgVAAAtAsAINUGAAAArQcC1gYAAACtBwjXBgAAAK0HCNwGAACzC60HIgcIAADqCgAgUwAAtAsAIFQAALQLACDVBgAAAK0HAtYGAAAArQcI1wYAAACtBwjcBgAAswutByIE1QYAAACtBwLWBgAAAK0HCNcGAAAArQcI3AYAALQLrQciEMkGAAC1CwAwygYAAKEIABDLBgAAtQsAMMwGAQDlCgAhzQYBAOYKACHTBkAA6AoAIdQGQADoCgAh9QYCALYLACH-BgEA5goAIasHAQDlCgAhrwcBAOUKACGwBwIA-AoAIbEHAgD4CgAhsgcCAPgKACGzByAAjwsAIbQHIACPCwAhDQgAAOoKACBTAADqCgAgVAAA6goAILUBAAC4CwAgtgEAAOoKACDVBgIAAAAB1gYCAAAABNcGAgAAAATYBgIAAAAB2QYCAAAAAdoGAgAAAAHbBgIAAAAB3AYCALcLACENCAAA6goAIFMAAOoKACBUAADqCgAgtQEAALgLACC2AQAA6goAINUGAgAAAAHWBgIAAAAE1wYCAAAABNgGAgAAAAHZBgIAAAAB2gYCAAAAAdsGAgAAAAHcBgIAtwsAIQjVBggAAAAB1gYIAAAABNcGCAAAAATYBggAAAAB2QYIAAAAAdoGCAAAAAHbBggAAAAB3AYIALgLACEQyQYAALkLADDKBgAAiQgAEMsGAAC5CwAwzAYBAOUKACHTBkAA6AoAIdQGQADoCgAh7AYAALwLugciqwcBAOYKACGtBxAAuwsAIa4HAQDlCgAhtQcBAOYKACG3BwAAugu3ByK4BwEA5goAIboHAQDmCgAhuwdAAP8KACG8BwAA5woAIAcIAADqCgAgUwAAwgsAIFQAAMILACDVBgAAALcHAtYGAAAAtwcI1wYAAAC3BwjcBgAAwQu3ByINCAAA6goAIFMAAMALACBUAADACwAgtQEAAMALACC2AQAAwAsAINUGEAAAAAHWBhAAAAAE1wYQAAAABNgGEAAAAAHZBhAAAAAB2gYQAAAAAdsGEAAAAAHcBhAAvwsAIQcIAADqCgAgUwAAvgsAIFQAAL4LACDVBgAAALoHAtYGAAAAugcI1wYAAAC6BwjcBgAAvQu6ByIHCAAA6goAIFMAAL4LACBUAAC-CwAg1QYAAAC6BwLWBgAAALoHCNcGAAAAugcI3AYAAL0LugciBNUGAAAAugcC1gYAAAC6BwjXBgAAALoHCNwGAAC-C7oHIg0IAADqCgAgUwAAwAsAIFQAAMALACC1AQAAwAsAILYBAADACwAg1QYQAAAAAdYGEAAAAATXBhAAAAAE2AYQAAAAAdkGEAAAAAHaBhAAAAAB2wYQAAAAAdwGEAC_CwAhCNUGEAAAAAHWBhAAAAAE1wYQAAAABNgGEAAAAAHZBhAAAAAB2gYQAAAAAdsGEAAAAAHcBhAAwAsAIQcIAADqCgAgUwAAwgsAIFQAAMILACDVBgAAALcHAtYGAAAAtwcI1wYAAAC3BwjcBgAAwQu3ByIE1QYAAAC3BwLWBgAAALcHCNcGAAAAtwcI3AYAAMILtwciDckGAADDCwAwygYAAO8HABDLBgAAwwsAMMwGAQDlCgAh0wZAAOgKACH-BgEA5QoAIZsHAQDmCgAhtQcBAOUKACG9BwEA5goAIb4HAQDmCgAhvwcCALYLACHABxAAuwsAIcEHEAC7CwAhGjsBAOYKACHJBgAAxAsAMMoGAADVBwAQywYAAMQLADDMBgEA5QoAIc0GAQDmCgAh0wZAAOgKACHUBkAA6AoAIewGAADFC8oHIv4GAQDlCgAhqwcBAOYKACGuBwEA5QoAIcEHEAC7CwAhwgcBAOYKACHDBwEA5QoAIcQHAQDmCgAhxQcBAOYKACHGBxAAuwsAIccHEAC7CwAhyAcQALsLACHKB0AA_woAIcsHQAD_CgAhzAdAAP8KACHNB0AA_woAIc4HQAD_CgAhzwcBAOUKACEHCAAA6goAIFMAAMcLACBUAADHCwAg1QYAAADKBwLWBgAAAMoHCNcGAAAAygcI3AYAAMYLygciBwgAAOoKACBTAADHCwAgVAAAxwsAINUGAAAAygcC1gYAAADKBwjXBgAAAMoHCNwGAADGC8oHIgTVBgAAAMoHAtYGAAAAygcI1wYAAADKBwjcBgAAxwvKByINCQAAyQvWByLJBgAAyAsAMMoGAAC5BwAQywYAAMgLADDMBgEA5QoAIc0GAQDlCgAh0wZAAOgKACGbBwEA5goAIdAHAQDlCgAh0QcBAOUKACHSBwEA5goAIdMHAQDmCgAh1AcCAPgKACEHCAAA6goAIFMAAMsLACBUAADLCwAg1QYAAADWBwLWBgAAANYHCNcGAAAA1gcI3AYAAMoL1gciBwgAAOoKACBTAADLCwAgVAAAywsAINUGAAAA1gcC1gYAAADWBwjXBgAAANYHCNwGAADKC9YHIgTVBgAAANYHAtYGAAAA1gcI1wYAAADWBwjcBgAAywvWByIPyQYAAMwLADDKBgAAowcAEMsGAADMCwAwzAYBAOUKACHNBgEA5QoAIdMGQADoCgAh1AZAAOgKACHsBgAAzQvZByL-BgEA5QoAIZsHAQDmCgAh1gcBAOYKACHXBwEA5goAIdoHAADOC9oHItsHQAD_CgAh3AdAAP8KACEHCAAA6goAIFMAANILACBUAADSCwAg1QYAAADZBwLWBgAAANkHCNcGAAAA2QcI3AYAANEL2QciBwgAAOoKACBTAADQCwAgVAAA0AsAINUGAAAA2gcC1gYAAADaBwjXBgAAANoHCNwGAADPC9oHIgcIAADqCgAgUwAA0AsAIFQAANALACDVBgAAANoHAtYGAAAA2gcI1wYAAADaBwjcBgAAzwvaByIE1QYAAADaBwLWBgAAANoHCNcGAAAA2gcI3AYAANAL2gciBwgAAOoKACBTAADSCwAgVAAA0gsAINUGAAAA2QcC1gYAAADZBwjXBgAAANkHCNwGAADRC9kHIgTVBgAAANkHAtYGAAAA2QcI1wYAAADZBwjcBgAA0gvZByIOyQYAANMLADDKBgAAiQcAEMsGAADTCwAwzAYBAOUKACHNBgEA5QoAIdMGQADoCgAh1AZAAOgKACHsBgAA1AveByL-BgEA5QoAIZsHAQDmCgAh2wdAAP8KACHcB0AA_woAId4HQAD_CgAh3wcCALYLACEHCAAA6goAIFMAANYLACBUAADWCwAg1QYAAADeBwLWBgAAAN4HCNcGAAAA3gcI3AYAANUL3gciBwgAAOoKACBTAADWCwAgVAAA1gsAINUGAAAA3gcC1gYAAADeBwjXBgAAAN4HCNwGAADVC94HIgTVBgAAAN4HAtYGAAAA3gcI1wYAAADeBwjcBgAA1gveByIIyQYAANcLADDKBgAA8wYAEMsGAADXCwAwzAYBAOUKACHNBgEA5QoAIdMGQADoCgAh4AcBAOUKACHiBwAA2AviByIHCAAA6goAIFMAANoLACBUAADaCwAg1QYAAADiBwLWBgAAAOIHCNcGAAAA4gcI3AYAANkL4gciBwgAAOoKACBTAADaCwAgVAAA2gsAINUGAAAA4gcC1gYAAADiBwjXBgAAAOIHCNwGAADZC-IHIgTVBgAAAOIHAtYGAAAA4gcI1wYAAADiBwjcBgAA2gviByITyQYAANsLADDKBgAA3QYAEMsGAADbCwAwzAYBAOUKACHTBkAA6AoAIdQGQADoCgAh7AYAAN0L5gci8AYBAOUKACGbBwEA5goAIaUHAQDlCgAhqwcBAOYKACGuBwEA5QoAIb0HAQDmCgAh3AdAAP8KACHeB0AA_woAIeQHAADcC-QHIuYHEACECwAh5wdAAP8KACHoBwIAtgsAIQcIAADqCgAgUwAA4QsAIFQAAOELACDVBgAAAOQHAtYGAAAA5AcI1wYAAADkBwjcBgAA4AvkByIHCAAA6goAIFMAAN8LACBUAADfCwAg1QYAAADmBwLWBgAAAOYHCNcGAAAA5gcI3AYAAN4L5gciBwgAAOoKACBTAADfCwAgVAAA3wsAINUGAAAA5gcC1gYAAADmBwjXBgAAAOYHCNwGAADeC-YHIgTVBgAAAOYHAtYGAAAA5gcI1wYAAADmBwjcBgAA3wvmByIHCAAA6goAIFMAAOELACBUAADhCwAg1QYAAADkBwLWBgAAAOQHCNcGAAAA5AcI3AYAAOAL5AciBNUGAAAA5AcC1gYAAADkBwjXBgAAAOQHCNwGAADhC-QHIg87AQDmCgAhyQYAAOILADDKBgAAwwYAEMsGAADiCwAwzAYBAOUKACHTBkAA6AoAIdQGQADoCgAhhgcBAOYKACGWBwEA5goAIZwHAQDmCgAhpQcBAOUKACGmBwEA5QoAIacHAQDmCgAh6QcBAOYKACHqByAAjwsAIRYEAADkCwAgFgAA5QsAIBoAAOYLACAiAADqCwAgIwAA5wsAICQAAOgLACAlAADpCwAgOwEA8woAIckGAADjCwAwygYAAEgAEMsGAADjCwAwzAYBAJMLACHTBkAA9QoAIdQGQAD1CgAhhgcBAPMKACGWBwEA8woAIZwHAQDzCgAhpQcBAJMLACGmBwEAkwsAIacHAQDzCgAh6QcBAPMKACHqByAAlAsAIRsDAAC9DAAgBQAAvgwAIAYAAL8MACAOAACMDAAgIwAA5wsAID0AAMAMACA-AADBDAAgPwAAwgwAIEAAAMMMACDJBgAAugwAMMoGAAAWABDLBgAAugwAMMwGAQCTCwAh0wZAAPUKACHUBkAA9QoAIewGAAC8DK8IIqUHAQDzCgAhpgcBAJMLACHiBwAAuwyuCCKrCCAAlAsAIawIAQDzCgAhrwgBAPMKACGwCEAAlQsAIbEIIACUCwAhsggBAPMKACHKCAAAFgAgywgAABYAIAPrBwAANgAg7AcAADYAIO0HAAA2ACAD6wcAAEwAIOwHAABMACDtBwAATAAgA-sHAABQACDsBwAAUAAg7QcAAFAAIAPrBwAAaAAg7AcAAGgAIO0HAABoACAD6wcAAG0AIOwHAABtACDtBwAAbQAgA-sHAABgACDsBwAAYAAg7QcAAGAAIA07AQDmCgAhyQYAAOsLADDKBgAAqQYAEMsGAADrCwAwzAYBAOUKACHTBkAA6AoAIdQGQADoCgAh7AYAAOwL8QcivQcBAOYKACHCBwEA5QoAIdcHAQDmCgAh7gdAAP8KACHvBwEA5goAIQcIAADqCgAgUwAA7gsAIFQAAO4LACDVBgAAAPEHAtYGAAAA8QcI1wYAAADxBwjcBgAA7QvxByIHCAAA6goAIFMAAO4LACBUAADuCwAg1QYAAADxBwLWBgAAAPEHCNcGAAAA8QcI3AYAAO0L8QciBNUGAAAA8QcC1gYAAADxBwjXBgAAAPEHCNwGAADuC_EHIgrJBgAA7wsAMMoGAACPBgAQywYAAO8LADDMBgEA5QoAIdMGQADoCgAhmwcBAOUKACGeBwAA8AvyByK8BwAA5woAIMIHAQDlCgAhzwcBAOYKACEHCAAA6goAIFMAAPILACBUAADyCwAg1QYAAADyBwLWBgAAAPIHCNcGAAAA8gcI3AYAAPEL8gciBwgAAOoKACBTAADyCwAgVAAA8gsAINUGAAAA8gcC1gYAAADyBwjXBgAAAPIHCNwGAADxC_IHIgTVBgAAAPIHAtYGAAAA8gcI1wYAAADyBwjcBgAA8gvyByIIyQYAAPMLADDKBgAA9wUAEMsGAADzCwAwzAYBAOUKACHTBkAA6AoAIdQGQADoCgAhrwcBAOUKACHCBwEA5QoAIRbJBgAA9AsAMMoGAADhBQAQywYAAPQLADDMBgEA5QoAIdMGQADoCgAh1AZAAOgKACHsBgAA9Qv0ByKGBwEA5goAIZYHAQDmCgAhogcBAOYKACGlBwEA5QoAIaYHAQDlCgAhpwcBAOYKACGrBwEA5goAIb0HAQDmCgAh1wcBAOYKACHaBwAA9gv1ByLmBwEA5goAIekHAQDmCgAh8gcBAOYKACH2BwAA9wv2ByL3B0AA_woAIQcIAADqCgAgUwAA_QsAIFQAAP0LACDVBgAAAPQHAtYGAAAA9AcI1wYAAAD0BwjcBgAA_Av0ByIHCAAA6goAIFMAAPsLACBUAAD7CwAg1QYAAAD1BwLWBgAAAPUHCNcGAAAA9QcI3AYAAPoL9QciBwgAAOoKACBTAAD5CwAgVAAA-QsAINUGAAAA9gcC1gYAAAD2BwjXBgAAAPYHCNwGAAD4C_YHIgcIAADqCgAgUwAA-QsAIFQAAPkLACDVBgAAAPYHAtYGAAAA9gcI1wYAAAD2BwjcBgAA-Av2ByIE1QYAAAD2BwLWBgAAAPYHCNcGAAAA9gcI3AYAAPkL9gciBwgAAOoKACBTAAD7CwAgVAAA-wsAINUGAAAA9QcC1gYAAAD1BwjXBgAAAPUHCNwGAAD6C_UHIgTVBgAAAPUHAtYGAAAA9QcI1wYAAAD1BwjcBgAA-wv1ByIHCAAA6goAIFMAAP0LACBUAAD9CwAg1QYAAAD0BwLWBgAAAPQHCNcGAAAA9AcI3AYAAPwL9AciBNUGAAAA9AcC1gYAAAD0BwjXBgAAAPQHCNwGAAD9C_QHIhAJAADJC9YHIskGAAD-CwAwygYAAMUFABDLBgAA_gsAMMwGAQDlCgAh0wZAAOgKACHUBkAA6AoAIYoHAQDlCgAh0AcBAOUKACHSBwEA5goAIdMHAQDmCgAh1AcCAPgKACH4BwEA5goAIfkHAQDmCgAh-gcCAPgKACH7BwIA-AoAIRAJAACBDNYHIskGAAD_CwAwygYAALIFABDLBgAA_wsAMMwGAQCTCwAh0wZAAPUKACHUBkAA9QoAIYoHAQCTCwAh0AcBAJMLACHSBwEA8woAIdMHAQDzCgAh1AcCAIAMACH4BwEA8woAIfkHAQDzCgAh-gcCAIAMACH7BwIAgAwAIQjVBgIAAAAB1gYCAAAABdcGAgAAAAXYBgIAAAAB2QYCAAAAAdoGAgAAAAHbBgIAAAAB3AYCAOwKACEE1QYAAADWBwLWBgAAANYHCNcGAAAA1gcI3AYAAMsL1gciBskGAACCDAAwygYAAKwFABDLBgAAggwAMMwGAQDlCgAh_AcBAOUKACH9BwEA5QoAIQjJBgAAgwwAMMoGAACWBQAQywYAAIMMADDMBgEA5QoAIdMGQADoCgAh1AZAAOgKACHwBgEA5QoAIaUHAQDlCgAhCQcAAIUMACDJBgAAhAwAMMoGAACDBQAQywYAAIQMADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACHwBgEAkwsAIaUHAQCTCwAhA-sHAAAYACDsBwAAGAAg7QcAABgAIBPJBgAAhgwAMMoGAAD9BAAQywYAAIYMADDMBgEA5QoAIdMGQADoCgAh1AZAAOgKACHsBgAAhwyHCCLwBgEA5QoAIfIGQAD_CgAh_gYBAOUKACGvBwEA5QoAIf4HAQDmCgAh_wcBAOYKACGACAEA5goAIYEIAQDmCgAhgggBAOYKACGDCAEA5goAIYQIAQDmCgAhhQgAAOcKACAHCAAA6goAIFMAAIkMACBUAACJDAAg1QYAAACHCALWBgAAAIcICNcGAAAAhwgI3AYAAIgMhwgiBwgAAOoKACBTAACJDAAgVAAAiQwAINUGAAAAhwgC1gYAAACHCAjXBgAAAIcICNwGAACIDIcIIgTVBgAAAIcIAtYGAAAAhwgI1wYAAACHCAjcBgAAiQyHCCIKyQYAAIoMADDKBgAA4wQAEMsGAACKDAAwzAYBAOUKACHTBkAA6AoAIdQGQADoCgAh8AYBAOUKACGbBwEA5goAIaUHAQDlCgAh6gcgAI8LACELBwAAjAwAIMkGAACLDAAwygYAABIAEMsGAACLDAAwzAYBAJMLACHTBkAA9QoAIdQGQAD1CgAh8AYBAJMLACGbBwEA8woAIaUHAQCTCwAh6gcgAJQLACED6wcAAA4AIOwHAAAOACDtBwAADgAgCwkBAOYKACHJBgAAjQwAMMoGAADLBAAQywYAAI0MADDMBgEA5QoAIdMGQADoCgAh1AZAAOgKACHfBwIAtgsAIeoHIACPCwAhhwgBAOUKACGICAEA5QoAIQsJAQDzCgAhyQYAAI4MADDKBgAAuAQAEMsGAACODAAwzAYBAJMLACHTBkAA9QoAIdQGQAD1CgAh3wcCAI8MACHqByAAlAsAIYcIAQCTCwAhiAgBAJMLACEI1QYCAAAAAdYGAgAAAATXBgIAAAAE2AYCAAAAAdkGAgAAAAHaBgIAAAAB2wYCAAAAAdwGAgDqCgAhEMkGAACQDAAwygYAALIEABDLBgAAkAwAMMwGAQDlCgAh0wZAAOgKACHUBkAA6AoAIewGAACHDIcIIvIGQAD_CgAh9QYCALYLACGvBwEA5QoAIbQHIACPCwAhiQgBAOUKACGKCAEA5goAIYsIAQDmCgAhjAgBAOYKACGNCAEA5goAIRDJBgAAkQwAMMoGAACfBAAQywYAAJEMADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACHsBgAAkgyHCCLyBkAAlQsAIfUGAgCPDAAhrwcBAJMLACG0ByAAlAsAIYkIAQCTCwAhiggBAPMKACGLCAEA8woAIYwIAQDzCgAhjQgBAPMKACEE1QYAAACHCALWBgAAAIcICNcGAAAAhwgI3AYAAIkMhwgiBskGAACTDAAwygYAAJkEABDLBgAAkwwAMMwGAQDlCgAhvQcBAOUKACGOCAEA5QoAIRbJBgAAlAwAMMoGAACDBAAQywYAAJQMADDMBgEA5QoAIdMGQADoCgAh1AZAAOgKACHsBgAAhwyHCCLwBgEA5QoAIfIGQAD_CgAh_AYAAOcKACD-BgEA5QoAIZYHAQDmCgAhtAcgAI8LACGCCAEA5goAIYMIAQDmCgAhiQgBAOYKACGPCAEA5goAIZAIAQDmCgAhkQgBAOYKACGSCAEA5goAIZMIAQDmCgAhlAgBAOYKACEXEQAAlgwAIMkGAACVDAAwygYAAPADABDLBgAAlQwAMMwGAQCTCwAh0wZAAPUKACHUBkAA9QoAIewGAACSDIcIIvAGAQCTCwAh8gZAAJULACH8BgAA9AoAIP4GAQCTCwAhlgcBAPMKACG0ByAAlAsAIYIIAQDzCgAhgwgBAPMKACGJCAEA8woAIY8IAQDzCgAhkAgBAPMKACGRCAEA8woAIZIIAQDzCgAhkwgBAPMKACGUCAEA8woAIQPrBwAAMAAg7AcAADAAIO0HAAAwACAGyQYAAJcMADDKBgAA6gMAEMsGAACXDAAwzAYBAOUKACG9BwEA5QoAIZUIAQDlCgAhC8kGAACYDAAwygYAANQDABDLBgAAmAwAMMwGAQDlCgAh0wZAAOgKACGKBwEA5QoAIdIHAQDmCgAh3wcCALYLACH4BwEA5goAIfkHAQDmCgAhlQgBAOUKACEWyQYAAJkMADDKBgAAvgMAEMsGAACZDAAwzAYBAOUKACHTBkAA6AoAIdQGQADoCgAh6QYBAOYKACHsBgAAhwyHCCLwBgEA5QoAIfIGQAD_CgAh_gYBAOUKACGWBwEA5goAIZsHAQDmCgAhtAcgAI8LACGCCAEA5goAIYMIAQDmCgAhiQgBAOYKACGPCAEA5goAIZAIAQDmCgAhlAgAAOcKACCWCAEA5goAIZcIAADnCgAgGBAAAJsMACARAACcDAAgyQYAAJoMADDKBgAAqwMAEMsGAACaDAAwzAYBAJMLACHTBkAA9QoAIdQGQAD1CgAh6QYBAPMKACHsBgAAkgyHCCLwBgEAkwsAIfIGQACVCwAh_gYBAJMLACGWBwEA8woAIZsHAQDzCgAhtAcgAJQLACGCCAEA8woAIYMIAQDzCgAhiQgBAPMKACGPCAEA8woAIZAIAQDzCgAhlAgAAPQKACCWCAEA8woAIZcIAAD0CgAgA-sHAAApACDsBwAAKQAg7QcAACkAIAPrBwAAJQAg7AcAACUAIO0HAAAlACARyQYAAJ0MADDKBgAApQMAEMsGAACdDAAwzAYBAOUKACHTBkAA6AoAIdQGQADoCgAh8AYBAOUKACGbBwEA5goAIaUHAQDlCgAhrgcBAOUKACG9BwEA5QoAId8HAgC2CwAh6gcgAI8LACGYCBAAuwsAIZoIAACeDJoIIpsIAADnCgAgnAggAI8LACEHCAAA6goAIFMAAKAMACBUAACgDAAg1QYAAACaCALWBgAAAJoICNcGAAAAmggI3AYAAJ8MmggiBwgAAOoKACBTAACgDAAgVAAAoAwAINUGAAAAmggC1gYAAACaCAjXBgAAAJoICNwGAACfDJoIIgTVBgAAAJoIAtYGAAAAmggI1wYAAACaCAjcBgAAoAyaCCIWyQYAAKEMADDKBgAAjwMAEMsGAAChDAAwzAYBAOUKACHTBkAA6AoAIdQGQADoCgAh8AYBAOUKACGbBwEA5goAIaUHAQDlCgAhrgcBAOUKACG0ByAAjwsAId8HAgC2CwAh6gcgAI8LACGCCAEA5goAIYMIAQDmCgAhkAgBAOYKACGbCAAA5woAIJ0IAQDmCgAhnggBAOYKACGfCAEA5goAIaAIAADnCgAgoQgQAIQLACEdEwAAnAwAIBUAAJYMACAWAADlCwAgGgAA5gsAIB8AAKUMACA5AACkDAAgOgAApgwAIMkGAACiDAAwygYAACMAEMsGAACiDAAwzAYBAJMLACHTBkAA9QoAIdQGQAD1CgAh8AYBAJMLACGbBwEA8woAIaUHAQCTCwAhrgcBAJMLACG0ByAAlAsAId8HAgCPDAAh6gcgAJQLACGCCAEA8woAIYMIAQDzCgAhkAgBAPMKACGbCAAA9AoAIJ0IAQDzCgAhnggBAPMKACGfCAEA8woAIaAIAAD0CgAgoQgQAKMMACEI1QYQAAAAAdYGEAAAAAXXBhAAAAAF2AYQAAAAAdkGEAAAAAHaBhAAAAAB2wYQAAAAAdwGEACGCwAhA-sHAAA6ACDsBwAAOgAg7QcAADoAIAPrBwAAVwAg7AcAAFcAIO0HAABXACAD6wcAAFwAIOwHAABcACDtBwAAXAAgEskGAACnDAAwygYAAPcCABDLBgAApwwAMMwGAQDlCgAh0wZAAOgKACHUBkAA6AoAIewGAACpDKYIIoYHAQDmCgAhnAcBAOYKACGmBwEA5QoAIeIHAACoDKUIIqIIAQDmCgAhowgBAOUKACGmCAEA5goAIacIAQDmCgAhqAgBAOYKACGpCAEA5goAIaoIQAD_CgAhBwgAAOoKACBTAACtDAAgVAAArQwAINUGAAAApQgC1gYAAAClCAjXBgAAAKUICNwGAACsDKUIIgcIAADqCgAgUwAAqwwAIFQAAKsMACDVBgAAAKYIAtYGAAAApggI1wYAAACmCAjcBgAAqgymCCIHCAAA6goAIFMAAKsMACBUAACrDAAg1QYAAACmCALWBgAAAKYICNcGAAAApggI3AYAAKoMpggiBNUGAAAApggC1gYAAACmCAjXBgAAAKYICNwGAACrDKYIIgcIAADqCgAgUwAArQwAIFQAAK0MACDVBgAAAKUIAtYGAAAApQgI1wYAAAClCAjcBgAArAylCCIE1QYAAAClCALWBgAAAKUICNcGAAAApQgI3AYAAK0MpQgiFwQAAOQLACAYAADlCwAgGQAApAwAIDcAALEMACA4AACyDAAgyQYAAK4MADDKBgAAPwAQywYAAK4MADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACHsBgAAsAymCCKGBwEA8woAIZwHAQDzCgAhpgcBAJMLACHiBwAArwylCCKiCAEA8woAIaMIAQCTCwAhpggBAPMKACGnCAEA8woAIagIAQDzCgAhqQgBAPMKACGqCEAAlQsAIQTVBgAAAKUIAtYGAAAApQgI1wYAAAClCAjcBgAArQylCCIE1QYAAACmCALWBgAAAKYICNcGAAAApggI3AYAAKsMpggiA-sHAABEACDsBwAARAAg7QcAAEQAIAPrBwAAegAg7AcAAHoAIO0HAAB6ACAQyQYAALMMADDKBgAA3QIAEMsGAACzDAAwzAYBAOUKACHTBkAA6AoAIdQGQADoCgAh7AYAALUMrwgipQcBAOYKACGmBwEA5QoAIeIHAAC0DK4IIqsIIACPCwAhrAgBAOYKACGvCAEA5goAIbAIQAD_CgAhsQggAI8LACGyCAEA5goAIQcIAADqCgAgUwAAuQwAIFQAALkMACDVBgAAAK4IAtYGAAAArggI1wYAAACuCAjcBgAAuAyuCCIHCAAA6goAIFMAALcMACBUAAC3DAAg1QYAAACvCALWBgAAAK8ICNcGAAAArwgI3AYAALYMrwgiBwgAAOoKACBTAAC3DAAgVAAAtwwAINUGAAAArwgC1gYAAACvCAjXBgAAAK8ICNwGAAC2DK8IIgTVBgAAAK8IAtYGAAAArwgI1wYAAACvCAjcBgAAtwyvCCIHCAAA6goAIFMAALkMACBUAAC5DAAg1QYAAACuCALWBgAAAK4ICNcGAAAArggI3AYAALgMrggiBNUGAAAArggC1gYAAACuCAjXBgAAAK4ICNwGAAC5DK4IIhkDAAC9DAAgBQAAvgwAIAYAAL8MACAOAACMDAAgIwAA5wsAID0AAMAMACA-AADBDAAgPwAAwgwAIEAAAMMMACDJBgAAugwAMMoGAAAWABDLBgAAugwAMMwGAQCTCwAh0wZAAPUKACHUBkAA9QoAIewGAAC8DK8IIqUHAQDzCgAhpgcBAJMLACHiBwAAuwyuCCKrCCAAlAsAIawIAQDzCgAhrwgBAPMKACGwCEAAlQsAIbEIIACUCwAhsggBAPMKACEE1QYAAACuCALWBgAAAK4ICNcGAAAArggI3AYAALkMrggiBNUGAAAArwgC1gYAAACvCAjXBgAAAK8ICNwGAAC3DK8IIgPrBwAAAwAg7AcAAAMAIO0HAAADACAD6wcAAAYAIOwHAAAGACDtBwAABgAgA-sHAAAKACDsBwAACgAg7QcAAAoAIAPrBwAAHwAg7AcAAB8AIO0HAAAfACAD6wcAAOEBACDsBwAA4QEAIO0HAADhAQAgGQQAAOQLACAYAADlCwAgGQAApAwAIDcAALEMACA4AACyDAAgyQYAAK4MADDKBgAAPwAQywYAAK4MADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACHsBgAAsAymCCKGBwEA8woAIZwHAQDzCgAhpgcBAJMLACHiBwAArwylCCKiCAEA8woAIaMIAQCTCwAhpggBAPMKACGnCAEA8woAIagIAQDzCgAhqQgBAPMKACGqCEAAlQsAIcoIAAA_ACDLCAAAPwAgGAQAAOQLACAWAADlCwAgGgAA5gsAICIAAOoLACAjAADnCwAgJAAA6AsAICUAAOkLACA7AQDzCgAhyQYAAOMLADDKBgAASAAQywYAAOMLADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACGGBwEA8woAIZYHAQDzCgAhnAcBAPMKACGlBwEAkwsAIaYHAQCTCwAhpwcBAPMKACHpBwEA8woAIeoHIACUCwAhyggAAEgAIMsIAABIACAJyQYAAMQMADDKBgAAxQIAEMsGAADEDAAwzAYBAOUKACHTBkAA6AoAIdQGQADoCgAhnAcBAOUKACGzCAEA5QoAIbQIAQDlCgAhCckGAADFDAAwygYAAK8CABDLBgAAxQwAMMwGAQDlCgAh0wZAAOgKACHUBkAA6AoAIZoHAQDlCgAhtQgBAOUKACG2CEAA6AoAIQnJBgAAxgwAMMoGAACcAgAQywYAAMYMADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACGaBwEAkwsAIbUIAQCTCwAhtghAAPUKACERyQYAAMcMADDKBgAAlgIAEMsGAADHDAAwzAYBAOUKACHTBkAA6AoAIdQGQADoCgAhnAcBAOUKACG3CAEA5QoAIbgIAQDlCgAhuQgBAOYKACG6CAEA5goAIbsIAQDmCgAhvAgBAOYKACG9CEAA_woAIb4IQAD_CgAhvwgBAOYKACHACAEA5goAIQvJBgAAyAwAMMoGAACAAgAQywYAAMgMADDMBgEA5QoAIdMGQADoCgAh1AZAAOgKACGcBwEA5QoAIbYIQADoCgAhwQgBAOUKACHCCAEA5goAIcMIAQDmCgAhDgQAAMwMACDJBgAAyQwAMMoGAADhAQAQywYAAMkMADDMBgEAkwsAIdMGQAD1CgAh_gYBAJMLACGcBwEAkwsAIZ4HAADKDJ4HIqAHAADLDKAHI6EHAQDzCgAhogcBAJMLACGjByAAlAsAIaQHQACVCwAhBNUGAAAAngcC1gYAAACeBwjXBgAAAJ4HCNwGAACqC54HIgTVBgAAAKAHA9YGAAAAoAcJ1wYAAACgBwncBgAAqAugByMbAwAAvQwAIAUAAL4MACAGAAC_DAAgDgAAjAwAICMAAOcLACA9AADADAAgPgAAwQwAID8AAMIMACBAAADDDAAgyQYAALoMADDKBgAAFgAQywYAALoMADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACHsBgAAvAyvCCKlBwEA8woAIaYHAQCTCwAh4gcAALsMrggiqwggAJQLACGsCAEA8woAIa8IAQDzCgAhsAhAAJULACGxCCAAlAsAIbIIAQDzCgAhyggAABYAIMsIAAAWACAJFwAAzgwAIMkGAADNDAAwygYAANQBABDLBgAAzQwAMMwGAQCTCwAh0wZAAPUKACHUBkAA9QoAIa8HAQCTCwAhwgcBAJMLACEfEgAA9AwAIBsAAMMMACAjAADnCwAgNgAAwgwAIDkAAKQMACA7AACSDQAgPAAAwAwAIMkGAACODQAwygYAADYAEMsGAACODQAwzAYBAJMLACHTBkAA9QoAIdQGQAD1CgAh7AYAAI8N9AcihgcBAPMKACGWBwEA8woAIaIHAQDzCgAhpQcBAJMLACGmBwEAkwsAIacHAQDzCgAhqwcBAPMKACG9BwEA8woAIdcHAQDzCgAh2gcAAJAN9Qci5gcBAPMKACHpBwEA8woAIfIHAQDzCgAh9gcAAJEN9gci9wdAAJULACHKCAAANgAgywgAADYAIBMSAADSDAAgHwAApQwAIMkGAADPDAAwygYAAFwAEMsGAADPDAAwzAYBAJMLACHTBkAA9QoAIdQGQAD1CgAh8AYBAJMLACGbBwEA8woAIaUHAQCTCwAhrgcBAJMLACG9BwEAkwsAId8HAgCPDAAh6gcgAJQLACGYCBAA0AwAIZoIAADRDJoIIpsIAAD0CgAgnAggAJQLACEI1QYQAAAAAdYGEAAAAATXBhAAAAAE2AYQAAAAAdkGEAAAAAHaBhAAAAAB2wYQAAAAAdwGEADACwAhBNUGAAAAmggC1gYAAACaCAjXBgAAAJoICNwGAACgDJoIIh8TAACcDAAgFQAAlgwAIBYAAOULACAaAADmCwAgHwAApQwAIDkAAKQMACA6AACmDAAgyQYAAKIMADDKBgAAIwAQywYAAKIMADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACHwBgEAkwsAIZsHAQDzCgAhpQcBAJMLACGuBwEAkwsAIbQHIACUCwAh3wcCAI8MACHqByAAlAsAIYIIAQDzCgAhgwgBAPMKACGQCAEA8woAIZsIAAD0CgAgnQgBAPMKACGeCAEA8woAIZ8IAQDzCgAhoAgAAPQKACChCBAAowwAIcoIAAAjACDLCAAAIwAgDhwAAPYKACDJBgAA0wwAMMoGAACqAQAQywYAANMMADDMBgEAkwsAIc0GAQCTCwAh0wZAAPUKACHmBgEA8woAIecGAQCTCwAh6AYBAPMKACHpBgIAgAwAIeoGAQDzCgAh7AYAANQM7AYi7QZAAPUKACEE1QYAAADsBgLWBgAAAOwGCNcGAAAA7AYI3AYAAPsK7AYiAs0GAQAAAAHwBgEAAAABDRwAAPYKACDJBgAA1gwAMMoGAACmAQAQywYAANYMADDMBgEAkwsAIc0GAQCTCwAh0wZAAPUKACHUBkAA9QoAIe4GAQCTCwAh7wYBAPMKACHwBgEAkwsAIfEGAQDzCgAh8gZAAJULACELHAAA9goAIMkGAADXDAAwygYAAKIBABDLBgAA1wwAMMwGAQCTCwAhzQYBAJMLACHTBkAA9QoAIfQGAADYDPQGIvUGEACjDAAh9gYCAIAMACH3BkAA9QoAIQTVBgAAAPQGAtYGAAAA9AYI1wYAAAD0BgjcBgAAiAv0BiIOHAAA9goAIMkGAADZDAAwygYAAJ4BABDLBgAA2QwAMMwGAQCTCwAhzQYBAJMLACHTBkAA9QoAIfEGAQCTCwAh9wZAAPUKACH5BgAA2gz5BiL6BgIAgAwAIfsGAgCADAAh_AYAAPQKACD9BgEA8woAIQTVBgAAAPkGAtYGAAAA-QYI1wYAAAD5BgjcBgAAjAv5BiINHAAA9goAIMkGAADbDAAwygYAAJoBABDLBgAA2wwAMMwGAQCTCwAhzQYBAJMLACHTBkAA9QoAIf0GAQDzCgAh_gYBAPMKACH_BkAA9QoAIYAHAgCADAAhgQcAAPQKACCCBwEA8woAIQ0cAAD2CgAgOwEA8woAIckGAADcDAAwygYAAJQBABDLBgAA3AwAMMwGAQCTCwAhzQYBAJMLACHTBkAA9QoAIdQGQAD1CgAh7AYAAN0MjAciiQcBAJMLACGKBwEA8woAIYwHQACVCwAhBNUGAAAAjAcC1gYAAACMBwjXBgAAAIwHCNwGAACZC4wHIg8cAAD2CgAgOwEA8woAIckGAADeDAAwygYAAJABABDLBgAA3gwAMMwGAQCTCwAhzQYBAJMLACHTBkAA9QoAIdQGQAD1CgAh7AYAAN8MkgcijQcBAJMLACGOBwEAkwsAIY8HAQDzCgAhkAcCAIAMACGSB0AAlQsAIQTVBgAAAJIHAtYGAAAAkgcI1wYAAACSBwjcBgAAnQuSByIPHAAA9goAIMkGAADgDAAwygYAAIwBABDLBgAA4AwAMMwGAQCTCwAhzQYBAJMLACHTBkAA9QoAIfcGQAD1CgAh-QYAANoM-QYijgcBAPMKACGTBwEAkwsAIZUHAADhDJUHIpYHAQDzCgAhlwcCAIAMACGYBwIAgAwAIQTVBgAAAJUHAtYGAAAAlQcI1wYAAACVBwjcBgAAoQuVByIOCQAAgQzWByIcAAD2CgAgyQYAAOIMADDKBgAAhQEAEMsGAADiDAAwzAYBAJMLACHNBgEAkwsAIdMGQAD1CgAhmwcBAPMKACHQBwEAkwsAIdEHAQCTCwAh0gcBAPMKACHTBwEA8woAIdQHAgCADAAhEBwAAPYKACAoAACxDAAgyQYAAOMMADDKBgAAfgAQywYAAOMMADDMBgEAkwsAIc0GAQCTCwAh0wZAAPUKACHUBkAA9QoAIewGAADkDN4HIv4GAQCTCwAhmwcBAPMKACHbB0AAlQsAIdwHQACVCwAh3gdAAJULACHfBwIAjwwAIQTVBgAAAN4HAtYGAAAA3gcI1wYAAADeBwjcBgAA1gveByICzQYBAAAAAeAHAQAAAAEKHAAA9goAICYAAOgMACDJBgAA5gwAMMoGAAB6ABDLBgAA5gwAMMwGAQCTCwAhzQYBAJMLACHTBkAA9QoAIeAHAQCTCwAh4gcAAOcM4gciBNUGAAAA4gcC1gYAAADiBwjXBgAAAOIHCNwGAADaC-IHIhkEAADkCwAgGAAA5QsAIBkAAKQMACA3AACxDAAgOAAAsgwAIMkGAACuDAAwygYAAD8AEMsGAACuDAAwzAYBAJMLACHTBkAA9QoAIdQGQAD1CgAh7AYAALAMpggihgcBAPMKACGcBwEA8woAIaYHAQCTCwAh4gcAAK8MpQgioggBAPMKACGjCAEAkwsAIaYIAQDzCgAhpwgBAPMKACGoCAEA8woAIakIAQDzCgAhqghAAJULACHKCAAAPwAgywgAAD8AIBAbAADrDAAgHAAA7AwAIMkGAADpDAAwygYAAG0AEMsGAADpDAAwzAYBAJMLACHNBgEA8woAIdMGQAD1CgAh1AZAAPUKACHtBkAA9QoAIf4GAQDzCgAhmwcBAPMKACGeBwAA6gytByKrBwEAkwsAIa0HEACjDAAhrgcBAPMKACEE1QYAAACtBwLWBgAAAK0HCNcGAAAArQcI3AYAALQLrQciGAQAAOQLACAWAADlCwAgGgAA5gsAICIAAOoLACAjAADnCwAgJAAA6AsAICUAAOkLACA7AQDzCgAhyQYAAOMLADDKBgAASAAQywYAAOMLADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACGGBwEA8woAIZYHAQDzCgAhnAcBAPMKACGlBwEAkwsAIaYHAQCTCwAhpwcBAPMKACHpBwEA8woAIeoHIACUCwAhyggAAEgAIMsIAABIACAoEgAA9AwAIBsAAMMMACAjAADnCwAgJAAA6AsAICUAAOkLACAnAACyDAAgKAAAsQwAICkAAPwMACAqAAD9DAAgKwAA_gwAICwAAP8MACAtAACADQAgLgAAgQ0AIC8AAIINACAwAACDDQAgMQAAhA0AIDIAAIUNACAzAACGDQAgNAAAhw0AIMkGAAD5DAAwygYAAEwAEMsGAAD5DAAwzAYBAJMLACHTBkAA9QoAIdQGQAD1CgAh7AYAAPsM5gci8AYBAJMLACGbBwEA8woAIaUHAQCTCwAhqwcBAPMKACGuBwEAkwsAIb0HAQDzCgAh3AdAAJULACHeB0AAlQsAIeQHAAD6DOQHIuYHEACjDAAh5wdAAJULACHoBwIAjwwAIcoIAABMACDLCAAATAAgEhsAAOsMACAcAADsDAAgyQYAAO0MADDKBgAAaAAQywYAAO0MADDMBgEAkwsAIc0GAQDzCgAh0wZAAPUKACHUBkAA9QoAIfUGAgCPDAAh_gYBAPMKACGrBwEAkwsAIa8HAQCTCwAhsAcCAIAMACGxBwIAgAwAIbIHAgCADAAhswcgAJQLACG0ByAAlAsAIRIbAADDDAAgHgAA8QwAIMkGAADuDAAwygYAAGAAEMsGAADuDAAwzAYBAJMLACHTBkAA9QoAIdQGQAD1CgAh7AYAAPAMugciqwcBAPMKACGtBxAA0AwAIa4HAQCTCwAhtQcBAPMKACG3BwAA7wy3ByK4BwEA8woAIboHAQDzCgAhuwdAAJULACG8BwAA9AoAIATVBgAAALcHAtYGAAAAtwcI1wYAAAC3BwjcBgAAwgu3ByIE1QYAAAC6BwLWBgAAALoHCNcGAAAAugcI3AYAAL4LugciIhcAAPgMACAbAADDDAAgHAAA7AwAIB0AAMwMACAhAAClDAAgIgAA6gsAIDsBAPMKACHJBgAA9gwAMMoGAABQABDLBgAA9gwAMMwGAQCTCwAhzQYBAPMKACHTBkAA9QoAIdQGQAD1CgAh7AYAAPcMygci_gYBAJMLACGrBwEA8woAIa4HAQCTCwAhwQcQANAMACHCBwEA8woAIcMHAQCTCwAhxAcBAPMKACHFBwEA8woAIcYHEADQDAAhxwcQANAMACHIBxAA0AwAIcoHQACVCwAhywdAAJULACHMB0AAlQsAIc0HQACVCwAhzgdAAJULACHPBwEAkwsAIcoIAABQACDLCAAAUAAgEBIAAPQMACAeAADzDAAgIAAA9QwAIMkGAADyDAAwygYAAFcAEMsGAADyDAAwzAYBAJMLACHTBkAA9QoAIf4GAQCTCwAhmwcBAPMKACG1BwEAkwsAIb0HAQDzCgAhvgcBAPMKACG_BwIAjwwAIcAHEADQDAAhwQcQANAMACEiFwAA-AwAIBsAAMMMACAcAADsDAAgHQAAzAwAICEAAKUMACAiAADqCwAgOwEA8woAIckGAAD2DAAwygYAAFAAEMsGAAD2DAAwzAYBAJMLACHNBgEA8woAIdMGQAD1CgAh1AZAAPUKACHsBgAA9wzKByL-BgEAkwsAIasHAQDzCgAhrgcBAJMLACHBBxAA0AwAIcIHAQDzCgAhwwcBAJMLACHEBwEA8woAIcUHAQDzCgAhxgcQANAMACHHBxAA0AwAIcgHEADQDAAhygdAAJULACHLB0AAlQsAIcwHQACVCwAhzQdAAJULACHOB0AAlQsAIc8HAQCTCwAhyggAAFAAIMsIAABQACAfEwAAnAwAIBUAAJYMACAWAADlCwAgGgAA5gsAIB8AAKUMACA5AACkDAAgOgAApgwAIMkGAACiDAAwygYAACMAEMsGAACiDAAwzAYBAJMLACHTBkAA9QoAIdQGQAD1CgAh8AYBAJMLACGbBwEA8woAIaUHAQCTCwAhrgcBAJMLACG0ByAAlAsAId8HAgCPDAAh6gcgAJQLACGCCAEA8woAIYMIAQDzCgAhkAgBAPMKACGbCAAA9AoAIJ0IAQDzCgAhnggBAPMKACGfCAEA8woAIaAIAAD0CgAgoQgQAKMMACHKCAAAIwAgywgAACMAIBUSAADSDAAgHwAApQwAIMkGAADPDAAwygYAAFwAEMsGAADPDAAwzAYBAJMLACHTBkAA9QoAIdQGQAD1CgAh8AYBAJMLACGbBwEA8woAIaUHAQCTCwAhrgcBAJMLACG9BwEAkwsAId8HAgCPDAAh6gcgAJQLACGYCBAA0AwAIZoIAADRDJoIIpsIAAD0CgAgnAggAJQLACHKCAAAXAAgywgAAFwAICAXAAD4DAAgGwAAwwwAIBwAAOwMACAdAADMDAAgIQAApQwAICIAAOoLACA7AQDzCgAhyQYAAPYMADDKBgAAUAAQywYAAPYMADDMBgEAkwsAIc0GAQDzCgAh0wZAAPUKACHUBkAA9QoAIewGAAD3DMoHIv4GAQCTCwAhqwcBAPMKACGuBwEAkwsAIcEHEADQDAAhwgcBAPMKACHDBwEAkwsAIcQHAQDzCgAhxQcBAPMKACHGBxAA0AwAIccHEADQDAAhyAcQANAMACHKB0AAlQsAIcsHQACVCwAhzAdAAJULACHNB0AAlQsAIc4HQACVCwAhzwcBAJMLACEE1QYAAADKBwLWBgAAAMoHCNcGAAAAygcI3AYAAMcLygciHxIAAPQMACAbAADDDAAgIwAA5wsAIDYAAMIMACA5AACkDAAgOwAAkg0AIDwAAMAMACDJBgAAjg0AMMoGAAA2ABDLBgAAjg0AMMwGAQCTCwAh0wZAAPUKACHUBkAA9QoAIewGAACPDfQHIoYHAQDzCgAhlgcBAPMKACGiBwEA8woAIaUHAQCTCwAhpgcBAJMLACGnBwEA8woAIasHAQDzCgAhvQcBAPMKACHXBwEA8woAIdoHAACQDfUHIuYHAQDzCgAh6QcBAPMKACHyBwEA8woAIfYHAACRDfYHIvcHQACVCwAhyggAADYAIMsIAAA2ACAmEgAA9AwAIBsAAMMMACAjAADnCwAgJAAA6AsAICUAAOkLACAnAACyDAAgKAAAsQwAICkAAPwMACAqAAD9DAAgKwAA_gwAICwAAP8MACAtAACADQAgLgAAgQ0AIC8AAIINACAwAACDDQAgMQAAhA0AIDIAAIUNACAzAACGDQAgNAAAhw0AIMkGAAD5DAAwygYAAEwAEMsGAAD5DAAwzAYBAJMLACHTBkAA9QoAIdQGQAD1CgAh7AYAAPsM5gci8AYBAJMLACGbBwEA8woAIaUHAQCTCwAhqwcBAPMKACGuBwEAkwsAIb0HAQDzCgAh3AdAAJULACHeB0AAlQsAIeQHAAD6DOQHIuYHEACjDAAh5wdAAJULACHoBwIAjwwAIQTVBgAAAOQHAtYGAAAA5AcI1wYAAADkBwjcBgAA4QvkByIE1QYAAADmBwLWBgAAAOYHCNcGAAAA5gcI3AYAAN8L5gciA-sHAAB-ACDsBwAAfgAg7QcAAH4AIAPrBwAAhQEAIOwHAACFAQAg7QcAAIUBACAD6wcAAIwBACDsBwAAjAEAIO0HAACMAQAgA-sHAACQAQAg7AcAAJABACDtBwAAkAEAIAPrBwAAlAEAIOwHAACUAQAg7QcAAJQBACASCQEA8woAIRwAAPYKACA7AQDzCgAhyQYAAJILADDKBgAAmAEAEMsGAACSCwAwzAYBAJMLACHNBgEAkwsAIdMGQAD1CgAh1AZAAPUKACGDBwEAkwsAIYQHAQDzCgAhhQcBAPMKACGGBwEA8woAIYcHIACUCwAhiAdAAJULACHKCAAAmAEAIMsIAACYAQAgA-sHAACaAQAg7AcAAJoBACDtBwAAmgEAIAPrBwAAngEAIOwHAACeAQAg7QcAAJ4BACAD6wcAAKIBACDsBwAAogEAIO0HAACiAQAgA-sHAACmAQAg7AcAAKYBACDtBwAApgEAIAPrBwAAqgEAIOwHAACqAQAg7QcAAKoBACAPHAAA9goAIMkGAADyCgAwygYAAK4BABDLBgAA8goAMMwGAQCTCwAhzQYBAJMLACHOBgEA8woAIc8GAQDzCgAh0AYBAPMKACHRBgEA8woAIdIGAAD0CgAg0wZAAPUKACHUBkAA9QoAIcoIAACuAQAgywgAAK4BACASHAAA9goAIDUAAIsNACA2AADCDAAgyQYAAIgNADDKBgAARAAQywYAAIgNADDMBgEAkwsAIc0GAQCTCwAh0wZAAPUKACHUBkAA9QoAIewGAACJDdkHIv4GAQCTCwAhmwcBAPMKACHWBwEA8woAIdcHAQDzCgAh2gcAAIoN2gci2wdAAJULACHcB0AAlQsAIQTVBgAAANkHAtYGAAAA2QcI1wYAAADZBwjcBgAA0gvZByIE1QYAAADaBwLWBgAAANoHCNcGAAAA2gcI3AYAANAL2gciEhwAAPYKACAoAACxDAAgyQYAAOMMADDKBgAAfgAQywYAAOMMADDMBgEAkwsAIc0GAQCTCwAh0wZAAPUKACHUBkAA9QoAIewGAADkDN4HIv4GAQCTCwAhmwcBAPMKACHbB0AAlQsAIdwHQACVCwAh3gdAAJULACHfBwIAjwwAIcoIAAB-ACDLCAAAfgAgEBIAAPQMACAXAADODAAgNgAAwgwAIDsBAPMKACHJBgAAjA0AMMoGAAA6ABDLBgAAjA0AMMwGAQCTCwAh0wZAAPUKACHUBkAA9QoAIewGAACNDfEHIr0HAQDzCgAhwgcBAJMLACHXBwEA8woAIe4HQACVCwAh7wcBAPMKACEE1QYAAADxBwLWBgAAAPEHCNcGAAAA8QcI3AYAAO4L8QciHRIAAPQMACAbAADDDAAgIwAA5wsAIDYAAMIMACA5AACkDAAgOwAAkg0AIDwAAMAMACDJBgAAjg0AMMoGAAA2ABDLBgAAjg0AMMwGAQCTCwAh0wZAAPUKACHUBkAA9QoAIewGAACPDfQHIoYHAQDzCgAhlgcBAPMKACGiBwEA8woAIaUHAQCTCwAhpgcBAJMLACGnBwEA8woAIasHAQDzCgAhvQcBAPMKACHXBwEA8woAIdoHAACQDfUHIuYHAQDzCgAh6QcBAPMKACHyBwEA8woAIfYHAACRDfYHIvcHQACVCwAhBNUGAAAA9AcC1gYAAAD0BwjXBgAAAPQHCNwGAAD9C_QHIgTVBgAAAPUHAtYGAAAA9QcI1wYAAAD1BwjcBgAA-wv1ByIE1QYAAAD2BwLWBgAAAPYHCNcGAAAA9gcI3AYAAPkL9gciA-sHAADUAQAg7AcAANQBACDtBwAA1AEAIAK9BwEAAAABjggBAAAAAQgSAADSDAAgFAAAlQ0AIMkGAACUDQAwygYAADAAEMsGAACUDQAwzAYBAJMLACG9BwEAkwsAIY4IAQCTCwAhGREAAJYMACDJBgAAlQwAMMoGAADwAwAQywYAAJUMADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACHsBgAAkgyHCCLwBgEAkwsAIfIGQACVCwAh_AYAAPQKACD-BgEAkwsAIZYHAQDzCgAhtAcgAJQLACGCCAEA8woAIYMIAQDzCgAhiQgBAPMKACGPCAEA8woAIZAIAQDzCgAhkQgBAPMKACGSCAEA8woAIZMIAQDzCgAhlAgBAPMKACHKCAAA8AMAIMsIAADwAwAgDA8AAJcNACDJBgAAlg0AMMoGAAApABDLBgAAlg0AMMwGAQCTCwAh0wZAAPUKACGKBwEAkwsAIdIHAQDzCgAh3wcCAI8MACH4BwEA8woAIfkHAQDzCgAhlQgBAJMLACEaEAAAmwwAIBEAAJwMACDJBgAAmgwAMMoGAACrAwAQywYAAJoMADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACHpBgEA8woAIewGAACSDIcIIvAGAQCTCwAh8gZAAJULACH-BgEAkwsAIZYHAQDzCgAhmwcBAPMKACG0ByAAlAsAIYIIAQDzCgAhgwgBAPMKACGJCAEA8woAIY8IAQDzCgAhkAgBAPMKACGUCAAA9AoAIJYIAQDzCgAhlwgAAPQKACDKCAAAqwMAIMsIAACrAwAgAr0HAQAAAAGVCAEAAAABCA8AAJcNACASAADSDAAgyQYAAJkNADDKBgAAJQAQywYAAJkNADDMBgEAkwsAIb0HAQCTCwAhlQgBAJMLACEMFwAAzgwAIB0AAOQLACDJBgAAmg0AMMoGAAAfABDLBgAAmg0AMMwGAQCTCwAh0wZAAPUKACGbBwEAkwsAIZ4HAACbDfIHIrwHAAD0CgAgwgcBAJMLACHPBwEA8woAIQTVBgAAAPIHAtYGAAAA8gcI1wYAAADyBwjcBgAA8gvyByIC_AcBAAAAAf0HAQAAAAEICwAAng0AIAwAAJ8NACDJBgAAnQ0AMMoGAAAYABDLBgAAnQ0AMMwGAQCTCwAh_AcBAJMLACH9BwEAkwsAIRgJAAChDQAgCgAA5AsAIA0AAIUMACDJBgAAoA0AMMoGAAAOABDLBgAAoA0AMMwGAQCTCwAh0wZAAPUKACHUBkAA9QoAIewGAACSDIcIIvAGAQCTCwAh8gZAAJULACH-BgEAkwsAIa8HAQCTCwAh_gcBAPMKACH_BwEA8woAIYAIAQDzCgAhgQgBAPMKACGCCAEA8woAIYMIAQDzCgAhhAgBAPMKACGFCAAA9AoAIMoIAAAOACDLCAAADgAgCwcAAIUMACDJBgAAhAwAMMoGAACDBQAQywYAAIQMADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACHwBgEAkwsAIaUHAQCTCwAhyggAAIMFACDLCAAAgwUAIBYJAAChDQAgCgAA5AsAIA0AAIUMACDJBgAAoA0AMMoGAAAOABDLBgAAoA0AMMwGAQCTCwAh0wZAAPUKACHUBkAA9QoAIewGAACSDIcIIvAGAQCTCwAh8gZAAJULACH-BgEAkwsAIa8HAQCTCwAh_gcBAPMKACH_BwEA8woAIYAIAQDzCgAhgQgBAPMKACGCCAEA8woAIYMIAQDzCgAhhAgBAPMKACGFCAAA9AoAIA0HAACMDAAgyQYAAIsMADDKBgAAEgAQywYAAIsMADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACHwBgEAkwsAIZsHAQDzCgAhpQcBAJMLACHqByAAlAsAIcoIAAASACDLCAAAEgAgCgQAAMwMACDJBgAAog0AMMoGAAAKABDLBgAAog0AMMwGAQCTCwAh0wZAAPUKACHUBkAA9QoAIZwHAQCTCwAhswgBAJMLACG0CAEAkwsAIQK3CAEAAAABuAgBAAAAARIEAADMDAAgyQYAAKQNADDKBgAABgAQywYAAKQNADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACGcBwEAkwsAIbcIAQCTCwAhuAgBAJMLACG5CAEA8woAIboIAQDzCgAhuwgBAPMKACG8CAEA8woAIb0IQACVCwAhvghAAJULACG_CAEA8woAIcAIAQDzCgAhDAQAAMwMACDJBgAApQ0AMMoGAAADABDLBgAApQ0AMMwGAQCTCwAh0wZAAPUKACHUBkAA9QoAIZwHAQCTCwAhtghAAPUKACHBCAEAkwsAIcIIAQDzCgAhwwgBAPMKACEAAAAAAc8IAQAAAAEBzwgBAAAAAQHPCEAAAAABBU0AALkYACBOAAC8GAAgzAgAALoYACDNCAAAuxgAINIIAABOACADTQAAuRgAIMwIAAC6GAAg0ggAAE4AIBoSAADWFQAgGwAAwhUAICMAAIMSACAkAACEEgAgJQAAhRIAICcAAM8UACAoAADOFAAgKQAA2RUAICoAANoVACArAADbFQAgLAAA3BUAIC0AAN0VACAuAADeFQAgLwAA3xUAIDAAAOAVACAxAADhFQAgMgAA4hUAIDMAAOMVACA0AADkFQAgmwcAAKYNACCrBwAApg0AIL0HAACmDQAg3AcAAKYNACDeBwAApg0AIOYHAACmDQAg5wcAAKYNACAAAAAAAAXPCAIAAAAB1QgCAAAAAdYIAgAAAAHXCAIAAAAB2AgCAAAAAQHPCAAAAOwGAgVNAAC0GAAgTgAAtxgAIMwIAAC1GAAgzQgAALYYACDSCAAATgAgA00AALQYACDMCAAAtRgAINIIAABOACAAAAABzwhAAAAAAQVNAACvGAAgTgAAshgAIMwIAACwGAAgzQgAALEYACDSCAAATgAgA00AAK8YACDMCAAAsBgAINIIAABOACAAAAAAAAHPCAAAAPQGAgXPCBAAAAAB1QgQAAAAAdYIEAAAAAHXCBAAAAAB2AgQAAAAAQVNAACqGAAgTgAArRgAIMwIAACrGAAgzQgAAKwYACDSCAAATgAgA00AAKoYACDMCAAAqxgAINIIAABOACAAAAAAAAHPCAAAAPkGAgVNAAClGAAgTgAAqBgAIMwIAACmGAAgzQgAAKcYACDSCAAATgAgA00AAKUYACDMCAAAphgAINIIAABOACAAAAAAAAVNAACgGAAgTgAAoxgAIMwIAAChGAAgzQgAAKIYACDSCAAATgAgA00AAKAYACDMCAAAoRgAINIIAABOACAAAAABzwggAAAAAQVNAACbGAAgTgAAnhgAIMwIAACcGAAgzQgAAJ0YACDSCAAATgAgA00AAJsYACDMCAAAnBgAINIIAABOACAAAAABzwgAAACMBwIFTQAAlhgAIE4AAJkYACDMCAAAlxgAIM0IAACYGAAg0ggAAE4AIANNAACWGAAgzAgAAJcYACDSCAAATgAgAAAAAAABzwgAAACSBwIFTQAAkRgAIE4AAJQYACDMCAAAkhgAIM0IAACTGAAg0ggAAE4AIANNAACRGAAgzAgAAJIYACDSCAAATgAgAAAAAAABzwgAAACVBwIFTQAAjBgAIE4AAI8YACDMCAAAjRgAIM0IAACOGAAg0ggAAE4AIANNAACMGAAgzAgAAI0YACDSCAAATgAgAAAAAAAAAc8IAAAAngcCAc8IAAAAoAcDBU0AAIcYACBOAACKGAAgzAgAAIgYACDNCAAAiRgAINIIAADIAgAgA00AAIcYACDMCAAAiBgAINIIAADIAgAgAAAAAc8IAAAAqgcCAAAAAAABzwgAAACtBwIFTQAA_xcAIE4AAIUYACDMCAAAgBgAIM0IAACEGAAg0ggAAKwGACAHTQAA_RcAIE4AAIIYACDMCAAA_hcAIM0IAACBGAAg0AgAAEwAINEIAABMACDSCAAATgAgA00AAP8XACDMCAAAgBgAINIIAACsBgAgA00AAP0XACDMCAAA_hcAINIIAABOACAAAAAAAAXPCAIAAAAB1QgCAAAAAdYIAgAAAAHXCAIAAAAB2AgCAAAAAQVNAAD1FwAgTgAA-xcAIMwIAAD2FwAgzQgAAPoXACDSCAAArAYAIAdNAADzFwAgTgAA-BcAIMwIAAD0FwAgzQgAAPcXACDQCAAATAAg0QgAAEwAINIIAABOACADTQAA9RcAIMwIAAD2FwAg0ggAAKwGACADTQAA8xcAIMwIAAD0FwAg0ggAAE4AIAAAAAAAAc8IAAAAtwcCBc8IEAAAAAHVCBAAAAAB1ggQAAAAAdcIEAAAAAHYCBAAAAABAc8IAAAAugcCB00AAOsXACBOAADxFwAgzAgAAOwXACDNCAAA8BcAINAIAABQACDRCAAAUAAg0ggAAFIAIAdNAADpFwAgTgAA7hcAIMwIAADqFwAgzQgAAO0XACDQCAAASAAg0QgAAEgAINIIAACsBgAgA00AAOsXACDMCAAA7BcAINIIAABSACADTQAA6RcAIMwIAADqFwAg0ggAAKwGACAAAAAAAAVNAADeFwAgTgAA5xcAIMwIAADfFwAgzQgAAOYXACDSCAAAUgAgB00AANwXACBOAADkFwAgzAgAAN0XACDNCAAA4xcAINAIAAAjACDRCAAAIwAg0ggAAPoCACAHTQAA2hcAIE4AAOEXACDMCAAA2xcAIM0IAADgFwAg0AgAAFwAINEIAABcACDSCAAAyAEAIANNAADeFwAgzAgAAN8XACDSCAAAUgAgA00AANwXACDMCAAA3RcAINIIAAD6AgAgA00AANoXACDMCAAA2xcAINIIAADIAQAgAAAAAAABzwgAAADKBwIHTQAAyhcAIE4AANgXACDMCAAAyxcAIM0IAADXFwAg0AgAADYAINEIAAA2ACDSCAAAOAAgB00AAMgXACBOAADVFwAgzAgAAMkXACDNCAAA1BcAINAIAABIACDRCAAASAAg0ggAAKwGACAHTQAAxhcAIE4AANIXACDMCAAAxxcAIM0IAADRFwAg0AgAAEwAINEIAABMACDSCAAATgAgBU0AAMQXACBOAADPFwAgzAgAAMUXACDNCAAAzhcAINIIAADIAgAgC00AAMQOADBOAADJDgAwzAgAAMUOADDNCAAAxg4AMM4IAADHDgAgzwgAAMgOADDQCAAAyA4AMNEIAADIDgAw0ggAAMgOADDTCAAAyg4AMNQIAADLDgAwC00AALgOADBOAAC9DgAwzAgAALkOADDNCAAAug4AMM4IAAC7DgAgzwgAALwOADDQCAAAvA4AMNEIAAC8DgAw0ggAALwOADDTCAAAvg4AMNQIAAC_DgAwDRsAAKAOACDMBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAALoHAqsHAQAAAAGtBxAAAAABrgcBAAAAAbcHAAAAtwcCuAcBAAAAAboHAQAAAAG7B0AAAAABvAeAAAAAAQIAAABiACBNAADDDgAgAwAAAGIAIE0AAMMOACBOAADCDgAgAUYAAM0XADASGwAAwwwAIB4AAPEMACDJBgAA7gwAMMoGAABgABDLBgAA7gwAMMwGAQAAAAHTBkAA9QoAIdQGQAD1CgAh7AYAAPAMugciqwcBAPMKACGtBxAA0AwAIa4HAQCTCwAhtQcBAPMKACG3BwAA7wy3ByK4BwEAAAABugcBAPMKACG7B0AAlQsAIbwHAAD0CgAgAgAAAGIAIEYAAMIOACACAAAAwA4AIEYAAMEOACAQyQYAAL8OADDKBgAAwA4AEMsGAAC_DgAwzAYBAJMLACHTBkAA9QoAIdQGQAD1CgAh7AYAAPAMugciqwcBAPMKACGtBxAA0AwAIa4HAQCTCwAhtQcBAPMKACG3BwAA7wy3ByK4BwEA8woAIboHAQDzCgAhuwdAAJULACG8BwAA9AoAIBDJBgAAvw4AMMoGAADADgAQywYAAL8OADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACHsBgAA8Ay6ByKrBwEA8woAIa0HEADQDAAhrgcBAJMLACG1BwEA8woAIbcHAADvDLcHIrgHAQDzCgAhugcBAPMKACG7B0AAlQsAIbwHAAD0CgAgDMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACcDroHIqsHAQCrDQAhrQcQAJsOACGuBwEAqg0AIbcHAACaDrcHIrgHAQCrDQAhugcBAKsNACG7B0AAvA0AIbwHgAAAAAENGwAAng4AIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACcDroHIqsHAQCrDQAhrQcQAJsOACGuBwEAqg0AIbcHAACaDrcHIrgHAQCrDQAhugcBAKsNACG7B0AAvA0AIbwHgAAAAAENGwAAoA4AIMwGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAAugcCqwcBAAAAAa0HEAAAAAGuBwEAAAABtwcAAAC3BwK4BwEAAAABugcBAAAAAbsHQAAAAAG8B4AAAAABCxIAAKoOACAgAACrDgAgzAYBAAAAAdMGQAAAAAH-BgEAAAABmwcBAAAAAb0HAQAAAAG-BwEAAAABvwcCAAAAAcAHEAAAAAHBBxAAAAABAgAAAFkAIE0AAM8OACADAAAAWQAgTQAAzw4AIE4AAM4OACABRgAAzBcAMBASAAD0DAAgHgAA8wwAICAAAPUMACDJBgAA8gwAMMoGAABXABDLBgAA8gwAMMwGAQAAAAHTBkAA9QoAIf4GAQCTCwAhmwcBAPMKACG1BwEAkwsAIb0HAQDzCgAhvgcBAPMKACG_BwIAjwwAIcAHEADQDAAhwQcQANAMACECAAAAWQAgRgAAzg4AIAIAAADMDgAgRgAAzQ4AIA3JBgAAyw4AMMoGAADMDgAQywYAAMsOADDMBgEAkwsAIdMGQAD1CgAh_gYBAJMLACGbBwEA8woAIbUHAQCTCwAhvQcBAPMKACG-BwEA8woAIb8HAgCPDAAhwAcQANAMACHBBxAA0AwAIQ3JBgAAyw4AMMoGAADMDgAQywYAAMsOADDMBgEAkwsAIdMGQAD1CgAh_gYBAJMLACGbBwEA8woAIbUHAQCTCwAhvQcBAPMKACG-BwEA8woAIb8HAgCPDAAhwAcQANAMACHBBxAA0AwAIQnMBgEAqg0AIdMGQACsDQAh_gYBAKoNACGbBwEAqw0AIb0HAQCrDQAhvgcBAKsNACG_BwIAkA4AIcAHEACbDgAhwQcQAJsOACELEgAApw4AICAAAKgOACDMBgEAqg0AIdMGQACsDQAh_gYBAKoNACGbBwEAqw0AIb0HAQCrDQAhvgcBAKsNACG_BwIAkA4AIcAHEACbDgAhwQcQAJsOACELEgAAqg4AICAAAKsOACDMBgEAAAAB0wZAAAAAAf4GAQAAAAGbBwEAAAABvQcBAAAAAb4HAQAAAAG_BwIAAAABwAcQAAAAAcEHEAAAAAEDTQAAyhcAIMwIAADLFwAg0ggAADgAIANNAADIFwAgzAgAAMkXACDSCAAArAYAIANNAADGFwAgzAgAAMcXACDSCAAATgAgA00AAMQXACDMCAAAxRcAINIIAADIAgAgBE0AAMQOADDMCAAAxQ4AMM4IAADHDgAg0ggAAMgOADAETQAAuA4AMMwIAAC5DgAwzggAALsOACDSCAAAvA4AMAAAAAAAAc8IAAAA1gcCBU0AAL8XACBOAADCFwAgzAgAAMAXACDNCAAAwRcAINIIAABOACADTQAAvxcAIMwIAADAFwAg0ggAAE4AIAAAAAHPCAAAANkHAgHPCAAAANoHAgVNAAC0FwAgTgAAvRcAIMwIAAC1FwAgzQgAALwXACDSCAAATgAgB00AALIXACBOAAC6FwAgzAgAALMXACDNCAAAuRcAINAIAAB-ACDRCAAAfgAg0ggAAIABACAHTQAAsBcAIE4AALcXACDMCAAAsRcAIM0IAAC2FwAg0AgAAD8AINEIAAA_ACDSCAAA4AIAIANNAAC0FwAgzAgAALUXACDSCAAATgAgA00AALIXACDMCAAAsxcAINIIAACAAQAgA00AALAXACDMCAAAsRcAINIIAADgAgAgAAAAAAABzwgAAADeBwIFTQAAqhcAIE4AAK4XACDMCAAAqxcAIM0IAACtFwAg0ggAAE4AIAtNAADxDgAwTgAA9g4AMMwIAADyDgAwzQgAAPMOADDOCAAA9A4AIM8IAAD1DgAw0AgAAPUOADDRCAAA9Q4AMNIIAAD1DgAw0wgAAPcOADDUCAAA-A4AMA0cAADmDgAgNgAA6A4AIMwGAQAAAAHNBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAANkHAv4GAQAAAAGbBwEAAAAB1wcBAAAAAdoHAAAA2gcC2wdAAAAAAdwHQAAAAAECAAAARgAgTQAA_A4AIAMAAABGACBNAAD8DgAgTgAA-w4AIAFGAACsFwAwEhwAAPYKACA1AACLDQAgNgAAwgwAIMkGAACIDQAwygYAAEQAEMsGAACIDQAwzAYBAAAAAc0GAQCTCwAh0wZAAPUKACHUBkAA9QoAIewGAACJDdkHIv4GAQCTCwAhmwcBAPMKACHWBwEA8woAIdcHAQDzCgAh2gcAAIoN2gci2wdAAJULACHcB0AAlQsAIQIAAABGACBGAAD7DgAgAgAAAPkOACBGAAD6DgAgD8kGAAD4DgAwygYAAPkOABDLBgAA-A4AMMwGAQCTCwAhzQYBAJMLACHTBkAA9QoAIdQGQAD1CgAh7AYAAIkN2Qci_gYBAJMLACGbBwEA8woAIdYHAQDzCgAh1wcBAPMKACHaBwAAig3aByLbB0AAlQsAIdwHQACVCwAhD8kGAAD4DgAwygYAAPkOABDLBgAA-A4AMMwGAQCTCwAhzQYBAJMLACHTBkAA9QoAIdQGQAD1CgAh7AYAAIkN2Qci_gYBAJMLACGbBwEA8woAIdYHAQDzCgAh1wcBAPMKACHaBwAAig3aByLbB0AAlQsAIdwHQACVCwAhC8wGAQCqDQAhzQYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAAOEO2Qci_gYBAKoNACGbBwEAqw0AIdcHAQCrDQAh2gcAAOIO2gci2wdAALwNACHcB0AAvA0AIQ0cAADjDgAgNgAA5Q4AIMwGAQCqDQAhzQYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAAOEO2Qci_gYBAKoNACGbBwEAqw0AIdcHAQCrDQAh2gcAAOIO2gci2wdAALwNACHcB0AAvA0AIQ0cAADmDgAgNgAA6A4AIMwGAQAAAAHNBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAANkHAv4GAQAAAAGbBwEAAAAB1wcBAAAAAdoHAAAA2gcC2wdAAAAAAdwHQAAAAAEDTQAAqhcAIMwIAACrFwAg0ggAAE4AIARNAADxDgAwzAgAAPIOADDOCAAA9A4AINIIAAD1DgAwAAAAAc8IAAAA4gcCBU0AAKIXACBOAACoFwAgzAgAAKMXACDNCAAApxcAINIIAABOACAFTQAAoBcAIE4AAKUXACDMCAAAoRcAIM0IAACkFwAg0ggAAOACACADTQAAohcAIMwIAACjFwAg0ggAAE4AIANNAACgFwAgzAgAAKEXACDSCAAA4AIAIAAAAAAAAc8IAAAA5AcCAc8IAAAA5gcCB00AAIkXACBOAACeFwAgzAgAAIoXACDNCAAAnRcAINAIAABIACDRCAAASAAg0ggAAKwGACAHTQAAhxcAIE4AAJsXACDMCAAAiBcAIM0IAACaFwAg0AgAACMAINEIAAAjACDSCAAA-gIAIAtNAADQEAAwTgAA1RAAMMwIAADREAAwzQgAANIQADDOCAAA0xAAIM8IAADUEAAw0AgAANQQADDRCAAA1BAAMNIIAADUEAAw0wgAANYQADDUCAAA1xAAMAtNAADEEAAwTgAAyRAAMMwIAADFEAAwzQgAAMYQADDOCAAAxxAAIM8IAADIEAAw0AgAAMgQADDRCAAAyBAAMNIIAADIEAAw0wgAAMoQADDUCAAAyxAAMAtNAAC7EAAwTgAAvxAAMMwIAAC8EAAwzQgAAL0QADDOCAAAvhAAIM8IAAD1DgAw0AgAAPUOADDRCAAA9Q4AMNIIAAD1DgAw0wgAAMAQADDUCAAA-A4AMAtNAACvEAAwTgAAtBAAMMwIAACwEAAwzQgAALEQADDOCAAAshAAIM8IAACzEAAw0AgAALMQADDRCAAAsxAAMNIIAACzEAAw0wgAALUQADDUCAAAthAAMAtNAACjEAAwTgAAqBAAMMwIAACkEAAwzQgAAKUQADDOCAAAphAAIM8IAACnEAAw0AgAAKcQADDRCAAApxAAMNIIAACnEAAw0wgAAKkQADDUCAAAqhAAMAtNAACXEAAwTgAAnBAAMMwIAACYEAAwzQgAAJkQADDOCAAAmhAAIM8IAACbEAAw0AgAAJsQADDRCAAAmxAAMNIIAACbEAAw0wgAAJ0QADDUCAAAnhAAMAtNAACLEAAwTgAAkBAAMMwIAACMEAAwzQgAAI0QADDOCAAAjhAAIM8IAACPEAAw0AgAAI8QADDRCAAAjxAAMNIIAACPEAAw0wgAAJEQADDUCAAAkhAAMAtNAAD_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-QYC-gYCAAAAAfsGAgAAAAH8BoAAAAAB_QYBAAAAAQIAAACgAQAgTQAA1Q8AIAMAAACgAQAgTQAA1Q8AIE4AANQPACABRgAAlhcAMA4cAAD2CgAgyQYAANkMADDKBgAAngEAEMsGAADZDAAwzAYBAAAAAc0GAQCTCwAh0wZAAPUKACHxBgEAkwsAIfcGQAD1CgAh-QYAANoM-QYi-gYCAIAMACH7BgIAgAwAIfwGAAD0CgAg_QYBAPMKACECAAAAoAEAIEYAANQPACACAAAA0g8AIEYAANMPACANyQYAANEPADDKBgAA0g8AEMsGAADRDwAwzAYBAJMLACHNBgEAkwsAIdMGQAD1CgAh8QYBAJMLACH3BkAA9QoAIfkGAADaDPkGIvoGAgCADAAh-wYCAIAMACH8BgAA9AoAIP0GAQDzCgAhDckGAADRDwAwygYAANIPABDLBgAA0Q8AMMwGAQCTCwAhzQYBAJMLACHTBkAA9QoAIfEGAQCTCwAh9wZAAPUKACH5BgAA2gz5BiL6BgIAgAwAIfsGAgCADAAh_AYAAPQKACD9BgEA8woAIQnMBgEAqg0AIdMGQACsDQAh8QYBAKoNACH3BkAArA0AIfkGAADNDfkGIvoGAgC1DQAh-wYCALUNACH8BoAAAAAB_QYBAKsNACEJzAYBAKoNACHTBkAArA0AIfEGAQCqDQAh9wZAAKwNACH5BgAAzQ35BiL6BgIAtQ0AIfsGAgC1DQAh_AaAAAAAAf0GAQCrDQAhCcwGAQAAAAHTBkAAAAAB8QYBAAAAAfcGQAAAAAH5BgAAAPkGAvoGAgAAAAH7BgIAAAAB_AaAAAAAAf0GAQAAAAEIzAYBAAAAAdMGQAAAAAH9BgEAAAAB_gYBAAAAAf8GQAAAAAGABwIAAAABgQeAAAAAAYIHAQAAAAECAAAAnAEAIE0AAOEPACADAAAAnAEAIE0AAOEPACBOAADgDwAgAUYAAJUXADANHAAA9goAIMkGAADbDAAwygYAAJoBABDLBgAA2wwAMMwGAQAAAAHNBgEAkwsAIdMGQAD1CgAh_QYBAPMKACH-BgEA8woAIf8GQAD1CgAhgAcCAIAMACGBBwAA9AoAIIIHAQDzCgAhAgAAAJwBACBGAADgDwAgAgAAAN4PACBGAADfDwAgDMkGAADdDwAwygYAAN4PABDLBgAA3Q8AMMwGAQCTCwAhzQYBAJMLACHTBkAA9QoAIf0GAQDzCgAh_gYBAPMKACH_BkAA9QoAIYAHAgCADAAhgQcAAPQKACCCBwEA8woAIQzJBgAA3Q8AMMoGAADeDwAQywYAAN0PADDMBgEAkwsAIc0GAQCTCwAh0wZAAPUKACH9BgEA8woAIf4GAQDzCgAh_wZAAPUKACGABwIAgAwAIYEHAAD0CgAgggcBAPMKACEIzAYBAKoNACHTBkAArA0AIf0GAQCrDQAh_gYBAKsNACH_BkAArA0AIYAHAgC1DQAhgQeAAAAAAYIHAQCrDQAhCMwGAQCqDQAh0wZAAKwNACH9BgEAqw0AIf4GAQCrDQAh_wZAAKwNACGABwIAtQ0AIYEHgAAAAAGCBwEAqw0AIQjMBgEAAAAB0wZAAAAAAf0GAQAAAAH-BgEAAAAB_wZAAAAAAYAHAgAAAAGBB4AAAAABggcBAAAAAQsJAQAAAAE7AQAAAAHMBgEAAAAB0wZAAAAAAdQGQAAAAAGDBwEAAAABhAcBAAAAAYUHAQAAAAGGBwEAAAABhwcgAAAAAYgHQAAAAAECAAAAxgkAIE0AAOIPACADAAAAmAEAIE0AAOIPACBOAADmDwAgDQAAAJgBACAJAQCrDQAhOwEAqw0AIUYAAOYPACDMBgEAqg0AIdMGQACsDQAh1AZAAKwNACGDBwEAqg0AIYQHAQCrDQAhhQcBAKsNACGGBwEAqw0AIYcHIADaDQAhiAdAALwNACELCQEAqw0AITsBAKsNACHMBgEAqg0AIdMGQACsDQAh1AZAAKwNACGDBwEAqg0AIYQHAQCrDQAhhQcBAKsNACGGBwEAqw0AIYcHIADaDQAhiAdAALwNACEIOwEAAAABzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAACMBwKJBwEAAAABigcBAAAAAYwHQAAAAAECAAAAlgEAIE0AAPIPACADAAAAlgEAIE0AAPIPACBOAADxDwAgAUYAAJQXADANHAAA9goAIDsBAPMKACHJBgAA3AwAMMoGAACUAQAQywYAANwMADDMBgEAAAABzQYBAJMLACHTBkAA9QoAIdQGQAD1CgAh7AYAAN0MjAciiQcBAJMLACGKBwEA8woAIYwHQACVCwAhAgAAAJYBACBGAADxDwAgAgAAAO8PACBGAADwDwAgDDsBAPMKACHJBgAA7g8AMMoGAADvDwAQywYAAO4PADDMBgEAkwsAIc0GAQCTCwAh0wZAAPUKACHUBkAA9QoAIewGAADdDIwHIokHAQCTCwAhigcBAPMKACGMB0AAlQsAIQw7AQDzCgAhyQYAAO4PADDKBgAA7w8AEMsGAADuDwAwzAYBAJMLACHNBgEAkwsAIdMGQAD1CgAh1AZAAPUKACHsBgAA3QyMByKJBwEAkwsAIYoHAQDzCgAhjAdAAJULACEIOwEAqw0AIcwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAADgDYwHIokHAQCqDQAhigcBAKsNACGMB0AAvA0AIQg7AQCrDQAhzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAAOANjAciiQcBAKoNACGKBwEAqw0AIYwHQAC8DQAhCDsBAAAAAcwGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAAjAcCiQcBAAAAAYoHAQAAAAGMB0AAAAABCjsBAAAAAcwGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAAkgcCjQcBAAAAAY4HAQAAAAGPBwEAAAABkAcCAAAAAZIHQAAAAAECAAAAkgEAIE0AAP4PACADAAAAkgEAIE0AAP4PACBOAAD9DwAgAUYAAJMXADAPHAAA9goAIDsBAPMKACHJBgAA3gwAMMoGAACQAQAQywYAAN4MADDMBgEAAAABzQYBAJMLACHTBkAA9QoAIdQGQAD1CgAh7AYAAN8MkgcijQcBAJMLACGOBwEAkwsAIY8HAQDzCgAhkAcCAIAMACGSB0AAlQsAIQIAAACSAQAgRgAA_Q8AIAIAAAD7DwAgRgAA_A8AIA47AQDzCgAhyQYAAPoPADDKBgAA-w8AEMsGAAD6DwAwzAYBAJMLACHNBgEAkwsAIdMGQAD1CgAh1AZAAPUKACHsBgAA3wySByKNBwEAkwsAIY4HAQCTCwAhjwcBAPMKACGQBwIAgAwAIZIHQACVCwAhDjsBAPMKACHJBgAA-g8AMMoGAAD7DwAQywYAAPoPADDMBgEAkwsAIc0GAQCTCwAh0wZAAPUKACHUBkAA9QoAIewGAADfDJIHIo0HAQCTCwAhjgcBAJMLACGPBwEA8woAIZAHAgCADAAhkgdAAJULACEKOwEAqw0AIcwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAADoDZIHIo0HAQCqDQAhjgcBAKoNACGPBwEAqw0AIZAHAgC1DQAhkgdAALwNACEKOwEAqw0AIcwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAADoDZIHIo0HAQCqDQAhjgcBAKoNACGPBwEAqw0AIZAHAgC1DQAhkgdAALwNACEKOwEAAAABzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAACSBwKNBwEAAAABjgcBAAAAAY8HAQAAAAGQBwIAAAABkgdAAAAAAQrMBgEAAAAB0wZAAAAAAfcGQAAAAAH5BgAAAPkGAo4HAQAAAAGTBwEAAAABlQcAAACVBwKWBwEAAAABlwcCAAAAAZgHAgAAAAECAAAAjgEAIE0AAIoQACADAAAAjgEAIE0AAIoQACBOAACJEAAgAUYAAJIXADAPHAAA9goAIMkGAADgDAAwygYAAIwBABDLBgAA4AwAMMwGAQAAAAHNBgEAkwsAIdMGQAD1CgAh9wZAAPUKACH5BgAA2gz5BiKOBwEA8woAIZMHAQCTCwAhlQcAAOEMlQcilgcBAPMKACGXBwIAgAwAIZgHAgCADAAhAgAAAI4BACBGAACJEAAgAgAAAIcQACBGAACIEAAgDskGAACGEAAwygYAAIcQABDLBgAAhhAAMMwGAQCTCwAhzQYBAJMLACHTBkAA9QoAIfcGQAD1CgAh-QYAANoM-QYijgcBAPMKACGTBwEAkwsAIZUHAADhDJUHIpYHAQDzCgAhlwcCAIAMACGYBwIAgAwAIQ7JBgAAhhAAMMoGAACHEAAQywYAAIYQADDMBgEAkwsAIc0GAQCTCwAh0wZAAPUKACH3BkAA9QoAIfkGAADaDPkGIo4HAQDzCgAhkwcBAJMLACGVBwAA4QyVByKWBwEA8woAIZcHAgCADAAhmAcCAIAMACEKzAYBAKoNACHTBkAArA0AIfcGQACsDQAh-QYAAM0N-QYijgcBAKsNACGTBwEAqg0AIZUHAADwDZUHIpYHAQCrDQAhlwcCALUNACGYBwIAtQ0AIQrMBgEAqg0AIdMGQACsDQAh9wZAAKwNACH5BgAAzQ35BiKOBwEAqw0AIZMHAQCqDQAhlQcAAPANlQcilgcBAKsNACGXBwIAtQ0AIZgHAgC1DQAhCswGAQAAAAHTBkAAAAAB9wZAAAAAAfkGAAAA-QYCjgcBAAAAAZMHAQAAAAGVBwAAAJUHApYHAQAAAAGXBwIAAAABmAcCAAAAARsXAADQDgAgGwAA0Q4AIB0AANMOACAhAADUDgAgIgAA1Q4AIDsBAAAAAcwGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAAygcC_gYBAAAAAasHAQAAAAGuBwEAAAABwQcQAAAAAcIHAQAAAAHDBwEAAAABxAcBAAAAAcUHAQAAAAHGBxAAAAABxwcQAAAAAcgHEAAAAAHKB0AAAAABywdAAAAAAcwHQAAAAAHNB0AAAAABzgdAAAAAAc8HAQAAAAECAAAAUgAgTQAAlhAAIAMAAABSACBNAACWEAAgTgAAlRAAIAFGAACRFwAwIBcAAPgMACAbAADDDAAgHAAA7AwAIB0AAMwMACAhAAClDAAgIgAA6gsAIDsBAPMKACHJBgAA9gwAMMoGAABQABDLBgAA9gwAMMwGAQAAAAHNBgEA8woAIdMGQAD1CgAh1AZAAPUKACHsBgAA9wzKByL-BgEAkwsAIasHAQDzCgAhrgcBAJMLACHBBxAA0AwAIcIHAQDzCgAhwwcBAAAAAcQHAQDzCgAhxQcBAPMKACHGBxAA0AwAIccHEADQDAAhyAcQANAMACHKB0AAlQsAIcsHQACVCwAhzAdAAJULACHNB0AAlQsAIc4HQACVCwAhzwcBAJMLACECAAAAUgAgRgAAlRAAIAIAAACTEAAgRgAAlBAAIBo7AQDzCgAhyQYAAJIQADDKBgAAkxAAEMsGAACSEAAwzAYBAJMLACHNBgEA8woAIdMGQAD1CgAh1AZAAPUKACHsBgAA9wzKByL-BgEAkwsAIasHAQDzCgAhrgcBAJMLACHBBxAA0AwAIcIHAQDzCgAhwwcBAJMLACHEBwEA8woAIcUHAQDzCgAhxgcQANAMACHHBxAA0AwAIcgHEADQDAAhygdAAJULACHLB0AAlQsAIcwHQACVCwAhzQdAAJULACHOB0AAlQsAIc8HAQCTCwAhGjsBAPMKACHJBgAAkhAAMMoGAACTEAAQywYAAJIQADDMBgEAkwsAIc0GAQDzCgAh0wZAAPUKACHUBkAA9QoAIewGAAD3DMoHIv4GAQCTCwAhqwcBAPMKACGuBwEAkwsAIcEHEADQDAAhwgcBAPMKACHDBwEAkwsAIcQHAQDzCgAhxQcBAPMKACHGBxAA0AwAIccHEADQDAAhyAcQANAMACHKB0AAlQsAIcsHQACVCwAhzAdAAJULACHNB0AAlQsAIc4HQACVCwAhzwcBAJMLACEWOwEAqw0AIcwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACxDsoHIv4GAQCqDQAhqwcBAKsNACGuBwEAqg0AIcEHEACbDgAhwgcBAKsNACHDBwEAqg0AIcQHAQCrDQAhxQcBAKsNACHGBxAAmw4AIccHEACbDgAhyAcQAJsOACHKB0AAvA0AIcsHQAC8DQAhzAdAALwNACHNB0AAvA0AIc4HQAC8DQAhzwcBAKoNACEbFwAAsg4AIBsAALMOACAdAAC1DgAgIQAAtg4AICIAALcOACA7AQCrDQAhzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAALEOygci_gYBAKoNACGrBwEAqw0AIa4HAQCqDQAhwQcQAJsOACHCBwEAqw0AIcMHAQCqDQAhxAcBAKsNACHFBwEAqw0AIcYHEACbDgAhxwcQAJsOACHIBxAAmw4AIcoHQAC8DQAhywdAALwNACHMB0AAvA0AIc0HQAC8DQAhzgdAALwNACHPBwEAqg0AIRsXAADQDgAgGwAA0Q4AIB0AANMOACAhAADUDgAgIgAA1Q4AIDsBAAAAAcwGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAAygcC_gYBAAAAAasHAQAAAAGuBwEAAAABwQcQAAAAAcIHAQAAAAHDBwEAAAABxAcBAAAAAcUHAQAAAAHGBxAAAAABxwcQAAAAAcgHEAAAAAHKB0AAAAABywdAAAAAAcwHQAAAAAHNB0AAAAABzgdAAAAAAc8HAQAAAAELGwAAiQ4AIMwGAQAAAAHTBkAAAAAB1AZAAAAAAe0GQAAAAAH-BgEAAAABmwcBAAAAAZ4HAAAArQcCqwcBAAAAAa0HEAAAAAGuBwEAAAABAgAAAG8AIE0AAKIQACADAAAAbwAgTQAAohAAIE4AAKEQACABRgAAkBcAMBAbAADrDAAgHAAA7AwAIMkGAADpDAAwygYAAG0AEMsGAADpDAAwzAYBAAAAAc0GAQDzCgAh0wZAAPUKACHUBkAA9QoAIe0GQAD1CgAh_gYBAPMKACGbBwEA8woAIZ4HAADqDK0HIqsHAQCTCwAhrQcQAKMMACGuBwEA8woAIQIAAABvACBGAAChEAAgAgAAAJ8QACBGAACgEAAgDskGAACeEAAwygYAAJ8QABDLBgAAnhAAMMwGAQCTCwAhzQYBAPMKACHTBkAA9QoAIdQGQAD1CgAh7QZAAPUKACH-BgEA8woAIZsHAQDzCgAhngcAAOoMrQciqwcBAJMLACGtBxAAowwAIa4HAQDzCgAhDskGAACeEAAwygYAAJ8QABDLBgAAnhAAMMwGAQCTCwAhzQYBAPMKACHTBkAA9QoAIdQGQAD1CgAh7QZAAPUKACH-BgEA8woAIZsHAQDzCgAhngcAAOoMrQciqwcBAJMLACGtBxAAowwAIa4HAQDzCgAhCswGAQCqDQAh0wZAAKwNACHUBkAArA0AIe0GQACsDQAh_gYBAKsNACGbBwEAqw0AIZ4HAACGDq0HIqsHAQCqDQAhrQcQAMUNACGuBwEAqw0AIQsbAACHDgAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7QZAAKwNACH-BgEAqw0AIZsHAQCrDQAhngcAAIYOrQciqwcBAKoNACGtBxAAxQ0AIa4HAQCrDQAhCxsAAIkOACDMBgEAAAAB0wZAAAAAAdQGQAAAAAHtBkAAAAAB_gYBAAAAAZsHAQAAAAGeBwAAAK0HAqsHAQAAAAGtBxAAAAABrgcBAAAAAQ0bAACTDgAgzAYBAAAAAdMGQAAAAAHUBkAAAAAB9QYCAAAAAf4GAQAAAAGrBwEAAAABrwcBAAAAAbAHAgAAAAGxBwIAAAABsgcCAAAAAbMHIAAAAAG0ByAAAAABAgAAAGoAIE0AAK4QACADAAAAagAgTQAArhAAIE4AAK0QACABRgAAjxcAMBIbAADrDAAgHAAA7AwAIMkGAADtDAAwygYAAGgAEMsGAADtDAAwzAYBAAAAAc0GAQDzCgAh0wZAAPUKACHUBkAA9QoAIfUGAgCPDAAh_gYBAPMKACGrBwEAkwsAIa8HAQCTCwAhsAcCAIAMACGxBwIAgAwAIbIHAgCADAAhswcgAJQLACG0ByAAlAsAIQIAAABqACBGAACtEAAgAgAAAKsQACBGAACsEAAgEMkGAACqEAAwygYAAKsQABDLBgAAqhAAMMwGAQCTCwAhzQYBAPMKACHTBkAA9QoAIdQGQAD1CgAh9QYCAI8MACH-BgEA8woAIasHAQCTCwAhrwcBAJMLACGwBwIAgAwAIbEHAgCADAAhsgcCAIAMACGzByAAlAsAIbQHIACUCwAhEMkGAACqEAAwygYAAKsQABDLBgAAqhAAMMwGAQCTCwAhzQYBAPMKACHTBkAA9QoAIdQGQAD1CgAh9QYCAI8MACH-BgEA8woAIasHAQCTCwAhrwcBAJMLACGwBwIAgAwAIbEHAgCADAAhsgcCAIAMACGzByAAlAsAIbQHIACUCwAhDMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIfUGAgCQDgAh_gYBAKsNACGrBwEAqg0AIa8HAQCqDQAhsAcCALUNACGxBwIAtQ0AIbIHAgC1DQAhswcgANoNACG0ByAA2g0AIQ0bAACRDgAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh9QYCAJAOACH-BgEAqw0AIasHAQCqDQAhrwcBAKoNACGwBwIAtQ0AIbEHAgC1DQAhsgcCALUNACGzByAA2g0AIbQHIADaDQAhDRsAAJMOACDMBgEAAAAB0wZAAAAAAdQGQAAAAAH1BgIAAAAB_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_iByIFJgAAhg8AIMwGAQAAAAHTBkAAAAAB4AcBAAAAAeIHAAAA4gcCA00AAIkXACDMCAAAihcAINIIAACsBgAgA00AAIcXACDMCAAAiBcAINIIAAD6AgAgBE0AANAQADDMCAAA0RAAMM4IAADTEAAg0ggAANQQADAETQAAxBAAMMwIAADFEAAwzggAAMcQACDSCAAAyBAAMARNAAC7EAAwzAgAALwQADDOCAAAvhAAINIIAAD1DgAwBE0AAK8QADDMCAAAsBAAMM4IAACyEAAg0ggAALMQADAETQAAoxAAMMwIAACkEAAwzggAAKYQACDSCAAApxAAMARNAACXEAAwzAgAAJgQADDOCAAAmhAAINIIAACbEAAwBE0AAIsQADDMCAAAjBAAMM4IAACOEAAg0ggAAI8QADAETQAA_w8AMMwIAACAEAAwzggAAIIQACDSCAAAgxAAMARNAADzDwAwzAgAAPQPADDOCAAA9g8AINIIAAD3DwAwBE0AAOcPADDMCAAA6A8AMM4IAADqDwAg0ggAAOsPADADTQAA4g8AIMwIAADjDwAg0ggAAMYJACAETQAA1g8AMMwIAADXDwAwzggAANkPACDSCAAA2g8AMARNAADKDwAwzAgAAMsPADDOCAAAzQ8AINIIAADODwAwBE0AAL4PADDMCAAAvw8AMM4IAADBDwAg0ggAAMIPADAETQAAsg8AMMwIAACzDwAwzggAALUPACDSCAAAtg8AMARNAACmDwAwzAgAAKcPADDOCAAAqQ8AINIIAACqDwAwA00AAKEPACDMCAAAog8AINIIAADMCgAgAAAAB00AAN8WACBOAACFFwAgzAgAAOAWACDNCAAAhBcAINAIAAAWACDRCAAAFgAg0ggAAMgCACALTQAAqREAME4AAK4RADDMCAAAqhEAMM0IAACrEQAwzggAAKwRACDPCAAArREAMNAIAACtEQAw0QgAAK0RADDSCAAArREAMNMIAACvEQAw1AgAALARADALTQAAnREAME4AAKIRADDMCAAAnhEAMM0IAACfEQAwzggAAKARACDPCAAAoREAMNAIAAChEQAw0QgAAKERADDSCAAAoREAMNMIAACjEQAw1AgAAKQRADALTQAAlBEAME4AAJgRADDMCAAAlREAMM0IAACWEQAwzggAAJcRACDPCAAAjxAAMNAIAACPEAAw0QgAAI8QADDSCAAAjxAAMNMIAACZEQAw1AgAAJIQADALTQAAixEAME4AAI8RADDMCAAAjBEAMM0IAACNEQAwzggAAI4RACDPCAAApxAAMNAIAACnEAAw0QgAAKcQADDSCAAApxAAMNMIAACQEQAw1AgAAKoQADALTQAAghEAME4AAIYRADDMCAAAgxEAMM0IAACEEQAwzggAAIURACDPCAAAmxAAMNAIAACbEAAw0QgAAJsQADDSCAAAmxAAMNMIAACHEQAw1AgAAJ4QADALTQAA-RAAME4AAP0QADDMCAAA-hAAMM0IAAD7EAAwzggAAPwQACDPCAAAvA4AMNAIAAC8DgAw0QgAALwOADDSCAAAvA4AMNMIAAD-EAAw1AgAAL8OADANHgAAnw4AIMwGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAAugcCrQcQAAAAAa4HAQAAAAG1BwEAAAABtwcAAAC3BwK4BwEAAAABugcBAAAAAbsHQAAAAAG8B4AAAAABAgAAAGIAIE0AAIERACADAAAAYgAgTQAAgREAIE4AAIARACABRgAAgxcAMAIAAABiACBGAACAEQAgAgAAAMAOACBGAAD_EAAgDMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACcDroHIq0HEACbDgAhrgcBAKoNACG1BwEAqw0AIbcHAACaDrcHIrgHAQCrDQAhugcBAKsNACG7B0AAvA0AIbwHgAAAAAENHgAAnQ4AIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACcDroHIq0HEACbDgAhrgcBAKoNACG1BwEAqw0AIbcHAACaDrcHIrgHAQCrDQAhugcBAKsNACG7B0AAvA0AIbwHgAAAAAENHgAAnw4AIMwGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAAugcCrQcQAAAAAa4HAQAAAAG1BwEAAAABtwcAAAC3BwK4BwEAAAABugcBAAAAAbsHQAAAAAG8B4AAAAABCxwAAIoOACDMBgEAAAABzQYBAAAAAdMGQAAAAAHUBkAAAAAB7QZAAAAAAf4GAQAAAAGbBwEAAAABngcAAACtBwKtBxAAAAABrgcBAAAAAQIAAABvACBNAACKEQAgAwAAAG8AIE0AAIoRACBOAACJEQAgAUYAAIIXADACAAAAbwAgRgAAiREAIAIAAACfEAAgRgAAiBEAIArMBgEAqg0AIc0GAQCrDQAh0wZAAKwNACHUBkAArA0AIe0GQACsDQAh_gYBAKsNACGbBwEAqw0AIZ4HAACGDq0HIq0HEADFDQAhrgcBAKsNACELHAAAiA4AIMwGAQCqDQAhzQYBAKsNACHTBkAArA0AIdQGQACsDQAh7QZAAKwNACH-BgEAqw0AIZsHAQCrDQAhngcAAIYOrQcirQcQAMUNACGuBwEAqw0AIQscAACKDgAgzAYBAAAAAc0GAQAAAAHTBkAAAAAB1AZAAAAAAe0GQAAAAAH-BgEAAAABmwcBAAAAAZ4HAAAArQcCrQcQAAAAAa4HAQAAAAENHAAAlA4AIMwGAQAAAAHNBgEAAAAB0wZAAAAAAdQGQAAAAAH1BgIAAAAB_gYBAAAAAa8HAQAAAAGwBwIAAAABsQcCAAAAAbIHAgAAAAGzByAAAAABtAcgAAAAAQIAAABqACBNAACTEQAgAwAAAGoAIE0AAJMRACBOAACSEQAgAUYAAIEXADACAAAAagAgRgAAkhEAIAIAAACrEAAgRgAAkREAIAzMBgEAqg0AIc0GAQCrDQAh0wZAAKwNACHUBkAArA0AIfUGAgCQDgAh_gYBAKsNACGvBwEAqg0AIbAHAgC1DQAhsQcCALUNACGyBwIAtQ0AIbMHIADaDQAhtAcgANoNACENHAAAkg4AIMwGAQCqDQAhzQYBAKsNACHTBkAArA0AIdQGQACsDQAh9QYCAJAOACH-BgEAqw0AIa8HAQCqDQAhsAcCALUNACGxBwIAtQ0AIbIHAgC1DQAhswcgANoNACG0ByAA2g0AIQ0cAACUDgAgzAYBAAAAAc0GAQAAAAHTBkAAAAAB1AZAAAAAAfUGAgAAAAH-BgEAAAABrwcBAAAAAbAHAgAAAAGxBwIAAAABsgcCAAAAAbMHIAAAAAG0ByAAAAABGxcAANAOACAcAADSDgAgHQAA0w4AICEAANQOACAiAADVDgAgOwEAAAABzAYBAAAAAc0GAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAAygcC_gYBAAAAAa4HAQAAAAHBBxAAAAABwgcBAAAAAcMHAQAAAAHEBwEAAAABxQcBAAAAAcYHEAAAAAHHBxAAAAAByAcQAAAAAcoHQAAAAAHLB0AAAAABzAdAAAAAAc0HQAAAAAHOB0AAAAABzwcBAAAAAQIAAABSACBNAACcEQAgAwAAAFIAIE0AAJwRACBOAACbEQAgAUYAAIAXADACAAAAUgAgRgAAmxEAIAIAAACTEAAgRgAAmhEAIBY7AQCrDQAhzAYBAKoNACHNBgEAqw0AIdMGQACsDQAh1AZAAKwNACHsBgAAsQ7KByL-BgEAqg0AIa4HAQCqDQAhwQcQAJsOACHCBwEAqw0AIcMHAQCqDQAhxAcBAKsNACHFBwEAqw0AIcYHEACbDgAhxwcQAJsOACHIBxAAmw4AIcoHQAC8DQAhywdAALwNACHMB0AAvA0AIc0HQAC8DQAhzgdAALwNACHPBwEAqg0AIRsXAACyDgAgHAAAtA4AIB0AALUOACAhAAC2DgAgIgAAtw4AIDsBAKsNACHMBgEAqg0AIc0GAQCrDQAh0wZAAKwNACHUBkAArA0AIewGAACxDsoHIv4GAQCqDQAhrgcBAKoNACHBBxAAmw4AIcIHAQCrDQAhwwcBAKoNACHEBwEAqw0AIcUHAQCrDQAhxgcQAJsOACHHBxAAmw4AIcgHEACbDgAhygdAALwNACHLB0AAvA0AIcwHQAC8DQAhzQdAALwNACHOB0AAvA0AIc8HAQCqDQAhGxcAANAOACAcAADSDgAgHQAA0w4AICEAANQOACAiAADVDgAgOwEAAAABzAYBAAAAAc0GAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAAygcC_gYBAAAAAa4HAQAAAAHBBxAAAAABwgcBAAAAAcMHAQAAAAHEBwEAAAABxQcBAAAAAcYHEAAAAAHHBxAAAAAByAcQAAAAAcoHQAAAAAHLB0AAAAABzAdAAAAAAc0HQAAAAAHOB0AAAAABzwcBAAAAASESAADdEAAgIwAA5BAAICQAAOIQACAlAADjEAAgJwAA3hAAICgAAOAQACApAADfEAAgKgAA4RAAICsAAOUQACAsAADmEAAgLQAA5xAAIC4AAOgQACAvAADpEAAgMAAA6hAAIDEAAOsQACAyAADsEAAgMwAA7RAAIDQAAO4QACDMBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAOYHAvAGAQAAAAGbBwEAAAABpQcBAAAAAa4HAQAAAAG9BwEAAAAB3AdAAAAAAd4HQAAAAAHkBwAAAOQHAuYHEAAAAAHnB0AAAAAB6AcCAAAAAQIAAABOACBNAACoEQAgAwAAAE4AIE0AAKgRACBOAACnEQAgAUYAAP8WADAmEgAA9AwAIBsAAMMMACAjAADnCwAgJAAA6AsAICUAAOkLACAnAACyDAAgKAAAsQwAICkAAPwMACAqAAD9DAAgKwAA_gwAICwAAP8MACAtAACADQAgLgAAgQ0AIC8AAIINACAwAACDDQAgMQAAhA0AIDIAAIUNACAzAACGDQAgNAAAhw0AIMkGAAD5DAAwygYAAEwAEMsGAAD5DAAwzAYBAAAAAdMGQAD1CgAh1AZAAPUKACHsBgAA-wzmByLwBgEAAAABmwcBAPMKACGlBwEAkwsAIasHAQDzCgAhrgcBAJMLACG9BwEA8woAIdwHQACVCwAh3gdAAJULACHkBwAA-gzkByLmBxAAowwAIecHQACVCwAh6AcCAI8MACECAAAATgAgRgAApxEAIAIAAAClEQAgRgAAphEAIBPJBgAApBEAMMoGAAClEQAQywYAAKQRADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACHsBgAA-wzmByLwBgEAkwsAIZsHAQDzCgAhpQcBAJMLACGrBwEA8woAIa4HAQCTCwAhvQcBAPMKACHcB0AAlQsAId4HQACVCwAh5AcAAPoM5Aci5gcQAKMMACHnB0AAlQsAIegHAgCPDAAhE8kGAACkEQAwygYAAKURABDLBgAApBEAMMwGAQCTCwAh0wZAAPUKACHUBkAA9QoAIewGAAD7DOYHIvAGAQCTCwAhmwcBAPMKACGlBwEAkwsAIasHAQDzCgAhrgcBAJMLACG9BwEA8woAIdwHQACVCwAh3gdAAJULACHkBwAA-gzkByLmBxAAowwAIecHQACVCwAh6AcCAI8MACEPzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAAI0P5gci8AYBAKoNACGbBwEAqw0AIaUHAQCqDQAhrgcBAKoNACG9BwEAqw0AIdwHQAC8DQAh3gdAALwNACHkBwAAjA_kByLmBxAAxQ0AIecHQAC8DQAh6AcCAJAOACEhEgAAjw8AICMAAJYPACAkAACUDwAgJQAAlQ8AICcAAJAPACAoAACSDwAgKQAAkQ8AICoAAJMPACArAACXDwAgLAAAmA8AIC0AAJkPACAuAACaDwAgLwAAmw8AIDAAAJwPACAxAACdDwAgMgAAng8AIDMAAJ8PACA0AACgDwAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAAI0P5gci8AYBAKoNACGbBwEAqw0AIaUHAQCqDQAhrgcBAKoNACG9BwEAqw0AIdwHQAC8DQAh3gdAALwNACHkBwAAjA_kByLmBxAAxQ0AIecHQAC8DQAh6AcCAJAOACEhEgAA3RAAICMAAOQQACAkAADiEAAgJQAA4xAAICcAAN4QACAoAADgEAAgKQAA3xAAICoAAOEQACArAADlEAAgLAAA5hAAIC0AAOcQACAuAADoEAAgLwAA6RAAIDAAAOoQACAxAADrEAAgMgAA7BAAIDMAAO0QACA0AADuEAAgzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAADmBwLwBgEAAAABmwcBAAAAAaUHAQAAAAGuBwEAAAABvQcBAAAAAdwHQAAAAAHeB0AAAAAB5AcAAADkBwLmBxAAAAAB5wdAAAAAAegHAgAAAAEYEgAA8xEAICMAAPgRACA2AAD0EQAgOQAA9xEAIDsAAPURACA8AAD2EQAgzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAAD0BwKGBwEAAAABlgcBAAAAAaIHAQAAAAGlBwEAAAABpgcBAAAAAacHAQAAAAG9BwEAAAAB1wcBAAAAAdoHAAAA9QcC5gcBAAAAAekHAQAAAAHyBwEAAAAB9gcAAAD2BwL3B0AAAAABAgAAADgAIE0AAPIRACADAAAAOAAgTQAA8hEAIE4AALYRACABRgAA_hYAMB0SAAD0DAAgGwAAwwwAICMAAOcLACA2AADCDAAgOQAApAwAIDsAAJINACA8AADADAAgyQYAAI4NADDKBgAANgAQywYAAI4NADDMBgEAAAAB0wZAAPUKACHUBkAA9QoAIewGAACPDfQHIoYHAQDzCgAhlgcBAPMKACGiBwEA8woAIaUHAQCTCwAhpgcBAJMLACGnBwEA8woAIasHAQDzCgAhvQcBAPMKACHXBwEA8woAIdoHAACQDfUHIuYHAQDzCgAh6QcBAPMKACHyBwEA8woAIfYHAACRDfYHIvcHQACVCwAhAgAAADgAIEYAALYRACACAAAAsREAIEYAALIRACAWyQYAALARADDKBgAAsREAEMsGAACwEQAwzAYBAJMLACHTBkAA9QoAIdQGQAD1CgAh7AYAAI8N9AcihgcBAPMKACGWBwEA8woAIaIHAQDzCgAhpQcBAJMLACGmBwEAkwsAIacHAQDzCgAhqwcBAPMKACG9BwEA8woAIdcHAQDzCgAh2gcAAJAN9Qci5gcBAPMKACHpBwEA8woAIfIHAQDzCgAh9gcAAJEN9gci9wdAAJULACEWyQYAALARADDKBgAAsREAEMsGAACwEQAwzAYBAJMLACHTBkAA9QoAIdQGQAD1CgAh7AYAAI8N9AcihgcBAPMKACGWBwEA8woAIaIHAQDzCgAhpQcBAJMLACGmBwEAkwsAIacHAQDzCgAhqwcBAPMKACG9BwEA8woAIdcHAQDzCgAh2gcAAJAN9Qci5gcBAPMKACHpBwEA8woAIfIHAQDzCgAh9gcAAJEN9gci9wdAAJULACESzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAALMR9AcihgcBAKsNACGWBwEAqw0AIaIHAQCrDQAhpQcBAKoNACGmBwEAqg0AIacHAQCrDQAhvQcBAKsNACHXBwEAqw0AIdoHAAC0EfUHIuYHAQCrDQAh6QcBAKsNACHyBwEAqw0AIfYHAAC1EfYHIvcHQAC8DQAhAc8IAAAA9AcCAc8IAAAA9QcCAc8IAAAA9gcCGBIAALcRACAjAAC8EQAgNgAAuBEAIDkAALsRACA7AAC5EQAgPAAAuhEAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACzEfQHIoYHAQCrDQAhlgcBAKsNACGiBwEAqw0AIaUHAQCqDQAhpgcBAKoNACGnBwEAqw0AIb0HAQCrDQAh1wcBAKsNACHaBwAAtBH1ByLmBwEAqw0AIekHAQCrDQAh8gcBAKsNACH2BwAAtRH2ByL3B0AAvA0AIQdNAADjFgAgTgAA_BYAIMwIAADkFgAgzQgAAPsWACDQCAAAIwAg0QgAACMAINIIAAD6AgAgB00AAOEWACBOAAD5FgAgzAgAAOIWACDNCAAA-BYAINAIAAA_ACDRCAAAPwAg0ggAAOACACALTQAA5hEAME4AAOsRADDMCAAA5xEAMM0IAADoEQAwzggAAOkRACDPCAAA6hEAMNAIAADqEQAw0QgAAOoRADDSCAAA6hEAMNMIAADsEQAw1AgAAO0RADALTQAA1xEAME4AANwRADDMCAAA2BEAMM0IAADZEQAwzggAANoRACDPCAAA2xEAMNAIAADbEQAw0QgAANsRADDSCAAA2xEAMNMIAADdEQAw1AgAAN4RADALTQAAxhEAME4AAMsRADDMCAAAxxEAMM0IAADIEQAwzggAAMkRACDPCAAAyhEAMNAIAADKEQAw0QgAAMoRADDSCAAAyhEAMNMIAADMEQAw1AgAAM0RADALTQAAvREAME4AAMERADDMCAAAvhEAMM0IAAC_EQAwzggAAMARACDPCAAAjxAAMNAIAACPEAAw0QgAAI8QADDSCAAAjxAAMNMIAADCEQAw1AgAAJIQADAbGwAA0Q4AIBwAANIOACAdAADTDgAgIQAA1A4AICIAANUOACA7AQAAAAHMBgEAAAABzQYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAADKBwL-BgEAAAABqwcBAAAAAa4HAQAAAAHBBxAAAAABwwcBAAAAAcQHAQAAAAHFBwEAAAABxgcQAAAAAccHEAAAAAHIBxAAAAABygdAAAAAAcsHQAAAAAHMB0AAAAABzQdAAAAAAc4HQAAAAAHPBwEAAAABAgAAAFIAIE0AAMURACADAAAAUgAgTQAAxREAIE4AAMQRACABRgAA9xYAMAIAAABSACBGAADEEQAgAgAAAJMQACBGAADDEQAgFjsBAKsNACHMBgEAqg0AIc0GAQCrDQAh0wZAAKwNACHUBkAArA0AIewGAACxDsoHIv4GAQCqDQAhqwcBAKsNACGuBwEAqg0AIcEHEACbDgAhwwcBAKoNACHEBwEAqw0AIcUHAQCrDQAhxgcQAJsOACHHBxAAmw4AIcgHEACbDgAhygdAALwNACHLB0AAvA0AIcwHQAC8DQAhzQdAALwNACHOB0AAvA0AIc8HAQCqDQAhGxsAALMOACAcAAC0DgAgHQAAtQ4AICEAALYOACAiAAC3DgAgOwEAqw0AIcwGAQCqDQAhzQYBAKsNACHTBkAArA0AIdQGQACsDQAh7AYAALEOygci_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_BAAINIIAAC8DgAwDgMAALwVACAFAAC9FQAgBgAAvhUAIA4AAN0SACAjAACDEgAgPQAAvxUAID4AAMAVACA_AADBFQAgQAAAwhUAIKUHAACmDQAgrAgAAKYNACCvCAAApg0AILAIAACmDQAgsggAAKYNACAAAAAAAAAAAAAFTQAA2hYAIE4AAN0WACDMCAAA2xYAIM0IAADcFgAg0ggAADgAIANNAADaFgAgzAgAANsWACDSCAAAOAAgAAAABU0AANUWACBOAADYFgAgzAgAANYWACDNCAAA1xYAINIIAAA4ACADTQAA1RYAIMwIAADWFgAg0ggAADgAIAAAAAVNAADQFgAgTgAA0xYAIMwIAADRFgAgzQgAANIWACDSCAAAOAAgA00AANAWACDMCAAA0RYAINIIAAA4ACAAAAAHTQAAyxYAIE4AAM4WACDMCAAAzBYAIM0IAADNFgAg0AgAAEgAINEIAABIACDSCAAArAYAIANNAADLFgAgzAgAAMwWACDSCAAArAYAIAAAAAAAAAAABU0AAMMWACBOAADJFgAgzAgAAMQWACDNCAAAyBYAINIIAAAQACAFTQAAwRYAIE4AAMYWACDMCAAAwhYAIM0IAADFFgAg0ggAAIAFACADTQAAwxYAIMwIAADEFgAg0ggAABAAIANNAADBFgAgzAgAAMIWACDSCAAAgAUAIAAAAAtNAACrEgAwTgAAsBIAMMwIAACsEgAwzQgAAK0SADDOCAAArhIAIM8IAACvEgAw0AgAAK8SADDRCAAArxIAMNIIAACvEgAw0wgAALESADDUCAAAshIAMAMLAAClEgAgzAYBAAAAAfwHAQAAAAECAAAAGgAgTQAAthIAIAMAAAAaACBNAAC2EgAgTgAAtRIAIAFGAADAFgAwCQsAAJ4NACAMAACfDQAgyQYAAJ0NADDKBgAAGAAQywYAAJ0NADDMBgEAAAAB_AcBAJMLACH9BwEAkwsAIcgIAACcDQAgAgAAABoAIEYAALUSACACAAAAsxIAIEYAALQSACAGyQYAALISADDKBgAAsxIAEMsGAACyEgAwzAYBAJMLACH8BwEAkwsAIf0HAQCTCwAhBskGAACyEgAwygYAALMSABDLBgAAshIAMMwGAQCTCwAh_AcBAJMLACH9BwEAkwsAIQLMBgEAqg0AIfwHAQCqDQAhAwsAAKMSACDMBgEAqg0AIfwHAQCqDQAhAwsAAKUSACDMBgEAAAAB_AcBAAAAAQRNAACrEgAwzAgAAKwSADDOCAAArhIAINIIAACvEgAwAAAAAAHPCAAAAIcIAgdNAAC3FgAgTgAAvhYAIMwIAAC4FgAgzQgAAL0WACDQCAAAEgAg0QgAABIAINIIAADOBAAgB00AALUWACBOAAC7FgAgzAgAALYWACDNCAAAuhYAINAIAAAWACDRCAAAFgAg0ggAAMgCACALTQAAwBIAME4AAMQSADDMCAAAwRIAMM0IAADCEgAwzggAAMMSACDPCAAArxIAMNAIAACvEgAw0QgAAK8SADDSCAAArxIAMNMIAADFEgAw1AgAALISADADDAAAphIAIMwGAQAAAAH9BwEAAAABAgAAABoAIE0AAMgSACADAAAAGgAgTQAAyBIAIE4AAMcSACABRgAAuRYAMAIAAAAaACBGAADHEgAgAgAAALMSACBGAADGEgAgAswGAQCqDQAh_QcBAKoNACEDDAAApBIAIMwGAQCqDQAh_QcBAKoNACEDDAAAphIAIMwGAQAAAAH9BwEAAAABA00AALcWACDMCAAAuBYAINIIAADOBAAgA00AALUWACDMCAAAthYAINIIAADIAgAgBE0AAMASADDMCAAAwRIAMM4IAADDEgAg0ggAAK8SADAAAAALTQAA0BIAME4AANUSADDMCAAA0RIAMM0IAADSEgAwzggAANMSACDPCAAA1BIAMNAIAADUEgAw0QgAANQSADDSCAAA1BIAMNMIAADWEgAw1AgAANcSADARCgAAyhIAIA0AAMsSACDMBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAIcIAvAGAQAAAAHyBkAAAAAB_gYBAAAAAa8HAQAAAAH_BwEAAAABgAgBAAAAAYEIAQAAAAGCCAEAAAABgwgBAAAAAYQIAQAAAAGFCIAAAAABAgAAABAAIE0AANsSACADAAAAEAAgTQAA2xIAIE4AANoSACABRgAAtBYAMBYJAAChDQAgCgAA5AsAIA0AAIUMACDJBgAAoA0AMMoGAAAOABDLBgAAoA0AMMwGAQAAAAHTBkAA9QoAIdQGQAD1CgAh7AYAAJIMhwgi8AYBAAAAAfIGQACVCwAh_gYBAJMLACGvBwEAkwsAIf4HAQDzCgAh_wcBAPMKACGACAEA8woAIYEIAQDzCgAhgggBAPMKACGDCAEA8woAIYQIAQDzCgAhhQgAAPQKACACAAAAEAAgRgAA2hIAIAIAAADYEgAgRgAA2RIAIBPJBgAA1xIAMMoGAADYEgAQywYAANcSADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACHsBgAAkgyHCCLwBgEAkwsAIfIGQACVCwAh_gYBAJMLACGvBwEAkwsAIf4HAQDzCgAh_wcBAPMKACGACAEA8woAIYEIAQDzCgAhgggBAPMKACGDCAEA8woAIYQIAQDzCgAhhQgAAPQKACATyQYAANcSADDKBgAA2BIAEMsGAADXEgAwzAYBAJMLACHTBkAA9QoAIdQGQAD1CgAh7AYAAJIMhwgi8AYBAJMLACHyBkAAlQsAIf4GAQCTCwAhrwcBAJMLACH-BwEA8woAIf8HAQDzCgAhgAgBAPMKACGBCAEA8woAIYIIAQDzCgAhgwgBAPMKACGECAEA8woAIYUIAAD0CgAgD8wGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAAC8EocIIvAGAQCqDQAh8gZAALwNACH-BgEAqg0AIa8HAQCqDQAh_wcBAKsNACGACAEAqw0AIYEIAQCrDQAhgggBAKsNACGDCAEAqw0AIYQIAQCrDQAhhQiAAAAAAREKAAC-EgAgDQAAvxIAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAAC8EocIIvAGAQCqDQAh8gZAALwNACH-BgEAqg0AIa8HAQCqDQAh_wcBAKsNACGACAEAqw0AIYEIAQCrDQAhgggBAKsNACGDCAEAqw0AIYQIAQCrDQAhhQiAAAAAAREKAADKEgAgDQAAyxIAIMwGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAAhwgC8AYBAAAAAfIGQAAAAAH-BgEAAAABrwcBAAAAAf8HAQAAAAGACAEAAAABgQgBAAAAAYIIAQAAAAGDCAEAAAABhAgBAAAAAYUIgAAAAAEETQAA0BIAMMwIAADREgAwzggAANMSACDSCAAA1BIAMAAAAAAAAAAAAAAAAAAABU0AAKwWACBOAACyFgAgzAgAAK0WACDNCAAAsRYAINIIAADtAwAgBU0AAKoWACBOAACvFgAgzAgAAKsWACDNCAAArhYAINIIAAD6AgAgA00AAKwWACDMCAAArRYAINIIAADtAwAgA00AAKoWACDMCAAAqxYAINIIAAD6AgAgAAAAC00AAPMSADBOAAD4EgAwzAgAAPQSADDNCAAA9RIAMM4IAAD2EgAgzwgAAPcSADDQCAAA9xIAMNEIAAD3EgAw0ggAAPcSADDTCAAA-RIAMNQIAAD6EgAwAxIAAO4SACDMBgEAAAABvQcBAAAAAQIAAAAyACBNAAD-EgAgAwAAADIAIE0AAP4SACBOAAD9EgAgAUYAAKkWADAJEgAA0gwAIBQAAJUNACDJBgAAlA0AMMoGAAAwABDLBgAAlA0AMMwGAQAAAAG9BwEAkwsAIY4IAQCTCwAhxggAAJMNACACAAAAMgAgRgAA_RIAIAIAAAD7EgAgRgAA_BIAIAbJBgAA-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_gYBAAAAAZsHAQAAAAG1BwEAAAABvQcBAAAAAb8HAgAAAAHABxAAAAABwQcQAAAAAQIAAABZACBNAADAEwAgAwAAAFkAIE0AAMATACBOAAC_EwAgAUYAAJQWADACAAAAWQAgRgAAvxMAIAIAAADMDgAgRgAAvhMAIAnMBgEAqg0AIdMGQACsDQAh_gYBAKoNACGbBwEAqw0AIbUHAQCqDQAhvQcBAKsNACG_BwIAkA4AIcAHEACbDgAhwQcQAJsOACELEgAApw4AIB4AAKYOACDMBgEAqg0AIdMGQACsDQAh_gYBAKoNACGbBwEAqw0AIbUHAQCqDQAhvQcBAKsNACG_BwIAkA4AIcAHEACbDgAhwQcQAJsOACELEgAAqg4AIB4AAKkOACDMBgEAAAAB0wZAAAAAAf4GAQAAAAGbBwEAAAABtQcBAAAAAb0HAQAAAAG_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_BwIAAAABwAcQAAAAAcEHEAAAAAECAAAAWQAgTQAA7BMAIAMAAABZACBNAADsEwAgTgAA6xMAIAFGAACPFgAwAgAAAFkAIEYAAOsTACACAAAAzA4AIEYAAOoTACAJzAYBAKoNACHTBkAArA0AIf4GAQCqDQAhmwcBAKsNACG1BwEAqg0AIb4HAQCrDQAhvwcCAJAOACHABxAAmw4AIcEHEACbDgAhCx4AAKYOACAgAACoDgAgzAYBAKoNACHTBkAArA0AIf4GAQCqDQAhmwcBAKsNACG1BwEAqg0AIb4HAQCrDQAhvwcCAJAOACHABxAAmw4AIcEHEACbDgAhCx4AAKkOACAgAACrDgAgzAYBAAAAAdMGQAAAAAH-BgEAAAABmwcBAAAAAbUHAQAAAAG-BwEAAAABvwcCAAAAAcAHEAAAAAHBBxAAAAABCxcAAIsSACA2AADWEQAgOwEAAAABzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAADxBwLCBwEAAAAB1wcBAAAAAe4HQAAAAAHvBwEAAAABAgAAADwAIE0AAPUTACADAAAAPAAgTQAA9RMAIE4AAPQTACABRgAAjhYAMAIAAAA8ACBGAAD0EwAgAgAAAM4RACBGAADzEwAgCTsBAKsNACHMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAA0BHxByLCBwEAqg0AIdcHAQCrDQAh7gdAALwNACHvBwEAqw0AIQsXAACKEgAgNgAA0xEAIDsBAKsNACHMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAA0BHxByLCBwEAqg0AIdcHAQCrDQAh7gdAALwNACHvBwEAqw0AIQsXAACLEgAgNgAA1hEAIDsBAAAAAcwGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAA8QcCwgcBAAAAAdcHAQAAAAHuB0AAAAAB7wcBAAAAARgbAACaEgAgIwAA-BEAIDYAAPQRACA5AAD3EQAgOwAA9REAIDwAAPYRACDMBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAPQHAoYHAQAAAAGWBwEAAAABogcBAAAAAaUHAQAAAAGmBwEAAAABpwcBAAAAAasHAQAAAAHXBwEAAAAB2gcAAAD1BwLmBwEAAAAB6QcBAAAAAfIHAQAAAAH2BwAAAPYHAvcHQAAAAAECAAAAOAAgTQAA_hMAIAMAAAA4ACBNAAD-EwAgTgAA_RMAIAFGAACNFgAwAgAAADgAIEYAAP0TACACAAAAsREAIEYAAPwTACASzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAALMR9AcihgcBAKsNACGWBwEAqw0AIaIHAQCrDQAhpQcBAKoNACGmBwEAqg0AIacHAQCrDQAhqwcBAKsNACHXBwEAqw0AIdoHAAC0EfUHIuYHAQCrDQAh6QcBAKsNACHyBwEAqw0AIfYHAAC1EfYHIvcHQAC8DQAhGBsAAJkSACAjAAC8EQAgNgAAuBEAIDkAALsRACA7AAC5EQAgPAAAuhEAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACzEfQHIoYHAQCrDQAhlgcBAKsNACGiBwEAqw0AIaUHAQCqDQAhpgcBAKoNACGnBwEAqw0AIasHAQCrDQAh1wcBAKsNACHaBwAAtBH1ByLmBwEAqw0AIekHAQCrDQAh8gcBAKsNACH2BwAAtRH2ByL3B0AAvA0AIRgbAACaEgAgIwAA-BEAIDYAAPQRACA5AAD3EQAgOwAA9REAIDwAAPYRACDMBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAPQHAoYHAQAAAAGWBwEAAAABogcBAAAAAaUHAQAAAAGmBwEAAAABpwcBAAAAAasHAQAAAAHXBwEAAAAB2gcAAAD1BwLmBwEAAAAB6QcBAAAAAfIHAQAAAAH2BwAAAPYHAvcHQAAAAAEDFAAA7RIAIMwGAQAAAAGOCAEAAAABAgAAADIAIE0AAIcUACADAAAAMgAgTQAAhxQAIE4AAIYUACABRgAAjBYAMAIAAAAyACBGAACGFAAgAgAAAPsSACBGAACFFAAgAswGAQCqDQAhjggBAKoNACEDFAAA6xIAIMwGAQCqDQAhjggBAKoNACEDFAAA7RIAIMwGAQAAAAGOCAEAAAABAw8AAIYTACDMBgEAAAABlQgBAAAAAQIAAAAnACBNAACQFAAgAwAAACcAIE0AAJAUACBOAACPFAAgAUYAAIsWADACAAAAJwAgRgAAjxQAIAIAAACcEwAgRgAAjhQAIALMBgEAqg0AIZUIAQCqDQAhAw8AAIQTACDMBgEAqg0AIZUIAQCqDQAhAw8AAIYTACDMBgEAAAABlQgBAAAAAQRNAACIFAAwzAgAAIkUADDOCAAAixQAINIIAACYEwAwBE0AAP8TADDMCAAAgBQAMM4IAACCFAAg0ggAAPcSADAETQAA9hMAMMwIAAD3EwAwzggAAPkTACDSCAAArREAMARNAADtEwAwzAgAAO4TADDOCAAA8BMAINIIAADKEQAwBE0AAOQTADDMCAAA5RMAMM4IAADnEwAg0ggAAMgOADAETQAA2BMAMMwIAADZEwAwzggAANsTACDSCAAA3BMAMARNAADPEwAwzAgAANATADDOCAAA0hMAINIIAAChEQAwAAAAAAAAAc8IAAAApQgCAc8IAAAApggCB00AAIIWACBOAACJFgAgzAgAAIMWACDNCAAAiBYAINAIAAAWACDRCAAAFgAg0ggAAMgCACALTQAAwBQAME4AAMQUADDMCAAAwRQAMM0IAADCFAAwzggAAMMUACDPCAAArREAMNAIAACtEQAw0QgAAK0RADDSCAAArREAMNMIAADFFAAw1AgAALARADALTQAAtxQAME4AALsUADDMCAAAuBQAMM0IAAC5FAAwzggAALoUACDPCAAAyhEAMNAIAADKEQAw0QgAAMoRADDSCAAAyhEAMNMIAAC8FAAw1AgAAM0RADALTQAArhQAME4AALIUADDMCAAArxQAMM0IAACwFAAwzggAALEUACDPCAAA9Q4AMNAIAAD1DgAw0QgAAPUOADDSCAAA9Q4AMNMIAACzFAAw1AgAAPgOADALTQAApRQAME4AAKkUADDMCAAAphQAMM0IAACnFAAwzggAAKgUACDPCAAA1BAAMNAIAADUEAAw0QgAANQQADDSCAAA1BAAMNMIAACqFAAw1AgAANcQADAFHAAAhQ8AIMwGAQAAAAHNBgEAAAAB0wZAAAAAAeIHAAAA4gcCAgAAAHwAIE0AAK0UACADAAAAfAAgTQAArRQAIE4AAKwUACABRgAAhxYAMAIAAAB8ACBGAACsFAAgAgAAANgQACBGAACrFAAgBMwGAQCqDQAhzQYBAKoNACHTBkAArA0AIeIHAACCD-IHIgUcAACDDwAgzAYBAKoNACHNBgEAqg0AIdMGQACsDQAh4gcAAIIP4gciBRwAAIUPACDMBgEAAAABzQYBAAAAAdMGQAAAAAHiBwAAAOIHAg0cAADmDgAgNQAA5w4AIMwGAQAAAAHNBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAANkHAv4GAQAAAAGbBwEAAAAB1gcBAAAAAdoHAAAA2gcC2wdAAAAAAdwHQAAAAAECAAAARgAgTQAAthQAIAMAAABGACBNAAC2FAAgTgAAtRQAIAFGAACGFgAwAgAAAEYAIEYAALUUACACAAAA-Q4AIEYAALQUACALzAYBAKoNACHNBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAA4Q7ZByL-BgEAqg0AIZsHAQCrDQAh1gcBAKsNACHaBwAA4g7aByLbB0AAvA0AIdwHQAC8DQAhDRwAAOMOACA1AADkDgAgzAYBAKoNACHNBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAA4Q7ZByL-BgEAqg0AIZsHAQCrDQAh1gcBAKsNACHaBwAA4g7aByLbB0AAvA0AIdwHQAC8DQAhDRwAAOYOACA1AADnDgAgzAYBAAAAAc0GAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAA2QcC_gYBAAAAAZsHAQAAAAHWBwEAAAAB2gcAAADaBwLbB0AAAAAB3AdAAAAAAQsSAADVEQAgFwAAixIAIDsBAAAAAcwGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAA8QcCvQcBAAAAAcIHAQAAAAHuB0AAAAAB7wcBAAAAAQIAAAA8ACBNAAC_FAAgAwAAADwAIE0AAL8UACBOAAC-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-hEAIBoAAPsRACAiAAD_EQAgIwAA_BEAICQAAP0RACAlAAD-EQAgOwEAAAABzAYBAAAAAdMGQAAAAAHUBkAAAAABhgcBAAAAAZYHAQAAAAGlBwEAAAABpgcBAAAAAacHAQAAAAHpBwEAAAAB6gcgAAAAAQIAAACsBgAgTQAA3hQAIAMAAABIACBNAADeFAAgTgAA4hQAIBMAAABIACAWAADzEAAgGgAA9BAAICIAAPgQACAjAAD1EAAgJAAA9hAAICUAAPcQACA7AQCrDQAhRgAA4hQAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIYYHAQCrDQAhlgcBAKsNACGlBwEAqg0AIaYHAQCqDQAhpwcBAKsNACHpBwEAqw0AIeoHIADaDQAhERYAAPMQACAaAAD0EAAgIgAA-BAAICMAAPUQACAkAAD2EAAgJQAA9xAAIDsBAKsNACHMBgEAqg0AIdMGQACsDQAh1AZAAKwNACGGBwEAqw0AIZYHAQCrDQAhpQcBAKoNACGmBwEAqg0AIacHAQCrDQAh6QcBAKsNACHqByAA2g0AIRIYAADKFAAgGQAAyxQAIDcAAMwUACA4AADNFAAgzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAACmCAKGBwEAAAABpgcBAAAAAeIHAAAApQgCoggBAAAAAaMIAQAAAAGmCAEAAAABpwgBAAAAAagIAQAAAAGpCAEAAAABqghAAAAAAQIAAADgAgAgTQAA4xQAIAMAAAA_ACBNAADjFAAgTgAA5xQAIBQAAAA_ACAYAAChFAAgGQAAohQAIDcAAKMUACA4AACkFAAgRgAA5xQAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACfFKYIIoYHAQCrDQAhpgcBAKoNACHiBwAAnhSlCCKiCAEAqw0AIaMIAQCqDQAhpggBAKsNACGnCAEAqw0AIagIAQCrDQAhqQgBAKsNACGqCEAAvA0AIRIYAAChFAAgGQAAohQAIDcAAKMUACA4AACkFAAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAAJ8UpggihgcBAKsNACGmBwEAqg0AIeIHAACeFKUIIqIIAQCrDQAhowgBAKoNACGmCAEAqw0AIacIAQCrDQAhqAgBAKsNACGpCAEAqw0AIaoIQAC8DQAhCcwGAQAAAAHTBkAAAAAB_gYBAAAAAZ4HAAAAngcCoAcAAACgBwOhBwEAAAABogcBAAAAAaMHIAAAAAGkB0AAAAABAgAAAOMBACBNAADzFAAgAwAAAOMBACBNAADzFAAgTgAA8hQAIAFGAACBFgAwDgQAAMwMACDJBgAAyQwAMMoGAADhAQAQywYAAMkMADDMBgEAAAAB0wZAAPUKACH-BgEAkwsAIZwHAQCTCwAhngcAAMoMngcioAcAAMsMoAcjoQcBAPMKACGiBwEAkwsAIaMHIACUCwAhpAdAAJULACECAAAA4wEAIEYAAPIUACACAAAA8BQAIEYAAPEUACANyQYAAO8UADDKBgAA8BQAEMsGAADvFAAwzAYBAJMLACHTBkAA9QoAIf4GAQCTCwAhnAcBAJMLACGeBwAAygyeByKgBwAAywygByOhBwEA8woAIaIHAQCTCwAhowcgAJQLACGkB0AAlQsAIQ3JBgAA7xQAMMoGAADwFAAQywYAAO8UADDMBgEAkwsAIdMGQAD1CgAh_gYBAJMLACGcBwEAkwsAIZ4HAADKDJ4HIqAHAADLDKAHI6EHAQDzCgAhogcBAJMLACGjByAAlAsAIaQHQACVCwAhCcwGAQCqDQAh0wZAAKwNACH-BgEAqg0AIZ4HAAD5DZ4HIqAHAAD6DaAHI6EHAQCrDQAhogcBAKoNACGjByAA2g0AIaQHQAC8DQAhCcwGAQCqDQAh0wZAAKwNACH-BgEAqg0AIZ4HAAD5DZ4HIqAHAAD6DaAHI6EHAQCrDQAhogcBAKoNACGjByAA2g0AIaQHQAC8DQAhCcwGAQAAAAHTBkAAAAAB_gYBAAAAAZ4HAAAAngcCoAcAAACgBwOhBwEAAAABogcBAAAAAaMHIAAAAAGkB0AAAAABGxcAANAOACAbAADRDgAgHAAA0g4AICEAANQOACAiAADVDgAgOwEAAAABzAYBAAAAAc0GAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAAygcC_gYBAAAAAasHAQAAAAGuBwEAAAABwQcQAAAAAcIHAQAAAAHDBwEAAAABxAcBAAAAAcUHAQAAAAHGBxAAAAABxwcQAAAAAcgHEAAAAAHKB0AAAAABywdAAAAAAcwHQAAAAAHNB0AAAAABzgdAAAAAAQIAAABSACBNAAD8FAAgAwAAAFIAIE0AAPwUACBOAAD7FAAgAUYAAIAWADACAAAAUgAgRgAA-xQAIAIAAACTEAAgRgAA-hQAIBY7AQCrDQAhzAYBAKoNACHNBgEAqw0AIdMGQACsDQAh1AZAAKwNACHsBgAAsQ7KByL-BgEAqg0AIasHAQCrDQAhrgcBAKoNACHBBxAAmw4AIcIHAQCrDQAhwwcBAKoNACHEBwEAqw0AIcUHAQCrDQAhxgcQAJsOACHHBxAAmw4AIcgHEACbDgAhygdAALwNACHLB0AAvA0AIcwHQAC8DQAhzQdAALwNACHOB0AAvA0AIRsXAACyDgAgGwAAsw4AIBwAALQOACAhAAC2DgAgIgAAtw4AIDsBAKsNACHMBgEAqg0AIc0GAQCrDQAh0wZAAKwNACHUBkAArA0AIewGAACxDsoHIv4GAQCqDQAhqwcBAKsNACGuBwEAqg0AIcEHEACbDgAhwgcBAKsNACHDBwEAqg0AIcQHAQCrDQAhxQcBAKsNACHGBxAAmw4AIccHEACbDgAhyAcQAJsOACHKB0AAvA0AIcsHQAC8DQAhzAdAALwNACHNB0AAvA0AIc4HQAC8DQAhGxcAANAOACAbAADRDgAgHAAA0g4AICEAANQOACAiAADVDgAgOwEAAAABzAYBAAAAAc0GAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAAygcC_gYBAAAAAasHAQAAAAGuBwEAAAABwQcQAAAAAcIHAQAAAAHDBwEAAAABxAcBAAAAAcUHAQAAAAHGBxAAAAABxwcQAAAAAcgHEAAAAAHKB0AAAAABywdAAAAAAcwHQAAAAAHNB0AAAAABzgdAAAAAAQcXAACQEgAgzAYBAAAAAdMGQAAAAAGbBwEAAAABngcAAADyBwK8B4AAAAABwgcBAAAAAQIAAAAhACBNAACFFQAgAwAAACEAIE0AAIUVACBOAACEFQAgAUYAAP8VADACAAAAIQAgRgAAhBUAIAIAAADfEQAgRgAAgxUAIAbMBgEAqg0AIdMGQACsDQAhmwcBAKoNACGeBwAA4RHyByK8B4AAAAABwgcBAKoNACEHFwAAjxIAIMwGAQCqDQAh0wZAAKwNACGbBwEAqg0AIZ4HAADhEfIHIrwHgAAAAAHCBwEAqg0AIQcXAACQEgAgzAYBAAAAAdMGQAAAAAGbBwEAAAABngcAAADyBwK8B4AAAAABwgcBAAAAAREJAADJEgAgDQAAyxIAIMwGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAAhwgC8AYBAAAAAfIGQAAAAAH-BgEAAAABrwcBAAAAAf4HAQAAAAGACAEAAAABgQgBAAAAAYIIAQAAAAGDCAEAAAABhAgBAAAAAYUIgAAAAAECAAAAEAAgTQAAjhUAIAMAAAAQACBNAACOFQAgTgAAjRUAIAFGAAD-FQAwAgAAABAAIEYAAI0VACACAAAA2BIAIEYAAIwVACAPzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAALwShwgi8AYBAKoNACHyBkAAvA0AIf4GAQCqDQAhrwcBAKoNACH-BwEAqw0AIYAIAQCrDQAhgQgBAKsNACGCCAEAqw0AIYMIAQCrDQAhhAgBAKsNACGFCIAAAAABEQkAAL0SACANAAC_EgAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAALwShwgi8AYBAKoNACHyBkAAvA0AIf4GAQCqDQAhrwcBAKoNACH-BwEAqw0AIYAIAQCrDQAhgQgBAKsNACGCCAEAqw0AIYMIAQCrDQAhhAgBAKsNACGFCIAAAAABEQkAAMkSACANAADLEgAgzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAACHCALwBgEAAAAB8gZAAAAAAf4GAQAAAAGvBwEAAAAB_gcBAAAAAYAIAQAAAAGBCAEAAAABgggBAAAAAYMIAQAAAAGECAEAAAABhQiAAAAAAQXMBgEAAAAB0wZAAAAAAdQGQAAAAAGzCAEAAAABtAgBAAAAAQIAAAAMACBNAACaFQAgAwAAAAwAIE0AAJoVACBOAACZFQAgAUYAAP0VADAKBAAAzAwAIMkGAACiDQAwygYAAAoAEMsGAACiDQAwzAYBAAAAAdMGQAD1CgAh1AZAAPUKACGcBwEAkwsAIbMIAQCTCwAhtAgBAJMLACECAAAADAAgRgAAmRUAIAIAAACXFQAgRgAAmBUAIAnJBgAAlhUAMMoGAACXFQAQywYAAJYVADDMBgEAkwsAIdMGQAD1CgAh1AZAAPUKACGcBwEAkwsAIbMIAQCTCwAhtAgBAJMLACEJyQYAAJYVADDKBgAAlxUAEMsGAACWFQAwzAYBAJMLACHTBkAA9QoAIdQGQAD1CgAhnAcBAJMLACGzCAEAkwsAIbQIAQCTCwAhBcwGAQCqDQAh0wZAAKwNACHUBkAArA0AIbMIAQCqDQAhtAgBAKoNACEFzAYBAKoNACHTBkAArA0AIdQGQACsDQAhswgBAKoNACG0CAEAqg0AIQXMBgEAAAAB0wZAAAAAAdQGQAAAAAGzCAEAAAABtAgBAAAAAQ3MBgEAAAAB0wZAAAAAAdQGQAAAAAG3CAEAAAABuAgBAAAAAbkIAQAAAAG6CAEAAAABuwgBAAAAAbwIAQAAAAG9CEAAAAABvghAAAAAAb8IAQAAAAHACAEAAAABAgAAAAgAIE0AAKYVACADAAAACAAgTQAAphUAIE4AAKUVACABRgAA_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5gcAAKYNACDpBwAApg0AIPIHAACmDQAg9wcAAKYNACAREwAArxMAIBUAAIATACAWAACBEgAgGgAAghIAIB8AAJkUACA5AACYFAAgOgAAmhQAIJsHAACmDQAggggAAKYNACCDCAAApg0AIJAIAACmDQAgmwgAAKYNACCdCAAApg0AIJ4IAACmDQAgnwgAAKYNACCgCAAApg0AIKEIAACmDQAgERcAANUVACAbAADCFQAgHAAArw0AIB0AAIASACAhAACZFAAgIgAAhhIAIDsAAKYNACDNBgAApg0AIKsHAACmDQAgwgcAAKYNACDEBwAApg0AIMUHAACmDQAgygcAAKYNACDLBwAApg0AIMwHAACmDQAgzQcAAKYNACDOBwAApg0AIAQSAADWFQAgHwAAmRQAIJsHAACmDQAgmwgAAKYNACAAAAAAAAcJAACmDQAgHAAArw0AIDsAAKYNACCEBwAApg0AIIUHAACmDQAghgcAAKYNACCIBwAApg0AIAAAAAAABhwAAK8NACDOBgAApg0AIM8GAACmDQAg0AYAAKYNACDRBgAApg0AINIGAACmDQAgBhwAAK8NACAoAADOFAAgmwcAAKYNACDbBwAApg0AINwHAACmDQAg3gcAAKYNACAADREAAIATACDyBgAApg0AIPwGAACmDQAglgcAAKYNACCCCAAApg0AIIMIAACmDQAgiQgAAKYNACCPCAAApg0AIJAIAACmDQAgkQgAAKYNACCSCAAApg0AIJMIAACmDQAglAgAAKYNACAOEAAArhMAIBEAAK8TACDpBgAApg0AIPIGAACmDQAglgcAAKYNACCbBwAApg0AIIIIAACmDQAggwgAAKYNACCJCAAApg0AII8IAACmDQAgkAgAAKYNACCUCAAApg0AIJYIAACmDQAglwgAAKYNACAMCQAA6xUAIAoAAIASACANAAC4EgAg8gYAAKYNACD-BwAApg0AIP8HAACmDQAggAgAAKYNACCBCAAApg0AIIIIAACmDQAggwgAAKYNACCECAAApg0AIIUIAACmDQAgAQcAALgSACACBwAA3RIAIJsHAACmDQAgFQUAALQVACAGAAC1FQAgDgAAthUAICMAALgVACA9AAC3FQAgPgAAuRUAID8AALoVACBAAAC7FQAgzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAACvCAKlBwEAAAABpgcBAAAAAeIHAAAArggCqwggAAAAAawIAQAAAAGvCAEAAAABsAhAAAAAAbEIIAAAAAGyCAEAAAABAgAAAMgCACBNAADsFQAgAwAAABYAIE0AAOwVACBOAADwFQAgFwAAABYAIAUAANYUACAGAADXFAAgDgAA2BQAICMAANoUACA9AADZFAAgPgAA2xQAID8AANwUACBAAADdFAAgRgAA8BUAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAADUFK8IIqUHAQCrDQAhpgcBAKoNACHiBwAA0xSuCCKrCCAA2g0AIawIAQCrDQAhrwgBAKsNACGwCEAAvA0AIbEIIADaDQAhsggBAKsNACEVBQAA1hQAIAYAANcUACAOAADYFAAgIwAA2hQAID0AANkUACA-AADbFAAgPwAA3BQAIEAAAN0UACDMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAA1BSvCCKlBwEAqw0AIaYHAQCqDQAh4gcAANMUrggiqwggANoNACGsCAEAqw0AIa8IAQCrDQAhsAhAALwNACGxCCAA2g0AIbIIAQCrDQAhFQMAALMVACAGAAC1FQAgDgAAthUAICMAALgVACA9AAC3FQAgPgAAuRUAID8AALoVACBAAAC7FQAgzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAACvCAKlBwEAAAABpgcBAAAAAeIHAAAArggCqwggAAAAAawIAQAAAAGvCAEAAAABsAhAAAAAAbEIIAAAAAGyCAEAAAABAgAAAMgCACBNAADxFQAgAwAAABYAIE0AAPEVACBOAAD1FQAgFwAAABYAIAMAANUUACAGAADXFAAgDgAA2BQAICMAANoUACA9AADZFAAgPgAA2xQAID8AANwUACBAAADdFAAgRgAA9RUAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAADUFK8IIqUHAQCrDQAhpgcBAKoNACHiBwAA0xSuCCKrCCAA2g0AIawIAQCrDQAhrwgBAKsNACGwCEAAvA0AIbEIIADaDQAhsggBAKsNACEVAwAA1RQAIAYAANcUACAOAADYFAAgIwAA2hQAID0AANkUACA-AADbFAAgPwAA3BQAIEAAAN0UACDMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAA1BSvCCKlBwEAqw0AIaYHAQCqDQAh4gcAANMUrggiqwggANoNACGsCAEAqw0AIa8IAQCrDQAhsAhAALwNACGxCCAA2g0AIbIIAQCrDQAhFQMAALMVACAFAAC0FQAgDgAAthUAICMAALgVACA9AAC3FQAgPgAAuRUAID8AALoVACBAAAC7FQAgzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAACvCAKlBwEAAAABpgcBAAAAAeIHAAAArggCqwggAAAAAawIAQAAAAGvCAEAAAABsAhAAAAAAbEIIAAAAAGyCAEAAAABAgAAAMgCACBNAAD2FQAgAwAAABYAIE0AAPYVACBOAAD6FQAgFwAAABYAIAMAANUUACAFAADWFAAgDgAA2BQAICMAANoUACA9AADZFAAgPgAA2xQAID8AANwUACBAAADdFAAgRgAA-hUAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAADUFK8IIqUHAQCrDQAhpgcBAKoNACHiBwAA0xSuCCKrCCAA2g0AIawIAQCrDQAhrwgBAKsNACGwCEAAvA0AIbEIIADaDQAhsggBAKsNACEVAwAA1RQAIAUAANYUACAOAADYFAAgIwAA2hQAID0AANkUACA-AADbFAAgPwAA3BQAIEAAAN0UACDMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAA1BSvCCKlBwEAqw0AIaYHAQCqDQAh4gcAANMUrggiqwggANoNACGsCAEAqw0AIa8IAQCrDQAhsAhAALwNACGxCCAA2g0AIbIIAQCrDQAhB8wGAQAAAAHTBkAAAAAB1AZAAAAAAbYIQAAAAAHBCAEAAAABwggBAAAAAcMIAQAAAAENzAYBAAAAAdMGQAAAAAHUBkAAAAABtwgBAAAAAbgIAQAAAAG5CAEAAAABuggBAAAAAbsIAQAAAAG8CAEAAAABvQhAAAAAAb4IQAAAAAG_CAEAAAABwAgBAAAAAQXMBgEAAAAB0wZAAAAAAdQGQAAAAAGzCAEAAAABtAgBAAAAAQ_MBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAIcIAvAGAQAAAAHyBkAAAAAB_gYBAAAAAa8HAQAAAAH-BwEAAAABgAgBAAAAAYEIAQAAAAGCCAEAAAABgwgBAAAAAYQIAQAAAAGFCIAAAAABBswGAQAAAAHTBkAAAAABmwcBAAAAAZ4HAAAA8gcCvAeAAAAAAcIHAQAAAAEWOwEAAAABzAYBAAAAAc0GAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAAygcC_gYBAAAAAasHAQAAAAGuBwEAAAABwQcQAAAAAcIHAQAAAAHDBwEAAAABxAcBAAAAAcUHAQAAAAHGBxAAAAABxwcQAAAAAcgHEAAAAAHKB0AAAAABywdAAAAAAcwHQAAAAAHNB0AAAAABzgdAAAAAAQnMBgEAAAAB0wZAAAAAAf4GAQAAAAGeBwAAAJ4HAqAHAAAAoAcDoQcBAAAAAaIHAQAAAAGjByAAAAABpAdAAAAAARUDAACzFQAgBQAAtBUAIAYAALUVACAOAAC2FQAgIwAAuBUAID0AALcVACA-AAC5FQAgQAAAuxUAIMwGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAArwgCpQcBAAAAAaYHAQAAAAHiBwAAAK4IAqsIIAAAAAGsCAEAAAABrwgBAAAAAbAIQAAAAAGxCCAAAAABsggBAAAAAQIAAADIAgAgTQAAghYAIBLMBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAPQHAoYHAQAAAAGWBwEAAAABogcBAAAAAaUHAQAAAAGmBwEAAAABpwcBAAAAAasHAQAAAAG9BwEAAAAB2gcAAAD1BwLmBwEAAAAB6QcBAAAAAfIHAQAAAAH2BwAAAPYHAvcHQAAAAAEJOwEAAAABzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAADxBwK9BwEAAAABwgcBAAAAAe4HQAAAAAHvBwEAAAABC8wGAQAAAAHNBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAANkHAv4GAQAAAAGbBwEAAAAB1gcBAAAAAdoHAAAA2gcC2wdAAAAAAdwHQAAAAAEEzAYBAAAAAc0GAQAAAAHTBkAAAAAB4gcAAADiBwIDAAAAFgAgTQAAghYAIE4AAIoWACAXAAAAFgAgAwAA1RQAIAUAANYUACAGAADXFAAgDgAA2BQAICMAANoUACA9AADZFAAgPgAA2xQAIEAAAN0UACBGAACKFgAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAANQUrwgipQcBAKsNACGmBwEAqg0AIeIHAADTFK4IIqsIIADaDQAhrAgBAKsNACGvCAEAqw0AIbAIQAC8DQAhsQggANoNACGyCAEAqw0AIRUDAADVFAAgBQAA1hQAIAYAANcUACAOAADYFAAgIwAA2hQAID0AANkUACA-AADbFAAgQAAA3RQAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAADUFK8IIqUHAQCrDQAhpgcBAKoNACHiBwAA0xSuCCKrCCAA2g0AIawIAQCrDQAhrwgBAKsNACGwCEAAvA0AIbEIIADaDQAhsggBAKsNACECzAYBAAAAAZUIAQAAAAECzAYBAAAAAY4IAQAAAAESzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAAD0BwKGBwEAAAABlgcBAAAAAaIHAQAAAAGlBwEAAAABpgcBAAAAAacHAQAAAAGrBwEAAAAB1wcBAAAAAdoHAAAA9QcC5gcBAAAAAekHAQAAAAHyBwEAAAAB9gcAAAD2BwL3B0AAAAABCTsBAAAAAcwGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAA8QcCwgcBAAAAAdcHAQAAAAHuB0AAAAAB7wcBAAAAAQnMBgEAAAAB0wZAAAAAAf4GAQAAAAGbBwEAAAABtQcBAAAAAb4HAQAAAAG_BwIAAAABwAcQAAAAAcEHEAAAAAENzAYBAAAAAdMGQAAAAAHUBkAAAAAB8AYBAAAAAZsHAQAAAAGlBwEAAAABrgcBAAAAAd8HAgAAAAHqByAAAAABmAgQAAAAAZoIAAAAmggCmwiAAAAAAZwIIAAAAAEPzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAADmBwLwBgEAAAABmwcBAAAAAaUHAQAAAAGrBwEAAAABrgcBAAAAAdwHQAAAAAHeB0AAAAAB5AcAAADkBwLmBxAAAAAB5wdAAAAAAegHAgAAAAEZEwAAkRQAIBUAAJIUACAWAACTFAAgGgAAlxQAIB8AAJUUACA5AACUFAAgzAYBAAAAAdMGQAAAAAHUBkAAAAAB8AYBAAAAAZsHAQAAAAGlBwEAAAABrgcBAAAAAbQHIAAAAAHfBwIAAAAB6gcgAAAAAYIIAQAAAAGDCAEAAAABkAgBAAAAAZsIgAAAAAGdCAEAAAABnggBAAAAAZ8IAQAAAAGgCIAAAAABoQgQAAAAAQIAAAD6AgAgTQAAkhYAIAnMBgEAAAAB0wZAAAAAAf4GAQAAAAGbBwEAAAABtQcBAAAAAb0HAQAAAAG_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_AaAAAAAAf4GAQAAAAGWBwEAAAABtAcgAAAAAYIIAQAAAAGDCAEAAAABiQgBAAAAAY8IAQAAAAGQCAEAAAABkQgBAAAAAZIIAQAAAAGTCAEAAAABlAgBAAAAAQIAAADtAwAgTQAArBYAIAMAAAAjACBNAACqFgAgTgAAsBYAIBsAAAAjACATAADIEwAgFgAAyhMAIBoAAM4TACAfAADMEwAgOQAAyxMAIDoAAM0TACBGAACwFgAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh8AYBAKoNACGbBwEAqw0AIaUHAQCqDQAhrgcBAKoNACG0ByAA2g0AId8HAgCQDgAh6gcgANoNACGCCAEAqw0AIYMIAQCrDQAhkAgBAKsNACGbCIAAAAABnQgBAKsNACGeCAEAqw0AIZ8IAQCrDQAhoAiAAAAAAaEIEADFDQAhGRMAAMgTACAWAADKEwAgGgAAzhMAIB8AAMwTACA5AADLEwAgOgAAzRMAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIfAGAQCqDQAhmwcBAKsNACGlBwEAqg0AIa4HAQCqDQAhtAcgANoNACHfBwIAkA4AIeoHIADaDQAhgggBAKsNACGDCAEAqw0AIZAIAQCrDQAhmwiAAAAAAZ0IAQCrDQAhnggBAKsNACGfCAEAqw0AIaAIgAAAAAGhCBAAxQ0AIQMAAADwAwAgTQAArBYAIE4AALMWACAVAAAA8AMAIEYAALMWACDMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAAvBKHCCLwBgEAqg0AIfIGQAC8DQAh_AaAAAAAAf4GAQCqDQAhlgcBAKsNACG0ByAA2g0AIYIIAQCrDQAhgwgBAKsNACGJCAEAqw0AIY8IAQCrDQAhkAgBAKsNACGRCAEAqw0AIZIIAQCrDQAhkwgBAKsNACGUCAEAqw0AIRPMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAAvBKHCCLwBgEAqg0AIfIGQAC8DQAh_AaAAAAAAf4GAQCqDQAhlgcBAKsNACG0ByAA2g0AIYIIAQCrDQAhgwgBAKsNACGJCAEAqw0AIY8IAQCrDQAhkAgBAKsNACGRCAEAqw0AIZIIAQCrDQAhkwgBAKsNACGUCAEAqw0AIQ_MBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAIcIAvAGAQAAAAHyBkAAAAAB_gYBAAAAAa8HAQAAAAH_BwEAAAABgAgBAAAAAYEIAQAAAAGCCAEAAAABgwgBAAAAAYQIAQAAAAGFCIAAAAABFQMAALMVACAFAAC0FQAgBgAAtRUAICMAALgVACA9AAC3FQAgPgAAuRUAID8AALoVACBAAAC7FQAgzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAACvCAKlBwEAAAABpgcBAAAAAeIHAAAArggCqwggAAAAAawIAQAAAAGvCAEAAAABsAhAAAAAAbEIIAAAAAGyCAEAAAABAgAAAMgCACBNAAC1FgAgB8wGAQAAAAHTBkAAAAAB1AZAAAAAAfAGAQAAAAGbBwEAAAABpQcBAAAAAeoHIAAAAAECAAAAzgQAIE0AALcWACACzAYBAAAAAf0HAQAAAAEDAAAAFgAgTQAAtRYAIE4AALwWACAXAAAAFgAgAwAA1RQAIAUAANYUACAGAADXFAAgIwAA2hQAID0AANkUACA-AADbFAAgPwAA3BQAIEAAAN0UACBGAAC8FgAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAANQUrwgipQcBAKsNACGmBwEAqg0AIeIHAADTFK4IIqsIIADaDQAhrAgBAKsNACGvCAEAqw0AIbAIQAC8DQAhsQggANoNACGyCAEAqw0AIRUDAADVFAAgBQAA1hQAIAYAANcUACAjAADaFAAgPQAA2RQAID4AANsUACA_AADcFAAgQAAA3RQAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAADUFK8IIqUHAQCrDQAhpgcBAKoNACHiBwAA0xSuCCKrCCAA2g0AIawIAQCrDQAhrwgBAKsNACGwCEAAvA0AIbEIIADaDQAhsggBAKsNACEDAAAAEgAgTQAAtxYAIE4AAL8WACAJAAAAEgAgRgAAvxYAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIfAGAQCqDQAhmwcBAKsNACGlBwEAqg0AIeoHIADaDQAhB8wGAQCqDQAh0wZAAKwNACHUBkAArA0AIfAGAQCqDQAhmwcBAKsNACGlBwEAqg0AIeoHIADaDQAhAswGAQAAAAH8BwEAAAABBcwGAQAAAAHTBkAAAAAB1AZAAAAAAfAGAQAAAAGlBwEAAAABAgAAAIAFACBNAADBFgAgEgkAAMkSACAKAADKEgAgzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAACHCALwBgEAAAAB8gZAAAAAAf4GAQAAAAGvBwEAAAAB_gcBAAAAAf8HAQAAAAGACAEAAAABgQgBAAAAAYIIAQAAAAGDCAEAAAABhAgBAAAAAYUIgAAAAAECAAAAEAAgTQAAwxYAIAMAAACDBQAgTQAAwRYAIE4AAMcWACAHAAAAgwUAIEYAAMcWACDMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHwBgEAqg0AIaUHAQCqDQAhBcwGAQCqDQAh0wZAAKwNACHUBkAArA0AIfAGAQCqDQAhpQcBAKoNACEDAAAADgAgTQAAwxYAIE4AAMoWACAUAAAADgAgCQAAvRIAIAoAAL4SACBGAADKFgAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAALwShwgi8AYBAKoNACHyBkAAvA0AIf4GAQCqDQAhrwcBAKoNACH-BwEAqw0AIf8HAQCrDQAhgAgBAKsNACGBCAEAqw0AIYIIAQCrDQAhgwgBAKsNACGECAEAqw0AIYUIgAAAAAESCQAAvRIAIAoAAL4SACDMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAAvBKHCCLwBgEAqg0AIfIGQAC8DQAh_gYBAKoNACGvBwEAqg0AIf4HAQCrDQAh_wcBAKsNACGACAEAqw0AIYEIAQCrDQAhgggBAKsNACGDCAEAqw0AIYQIAQCrDQAhhQiAAAAAARIEAAD5EQAgGgAA-xEAICIAAP8RACAjAAD8EQAgJAAA_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_AAC6FQAgQAAAuxUAIMwGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAArwgCpQcBAAAAAaYHAQAAAAHiBwAAAK4IAqsIIAAAAAGsCAEAAAABrwgBAAAAAbAIQAAAAAGxCCAAAAABsggBAAAAAQIAAADIAgAgTQAA5hYAIAMAAAAWACBNAADmFgAgTgAA6hYAIBcAAAAWACADAADVFAAgBQAA1hQAIAYAANcUACAOAADYFAAgIwAA2hQAID4AANsUACA_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_MBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAOYHAvAGAQAAAAGbBwEAAAABpQcBAAAAAa4HAQAAAAG9BwEAAAAB3AdAAAAAAd4HQAAAAAHkBwAAAOQHAuYHEAAAAAHnB0AAAAAB6AcCAAAAARY7AQAAAAHMBgEAAAABzQYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAADKBwL-BgEAAAABrgcBAAAAAcEHEAAAAAHCBwEAAAABwwcBAAAAAcQHAQAAAAHFBwEAAAABxgcQAAAAAccHEAAAAAHIBxAAAAABygdAAAAAAcsHQAAAAAHMB0AAAAABzQdAAAAAAc4HQAAAAAHPBwEAAAABDMwGAQAAAAHNBgEAAAAB0wZAAAAAAdQGQAAAAAH1BgIAAAAB_gYBAAAAAa8HAQAAAAGwBwIAAAABsQcCAAAAAbIHAgAAAAGzByAAAAABtAcgAAAAAQrMBgEAAAABzQYBAAAAAdMGQAAAAAHUBkAAAAAB7QZAAAAAAf4GAQAAAAGbBwEAAAABngcAAACtBwKtBxAAAAABrgcBAAAAAQzMBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAALoHAq0HEAAAAAGuBwEAAAABtQcBAAAAAbcHAAAAtwcCuAcBAAAAAboHAQAAAAG7B0AAAAABvAeAAAAAAQMAAAAWACBNAADfFgAgTgAAhhcAIBcAAAAWACADAADVFAAgBQAA1hQAIAYAANcUACAOAADYFAAgIwAA2hQAID0AANkUACA-AADbFAAgPwAA3BQAIEYAAIYXACDMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAA1BSvCCKlBwEAqw0AIaYHAQCqDQAh4gcAANMUrggiqwggANoNACGsCAEAqw0AIa8IAQCrDQAhsAhAALwNACGxCCAA2g0AIbIIAQCrDQAhFQMAANUUACAFAADWFAAgBgAA1xQAIA4AANgUACAjAADaFAAgPQAA2RQAID4AANsUACA_AADcFAAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAANQUrwgipQcBAKsNACGmBwEAqg0AIeIHAADTFK4IIqsIIADaDQAhrAgBAKsNACGvCAEAqw0AIbAIQAC8DQAhsQggANoNACGyCAEAqw0AIRkTAACRFAAgFQAAkhQAIBYAAJMUACAfAACVFAAgOQAAlBQAIDoAAJYUACDMBgEAAAAB0wZAAAAAAdQGQAAAAAHwBgEAAAABmwcBAAAAAaUHAQAAAAGuBwEAAAABtAcgAAAAAd8HAgAAAAHqByAAAAABgggBAAAAAYMIAQAAAAGQCAEAAAABmwiAAAAAAZ0IAQAAAAGeCAEAAAABnwgBAAAAAaAIgAAAAAGhCBAAAAABAgAAAPoCACBNAACHFwAgEgQAAPkRACAWAAD6EQAgIgAA_xEAICMAAPwRACAkAAD9EQAgJQAA_hEAIDsBAAAAAcwGAQAAAAHTBkAAAAAB1AZAAAAAAYYHAQAAAAGWBwEAAAABnAcBAAAAAaUHAQAAAAGmBwEAAAABpwcBAAAAAekHAQAAAAHqByAAAAABAgAAAKwGACBNAACJFwAgBMwGAQAAAAHTBkAAAAAB4AcBAAAAAeIHAAAA4gcCCswGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAA3gcC_gYBAAAAAZsHAQAAAAHbB0AAAAAB3AdAAAAAAd4HQAAAAAHfBwIAAAABC8wGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAA2QcC_gYBAAAAAZsHAQAAAAHWBwEAAAAB1wcBAAAAAdoHAAAA2gcC2wdAAAAAAdwHQAAAAAEJCQAAANYHAswGAQAAAAHTBkAAAAABmwcBAAAAAdAHAQAAAAHRBwEAAAAB0gcBAAAAAdMHAQAAAAHUBwIAAAABDMwGAQAAAAHTBkAAAAAB1AZAAAAAAfUGAgAAAAH-BgEAAAABqwcBAAAAAa8HAQAAAAGwBwIAAAABsQcCAAAAAbIHAgAAAAGzByAAAAABtAcgAAAAAQrMBgEAAAAB0wZAAAAAAdQGQAAAAAHtBkAAAAAB_gYBAAAAAZsHAQAAAAGeBwAAAK0HAqsHAQAAAAGtBxAAAAABrgcBAAAAARY7AQAAAAHMBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAMoHAv4GAQAAAAGrBwEAAAABrgcBAAAAAcEHEAAAAAHCBwEAAAABwwcBAAAAAcQHAQAAAAHFBwEAAAABxgcQAAAAAccHEAAAAAHIBxAAAAABygdAAAAAAcsHQAAAAAHMB0AAAAABzQdAAAAAAc4HQAAAAAHPBwEAAAABCswGAQAAAAHTBkAAAAAB9wZAAAAAAfkGAAAA-QYCjgcBAAAAAZMHAQAAAAGVBwAAAJUHApYHAQAAAAGXBwIAAAABmAcCAAAAAQo7AQAAAAHMBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAJIHAo0HAQAAAAGOBwEAAAABjwcBAAAAAZAHAgAAAAGSB0AAAAABCDsBAAAAAcwGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAAjAcCiQcBAAAAAYoHAQAAAAGMB0AAAAABCMwGAQAAAAHTBkAAAAAB_QYBAAAAAf4GAQAAAAH_BkAAAAABgAcCAAAAAYEHgAAAAAGCBwEAAAABCcwGAQAAAAHTBkAAAAAB8QYBAAAAAfcGQAAAAAH5BgAAAPkGAvoGAgAAAAH7BgIAAAAB_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_kByLmBxAAxQ0AIecHQAC8DQAh6AcCAJAOACEiEgAAjw8AIBsAAI4PACAjAACWDwAgJAAAlA8AICUAAJUPACAoAACSDwAgKQAAkQ8AICoAAJMPACArAACXDwAgLAAAmA8AIC0AAJkPACAuAACaDwAgLwAAmw8AIDAAAJwPACAxAACdDwAgMgAAng8AIDMAAJ8PACA0AACgDwAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAAI0P5gci8AYBAKoNACGbBwEAqw0AIaUHAQCqDQAhqwcBAKsNACGuBwEAqg0AIb0HAQCrDQAh3AdAALwNACHeB0AAvA0AIeQHAACMD-QHIuYHEADFDQAh5wdAALwNACHoBwIAkA4AISISAADdEAAgGwAA3BAAICMAAOQQACAkAADiEAAgJQAA4xAAICcAAN4QACAoAADgEAAgKgAA4RAAICsAAOUQACAsAADmEAAgLQAA5xAAIC4AAOgQACAvAADpEAAgMAAA6hAAIDEAAOsQACAyAADsEAAgMwAA7RAAIDQAAO4QACDMBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAOYHAvAGAQAAAAGbBwEAAAABpQcBAAAAAasHAQAAAAGuBwEAAAABvQcBAAAAAdwHQAAAAAHeB0AAAAAB5AcAAADkBwLmBxAAAAAB5wdAAAAAAegHAgAAAAECAAAATgAgTQAAqhcAIAvMBgEAAAABzQYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAADZBwL-BgEAAAABmwcBAAAAAdcHAQAAAAHaBwAAANoHAtsHQAAAAAHcB0AAAAABAwAAAEwAIE0AAKoXACBOAACvFwAgJAAAAEwAIBIAAI8PACAbAACODwAgIwAAlg8AICQAAJQPACAlAACVDwAgJwAAkA8AICgAAJIPACAqAACTDwAgKwAAlw8AICwAAJgPACAtAACZDwAgLgAAmg8AIC8AAJsPACAwAACcDwAgMQAAnQ8AIDIAAJ4PACAzAACfDwAgNAAAoA8AIEYAAK8XACDMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAAjQ_mByLwBgEAqg0AIZsHAQCrDQAhpQcBAKoNACGrBwEAqw0AIa4HAQCqDQAhvQcBAKsNACHcB0AAvA0AId4HQAC8DQAh5AcAAIwP5Aci5gcQAMUNACHnB0AAvA0AIegHAgCQDgAhIhIAAI8PACAbAACODwAgIwAAlg8AICQAAJQPACAlAACVDwAgJwAAkA8AICgAAJIPACAqAACTDwAgKwAAlw8AICwAAJgPACAtAACZDwAgLgAAmg8AIC8AAJsPACAwAACcDwAgMQAAnQ8AIDIAAJ4PACAzAACfDwAgNAAAoA8AIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACND-YHIvAGAQCqDQAhmwcBAKsNACGlBwEAqg0AIasHAQCrDQAhrgcBAKoNACG9BwEAqw0AIdwHQAC8DQAh3gdAALwNACHkBwAAjA_kByLmBxAAxQ0AIecHQAC8DQAh6AcCAJAOACETBAAAyRQAIBgAAMoUACAZAADLFAAgOAAAzRQAIMwGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAApggChgcBAAAAAZwHAQAAAAGmBwEAAAAB4gcAAAClCAKiCAEAAAABowgBAAAAAaYIAQAAAAGnCAEAAAABqAgBAAAAAakIAQAAAAGqCEAAAAABAgAAAOACACBNAACwFwAgDBwAAP0OACDMBgEAAAABzQYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAADeBwL-BgEAAAABmwcBAAAAAdsHQAAAAAHcB0AAAAAB3gdAAAAAAd8HAgAAAAECAAAAgAEAIE0AALIXACAiEgAA3RAAIBsAANwQACAjAADkEAAgJAAA4hAAICUAAOMQACAnAADeEAAgKQAA3xAAICoAAOEQACArAADlEAAgLAAA5hAAIC0AAOcQACAuAADoEAAgLwAA6RAAIDAAAOoQACAxAADrEAAgMgAA7BAAIDMAAO0QACA0AADuEAAgzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAADmBwLwBgEAAAABmwcBAAAAAaUHAQAAAAGrBwEAAAABrgcBAAAAAb0HAQAAAAHcB0AAAAAB3gdAAAAAAeQHAAAA5AcC5gcQAAAAAecHQAAAAAHoBwIAAAABAgAAAE4AIE0AALQXACADAAAAPwAgTQAAsBcAIE4AALgXACAVAAAAPwAgBAAAoBQAIBgAAKEUACAZAACiFAAgOAAApBQAIEYAALgXACDMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAAnxSmCCKGBwEAqw0AIZwHAQCrDQAhpgcBAKoNACHiBwAAnhSlCCKiCAEAqw0AIaMIAQCqDQAhpggBAKsNACGnCAEAqw0AIagIAQCrDQAhqQgBAKsNACGqCEAAvA0AIRMEAACgFAAgGAAAoRQAIBkAAKIUACA4AACkFAAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAAJ8UpggihgcBAKsNACGcBwEAqw0AIaYHAQCqDQAh4gcAAJ4UpQgioggBAKsNACGjCAEAqg0AIaYIAQCrDQAhpwgBAKsNACGoCAEAqw0AIakIAQCrDQAhqghAALwNACEDAAAAfgAgTQAAshcAIE4AALsXACAOAAAAfgAgHAAA7w4AIEYAALsXACDMBgEAqg0AIc0GAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAADuDt4HIv4GAQCqDQAhmwcBAKsNACHbB0AAvA0AIdwHQAC8DQAh3gdAALwNACHfBwIAkA4AIQwcAADvDgAgzAYBAKoNACHNBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAA7g7eByL-BgEAqg0AIZsHAQCrDQAh2wdAALwNACHcB0AAvA0AId4HQAC8DQAh3wcCAJAOACEDAAAATAAgTQAAtBcAIE4AAL4XACAkAAAATAAgEgAAjw8AIBsAAI4PACAjAACWDwAgJAAAlA8AICUAAJUPACAnAACQDwAgKQAAkQ8AICoAAJMPACArAACXDwAgLAAAmA8AIC0AAJkPACAuAACaDwAgLwAAmw8AIDAAAJwPACAxAACdDwAgMgAAng8AIDMAAJ8PACA0AACgDwAgRgAAvhcAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACND-YHIvAGAQCqDQAhmwcBAKsNACGlBwEAqg0AIasHAQCrDQAhrgcBAKoNACG9BwEAqw0AIdwHQAC8DQAh3gdAALwNACHkBwAAjA_kByLmBxAAxQ0AIecHQAC8DQAh6AcCAJAOACEiEgAAjw8AIBsAAI4PACAjAACWDwAgJAAAlA8AICUAAJUPACAnAACQDwAgKQAAkQ8AICoAAJMPACArAACXDwAgLAAAmA8AIC0AAJkPACAuAACaDwAgLwAAmw8AIDAAAJwPACAxAACdDwAgMgAAng8AIDMAAJ8PACA0AACgDwAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAAI0P5gci8AYBAKoNACGbBwEAqw0AIaUHAQCqDQAhqwcBAKsNACGuBwEAqg0AIb0HAQCrDQAh3AdAALwNACHeB0AAvA0AIeQHAACMD-QHIuYHEADFDQAh5wdAALwNACHoBwIAkA4AISISAADdEAAgGwAA3BAAICMAAOQQACAkAADiEAAgJQAA4xAAICcAAN4QACAoAADgEAAgKQAA3xAAICsAAOUQACAsAADmEAAgLQAA5xAAIC4AAOgQACAvAADpEAAgMAAA6hAAIDEAAOsQACAyAADsEAAgMwAA7RAAIDQAAO4QACDMBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAOYHAvAGAQAAAAGbBwEAAAABpQcBAAAAAasHAQAAAAGuBwEAAAABvQcBAAAAAdwHQAAAAAHeB0AAAAAB5AcAAADkBwLmBxAAAAAB5wdAAAAAAegHAgAAAAECAAAATgAgTQAAvxcAIAMAAABMACBNAAC_FwAgTgAAwxcAICQAAABMACASAACPDwAgGwAAjg8AICMAAJYPACAkAACUDwAgJQAAlQ8AICcAAJAPACAoAACSDwAgKQAAkQ8AICsAAJcPACAsAACYDwAgLQAAmQ8AIC4AAJoPACAvAACbDwAgMAAAnA8AIDEAAJ0PACAyAACeDwAgMwAAnw8AIDQAAKAPACBGAADDFwAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAAI0P5gci8AYBAKoNACGbBwEAqw0AIaUHAQCqDQAhqwcBAKsNACGuBwEAqg0AIb0HAQCrDQAh3AdAALwNACHeB0AAvA0AIeQHAACMD-QHIuYHEADFDQAh5wdAALwNACHoBwIAkA4AISISAACPDwAgGwAAjg8AICMAAJYPACAkAACUDwAgJQAAlQ8AICcAAJAPACAoAACSDwAgKQAAkQ8AICsAAJcPACAsAACYDwAgLQAAmQ8AIC4AAJoPACAvAACbDwAgMAAAnA8AIDEAAJ0PACAyAACeDwAgMwAAnw8AIDQAAKAPACDMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAAjQ_mByLwBgEAqg0AIZsHAQCrDQAhpQcBAKoNACGrBwEAqw0AIa4HAQCqDQAhvQcBAKsNACHcB0AAvA0AId4HQAC8DQAh5AcAAIwP5Aci5gcQAMUNACHnB0AAvA0AIegHAgCQDgAhFQMAALMVACAFAAC0FQAgBgAAtRUAIA4AALYVACA9AAC3FQAgPgAAuRUAID8AALoVACBAAAC7FQAgzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAACvCAKlBwEAAAABpgcBAAAAAeIHAAAArggCqwggAAAAAawIAQAAAAGvCAEAAAABsAhAAAAAAbEIIAAAAAGyCAEAAAABAgAAAMgCACBNAADEFwAgIhIAAN0QACAbAADcEAAgJAAA4hAAICUAAOMQACAnAADeEAAgKAAA4BAAICkAAN8QACAqAADhEAAgKwAA5RAAICwAAOYQACAtAADnEAAgLgAA6BAAIC8AAOkQACAwAADqEAAgMQAA6xAAIDIAAOwQACAzAADtEAAgNAAA7hAAIMwGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAA5gcC8AYBAAAAAZsHAQAAAAGlBwEAAAABqwcBAAAAAa4HAQAAAAG9BwEAAAAB3AdAAAAAAd4HQAAAAAHkBwAAAOQHAuYHEAAAAAHnB0AAAAAB6AcCAAAAAQIAAABOACBNAADGFwAgEgQAAPkRACAWAAD6EQAgGgAA-xEAICIAAP8RACAkAAD9EQAgJQAA_hEAIDsBAAAAAcwGAQAAAAHTBkAAAAAB1AZAAAAAAYYHAQAAAAGWBwEAAAABnAcBAAAAAaUHAQAAAAGmBwEAAAABpwcBAAAAAekHAQAAAAHqByAAAAABAgAAAKwGACBNAADIFwAgGRIAAPMRACAbAACaEgAgNgAA9BEAIDkAAPcRACA7AAD1EQAgPAAA9hEAIMwGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAA9AcChgcBAAAAAZYHAQAAAAGiBwEAAAABpQcBAAAAAaYHAQAAAAGnBwEAAAABqwcBAAAAAb0HAQAAAAHXBwEAAAAB2gcAAAD1BwLmBwEAAAAB6QcBAAAAAfIHAQAAAAH2BwAAAPYHAvcHQAAAAAECAAAAOAAgTQAAyhcAIAnMBgEAAAAB0wZAAAAAAf4GAQAAAAGbBwEAAAABvQcBAAAAAb4HAQAAAAG_BwIAAAABwAcQAAAAAcEHEAAAAAEMzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAAC6BwKrBwEAAAABrQcQAAAAAa4HAQAAAAG3BwAAALcHArgHAQAAAAG6BwEAAAABuwdAAAAAAbwHgAAAAAEDAAAAFgAgTQAAxBcAIE4AANAXACAXAAAAFgAgAwAA1RQAIAUAANYUACAGAADXFAAgDgAA2BQAID0AANkUACA-AADbFAAgPwAA3BQAIEAAAN0UACBGAADQFwAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAANQUrwgipQcBAKsNACGmBwEAqg0AIeIHAADTFK4IIqsIIADaDQAhrAgBAKsNACGvCAEAqw0AIbAIQAC8DQAhsQggANoNACGyCAEAqw0AIRUDAADVFAAgBQAA1hQAIAYAANcUACAOAADYFAAgPQAA2RQAID4AANsUACA_AADcFAAgQAAA3RQAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAADUFK8IIqUHAQCrDQAhpgcBAKoNACHiBwAA0xSuCCKrCCAA2g0AIawIAQCrDQAhrwgBAKsNACGwCEAAvA0AIbEIIADaDQAhsggBAKsNACEDAAAATAAgTQAAxhcAIE4AANMXACAkAAAATAAgEgAAjw8AIBsAAI4PACAkAACUDwAgJQAAlQ8AICcAAJAPACAoAACSDwAgKQAAkQ8AICoAAJMPACArAACXDwAgLAAAmA8AIC0AAJkPACAuAACaDwAgLwAAmw8AIDAAAJwPACAxAACdDwAgMgAAng8AIDMAAJ8PACA0AACgDwAgRgAA0xcAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACND-YHIvAGAQCqDQAhmwcBAKsNACGlBwEAqg0AIasHAQCrDQAhrgcBAKoNACG9BwEAqw0AIdwHQAC8DQAh3gdAALwNACHkBwAAjA_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-xEAICMAAPwRACAkAAD9EQAgJQAA_hEAIDsBAAAAAcwGAQAAAAHTBkAAAAAB1AZAAAAAAYYHAQAAAAGWBwEAAAABnAcBAAAAAaUHAQAAAAGmBwEAAAABpwcBAAAAAekHAQAAAAHqByAAAAABAgAAAKwGACBNAADpFwAgHBcAANAOACAbAADRDgAgHAAA0g4AIB0AANMOACAhAADUDgAgOwEAAAABzAYBAAAAAc0GAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAAygcC_gYBAAAAAasHAQAAAAGuBwEAAAABwQcQAAAAAcIHAQAAAAHDBwEAAAABxAcBAAAAAcUHAQAAAAHGBxAAAAABxwcQAAAAAcgHEAAAAAHKB0AAAAABywdAAAAAAcwHQAAAAAHNB0AAAAABzgdAAAAAAc8HAQAAAAECAAAAUgAgTQAA6xcAIAMAAABIACBNAADpFwAgTgAA7xcAIBQAAABIACAEAADyEAAgFgAA8xAAIBoAAPQQACAjAAD1EAAgJAAA9hAAICUAAPcQACA7AQCrDQAhRgAA7xcAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIYYHAQCrDQAhlgcBAKsNACGcBwEAqw0AIaUHAQCqDQAhpgcBAKoNACGnBwEAqw0AIekHAQCrDQAh6gcgANoNACESBAAA8hAAIBYAAPMQACAaAAD0EAAgIwAA9RAAICQAAPYQACAlAAD3EAAgOwEAqw0AIcwGAQCqDQAh0wZAAKwNACHUBkAArA0AIYYHAQCrDQAhlgcBAKsNACGcBwEAqw0AIaUHAQCqDQAhpgcBAKoNACGnBwEAqw0AIekHAQCrDQAh6gcgANoNACEDAAAAUAAgTQAA6xcAIE4AAPIXACAeAAAAUAAgFwAAsg4AIBsAALMOACAcAAC0DgAgHQAAtQ4AICEAALYOACA7AQCrDQAhRgAA8hcAIMwGAQCqDQAhzQYBAKsNACHTBkAArA0AIdQGQACsDQAh7AYAALEOygci_gYBAKoNACGrBwEAqw0AIa4HAQCqDQAhwQcQAJsOACHCBwEAqw0AIcMHAQCqDQAhxAcBAKsNACHFBwEAqw0AIcYHEACbDgAhxwcQAJsOACHIBxAAmw4AIcoHQAC8DQAhywdAALwNACHMB0AAvA0AIc0HQAC8DQAhzgdAALwNACHPBwEAqg0AIRwXAACyDgAgGwAAsw4AIBwAALQOACAdAAC1DgAgIQAAtg4AIDsBAKsNACHMBgEAqg0AIc0GAQCrDQAh0wZAAKwNACHUBkAArA0AIewGAACxDsoHIv4GAQCqDQAhqwcBAKsNACGuBwEAqg0AIcEHEACbDgAhwgcBAKsNACHDBwEAqg0AIcQHAQCrDQAhxQcBAKsNACHGBxAAmw4AIccHEACbDgAhyAcQAJsOACHKB0AAvA0AIcsHQAC8DQAhzAdAALwNACHNB0AAvA0AIc4HQAC8DQAhzwcBAKoNACEiEgAA3RAAIBsAANwQACAjAADkEAAgJQAA4xAAICcAAN4QACAoAADgEAAgKQAA3xAAICoAAOEQACArAADlEAAgLAAA5hAAIC0AAOcQACAuAADoEAAgLwAA6RAAIDAAAOoQACAxAADrEAAgMgAA7BAAIDMAAO0QACA0AADuEAAgzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAADmBwLwBgEAAAABmwcBAAAAAaUHAQAAAAGrBwEAAAABrgcBAAAAAb0HAQAAAAHcB0AAAAAB3gdAAAAAAeQHAAAA5AcC5gcQAAAAAecHQAAAAAHoBwIAAAABAgAAAE4AIE0AAPMXACASBAAA-REAIBYAAPoRACAaAAD7EQAgIgAA_xEAICMAAPwRACAlAAD-EQAgOwEAAAABzAYBAAAAAdMGQAAAAAHUBkAAAAABhgcBAAAAAZYHAQAAAAGcBwEAAAABpQcBAAAAAaYHAQAAAAGnBwEAAAAB6QcBAAAAAeoHIAAAAAECAAAArAYAIE0AAPUXACADAAAATAAgTQAA8xcAIE4AAPkXACAkAAAATAAgEgAAjw8AIBsAAI4PACAjAACWDwAgJQAAlQ8AICcAAJAPACAoAACSDwAgKQAAkQ8AICoAAJMPACArAACXDwAgLAAAmA8AIC0AAJkPACAuAACaDwAgLwAAmw8AIDAAAJwPACAxAACdDwAgMgAAng8AIDMAAJ8PACA0AACgDwAgRgAA-RcAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACND-YHIvAGAQCqDQAhmwcBAKsNACGlBwEAqg0AIasHAQCrDQAhrgcBAKoNACG9BwEAqw0AIdwHQAC8DQAh3gdAALwNACHkBwAAjA_kByLmBxAAxQ0AIecHQAC8DQAh6AcCAJAOACEiEgAAjw8AIBsAAI4PACAjAACWDwAgJQAAlQ8AICcAAJAPACAoAACSDwAgKQAAkQ8AICoAAJMPACArAACXDwAgLAAAmA8AIC0AAJkPACAuAACaDwAgLwAAmw8AIDAAAJwPACAxAACdDwAgMgAAng8AIDMAAJ8PACA0AACgDwAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAAI0P5gci8AYBAKoNACGbBwEAqw0AIaUHAQCqDQAhqwcBAKsNACGuBwEAqg0AIb0HAQCrDQAh3AdAALwNACHeB0AAvA0AIeQHAACMD-QHIuYHEADFDQAh5wdAALwNACHoBwIAkA4AIQMAAABIACBNAAD1FwAgTgAA_BcAIBQAAABIACAEAADyEAAgFgAA8xAAIBoAAPQQACAiAAD4EAAgIwAA9RAAICUAAPcQACA7AQCrDQAhRgAA_BcAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIYYHAQCrDQAhlgcBAKsNACGcBwEAqw0AIaUHAQCqDQAhpgcBAKoNACGnBwEAqw0AIekHAQCrDQAh6gcgANoNACESBAAA8hAAIBYAAPMQACAaAAD0EAAgIgAA-BAAICMAAPUQACAlAAD3EAAgOwEAqw0AIcwGAQCqDQAh0wZAAKwNACHUBkAArA0AIYYHAQCrDQAhlgcBAKsNACGcBwEAqw0AIaUHAQCqDQAhpgcBAKoNACGnBwEAqw0AIekHAQCrDQAh6gcgANoNACEiEgAA3RAAIBsAANwQACAjAADkEAAgJAAA4hAAICcAAN4QACAoAADgEAAgKQAA3xAAICoAAOEQACArAADlEAAgLAAA5hAAIC0AAOcQACAuAADoEAAgLwAA6RAAIDAAAOoQACAxAADrEAAgMgAA7BAAIDMAAO0QACA0AADuEAAgzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAADmBwLwBgEAAAABmwcBAAAAAaUHAQAAAAGrBwEAAAABrgcBAAAAAb0HAQAAAAHcB0AAAAAB3gdAAAAAAeQHAAAA5AcC5gcQAAAAAecHQAAAAAHoBwIAAAABAgAAAE4AIE0AAP0XACASBAAA-REAIBYAAPoRACAaAAD7EQAgIgAA_xEAICMAAPwRACAkAAD9EQAgOwEAAAABzAYBAAAAAdMGQAAAAAHUBkAAAAABhgcBAAAAAZYHAQAAAAGcBwEAAAABpQcBAAAAAaYHAQAAAAGnBwEAAAAB6QcBAAAAAeoHIAAAAAECAAAArAYAIE0AAP8XACADAAAATAAgTQAA_RcAIE4AAIMYACAkAAAATAAgEgAAjw8AIBsAAI4PACAjAACWDwAgJAAAlA8AICcAAJAPACAoAACSDwAgKQAAkQ8AICoAAJMPACArAACXDwAgLAAAmA8AIC0AAJkPACAuAACaDwAgLwAAmw8AIDAAAJwPACAxAACdDwAgMgAAng8AIDMAAJ8PACA0AACgDwAgRgAAgxgAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACND-YHIvAGAQCqDQAhmwcBAKsNACGlBwEAqg0AIasHAQCrDQAhrgcBAKoNACG9BwEAqw0AIdwHQAC8DQAh3gdAALwNACHkBwAAjA_kByLmBxAAxQ0AIecHQAC8DQAh6AcCAJAOACEiEgAAjw8AIBsAAI4PACAjAACWDwAgJAAAlA8AICcAAJAPACAoAACSDwAgKQAAkQ8AICoAAJMPACArAACXDwAgLAAAmA8AIC0AAJkPACAuAACaDwAgLwAAmw8AIDAAAJwPACAxAACdDwAgMgAAng8AIDMAAJ8PACA0AACgDwAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAAI0P5gci8AYBAKoNACGbBwEAqw0AIaUHAQCqDQAhqwcBAKsNACGuBwEAqg0AIb0HAQCrDQAh3AdAALwNACHeB0AAvA0AIeQHAACMD-QHIuYHEADFDQAh5wdAALwNACHoBwIAkA4AIQMAAABIACBNAAD_FwAgTgAAhhgAIBQAAABIACAEAADyEAAgFgAA8xAAIBoAAPQQACAiAAD4EAAgIwAA9RAAICQAAPYQACA7AQCrDQAhRgAAhhgAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIYYHAQCrDQAhlgcBAKsNACGcBwEAqw0AIaUHAQCqDQAhpgcBAKoNACGnBwEAqw0AIekHAQCrDQAh6gcgANoNACESBAAA8hAAIBYAAPMQACAaAAD0EAAgIgAA-BAAICMAAPUQACAkAAD2EAAgOwEAqw0AIcwGAQCqDQAh0wZAAKwNACHUBkAArA0AIYYHAQCrDQAhlgcBAKsNACGcBwEAqw0AIaUHAQCqDQAhpgcBAKoNACGnBwEAqw0AIekHAQCrDQAh6gcgANoNACEVAwAAsxUAIAUAALQVACAGAAC1FQAgDgAAthUAICMAALgVACA9AAC3FQAgPwAAuhUAIEAAALsVACDMBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAK8IAqUHAQAAAAGmBwEAAAAB4gcAAACuCAKrCCAAAAABrAgBAAAAAa8IAQAAAAGwCEAAAAABsQggAAAAAbIIAQAAAAECAAAAyAIAIE0AAIcYACADAAAAFgAgTQAAhxgAIE4AAIsYACAXAAAAFgAgAwAA1RQAIAUAANYUACAGAADXFAAgDgAA2BQAICMAANoUACA9AADZFAAgPwAA3BQAIEAAAN0UACBGAACLGAAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAANQUrwgipQcBAKsNACGmBwEAqg0AIeIHAADTFK4IIqsIIADaDQAhrAgBAKsNACGvCAEAqw0AIbAIQAC8DQAhsQggANoNACGyCAEAqw0AIRUDAADVFAAgBQAA1hQAIAYAANcUACAOAADYFAAgIwAA2hQAID0AANkUACA_AADcFAAgQAAA3RQAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAADUFK8IIqUHAQCrDQAhpgcBAKoNACHiBwAA0xSuCCKrCCAA2g0AIawIAQCrDQAhrwgBAKsNACGwCEAAvA0AIbEIIADaDQAhsggBAKsNACEiEgAA3RAAIBsAANwQACAjAADkEAAgJAAA4hAAICUAAOMQACAnAADeEAAgKAAA4BAAICkAAN8QACAqAADhEAAgLAAA5hAAIC0AAOcQACAuAADoEAAgLwAA6RAAIDAAAOoQACAxAADrEAAgMgAA7BAAIDMAAO0QACA0AADuEAAgzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAADmBwLwBgEAAAABmwcBAAAAAaUHAQAAAAGrBwEAAAABrgcBAAAAAb0HAQAAAAHcB0AAAAAB3gdAAAAAAeQHAAAA5AcC5gcQAAAAAecHQAAAAAHoBwIAAAABAgAAAE4AIE0AAIwYACADAAAATAAgTQAAjBgAIE4AAJAYACAkAAAATAAgEgAAjw8AIBsAAI4PACAjAACWDwAgJAAAlA8AICUAAJUPACAnAACQDwAgKAAAkg8AICkAAJEPACAqAACTDwAgLAAAmA8AIC0AAJkPACAuAACaDwAgLwAAmw8AIDAAAJwPACAxAACdDwAgMgAAng8AIDMAAJ8PACA0AACgDwAgRgAAkBgAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACND-YHIvAGAQCqDQAhmwcBAKsNACGlBwEAqg0AIasHAQCrDQAhrgcBAKoNACG9BwEAqw0AIdwHQAC8DQAh3gdAALwNACHkBwAAjA_kByLmBxAAxQ0AIecHQAC8DQAh6AcCAJAOACEiEgAAjw8AIBsAAI4PACAjAACWDwAgJAAAlA8AICUAAJUPACAnAACQDwAgKAAAkg8AICkAAJEPACAqAACTDwAgLAAAmA8AIC0AAJkPACAuAACaDwAgLwAAmw8AIDAAAJwPACAxAACdDwAgMgAAng8AIDMAAJ8PACA0AACgDwAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAAI0P5gci8AYBAKoNACGbBwEAqw0AIaUHAQCqDQAhqwcBAKsNACGuBwEAqg0AIb0HAQCrDQAh3AdAALwNACHeB0AAvA0AIeQHAACMD-QHIuYHEADFDQAh5wdAALwNACHoBwIAkA4AISISAADdEAAgGwAA3BAAICMAAOQQACAkAADiEAAgJQAA4xAAICcAAN4QACAoAADgEAAgKQAA3xAAICoAAOEQACArAADlEAAgLQAA5xAAIC4AAOgQACAvAADpEAAgMAAA6hAAIDEAAOsQACAyAADsEAAgMwAA7RAAIDQAAO4QACDMBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAOYHAvAGAQAAAAGbBwEAAAABpQcBAAAAAasHAQAAAAGuBwEAAAABvQcBAAAAAdwHQAAAAAHeB0AAAAAB5AcAAADkBwLmBxAAAAAB5wdAAAAAAegHAgAAAAECAAAATgAgTQAAkRgAIAMAAABMACBNAACRGAAgTgAAlRgAICQAAABMACASAACPDwAgGwAAjg8AICMAAJYPACAkAACUDwAgJQAAlQ8AICcAAJAPACAoAACSDwAgKQAAkQ8AICoAAJMPACArAACXDwAgLQAAmQ8AIC4AAJoPACAvAACbDwAgMAAAnA8AIDEAAJ0PACAyAACeDwAgMwAAnw8AIDQAAKAPACBGAACVGAAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAAI0P5gci8AYBAKoNACGbBwEAqw0AIaUHAQCqDQAhqwcBAKsNACGuBwEAqg0AIb0HAQCrDQAh3AdAALwNACHeB0AAvA0AIeQHAACMD-QHIuYHEADFDQAh5wdAALwNACHoBwIAkA4AISISAACPDwAgGwAAjg8AICMAAJYPACAkAACUDwAgJQAAlQ8AICcAAJAPACAoAACSDwAgKQAAkQ8AICoAAJMPACArAACXDwAgLQAAmQ8AIC4AAJoPACAvAACbDwAgMAAAnA8AIDEAAJ0PACAyAACeDwAgMwAAnw8AIDQAAKAPACDMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAAjQ_mByLwBgEAqg0AIZsHAQCrDQAhpQcBAKoNACGrBwEAqw0AIa4HAQCqDQAhvQcBAKsNACHcB0AAvA0AId4HQAC8DQAh5AcAAIwP5Aci5gcQAMUNACHnB0AAvA0AIegHAgCQDgAhIhIAAN0QACAbAADcEAAgIwAA5BAAICQAAOIQACAlAADjEAAgJwAA3hAAICgAAOAQACApAADfEAAgKgAA4RAAICsAAOUQACAsAADmEAAgLgAA6BAAIC8AAOkQACAwAADqEAAgMQAA6xAAIDIAAOwQACAzAADtEAAgNAAA7hAAIMwGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAA5gcC8AYBAAAAAZsHAQAAAAGlBwEAAAABqwcBAAAAAa4HAQAAAAG9BwEAAAAB3AdAAAAAAd4HQAAAAAHkBwAAAOQHAuYHEAAAAAHnB0AAAAAB6AcCAAAAAQIAAABOACBNAACWGAAgAwAAAEwAIE0AAJYYACBOAACaGAAgJAAAAEwAIBIAAI8PACAbAACODwAgIwAAlg8AICQAAJQPACAlAACVDwAgJwAAkA8AICgAAJIPACApAACRDwAgKgAAkw8AICsAAJcPACAsAACYDwAgLgAAmg8AIC8AAJsPACAwAACcDwAgMQAAnQ8AIDIAAJ4PACAzAACfDwAgNAAAoA8AIEYAAJoYACDMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAAjQ_mByLwBgEAqg0AIZsHAQCrDQAhpQcBAKoNACGrBwEAqw0AIa4HAQCqDQAhvQcBAKsNACHcB0AAvA0AId4HQAC8DQAh5AcAAIwP5Aci5gcQAMUNACHnB0AAvA0AIegHAgCQDgAhIhIAAI8PACAbAACODwAgIwAAlg8AICQAAJQPACAlAACVDwAgJwAAkA8AICgAAJIPACApAACRDwAgKgAAkw8AICsAAJcPACAsAACYDwAgLgAAmg8AIC8AAJsPACAwAACcDwAgMQAAnQ8AIDIAAJ4PACAzAACfDwAgNAAAoA8AIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACND-YHIvAGAQCqDQAhmwcBAKsNACGlBwEAqg0AIasHAQCrDQAhrgcBAKoNACG9BwEAqw0AIdwHQAC8DQAh3gdAALwNACHkBwAAjA_kByLmBxAAxQ0AIecHQAC8DQAh6AcCAJAOACEiEgAA3RAAIBsAANwQACAjAADkEAAgJAAA4hAAICUAAOMQACAnAADeEAAgKAAA4BAAICkAAN8QACAqAADhEAAgKwAA5RAAICwAAOYQACAtAADnEAAgLwAA6RAAIDAAAOoQACAxAADrEAAgMgAA7BAAIDMAAO0QACA0AADuEAAgzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAADmBwLwBgEAAAABmwcBAAAAAaUHAQAAAAGrBwEAAAABrgcBAAAAAb0HAQAAAAHcB0AAAAAB3gdAAAAAAeQHAAAA5AcC5gcQAAAAAecHQAAAAAHoBwIAAAABAgAAAE4AIE0AAJsYACADAAAATAAgTQAAmxgAIE4AAJ8YACAkAAAATAAgEgAAjw8AIBsAAI4PACAjAACWDwAgJAAAlA8AICUAAJUPACAnAACQDwAgKAAAkg8AICkAAJEPACAqAACTDwAgKwAAlw8AICwAAJgPACAtAACZDwAgLwAAmw8AIDAAAJwPACAxAACdDwAgMgAAng8AIDMAAJ8PACA0AACgDwAgRgAAnxgAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACND-YHIvAGAQCqDQAhmwcBAKsNACGlBwEAqg0AIasHAQCrDQAhrgcBAKoNACG9BwEAqw0AIdwHQAC8DQAh3gdAALwNACHkBwAAjA_kByLmBxAAxQ0AIecHQAC8DQAh6AcCAJAOACEiEgAAjw8AIBsAAI4PACAjAACWDwAgJAAAlA8AICUAAJUPACAnAACQDwAgKAAAkg8AICkAAJEPACAqAACTDwAgKwAAlw8AICwAAJgPACAtAACZDwAgLwAAmw8AIDAAAJwPACAxAACdDwAgMgAAng8AIDMAAJ8PACA0AACgDwAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAAI0P5gci8AYBAKoNACGbBwEAqw0AIaUHAQCqDQAhqwcBAKsNACGuBwEAqg0AIb0HAQCrDQAh3AdAALwNACHeB0AAvA0AIeQHAACMD-QHIuYHEADFDQAh5wdAALwNACHoBwIAkA4AISISAADdEAAgGwAA3BAAICMAAOQQACAkAADiEAAgJQAA4xAAICcAAN4QACAoAADgEAAgKQAA3xAAICoAAOEQACArAADlEAAgLAAA5hAAIC0AAOcQACAuAADoEAAgMAAA6hAAIDEAAOsQACAyAADsEAAgMwAA7RAAIDQAAO4QACDMBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAOYHAvAGAQAAAAGbBwEAAAABpQcBAAAAAasHAQAAAAGuBwEAAAABvQcBAAAAAdwHQAAAAAHeB0AAAAAB5AcAAADkBwLmBxAAAAAB5wdAAAAAAegHAgAAAAECAAAATgAgTQAAoBgAIAMAAABMACBNAACgGAAgTgAApBgAICQAAABMACASAACPDwAgGwAAjg8AICMAAJYPACAkAACUDwAgJQAAlQ8AICcAAJAPACAoAACSDwAgKQAAkQ8AICoAAJMPACArAACXDwAgLAAAmA8AIC0AAJkPACAuAACaDwAgMAAAnA8AIDEAAJ0PACAyAACeDwAgMwAAnw8AIDQAAKAPACBGAACkGAAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAAI0P5gci8AYBAKoNACGbBwEAqw0AIaUHAQCqDQAhqwcBAKsNACGuBwEAqg0AIb0HAQCrDQAh3AdAALwNACHeB0AAvA0AIeQHAACMD-QHIuYHEADFDQAh5wdAALwNACHoBwIAkA4AISISAACPDwAgGwAAjg8AICMAAJYPACAkAACUDwAgJQAAlQ8AICcAAJAPACAoAACSDwAgKQAAkQ8AICoAAJMPACArAACXDwAgLAAAmA8AIC0AAJkPACAuAACaDwAgMAAAnA8AIDEAAJ0PACAyAACeDwAgMwAAnw8AIDQAAKAPACDMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAAjQ_mByLwBgEAqg0AIZsHAQCrDQAhpQcBAKoNACGrBwEAqw0AIa4HAQCqDQAhvQcBAKsNACHcB0AAvA0AId4HQAC8DQAh5AcAAIwP5Aci5gcQAMUNACHnB0AAvA0AIegHAgCQDgAhIhIAAN0QACAbAADcEAAgIwAA5BAAICQAAOIQACAlAADjEAAgJwAA3hAAICgAAOAQACApAADfEAAgKgAA4RAAICsAAOUQACAsAADmEAAgLQAA5xAAIC4AAOgQACAvAADpEAAgMQAA6xAAIDIAAOwQACAzAADtEAAgNAAA7hAAIMwGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAA5gcC8AYBAAAAAZsHAQAAAAGlBwEAAAABqwcBAAAAAa4HAQAAAAG9BwEAAAAB3AdAAAAAAd4HQAAAAAHkBwAAAOQHAuYHEAAAAAHnB0AAAAAB6AcCAAAAAQIAAABOACBNAAClGAAgAwAAAEwAIE0AAKUYACBOAACpGAAgJAAAAEwAIBIAAI8PACAbAACODwAgIwAAlg8AICQAAJQPACAlAACVDwAgJwAAkA8AICgAAJIPACApAACRDwAgKgAAkw8AICsAAJcPACAsAACYDwAgLQAAmQ8AIC4AAJoPACAvAACbDwAgMQAAnQ8AIDIAAJ4PACAzAACfDwAgNAAAoA8AIEYAAKkYACDMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAAjQ_mByLwBgEAqg0AIZsHAQCrDQAhpQcBAKoNACGrBwEAqw0AIa4HAQCqDQAhvQcBAKsNACHcB0AAvA0AId4HQAC8DQAh5AcAAIwP5Aci5gcQAMUNACHnB0AAvA0AIegHAgCQDgAhIhIAAI8PACAbAACODwAgIwAAlg8AICQAAJQPACAlAACVDwAgJwAAkA8AICgAAJIPACApAACRDwAgKgAAkw8AICsAAJcPACAsAACYDwAgLQAAmQ8AIC4AAJoPACAvAACbDwAgMQAAnQ8AIDIAAJ4PACAzAACfDwAgNAAAoA8AIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACND-YHIvAGAQCqDQAhmwcBAKsNACGlBwEAqg0AIasHAQCrDQAhrgcBAKoNACG9BwEAqw0AIdwHQAC8DQAh3gdAALwNACHkBwAAjA_kByLmBxAAxQ0AIecHQAC8DQAh6AcCAJAOACEiEgAA3RAAIBsAANwQACAjAADkEAAgJAAA4hAAICUAAOMQACAnAADeEAAgKAAA4BAAICkAAN8QACAqAADhEAAgKwAA5RAAICwAAOYQACAtAADnEAAgLgAA6BAAIC8AAOkQACAwAADqEAAgMgAA7BAAIDMAAO0QACA0AADuEAAgzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAADmBwLwBgEAAAABmwcBAAAAAaUHAQAAAAGrBwEAAAABrgcBAAAAAb0HAQAAAAHcB0AAAAAB3gdAAAAAAeQHAAAA5AcC5gcQAAAAAecHQAAAAAHoBwIAAAABAgAAAE4AIE0AAKoYACADAAAATAAgTQAAqhgAIE4AAK4YACAkAAAATAAgEgAAjw8AIBsAAI4PACAjAACWDwAgJAAAlA8AICUAAJUPACAnAACQDwAgKAAAkg8AICkAAJEPACAqAACTDwAgKwAAlw8AICwAAJgPACAtAACZDwAgLgAAmg8AIC8AAJsPACAwAACcDwAgMgAAng8AIDMAAJ8PACA0AACgDwAgRgAArhgAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACND-YHIvAGAQCqDQAhmwcBAKsNACGlBwEAqg0AIasHAQCrDQAhrgcBAKoNACG9BwEAqw0AIdwHQAC8DQAh3gdAALwNACHkBwAAjA_kByLmBxAAxQ0AIecHQAC8DQAh6AcCAJAOACEiEgAAjw8AIBsAAI4PACAjAACWDwAgJAAAlA8AICUAAJUPACAnAACQDwAgKAAAkg8AICkAAJEPACAqAACTDwAgKwAAlw8AICwAAJgPACAtAACZDwAgLgAAmg8AIC8AAJsPACAwAACcDwAgMgAAng8AIDMAAJ8PACA0AACgDwAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAAI0P5gci8AYBAKoNACGbBwEAqw0AIaUHAQCqDQAhqwcBAKsNACGuBwEAqg0AIb0HAQCrDQAh3AdAALwNACHeB0AAvA0AIeQHAACMD-QHIuYHEADFDQAh5wdAALwNACHoBwIAkA4AISISAADdEAAgGwAA3BAAICMAAOQQACAkAADiEAAgJQAA4xAAICcAAN4QACAoAADgEAAgKQAA3xAAICoAAOEQACArAADlEAAgLAAA5hAAIC0AAOcQACAuAADoEAAgLwAA6RAAIDAAAOoQACAxAADrEAAgMwAA7RAAIDQAAO4QACDMBgEAAAAB0wZAAAAAAdQGQAAAAAHsBgAAAOYHAvAGAQAAAAGbBwEAAAABpQcBAAAAAasHAQAAAAGuBwEAAAABvQcBAAAAAdwHQAAAAAHeB0AAAAAB5AcAAADkBwLmBxAAAAAB5wdAAAAAAegHAgAAAAECAAAATgAgTQAArxgAIAMAAABMACBNAACvGAAgTgAAsxgAICQAAABMACASAACPDwAgGwAAjg8AICMAAJYPACAkAACUDwAgJQAAlQ8AICcAAJAPACAoAACSDwAgKQAAkQ8AICoAAJMPACArAACXDwAgLAAAmA8AIC0AAJkPACAuAACaDwAgLwAAmw8AIDAAAJwPACAxAACdDwAgMwAAnw8AIDQAAKAPACBGAACzGAAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAAI0P5gci8AYBAKoNACGbBwEAqw0AIaUHAQCqDQAhqwcBAKsNACGuBwEAqg0AIb0HAQCrDQAh3AdAALwNACHeB0AAvA0AIeQHAACMD-QHIuYHEADFDQAh5wdAALwNACHoBwIAkA4AISISAACPDwAgGwAAjg8AICMAAJYPACAkAACUDwAgJQAAlQ8AICcAAJAPACAoAACSDwAgKQAAkQ8AICoAAJMPACArAACXDwAgLAAAmA8AIC0AAJkPACAuAACaDwAgLwAAmw8AIDAAAJwPACAxAACdDwAgMwAAnw8AIDQAAKAPACDMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAAjQ_mByLwBgEAqg0AIZsHAQCrDQAhpQcBAKoNACGrBwEAqw0AIa4HAQCqDQAhvQcBAKsNACHcB0AAvA0AId4HQAC8DQAh5AcAAIwP5Aci5gcQAMUNACHnB0AAvA0AIegHAgCQDgAhIhIAAN0QACAbAADcEAAgIwAA5BAAICQAAOIQACAlAADjEAAgJwAA3hAAICgAAOAQACApAADfEAAgKgAA4RAAICsAAOUQACAsAADmEAAgLQAA5xAAIC4AAOgQACAvAADpEAAgMAAA6hAAIDEAAOsQACAyAADsEAAgNAAA7hAAIMwGAQAAAAHTBkAAAAAB1AZAAAAAAewGAAAA5gcC8AYBAAAAAZsHAQAAAAGlBwEAAAABqwcBAAAAAa4HAQAAAAG9BwEAAAAB3AdAAAAAAd4HQAAAAAHkBwAAAOQHAuYHEAAAAAHnB0AAAAAB6AcCAAAAAQIAAABOACBNAAC0GAAgAwAAAEwAIE0AALQYACBOAAC4GAAgJAAAAEwAIBIAAI8PACAbAACODwAgIwAAlg8AICQAAJQPACAlAACVDwAgJwAAkA8AICgAAJIPACApAACRDwAgKgAAkw8AICsAAJcPACAsAACYDwAgLQAAmQ8AIC4AAJoPACAvAACbDwAgMAAAnA8AIDEAAJ0PACAyAACeDwAgNAAAoA8AIEYAALgYACDMBgEAqg0AIdMGQACsDQAh1AZAAKwNACHsBgAAjQ_mByLwBgEAqg0AIZsHAQCrDQAhpQcBAKoNACGrBwEAqw0AIa4HAQCqDQAhvQcBAKsNACHcB0AAvA0AId4HQAC8DQAh5AcAAIwP5Aci5gcQAMUNACHnB0AAvA0AIegHAgCQDgAhIhIAAI8PACAbAACODwAgIwAAlg8AICQAAJQPACAlAACVDwAgJwAAkA8AICgAAJIPACApAACRDwAgKgAAkw8AICsAAJcPACAsAACYDwAgLQAAmQ8AIC4AAJoPACAvAACbDwAgMAAAnA8AIDEAAJ0PACAyAACeDwAgNAAAoA8AIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACND-YHIvAGAQCqDQAhmwcBAKsNACGlBwEAqg0AIasHAQCrDQAhrgcBAKoNACG9BwEAqw0AIdwHQAC8DQAh3gdAALwNACHkBwAAjA_kByLmBxAAxQ0AIecHQAC8DQAh6AcCAJAOACEiEgAA3RAAIBsAANwQACAjAADkEAAgJAAA4hAAICUAAOMQACAnAADeEAAgKAAA4BAAICkAAN8QACAqAADhEAAgKwAA5RAAICwAAOYQACAtAADnEAAgLgAA6BAAIC8AAOkQACAwAADqEAAgMQAA6xAAIDIAAOwQACAzAADtEAAgzAYBAAAAAdMGQAAAAAHUBkAAAAAB7AYAAADmBwLwBgEAAAABmwcBAAAAAaUHAQAAAAGrBwEAAAABrgcBAAAAAb0HAQAAAAHcB0AAAAAB3gdAAAAAAeQHAAAA5AcC5gcQAAAAAecHQAAAAAHoBwIAAAABAgAAAE4AIE0AALkYACADAAAATAAgTQAAuRgAIE4AAL0YACAkAAAATAAgEgAAjw8AIBsAAI4PACAjAACWDwAgJAAAlA8AICUAAJUPACAnAACQDwAgKAAAkg8AICkAAJEPACAqAACTDwAgKwAAlw8AICwAAJgPACAtAACZDwAgLgAAmg8AIC8AAJsPACAwAACcDwAgMQAAnQ8AIDIAAJ4PACAzAACfDwAgRgAAvRgAIMwGAQCqDQAh0wZAAKwNACHUBkAArA0AIewGAACND-YHIvAGAQCqDQAhmwcBAKsNACGlBwEAqg0AIasHAQCrDQAhrgcBAKoNACG9BwEAqw0AIdwHQAC8DQAh3gdAALwNACHkBwAAjA_kByLmBxAAxQ0AIecHQAC8DQAh6AcCAJAOACEiEgAAjw8AIBsAAI4PACAjAACWDwAgJAAAlA8AICUAAJUPACAnAACQDwAgKAAAkg8AICkAAJEPACAqAACTDwAgKwAAlw8AICwAAJgPACAtAACZDwAgLgAAmg8AIC8AAJsPACAwAACcDwAgMQAAnQ8AIDIAAJ4PACAzAACfDwAgzAYBAKoNACHTBkAArA0AIdQGQACsDQAh7AYAAI0P5gci8AYBAKoNACGbBwEAqw0AIaUHAQCqDQAhqwcBAKsNACGuBwEAqg0AIb0HAQCrDQAh3AdAALwNACHeB0AAvA0AIeQHAACMD-QHIuYHEADFDQAh5wdAALwNACHoBwIAkA4AIQEEAAIKAwUBBQkDBg0ECAA4DhEFI-ABGz0iDD7kATc_5QEXQOYBGgEEAAIBBAACBAgACwkTBgoXAg0bCAIHFAUIAAcBBxUAAgsABQwACQIHHAgIAAoBBx0AAQ0eAAIXAA0d3wECCAgANhIkDhvSARoj2gEbNtMBFznZARY71wE1PNgBDAgIADQTKA8VMxMWOQ0aygEZH8YBHDk9FjrJAR0CDwAQEgAOAwgAEhAsEREtDwEPABACEC4AES8AAhIADhQAFAIIABURNBMBETUAAxI-DhcADTZAFwYEQQIIADMYQg0ZQxY3Rxg4wQEkAxwAGTW_ASU2wAEXFAgAMhJ5DhtJGiOLARskiQEhJYoBIid9JCiEARgpgQElKogBJyuPASgskwEpLZcBKi6ZASsvnQEsMKEBLTGlAS4yqQEvM60BMDSvATEIBEoCCAAjFksNGk8ZInIfI1MbJGshJXAiBwgAIBdUDRtVGhxWGR0AAiFaHCJjHwMSWw4eABsgXR0DCAAeEgAOH14cAR9fAAIbZRoeZBsCIWYAImcAAhsAGhxsGQIbABoccRkGFnMAGnQAIngAI3UAJHYAJXcAAhwAGSYAFwMIACYcABkoggEYASiDAQABHAAZARwAGQEcABkBHAAZARwAGQEcABkBHAAZARwAGQEcABkBHAAZARwAGQ8jtgEAJLQBACW1AQAnsAEAKLIBACmxAQAqswEAK7cBACy4AQAtuQEAL7oBADC7AQAxvAEAMr0BADO-AQAEGMIBABnDAQA3xAEAOMUBAAcTywEAFcwBABbNAQAa0QEAH88BADnOAQA60AEAARcADQQj3gEAOd0BADvbAQA83AEAAQQAAgcD5wEABegBAAbpAQAO6gEAI-wBAD3rAQA-7QEAAAEEAAIBBAACAwgAPVMAPlQAPwAAAAMIAD1TAD5UAD8BBAACAQQAAgMIAERTAEVUAEYAAAADCABEUwBFVABGAAAAAwgATFMATVQATgAAAAMIAExTAE1UAE4BBAACAQQAAgMIAFNTAFRUAFUAAAADCABTUwBUVABVAAADCABaUwBbVABcAAAAAwgAWlMAW1QAXAEE7AICAQTyAgIDCABhUwBiVABjAAAAAwgAYVMAYlQAYwAABQgAaFMAa1QAbLUBAGm2AQBqAAAAAAAFCABoUwBrVABstQEAabYBAGoBEgAOARIADgUIAHFTAHRUAHW1AQBytgEAcwAAAAAABQgAcVMAdFQAdbUBAHK2AQBzAAADCAB6UwB7VAB8AAAAAwgAelMAe1QAfAEPABABDwAQBQgAgQFTAIQBVACFAbUBAIIBtgEAgwEAAAAAAAUIAIEBUwCEAVQAhQG1AQCCAbYBAIMBAg8AEBIADgIPABASAA4DCACKAVMAiwFUAIwBAAAAAwgAigFTAIsBVACMAQAAAwgAkQFTAJIBVACTAQAAAAMIAJEBUwCSAVQAkwECEgAOFAAUAhIADhQAFAMIAJgBUwCZAVQAmgEAAAADCACYAVMAmQFUAJoBAAAABQgAoAFTAKMBVACkAbUBAKEBtgEAogEAAAAAAAUIAKABUwCjAVQApAG1AQChAbYBAKIBAAAABQgAqgFTAK0BVACuAbUBAKsBtgEArAEAAAAAAAUIAKoBUwCtAVQArgG1AQCrAbYBAKwBAAADCACzAVMAtAFUALUBAAAAAwgAswFTALQBVAC1AQIJ8AQGCvEEAgIJ9wQGCvgEAgMIALoBUwC7AVQAvAEAAAADCAC6AVMAuwFUALwBAAADCADBAVMAwgFUAMMBAAAAAwgAwQFTAMIBVADDAQILAAUMAAkCCwAFDAAJAwgAyAFTAMkBVADKAQAAAAMIAMgBUwDJAVQAygEAAAAFCADQAVMA0wFUANQBtQEA0QG2AQDSAQAAAAAABQgA0AFTANMBVADUAbUBANEBtgEA0gEDEtIFDhvTBRo21AUXAxLaBQ4b2wUaNtwFFwMIANkBUwDaAVQA2wEAAAADCADZAVMA2gFUANsBARcADQEXAA0DCADgAVMA4QFUAOIBAAAAAwgA4AFTAOEBVADiAQIXAA0dhAYCAhcADR2KBgIDCADnAVMA6AFUAOkBAAAAAwgA5wFTAOgBVADpAQMSnAYOFwANNp0GFwMSowYOFwANNqQGFwMIAO4BUwDvAVQA8AEAAAADCADuAVMA7wFUAPABAQS4BgIBBL4GAgMIAPUBUwD2AVQA9wEAAAADCAD1AVMA9gFUAPcBAhLRBg4b0AYaAhLYBg4b1wYaBQgA_AFTAP8BVACAArUBAP0BtgEA_gEAAAAAAAUIAPwBUwD_AVQAgAK1AQD9AbYBAP4BAhwAGSYAFwIcABkmABcDCACFAlMAhgJUAIcCAAAAAwgAhQJTAIYCVACHAgEcABkBHAAZBQgAjAJTAI8CVACQArUBAI0CtgEAjgIAAAAAAAUIAIwCUwCPAlQAkAK1AQCNArYBAI4CAxwAGTWWByU2lwcXAxwAGTWdByU2ngcXAwgAlQJTAJYCVACXAgAAAAMIAJUCUwCWAlQAlwIBHAAZARwAGQUIAJwCUwCfAlQAoAK1AQCdArYBAJ4CAAAAAAAFCACcAlMAnwJUAKACtQEAnQK2AQCeAgQXxgcNG8cHGhzIBxkdAAIEF84HDRvPBxoc0AcZHQACBQgApQJTAKgCVACpArUBAKYCtgEApwIAAAAAAAUIAKUCUwCoAlQAqQK1AQCmArYBAKcCAxLiBw4eABsg4wcdAxLpBw4eABsg6gcdBQgArgJTALECVACyArUBAK8CtgEAsAIAAAAAAAUIAK4CUwCxAlQAsgK1AQCvArYBALACAhv9Bxoe_AcbAhuECBoegwgbBQgAtwJTALoCVAC7ArUBALgCtgEAuQIAAAAAAAUIALcCUwC6AlQAuwK1AQC4ArYBALkCAhsAGhyWCBkCGwAaHJwIGQUIAMACUwDDAlQAxAK1AQDBArYBAMICAAAAAAAFCADAAlMAwwJUAMQCtQEAwQK2AQDCAgIbABocrggZAhsAGhy0CBkFCADJAlMAzAJUAM0CtQEAygK2AQDLAgAAAAAABQgAyQJTAMwCVADNArUBAMoCtgEAywIAAAADCADTAlMA1AJUANUCAAAAAwgA0wJTANQCVADVAgEEAAIBBAACAwgA2gJTANsCVADcAgAAAAMIANoCUwDbAlQA3AIAAAADCADiAlMA4wJUAOQCAAAAAwgA4gJTAOMCVADkAgEcABkBHAAZBQgA6QJTAOwCVADtArUBAOoCtgEA6wIAAAAAAAUIAOkCUwDsAlQA7QK1AQDqArYBAOsCARwAGQEcABkFCADyAlMA9QJUAPYCtQEA8wK2AQD0AgAAAAAABQgA8gJTAPUCVAD2ArUBAPMCtgEA9AIBHAAZARwAGQMIAPsCUwD8AlQA_QIAAAADCAD7AlMA_AJUAP0CARwAGQEcABkDCACCA1MAgwNUAIQDAAAAAwgAggNTAIMDVACEAwEcABkBHAAZBQgAiQNTAIwDVACNA7UBAIoDtgEAiwMAAAAAAAUIAIkDUwCMA1QAjQO1AQCKA7YBAIsDARwAGQEcABkFCACSA1MAlQNUAJYDtQEAkwO2AQCUAwAAAAAABQgAkgNTAJUDVACWA7UBAJMDtgEAlAMBHAAZARwAGQUIAJsDUwCeA1QAnwO1AQCcA7YBAJ0DAAAAAAAFCACbA1MAngNUAJ8DtQEAnAO2AQCdAwEcABkBHAAZAwgApANTAKUDVACmAwAAAAMIAKQDUwClA1QApgMBHAAZARwAGQUIAKsDUwCuA1QArwO1AQCsA7YBAK0DAAAAAAAFCACrA1MArgNUAK8DtQEArAO2AQCtAwEcABkBHAAZAwgAtANTALUDVAC2AwAAAAMIALQDUwC1A1QAtgNBAgFC7gEBQ-8BAUTwAQFF8QEBR_MBAUj1ATlJ9gE6SvgBAUv6ATlM-wE7T_wBAVD9AQFR_gE5VYECPFaCAkBXgwIDWIQCA1mFAgNahgIDW4cCA1yJAgNdiwI5XowCQV-OAgNgkAI5YZECQmKSAgNjkwIDZJQCOWWXAkNmmAJHZ5oCSGibAkhpngJIap8CSGugAkhsogJIbaQCOW6lAklvpwJIcKkCOXGqAkpyqwJIc6wCSHStAjl1sAJLdrECT3eyAgR4swIEebQCBHq1AgR7tgIEfLgCBH26Ajl-uwJQf70CBIABvwI5gQHAAlGCAcECBIMBwgIEhAHDAjmFAcYCUoYBxwJWhwHJAgKIAcoCAokBzAICigHNAgKLAc4CAowB0AICjQHSAjmOAdMCV48B1QICkAHXAjmRAdgCWJIB2QICkwHaAgKUAdsCOZUB3gJZlgHfAl2XAeECF5gB4gIXmQHkAheaAeUCF5sB5gIXnAHoAhedAeoCOZ4B6wJenwHuAhegAfACOaEB8QJfogHzAhejAfQCF6QB9QI5pQH4AmCmAfkCZKcB-wIOqAH8Ag6pAf4CDqoB_wIOqwGAAw6sAYIDDq0BhAM5rgGFA2WvAYcDDrABiQM5sQGKA2ayAYsDDrMBjAMOtAGNAzm3AZADZ7gBkQNtuQGSAx26AZMDHbsBlAMdvAGVAx29AZYDHb4BmAMdvwGaAznAAZsDbsEBnQMdwgGfAznDAaADb8QBoQMdxQGiAx3GAaMDOccBpgNwyAGnA3bJAakDEMoBqgMQywGtAxDMAa4DEM0BrwMQzgGxAxDPAbMDOdABtAN30QG2AxDSAbgDOdMBuQN41AG6AxDVAbsDENYBvAM51wG_A3nYAcADfdkBwQMR2gHCAxHbAcMDEdwBxAMR3QHFAxHeAccDEd8ByQM54AHKA37hAcwDEeIBzgM54wHPA3_kAdADEeUB0QMR5gHSAznnAdUDgAHoAdYDhgHpAdcDD-oB2AMP6wHZAw_sAdoDD-0B2wMP7gHdAw_vAd8DOfAB4AOHAfEB4gMP8gHkAznzAeUDiAH0AeYDD_UB5wMP9gHoAzn3AesDiQH4AewDjQH5Ae4DFPoB7wMU-wHyAxT8AfMDFP0B9AMU_gH2AxT_AfgDOYAC-QOOAYEC-wMUggL9AzmDAv4DjwGEAv8DFIUCgAQUhgKBBDmHAoQEkAGIAoUElAGJAoYEE4oChwQTiwKIBBOMAokEE40CigQTjgKMBBOPAo4EOZACjwSVAZECkQQTkgKTBDmTApQElgGUApUEE5UClgQTlgKXBDmXApoElwGYApsEmwGZAp0EnAGaAp4EnAGbAqEEnAGcAqIEnAGdAqMEnAGeAqUEnAGfAqcEOaACqASdAaECqgScAaICrAQ5owKtBJ4BpAKuBJwBpQKvBJwBpgKwBDmnArMEnwGoArQEpQGpArYEpgGqArcEpgGrAroEpgGsArsEpgGtArwEpgGuAr4EpgGvAsAEObACwQSnAbECwwSmAbICxQQ5swLGBKgBtALHBKYBtQLIBKYBtgLJBDm3AswEqQG4As0ErwG5As8EBroC0AQGuwLSBAa8AtMEBr0C1AQGvgLWBAa_AtgEOcAC2QSwAcEC2wQGwgLdBDnDAt4EsQHEAt8EBsUC4AQGxgLhBDnHAuQEsgHIAuUEtgHJAuYEBcoC5wQFywLoBAXMAukEBc0C6gQFzgLsBAXPAu4EOdAC7wS3AdEC8wQF0gL1BDnTAvYEuAHUAvkEBdUC-gQF1gL7BDnXAv4EuQHYAv8EvQHZAoEFCdoCggUJ2wKFBQncAoYFCd0ChwUJ3gKJBQnfAosFOeACjAW-AeECjgUJ4gKQBTnjApEFvwHkApIFCeUCkwUJ5gKUBTnnApcFwAHoApgFxAHpApkFCOoCmgUI6wKbBQjsApwFCO0CnQUI7gKfBQjvAqEFOfACogXFAfECpAUI8gKmBTnzAqcFxgH0AqgFCPUCqQUI9gKqBTn3Aq0FxwH4Aq4FywH5ArAFzAH6ArEFzAH7ArQFzAH8ArUFzAH9ArYFzAH-ArgFzAH_AroFOYADuwXNAYEDvQXMAYIDvwU5gwPABc4BhAPBBcwBhQPCBcwBhgPDBTmHA8YFzwGIA8cF1QGJA8gFDYoDyQUNiwPKBQ2MA8sFDY0DzAUNjgPOBQ2PA9AFOZAD0QXWAZED1gUNkgPYBTmTA9kF1wGUA90FDZUD3gUNlgPfBTmXA-IF2AGYA-MF3AGZA-QFNZoD5QU1mwPmBTWcA-cFNZ0D6AU1ngPqBTWfA-wFOaAD7QXdAaED7wU1ogPxBTmjA_IF3gGkA_MFNaUD9AU1pgP1BTmnA_gF3wGoA_kF4wGpA_oFDKoD-wUMqwP8BQysA_0FDK0D_gUMrgOABgyvA4IGObADgwbkAbEDhgYMsgOIBjmzA4kG5QG0A4sGDLUDjAYMtgONBjm3A5AG5gG4A5EG6gG5A5IGFroDkwYWuwOUBha8A5UGFr0DlgYWvgOYBha_A5oGOcADmwbrAcEDnwYWwgOhBjnDA6IG7AHEA6UGFsUDpgYWxgOnBjnHA6oG7QHIA6sG8QHJA60GGsoDrgYaywOwBhrMA7EGGs0DsgYazgO0BhrPA7YGOdADtwbyAdEDugYa0gO8BjnTA70G8wHUA78GGtUDwAYa1gPBBjnXA8QG9AHYA8UG-AHZA8YGGdoDxwYZ2wPIBhncA8kGGd0DygYZ3gPMBhnfA84GOeADzwb5AeED0wYZ4gPVBjnjA9YG-gHkA9kGGeUD2gYZ5gPbBjnnA94G-wHoA98GgQLpA-AGJOoD4QYk6wPiBiTsA-MGJO0D5AYk7gPmBiTvA-gGOfAD6QaCAvED6wYk8gPtBjnzA-4GgwL0A-8GJPUD8AYk9gPxBjn3A_QGhAL4A_UGiAL5A_YGJfoD9wYl-wP4BiX8A_kGJf0D-gYl_gP8BiX_A_4GOYAE_waJAoEEgQclggSDBzmDBIQHigKEBIUHJYUEhgclhgSHBzmHBIoHiwKIBIsHkQKJBIwHGIoEjQcYiwSOBxiMBI8HGI0EkAcYjgSSBxiPBJQHOZAElQeSApEEmQcYkgSbBzmTBJwHkwKUBJ8HGJUEoAcYlgShBzmXBKQHlAKYBKUHmAKZBKYHJ5oEpwcnmwSoByecBKkHJ50EqgcnngSsByefBK4HOaAErweZAqEEsQcnogSzBzmjBLQHmgKkBLUHJ6UEtgcnpgS3BzmnBLoHmwKoBLsHoQKpBLwHG6oEvQcbqwS-BxusBL8HG60EwAcbrgTCBxuvBMQHObAExQeiArEEygcbsgTMBzmzBM0HowK0BNEHG7UE0gcbtgTTBzm3BNYHpAK4BNcHqgK5BNgHHLoE2QccuwTaBxy8BNsHHL0E3AccvgTeBxy_BOAHOcAE4QerAsEE5QccwgTnBznDBOgHrALEBOsHHMUE7AccxgTtBznHBPAHrQLIBPEHswLJBPIHH8oE8wcfywT0Bx_MBPUHH80E9gcfzgT4Bx_PBPoHOdAE-we0AtEE_wcf0gSBCDnTBIIItQLUBIUIH9UEhggf1gSHCDnXBIoItgLYBIsIvALZBIwIIdoEjQgh2wSOCCHcBI8IId0EkAgh3gSSCCHfBJQIOeAElQi9AuEEmAgh4gSaCDnjBJsIvgLkBJ0IIeUEnggh5gSfCDnnBKIIvwLoBKMIxQLpBKQIIuoEpQgi6wSmCCLsBKcIIu0EqAgi7gSqCCLvBKwIOfAErQjGAvEEsAgi8gSyCDnzBLMIxwL0BLUIIvUEtggi9gS3CDn3BLoIyAL4BLsIzgL5BL0IzwL6BL4IzwL7BMEIzwL8BMIIzwL9BMMIzwL-BMUIzwL_BMcIOYAFyAjQAoEFygjPAoIFzAg5gwXNCNEChAXOCM8ChQXPCM8ChgXQCDmHBdMI0gKIBdQI1gKJBdUIN4oF1gg3iwXXCDeMBdgIN40F2Qg3jgXbCDePBd0IOZAF3gjXApEF4Ag3kgXiCDmTBeMI2AKUBeQIN5UF5Qg3lgXmCDmXBekI2QKYBeoI3QKZBewI3gKaBe0I3gKbBfAI3gKcBfEI3gKdBfII3gKeBfQI3gKfBfYIOaAF9wjfAqEF-QjeAqIF-wg5owX8COACpAX9CN4CpQX-CN4CpgX_CDmnBYIJ4QKoBYMJ5QKpBYQJKKoFhQkoqwWGCSisBYcJKK0FiAkorgWKCSivBYwJObAFjQnmArEFjwkosgWRCTmzBZIJ5wK0BZMJKLUFlAkotgWVCTm3BZgJ6AK4BZkJ7gK5BZoJKboFmwkpuwWcCSm8BZ0JKb0FngkpvgWgCSm_BaIJOcAFownvAsEFpQkpwgWnCTnDBagJ8ALEBakJKcUFqgkpxgWrCTnHBa4J8QLIBa8J9wLJBbAJKsoFsQkqywWyCSrMBbMJKs0FtAkqzgW2CSrPBbgJOdAFuQn4AtEFuwkq0gW9CTnTBb4J-QLUBb8JKtUFwAkq1gXBCTnXBcQJ-gLYBcUJ_gLZBccJK9oFyAkr2wXKCSvcBcsJK90FzAkr3gXOCSvfBdAJOeAF0Qn_AuEF0wkr4gXVCTnjBdYJgAPkBdcJK-UF2Akr5gXZCTnnBdwJgQPoBd0JhQPpBd4JLOoF3wks6wXgCSzsBeEJLO0F4gks7gXkCSzvBeYJOfAF5wmGA_EF6Qks8gXrCTnzBewJhwP0Be0JLPUF7gks9gXvCTn3BfIJiAP4BfMJjgP5BfQJLfoF9Qkt-wX2CS38BfcJLf0F-Akt_gX6CS3_BfwJOYAG_QmPA4EG_wktggaBCjmDBoIKkAOEBoMKLYUGhAothgaFCjmHBogKkQOIBokKlwOJBooKLooGiwouiwaMCi6MBo0KLo0GjgoujgaQCi6PBpIKOZAGkwqYA5EGlQoukgaXCjmTBpgKmQOUBpkKLpUGmgoulgabCjmXBp4KmgOYBp8KoAOZBqAKL5oGoQovmwaiCi-cBqMKL50GpAovngamCi-fBqgKOaAGqQqhA6EGqwovogatCjmjBq4KogOkBq8KL6UGsAovpgaxCjmnBrQKowOoBrUKpwOpBrYKMKoGtwowqwa4CjCsBrkKMK0Gugowrga8CjCvBr4KObAGvwqoA7EGwQowsgbDCjmzBsQKqQO0BsUKMLUGxgowtgbHCjm3BsoKqgO4BssKsAO5Bs0KMboGzgoxuwbQCjG8BtEKMb0G0goxvgbUCjG_BtYKOcAG1wqxA8EG2QoxwgbbCjnDBtwKsgPEBt0KMcUG3goxxgbfCjnHBuIKswPIBuMKtwM"
};
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config2.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config2);
}

// src/generated/prisma/internal/prismaNamespace.ts
var prismaNamespace_exports = {};
__export(prismaNamespace_exports, {
  AccountScalarFieldEnum: () => AccountScalarFieldEnum,
  AnyNull: () => AnyNull2,
  BacklinkScalarFieldEnum: () => BacklinkScalarFieldEnum,
  BlogCategoryScalarFieldEnum: () => BlogCategoryScalarFieldEnum,
  BlogPostScalarFieldEnum: () => BlogPostScalarFieldEnum,
  BlogPostTagScalarFieldEnum: () => BlogPostTagScalarFieldEnum,
  BlogTagScalarFieldEnum: () => BlogTagScalarFieldEnum,
  CallLogScalarFieldEnum: () => CallLogScalarFieldEnum,
  CaseStudyScalarFieldEnum: () => CaseStudyScalarFieldEnum,
  CaseStudyServiceScalarFieldEnum: () => CaseStudyServiceScalarFieldEnum,
  CitationScalarFieldEnum: () => CitationScalarFieldEnum,
  ClientAppreciationScalarFieldEnum: () => ClientAppreciationScalarFieldEnum,
  ClientReviewScalarFieldEnum: () => ClientReviewScalarFieldEnum,
  ClientScalarFieldEnum: () => ClientScalarFieldEnum,
  ConsultationScalarFieldEnum: () => ConsultationScalarFieldEnum,
  ContactMessageScalarFieldEnum: () => ContactMessageScalarFieldEnum,
  DbNull: () => DbNull2,
  Decimal: () => Decimal2,
  FAQScalarFieldEnum: () => FAQScalarFieldEnum,
  GoogleBusinessProfileScalarFieldEnum: () => GoogleBusinessProfileScalarFieldEnum,
  JsonNull: () => JsonNull2,
  JsonNullValueFilter: () => JsonNullValueFilter,
  KeywordRankingScalarFieldEnum: () => KeywordRankingScalarFieldEnum,
  LeadActivityScalarFieldEnum: () => LeadActivityScalarFieldEnum,
  LeadNoteScalarFieldEnum: () => LeadNoteScalarFieldEnum,
  LeadScalarFieldEnum: () => LeadScalarFieldEnum,
  MediaScalarFieldEnum: () => MediaScalarFieldEnum,
  ModelName: () => ModelName,
  NotificationScalarFieldEnum: () => NotificationScalarFieldEnum,
  NullTypes: () => NullTypes2,
  NullableJsonNullValueInput: () => NullableJsonNullValueInput,
  NullsOrder: () => NullsOrder,
  PaymentScalarFieldEnum: () => PaymentScalarFieldEnum,
  PerformanceReportScalarFieldEnum: () => PerformanceReportScalarFieldEnum,
  PortfolioImageScalarFieldEnum: () => PortfolioImageScalarFieldEnum,
  PortfolioScalarFieldEnum: () => PortfolioScalarFieldEnum,
  PortfolioServiceScalarFieldEnum: () => PortfolioServiceScalarFieldEnum,
  PricingPlanScalarFieldEnum: () => PricingPlanScalarFieldEnum,
  PrismaClientInitializationError: () => PrismaClientInitializationError2,
  PrismaClientKnownRequestError: () => PrismaClientKnownRequestError2,
  PrismaClientRustPanicError: () => PrismaClientRustPanicError2,
  PrismaClientUnknownRequestError: () => PrismaClientUnknownRequestError2,
  PrismaClientValidationError: () => PrismaClientValidationError2,
  ProjectFileScalarFieldEnum: () => ProjectFileScalarFieldEnum,
  ProjectMemberScalarFieldEnum: () => ProjectMemberScalarFieldEnum,
  ProjectMilestoneScalarFieldEnum: () => ProjectMilestoneScalarFieldEnum,
  ProjectScalarFieldEnum: () => ProjectScalarFieldEnum,
  ProjectTaskScalarFieldEnum: () => ProjectTaskScalarFieldEnum,
  ProposalItemScalarFieldEnum: () => ProposalItemScalarFieldEnum,
  ProposalScalarFieldEnum: () => ProposalScalarFieldEnum,
  QueryMode: () => QueryMode,
  ReviewMonitorScalarFieldEnum: () => ReviewMonitorScalarFieldEnum,
  SEOAuditScalarFieldEnum: () => SEOAuditScalarFieldEnum,
  ServiceAreaScalarFieldEnum: () => ServiceAreaScalarFieldEnum,
  ServiceScalarFieldEnum: () => ServiceScalarFieldEnum,
  SessionScalarFieldEnum: () => SessionScalarFieldEnum,
  SiteSettingScalarFieldEnum: () => SiteSettingScalarFieldEnum,
  SortOrder: () => SortOrder,
  Sql: () => Sql2,
  StaffScalarFieldEnum: () => StaffScalarFieldEnum,
  TestimonialScalarFieldEnum: () => TestimonialScalarFieldEnum,
  TrackingConfigScalarFieldEnum: () => TrackingConfigScalarFieldEnum,
  TransactionIsolationLevel: () => TransactionIsolationLevel,
  TwoFactorScalarFieldEnum: () => TwoFactorScalarFieldEnum,
  UserScalarFieldEnum: () => UserScalarFieldEnum,
  VerificationScalarFieldEnum: () => VerificationScalarFieldEnum,
  defineExtension: () => defineExtension,
  empty: () => empty2,
  getExtensionContext: () => getExtensionContext,
  join: () => join2,
  prismaVersion: () => prismaVersion,
  raw: () => raw2,
  sql: () => sql
});
import * as runtime2 from "@prisma/client/runtime/client";
var PrismaClientKnownRequestError2 = runtime2.PrismaClientKnownRequestError;
var PrismaClientUnknownRequestError2 = runtime2.PrismaClientUnknownRequestError;
var PrismaClientRustPanicError2 = runtime2.PrismaClientRustPanicError;
var PrismaClientInitializationError2 = runtime2.PrismaClientInitializationError;
var PrismaClientValidationError2 = runtime2.PrismaClientValidationError;
var sql = runtime2.sqltag;
var empty2 = runtime2.empty;
var join2 = runtime2.join;
var raw2 = runtime2.raw;
var Sql2 = runtime2.Sql;
var Decimal2 = runtime2.Decimal;
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var prismaVersion = {
  client: "7.10.0",
  engine: "0edf323efd1d98336f3f0a68684b56f689b900d3"
};
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var DbNull2 = runtime2.DbNull;
var JsonNull2 = runtime2.JsonNull;
var AnyNull2 = runtime2.AnyNull;
var ModelName = {
  Session: "Session",
  Account: "Account",
  Verification: "Verification",
  TwoFactor: "TwoFactor",
  User: "User",
  Staff: "Staff",
  Service: "Service",
  PricingPlan: "PricingPlan",
  Portfolio: "Portfolio",
  PortfolioImage: "PortfolioImage",
  PortfolioService: "PortfolioService",
  CaseStudy: "CaseStudy",
  CaseStudyService: "CaseStudyService",
  Testimonial: "Testimonial",
  FAQ: "FAQ",
  BlogCategory: "BlogCategory",
  BlogPost: "BlogPost",
  BlogTag: "BlogTag",
  BlogPostTag: "BlogPostTag",
  Media: "Media",
  Lead: "Lead",
  LeadNote: "LeadNote",
  LeadActivity: "LeadActivity",
  Consultation: "Consultation",
  Client: "Client",
  Project: "Project",
  ProjectMember: "ProjectMember",
  ProjectMilestone: "ProjectMilestone",
  ProjectTask: "ProjectTask",
  ProjectFile: "ProjectFile",
  Proposal: "Proposal",
  ProposalItem: "ProposalItem",
  Payment: "Payment",
  ClientReview: "ClientReview",
  ClientAppreciation: "ClientAppreciation",
  ContactMessage: "ContactMessage",
  Notification: "Notification",
  SiteSetting: "SiteSetting",
  KeywordRanking: "KeywordRanking",
  Backlink: "Backlink",
  Citation: "Citation",
  GoogleBusinessProfile: "GoogleBusinessProfile",
  SEOAudit: "SEOAudit",
  PerformanceReport: "PerformanceReport",
  ReviewMonitor: "ReviewMonitor",
  ServiceArea: "ServiceArea",
  CallLog: "CallLog",
  TrackingConfig: "TrackingConfig"
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var SessionScalarFieldEnum = {
  id: "id",
  expiresAt: "expiresAt",
  token: "token",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  ipAddress: "ipAddress",
  userAgent: "userAgent",
  userId: "userId"
};
var AccountScalarFieldEnum = {
  id: "id",
  accountId: "accountId",
  providerId: "providerId",
  userId: "userId",
  issuer: "issuer",
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  idToken: "idToken",
  accessTokenExpiresAt: "accessTokenExpiresAt",
  refreshTokenExpiresAt: "refreshTokenExpiresAt",
  scope: "scope",
  password: "password",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var VerificationScalarFieldEnum = {
  id: "id",
  identifier: "identifier",
  value: "value",
  expiresAt: "expiresAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var TwoFactorScalarFieldEnum = {
  id: "id",
  secret: "secret",
  backupCodes: "backupCodes",
  userId: "userId",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var UserScalarFieldEnum = {
  id: "id",
  email: "email",
  emailVerified: "emailVerified",
  name: "name",
  image: "image",
  role: "role",
  status: "status",
  passwordHash: "passwordHash",
  lastLoginAt: "lastLoginAt",
  twoFactorEnabled: "twoFactorEnabled",
  twoFactorSecret: "twoFactorSecret",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var StaffScalarFieldEnum = {
  id: "id",
  userId: "userId",
  employeeId: "employeeId",
  fullName: "fullName",
  email: "email",
  phone: "phone",
  role: "role",
  status: "status",
  designation: "designation",
  department: "department",
  bio: "bio",
  avatar: "avatar",
  hireDate: "hireDate",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ServiceScalarFieldEnum = {
  id: "id",
  slug: "slug",
  name: "name",
  shortName: "shortName",
  tagline: "tagline",
  description: "description",
  icon: "icon",
  coverImage: "coverImage",
  features: "features",
  process: "process",
  startingPrice: "startingPrice",
  currency: "currency",
  isActive: "isActive",
  isFeatured: "isFeatured",
  order: "order",
  seoTitle: "seoTitle",
  seoDescription: "seoDescription",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var PricingPlanScalarFieldEnum = {
  id: "id",
  serviceId: "serviceId",
  slug: "slug",
  name: "name",
  description: "description",
  price: "price",
  currency: "currency",
  billingInterval: "billingInterval",
  features: "features",
  isPopular: "isPopular",
  isActive: "isActive",
  order: "order",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var PortfolioScalarFieldEnum = {
  id: "id",
  title: "title",
  slug: "slug",
  clientName: "clientName",
  industry: "industry",
  location: "location",
  websiteUrl: "websiteUrl",
  coverImage: "coverImage",
  description: "description",
  technologies: "technologies",
  duration: "duration",
  results: "results",
  seoTitle: "seoTitle",
  seoDescription: "seoDescription",
  status: "status",
  isFeatured: "isFeatured",
  publishedAt: "publishedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var PortfolioImageScalarFieldEnum = {
  id: "id",
  portfolioId: "portfolioId",
  url: "url",
  publicId: "publicId",
  altText: "altText",
  caption: "caption",
  order: "order",
  createdAt: "createdAt"
};
var PortfolioServiceScalarFieldEnum = {
  id: "id",
  portfolioId: "portfolioId",
  serviceId: "serviceId"
};
var CaseStudyScalarFieldEnum = {
  id: "id",
  title: "title",
  slug: "slug",
  clientName: "clientName",
  industry: "industry",
  location: "location",
  coverImage: "coverImage",
  problem: "problem",
  strategy: "strategy",
  implementation: "implementation",
  results: "results",
  metrics: "metrics",
  seoTitle: "seoTitle",
  seoDescription: "seoDescription",
  status: "status",
  isFeatured: "isFeatured",
  publishedAt: "publishedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var CaseStudyServiceScalarFieldEnum = {
  id: "id",
  caseStudyId: "caseStudyId",
  serviceId: "serviceId"
};
var TestimonialScalarFieldEnum = {
  id: "id",
  clientName: "clientName",
  clientRole: "clientRole",
  companyName: "companyName",
  clientImage: "clientImage",
  content: "content",
  rating: "rating",
  serviceName: "serviceName",
  status: "status",
  isFeatured: "isFeatured",
  publishedAt: "publishedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var FAQScalarFieldEnum = {
  id: "id",
  question: "question",
  answer: "answer",
  category: "category",
  isActive: "isActive",
  order: "order",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var BlogCategoryScalarFieldEnum = {
  id: "id",
  name: "name",
  slug: "slug",
  description: "description",
  isActive: "isActive",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var BlogPostScalarFieldEnum = {
  id: "id",
  categoryId: "categoryId",
  authorId: "authorId",
  title: "title",
  slug: "slug",
  excerpt: "excerpt",
  content: "content",
  featuredImage: "featuredImage",
  seoTitle: "seoTitle",
  seoDescription: "seoDescription",
  canonicalUrl: "canonicalUrl",
  schemaMarkup: "schemaMarkup",
  status: "status",
  publishedAt: "publishedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var BlogTagScalarFieldEnum = {
  id: "id",
  name: "name",
  slug: "slug",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var BlogPostTagScalarFieldEnum = {
  id: "id",
  postId: "postId",
  tagId: "tagId"
};
var MediaScalarFieldEnum = {
  id: "id",
  fileName: "fileName",
  url: "url",
  publicId: "publicId",
  mimeType: "mimeType",
  size: "size",
  category: "category",
  altText: "altText",
  caption: "caption",
  width: "width",
  height: "height",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var LeadScalarFieldEnum = {
  id: "id",
  serviceId: "serviceId",
  clientId: "clientId",
  name: "name",
  email: "email",
  phone: "phone",
  company: "company",
  website: "website",
  location: "location",
  budget: "budget",
  timeline: "timeline",
  message: "message",
  status: "status",
  priority: "priority",
  source: "source",
  followUpAt: "followUpAt",
  assignedStaffId: "assignedStaffId",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var LeadNoteScalarFieldEnum = {
  id: "id",
  leadId: "leadId",
  content: "content",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var LeadActivityScalarFieldEnum = {
  id: "id",
  leadId: "leadId",
  type: "type",
  description: "description",
  metadata: "metadata",
  createdById: "createdById",
  createdAt: "createdAt"
};
var ConsultationScalarFieldEnum = {
  id: "id",
  leadId: "leadId",
  serviceId: "serviceId",
  preferredDate: "preferredDate",
  preferredTime: "preferredTime",
  status: "status",
  notes: "notes",
  assignedStaffId: "assignedStaffId",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ClientScalarFieldEnum = {
  id: "id",
  userId: "userId",
  name: "name",
  email: "email",
  phone: "phone",
  company: "company",
  website: "website",
  location: "location",
  notes: "notes",
  isActive: "isActive",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ProjectScalarFieldEnum = {
  id: "id",
  clientId: "clientId",
  serviceId: "serviceId",
  name: "name",
  slug: "slug",
  projectType: "projectType",
  status: "status",
  description: "description",
  budget: "budget",
  currency: "currency",
  startDate: "startDate",
  deadline: "deadline",
  completedAt: "completedAt",
  progress: "progress",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ProjectMemberScalarFieldEnum = {
  id: "id",
  projectId: "projectId",
  staffId: "staffId",
  role: "role",
  createdAt: "createdAt"
};
var ProjectMilestoneScalarFieldEnum = {
  id: "id",
  projectId: "projectId",
  title: "title",
  description: "description",
  status: "status",
  startDate: "startDate",
  dueDate: "dueDate",
  completedAt: "completedAt",
  order: "order",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ProjectTaskScalarFieldEnum = {
  id: "id",
  projectId: "projectId",
  milestoneId: "milestoneId",
  assignedStaffId: "assignedStaffId",
  title: "title",
  description: "description",
  status: "status",
  priority: "priority",
  dueDate: "dueDate",
  completedAt: "completedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ProjectFileScalarFieldEnum = {
  id: "id",
  projectId: "projectId",
  fileName: "fileName",
  fileUrl: "fileUrl",
  publicId: "publicId",
  mimeType: "mimeType",
  size: "size",
  category: "category",
  description: "description",
  createdAt: "createdAt"
};
var ProposalScalarFieldEnum = {
  id: "id",
  leadId: "leadId",
  clientId: "clientId",
  projectId: "projectId",
  proposalNumber: "proposalNumber",
  title: "title",
  introduction: "introduction",
  terms: "terms",
  notes: "notes",
  subtotal: "subtotal",
  discount: "discount",
  tax: "tax",
  total: "total",
  currency: "currency",
  status: "status",
  validUntil: "validUntil",
  sentAt: "sentAt",
  viewedAt: "viewedAt",
  acceptedAt: "acceptedAt",
  rejectedAt: "rejectedAt",
  createdById: "createdById",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ProposalItemScalarFieldEnum = {
  id: "id",
  proposalId: "proposalId",
  serviceId: "serviceId",
  pricingPlanId: "pricingPlanId",
  title: "title",
  description: "description",
  quantity: "quantity",
  unitPrice: "unitPrice",
  total: "total",
  createdAt: "createdAt"
};
var PaymentScalarFieldEnum = {
  id: "id",
  proposalId: "proposalId",
  clientId: "clientId",
  provider: "provider",
  providerPaymentId: "providerPaymentId",
  amount: "amount",
  currency: "currency",
  status: "status",
  method: "method",
  paidAt: "paidAt",
  metadata: "metadata",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ClientReviewScalarFieldEnum = {
  id: "id",
  clientId: "clientId",
  projectId: "projectId",
  rating: "rating",
  title: "title",
  content: "content",
  serviceQuality: "serviceQuality",
  communication: "communication",
  delivery: "delivery",
  isApproved: "isApproved",
  isFeatured: "isFeatured",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ClientAppreciationScalarFieldEnum = {
  id: "id",
  clientId: "clientId",
  projectId: "projectId",
  type: "type",
  amount: "amount",
  currency: "currency",
  title: "title",
  description: "description",
  receivedAt: "receivedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ContactMessageScalarFieldEnum = {
  id: "id",
  name: "name",
  email: "email",
  phone: "phone",
  company: "company",
  subject: "subject",
  message: "message",
  status: "status",
  repliedAt: "repliedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var NotificationScalarFieldEnum = {
  id: "id",
  userId: "userId",
  type: "type",
  entityType: "entityType",
  entityId: "entityId",
  title: "title",
  message: "message",
  isRead: "isRead",
  readAt: "readAt",
  createdAt: "createdAt"
};
var SiteSettingScalarFieldEnum = {
  id: "id",
  key: "key",
  value: "value",
  description: "description",
  updatedAt: "updatedAt"
};
var KeywordRankingScalarFieldEnum = {
  id: "id",
  projectId: "projectId",
  keyword: "keyword",
  targetUrl: "targetUrl",
  searchEngine: "searchEngine",
  device: "device",
  location: "location",
  rank: "rank",
  previousRank: "previousRank",
  checkedAt: "checkedAt",
  createdAt: "createdAt"
};
var BacklinkScalarFieldEnum = {
  id: "id",
  projectId: "projectId",
  sourceUrl: "sourceUrl",
  targetUrl: "targetUrl",
  anchorText: "anchorText",
  domainAuthority: "domainAuthority",
  status: "status",
  acquiredAt: "acquiredAt",
  notes: "notes",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var CitationScalarFieldEnum = {
  id: "id",
  projectId: "projectId",
  directoryName: "directoryName",
  url: "url",
  status: "status",
  submittedAt: "submittedAt",
  notes: "notes",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var GoogleBusinessProfileScalarFieldEnum = {
  id: "id",
  projectId: "projectId",
  businessName: "businessName",
  gbpUrl: "gbpUrl",
  category: "category",
  address: "address",
  phone: "phone",
  isVerified: "isVerified",
  lastOptimizedAt: "lastOptimizedAt",
  notes: "notes",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var SEOAuditScalarFieldEnum = {
  id: "id",
  projectId: "projectId",
  title: "title",
  auditDate: "auditDate",
  score: "score",
  issues: "issues",
  reportUrl: "reportUrl",
  summary: "summary",
  createdAt: "createdAt"
};
var PerformanceReportScalarFieldEnum = {
  id: "id",
  projectId: "projectId",
  pageUrl: "pageUrl",
  device: "device",
  performanceScore: "performanceScore",
  seoScore: "seoScore",
  metrics: "metrics",
  reportUrl: "reportUrl",
  checkedAt: "checkedAt",
  createdAt: "createdAt"
};
var ReviewMonitorScalarFieldEnum = {
  id: "id",
  projectId: "projectId",
  platform: "platform",
  rating: "rating",
  reviewCount: "reviewCount",
  checkedAt: "checkedAt",
  createdAt: "createdAt"
};
var ServiceAreaScalarFieldEnum = {
  id: "id",
  projectId: "projectId",
  city: "city",
  state: "state",
  slug: "slug",
  pageUrl: "pageUrl",
  publishedAt: "publishedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var CallLogScalarFieldEnum = {
  id: "id",
  projectId: "projectId",
  twilioCallSid: "twilioCallSid",
  fromNumber: "fromNumber",
  toNumber: "toNumber",
  duration: "duration",
  recordingUrl: "recordingUrl",
  status: "status",
  receivedAt: "receivedAt",
  createdAt: "createdAt"
};
var TrackingConfigScalarFieldEnum = {
  id: "id",
  projectId: "projectId",
  ga4MeasurementId: "ga4MeasurementId",
  gtmContainerId: "gtmContainerId",
  metaPixelId: "metaPixelId",
  whatsappNumber: "whatsappNumber",
  conversionGoals: "conversionGoals",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var SortOrder = {
  asc: "asc",
  desc: "desc"
};
var NullableJsonNullValueInput = {
  DbNull: DbNull2,
  JsonNull: JsonNull2
};
var QueryMode = {
  default: "default",
  insensitive: "insensitive"
};
var NullsOrder = {
  first: "first",
  last: "last"
};
var JsonNullValueFilter = {
  DbNull: DbNull2,
  JsonNull: JsonNull2,
  AnyNull: AnyNull2
};
var defineExtension = runtime2.Extensions.defineExtension;

// src/generated/prisma/client.ts
globalThis["__dirname"] = path.dirname(fileURLToPath(import.meta.url));
var PrismaClient = getPrismaClientClass();

// src/app/errors/handlePrismaError.ts
var handlePrismaError = (error) => {
  if (error instanceof prismaNamespace_exports.PrismaClientValidationError) {
    return {
      statusCode: StatusCodes3.BAD_REQUEST,
      message: "Invalid request data.",
      errorCode: "PRISMA_VALIDATION_ERROR"
    };
  }
  if (error instanceof prismaNamespace_exports.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return { statusCode: StatusCodes3.CONFLICT, message: "Resource already exists.", errorCode: error.code };
      case "P2003":
        return { statusCode: StatusCodes3.BAD_REQUEST, message: "Foreign key constraint failed.", errorCode: error.code };
      case "P2025":
        return { statusCode: StatusCodes3.NOT_FOUND, message: "Resource not found.", errorCode: error.code };
      default:
        return { statusCode: StatusCodes3.BAD_REQUEST, message: "Database request failed.", errorCode: error.code };
    }
  }
  if (error instanceof prismaNamespace_exports.PrismaClientInitializationError) {
    if (error.errorCode === "P1000") {
      return { statusCode: StatusCodes3.UNAUTHORIZED, message: "Database authentication failed.", errorCode: "P1000" };
    }
    if (error.errorCode === "P1001") {
      return { statusCode: StatusCodes3.SERVICE_UNAVAILABLE, message: "Can't reach database server.", errorCode: "P1001" };
    }
    return { statusCode: StatusCodes3.SERVICE_UNAVAILABLE, message: "Database connection failed.", errorCode: error.errorCode ?? "PRISMA_INIT_ERROR" };
  }
  if (error instanceof prismaNamespace_exports.PrismaClientUnknownRequestError) {
    return { statusCode: StatusCodes3.INTERNAL_SERVER_ERROR, message: "Database query failed.", errorCode: "PRISMA_UNKNOWN_ERROR" };
  }
  return null;
};

// src/app/errors/appError.ts
var AppError = class extends Error {
  statusCode;
  errorCode;
  details;
  isOperational;
  constructor(statusCode, message, errorCode, details) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    if (errorCode !== void 0) {
      this.errorCode = errorCode;
    }
    if (details !== void 0) {
      this.details = details;
    }
    Error.captureStackTrace?.(this, this.constructor);
  }
};
var appError_default = AppError;

// src/app/middlewares/globalErrorHandler.ts
var globalErrorHandler = (error, _req, res, _next) => {
  let statusCode = StatusCodes4.INTERNAL_SERVER_ERROR;
  let message = "Something went wrong";
  let errorCode;
  let details;
  if (error instanceof appError_default) {
    statusCode = error.statusCode;
    message = error.message;
    errorCode = error.errorCode;
    details = error.details;
  } else if (error instanceof ZodError) {
    const zodError = handleZodError(error);
    statusCode = zodError.statusCode;
    message = zodError.message;
    details = zodError.details;
  } else {
    const prismaError = handlePrismaError(error);
    if (prismaError) {
      statusCode = prismaError.statusCode;
      message = prismaError.message;
      errorCode = prismaError.errorCode;
    } else if (error instanceof Error) {
      message = error.message;
    }
  }
  const response = { success: false, statusCode, message };
  if (errorCode) response.errorCode = errorCode;
  if (details) response.details = details;
  if (config_default.app.env === "development") {
    response.stack = error instanceof Error ? error.stack : void 0;
  }
  res.status(statusCode).json(response);
};

// src/app/middlewares/notFound.ts
import { StatusCodes as StatusCodes5 } from "http-status-codes";
var notFound = (req, res) => {
  res.status(StatusCodes5.NOT_FOUND).json({
    success: false,
    statusCode: StatusCodes5.NOT_FOUND,
    message: "Route not found.",
    path: req.originalUrl
  });
};

// src/app/middlewares/sanitizeBody.ts
var UNSAFE_KEYS = ["__proto__", "constructor", "prototype"];
var stripUnsafeKeys = (value) => {
  if (Array.isArray(value)) return value.map(stripUnsafeKeys);
  if (value !== null && typeof value === "object") {
    const clean = {};
    for (const [key, val] of Object.entries(value)) {
      if (UNSAFE_KEYS.includes(key)) continue;
      clean[key] = stripUnsafeKeys(val);
    }
    return clean;
  }
  return value;
};
var sanitizeBody = (req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = stripUnsafeKeys(req.body);
  }
  next();
};

// src/app/modules/webhook/webhook.routes.ts
import express, { Router } from "express";

// src/app/modules/webhook/webhook.controller.ts
import { StatusCodes as StatusCodes10 } from "http-status-codes";

// src/lib/stripe.ts
import Stripe from "stripe";
var stripe = config_default.stripe.secretKey ? new Stripe(config_default.stripe.secretKey) : null;
var getStripe = () => {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in your .env file."
    );
  }
  return stripe;
};

// src/app/utils/catchAsync.ts
var catchAsync = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

// src/app/modules/payment/payment.service.ts
import { StatusCodes as StatusCodes9 } from "http-status-codes";

// src/app/queryBuilder/constants.ts
var DEFAULT_PAGE = 1;
var DEFAULT_LIMIT = 10;
var DEFAULT_MAX_LIMIT = 100;
var DEFAULT_SORT_FIELD = "createdAt";
var DEFAULT_MAX_INCLUDE = 5;
var DEFAULT_MAX_NESTED_DEPTH = 2;
var DEFAULT_MAX_SEARCH_LENGTH = 150;
var RESERVED_QUERY_KEYS = [
  "page",
  "limit",
  "search",
  "sortBy",
  "sortOrder",
  "sort",
  "fields",
  "include"
];
var OPERATOR_MAP = {
  eq: "equals",
  not: "not",
  gt: "gt",
  gte: "gte",
  lt: "lt",
  lte: "lte",
  in: "in",
  notIn: "notIn",
  contains: "contains",
  startsWith: "startsWith",
  endsWith: "endsWith"
};
var VALID_OPERATORS = Object.keys(OPERATOR_MAP);
var OPERATORS_BY_TYPE = {
  string: ["eq", "not", "in", "notIn", "contains", "startsWith", "endsWith"],
  number: ["eq", "not", "gt", "gte", "lt", "lte", "in", "notIn"],
  decimal: ["eq", "not", "gt", "gte", "lt", "lte", "in", "notIn"],
  date: ["eq", "not", "gt", "gte", "lt", "lte", "in", "notIn"],
  boolean: ["eq", "not"],
  enum: ["eq", "not", "in", "notIn"]
};
var UNSAFE_KEYS2 = ["__proto__", "constructor", "prototype"];
var DATE_STRING_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;

// src/app/queryBuilder/marge.ts
var buildNestedField = (path2, condition) => {
  const segments = path2.split(".");
  for (const segment of segments) {
    if (UNSAFE_KEYS2.includes(segment)) return {};
  }
  return segments.reduceRight((acc, part) => ({ [part]: acc }), condition);
};
var deepMerge = (target, source) => {
  for (const [key, value] of Object.entries(source)) {
    if (UNSAFE_KEYS2.includes(key)) continue;
    const isPlainObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
    if (isPlainObj(value) && isPlainObj(target[key])) {
      deepMerge(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
};
var buildWhereFromFilters = (filters) => {
  const grouped = {};
  for (const { field, operator, value } of filters) {
    const prismaOp = OPERATOR_MAP[operator];
    if (!prismaOp) continue;
    grouped[field] = { ...grouped[field] ?? {}, [prismaOp]: value };
  }
  const where = {};
  for (const [field, condition] of Object.entries(grouped)) {
    deepMerge(where, buildNestedField(field, condition));
  }
  return where;
};
var buildSearchWhere = (search, searchableFields = []) => {
  if (!search || searchableFields.length === 0) return void 0;
  return { OR: searchableFields.map((field) => buildNestedField(field, { contains: search, mode: "insensitive" })) };
};
var buildWhere = (parsed2, config3, tenantScope) => {
  const conditions = [];
  const filterWhere = buildWhereFromFilters(parsed2.filters);
  if (Object.keys(filterWhere).length > 0) conditions.push(filterWhere);
  const searchWhere = buildSearchWhere(parsed2.search, config3.searchableFields);
  if (searchWhere) conditions.push(searchWhere);
  if (config3.softDelete) conditions.push({ deletedAt: null });
  if (tenantScope) conditions.push(tenantScope);
  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0] ?? {};
  return { AND: conditions };
};
var buildOrderBy = (parsed2, config3) => {
  if (parsed2.sorts.length === 0) {
    return [{ [config3.defaultSortField ?? DEFAULT_SORT_FIELD]: "desc" }];
  }
  return parsed2.sorts.map(({ field, order }) => buildNestedField(field, order));
};
var buildSelect = (fields) => {
  if (!fields || fields.length === 0) return void 0;
  const safeFields = fields.filter((f) => !UNSAFE_KEYS2.includes(f));
  return safeFields.length > 0 ? Object.fromEntries(safeFields.map((f) => [f, true])) : void 0;
};
var buildInclude = (requested, defaultInclude) => {
  const include = { ...defaultInclude ?? {} };
  for (const relation of requested ?? []) {
    if (UNSAFE_KEYS2.includes(relation)) continue;
    include[relation] = true;
  }
  return Object.keys(include).length > 0 ? include : void 0;
};
var buildPrismaArgs = (parsed2, config3, tenantScope) => {
  const select = buildSelect(parsed2.fields);
  const include = select ? void 0 : buildInclude(parsed2.include, config3.defaultInclude);
  return {
    where: buildWhere(parsed2, config3, tenantScope),
    orderBy: buildOrderBy(parsed2, config3),
    skip: parsed2.skip,
    take: parsed2.limit,
    ...select && { select },
    ...include && { include }
  };
};

// src/app/queryBuilder/parser.ts
import { StatusCodes as StatusCodes6 } from "http-status-codes";
var getBaseType = (config3) => typeof config3 === "string" ? config3 : "enum";
var assertValidDepth = (field, maxDepth) => {
  if (field.split(".").length > maxDepth) {
    throw new appError_default(StatusCodes6.BAD_REQUEST, `Field "${field}" exceeds the maximum allowed nesting depth of ${maxDepth}.`);
  }
};
var assertOperatorAllowedForType = (field, operator, type) => {
  const allowed = OPERATORS_BY_TYPE[type] ?? [];
  if (!allowed.includes(operator)) {
    throw new appError_default(StatusCodes6.BAD_REQUEST, `Operator "${operator}" is not allowed on field "${field}" (type: ${type}).`);
  }
};
var isValidCalendarDate = (raw3) => {
  const datePart = raw3.split("T")[0];
  const match = datePart?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};
var castSingleValue = (raw3, field, config3) => {
  if (typeof config3 === "object" && config3.type === "enum") {
    const validValues = Object.values(config3.enum);
    if (!validValues.includes(raw3)) {
      throw new appError_default(StatusCodes6.BAD_REQUEST, `Invalid value "${raw3}" for "${field}". Expected one of: ${validValues.join(", ")}.`);
    }
    return raw3;
  }
  switch (config3) {
    case "number": {
      const num = Number(raw3);
      if (raw3.trim() === "" || Number.isNaN(num)) {
        throw new appError_default(StatusCodes6.BAD_REQUEST, `Invalid number value for "${field}": "${raw3}"`);
      }
      return num;
    }
    case "decimal": {
      try {
        return new prismaNamespace_exports.Decimal(raw3);
      } catch {
        throw new appError_default(StatusCodes6.BAD_REQUEST, `Invalid decimal value for "${field}": "${raw3}"`);
      }
    }
    case "boolean": {
      if (raw3 !== "true" && raw3 !== "false") {
        throw new appError_default(StatusCodes6.BAD_REQUEST, `"${field}" must be "true" or "false".`);
      }
      return raw3 === "true";
    }
    case "date": {
      if (!DATE_STRING_PATTERN.test(raw3)) {
        throw new appError_default(StatusCodes6.BAD_REQUEST, `Invalid date value for "${field}": "${raw3}". Expected format YYYY-MM-DD.`);
      }
      if (!isValidCalendarDate(raw3)) {
        throw new appError_default(StatusCodes6.BAD_REQUEST, `"${raw3}" is not a real calendar date for "${field}".`);
      }
      const date = new Date(raw3);
      if (Number.isNaN(date.getTime())) {
        throw new appError_default(StatusCodes6.BAD_REQUEST, `Invalid date value for "${field}": "${raw3}"`);
      }
      return date;
    }
    default:
      return raw3;
  }
};
var castValue = (raw3, field, config3, operator) => {
  const str = String(raw3);
  if (operator === "in" || operator === "notIn") {
    return str.split(",").map((v) => castSingleValue(v.trim(), field, config3));
  }
  return castSingleValue(str, field, config3);
};
var parsePagination = (query, maxLimit) => {
  const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
  const requestedLimit = Number(query.limit) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(1, requestedLimit), maxLimit);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
var parseFilters = (query, config3, maxNestedDepth) => {
  const filters = [];
  for (const [key, rawValue] of Object.entries(query)) {
    if (RESERVED_QUERY_KEYS.includes(key)) continue;
    const fieldConfig = config3.filterableFields[key];
    if (!fieldConfig) continue;
    assertValidDepth(key, maxNestedDepth);
    const baseType = getBaseType(fieldConfig);
    if (rawValue !== null && typeof rawValue === "object" && !Array.isArray(rawValue)) {
      for (const [op, val] of Object.entries(rawValue)) {
        if (!VALID_OPERATORS.includes(op)) continue;
        assertOperatorAllowedForType(key, op, baseType);
        filters.push({ field: key, operator: op, value: castValue(val, key, fieldConfig, op) });
      }
    } else {
      assertOperatorAllowedForType(key, "eq", baseType);
      filters.push({ field: key, operator: "eq", value: castValue(rawValue, key, fieldConfig, "eq") });
    }
  }
  return filters;
};
var parseSort = (query, config3, maxNestedDepth) => {
  const sorts = [];
  const seenFields = /* @__PURE__ */ new Set();
  const pushSort = (field, order) => {
    if (seenFields.has(field)) return;
    seenFields.add(field);
    assertValidDepth(field, maxNestedDepth);
    sorts.push({ field, order });
  };
  if (typeof query.sort === "string" && query.sort.trim() !== "") {
    for (const raw3 of query.sort.split(",")) {
      const trimmed = raw3.trim();
      const desc = trimmed.startsWith("-");
      const field = desc ? trimmed.slice(1) : trimmed;
      if (config3.sortableFields.includes(field)) pushSort(field, desc ? "desc" : "asc");
    }
    return sorts;
  }
  if (typeof query.sortBy === "string" && config3.sortableFields.includes(query.sortBy)) {
    pushSort(query.sortBy, query.sortOrder === "desc" ? "desc" : "asc");
  }
  return sorts;
};
var parseCsvWhitelisted = (value, allowed, maxItems) => {
  if (typeof value !== "string" || value.trim() === "") return void 0;
  const requested = value.split(",").map((v) => v.trim()).filter(Boolean);
  const filtered = allowed ? requested.filter((f) => allowed.includes(f)) : requested;
  const unique = Array.from(new Set(filtered));
  if (unique.length === 0) return void 0;
  if (maxItems && unique.length > maxItems) {
    throw new appError_default(StatusCodes6.BAD_REQUEST, `A maximum of ${maxItems} items can be requested at once.`);
  }
  return unique;
};
var parseSearch = (query, maxSearchLength) => {
  if (typeof query.search !== "string") return void 0;
  const trimmed = query.search.trim();
  if (trimmed === "") return void 0;
  if (trimmed.length > maxSearchLength) {
    throw new appError_default(StatusCodes6.BAD_REQUEST, `Search query is too long (max ${maxSearchLength} characters).`);
  }
  return trimmed;
};
var parseQuery = (query, config3) => {
  const maxLimit = config3.maxLimit ?? DEFAULT_MAX_LIMIT;
  const maxInclude = config3.maxInclude ?? DEFAULT_MAX_INCLUDE;
  const maxNestedDepth = config3.maxNestedDepth ?? DEFAULT_MAX_NESTED_DEPTH;
  const maxSearchLength = config3.maxSearchLength ?? DEFAULT_MAX_SEARCH_LENGTH;
  const { page, limit, skip } = parsePagination(query, maxLimit);
  const search = parseSearch(query, maxSearchLength);
  const fields = parseCsvWhitelisted(query.fields, config3.selectableFields);
  const include = parseCsvWhitelisted(query.include, config3.includableRelations, maxInclude);
  return {
    page,
    limit,
    skip,
    ...search !== void 0 && { search },
    filters: parseFilters(query, config3, maxNestedDepth),
    sorts: parseSort(query, config3, maxNestedDepth),
    ...fields !== void 0 && { fields },
    ...include !== void 0 && { include }
  };
};

// src/app/queryBuilder/queryBuilder.ts
var validateConfig = (config3) => {
  for (const field of config3.selectableFields ?? []) {
    if (field.includes(".")) {
      throw new Error(`QueryConfig.selectableFields: "${field}" is invalid \u2014 nested field selection is not supported.`);
    }
  }
  for (const relation of config3.includableRelations ?? []) {
    if (relation.includes(".")) {
      throw new Error(`QueryConfig.includableRelations: "${relation}" is invalid \u2014 only direct relation names are supported.`);
    }
  }
  for (const field of config3.searchableFields ?? []) {
    const baseField = field.includes(".") ? void 0 : field;
    if (baseField && config3.filterableFields[baseField]) {
      const fieldConfig = config3.filterableFields[baseField];
      const baseType = typeof fieldConfig === "string" ? fieldConfig : "enum";
      if (baseType !== "string") {
        throw new Error(`QueryConfig.searchableFields: "${field}" is type "${baseType}", but search uses "contains" which only works on strings.`);
      }
    }
  }
};
var QueryBuilder = class {
  delegate;
  config;
  constructor(delegate10, config3) {
    const merged = {
      maxLimit: DEFAULT_MAX_LIMIT,
      maxInclude: DEFAULT_MAX_INCLUDE,
      maxNestedDepth: DEFAULT_MAX_NESTED_DEPTH,
      maxSearchLength: DEFAULT_MAX_SEARCH_LENGTH,
      defaultSortField: DEFAULT_SORT_FIELD,
      ...config3
    };
    validateConfig(merged);
    this.delegate = delegate10;
    this.config = merged;
  }
  parse(rawQuery) {
    return parseQuery(rawQuery, this.config);
  }
  buildArgs(parsed2, tenantScope) {
    return buildPrismaArgs(parsed2, this.config, tenantScope);
  }
  buildMeta(parsed2, total) {
    return { page: parsed2.page, limit: parsed2.limit, total, totalPage: Math.max(1, Math.ceil(total / parsed2.limit)) };
  }
  async execute(rawQuery, tenantScope) {
    const parsed2 = this.parse(rawQuery);
    const args = this.buildArgs(parsed2, tenantScope);
    const where = args.where;
    const [data, total] = await Promise.all([
      this.delegate.findMany({ ...args, where }),
      this.delegate.count({ where })
    ]);
    return { data, meta: this.buildMeta(parsed2, total) };
  }
};

// src/lib/prisma.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
var adapter = new PrismaPg({
  connectionString: config_default.database.url
});
var globalForPrisma = globalThis;
var prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter
});
if (config_default.app.env !== "production") {
  globalForPrisma.prisma = prisma;
}

// src/lib/sslcommerz.ts
import SSLCommerzPayment from "sslcommerz-lts";
var sslcommerz = new SSLCommerzPayment(
  config_default.sslcommerz.storeId ?? "",
  config_default.sslcommerz.storePassword ?? "",
  config_default.sslcommerz.isLive
);

// src/lib/bkash.ts
import { StatusCodes as StatusCodes7 } from "http-status-codes";

// src/lib/radis.ts
import Redis from "ioredis";
var redis = config_default.redis.url ? new Redis(config_default.redis.url, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true
}) : null;
if (redis) {
  redis.on("error", (error) => {
    console.error("[Redis] Connection error:", error.message);
  });
  redis.on("connect", () => {
    console.log("[Redis] Connected.");
  });
}

// src/lib/bkash.ts
var ID_TOKEN_KEY = "bkash:idToken";
var REFRESH_TOKEN_KEY = "bkash:refreshToken";
var getBkashIdToken = async () => {
  if (!config_default.bkash.baseUrl || !config_default.bkash.username || !config_default.bkash.password || !config_default.bkash.appKey || !config_default.bkash.appSecret) {
    throw new appError_default(
      StatusCodes7.SERVICE_UNAVAILABLE,
      "bKash is not configured."
    );
  }
  const idToken = await redis.get(ID_TOKEN_KEY);
  const idTokenTTL = await redis.ttl(ID_TOKEN_KEY);
  if (idToken && idTokenTTL > 600) {
    return idToken;
  }
  const refreshToken = await redis.get(REFRESH_TOKEN_KEY);
  const refreshTokenTTL = await redis.ttl(REFRESH_TOKEN_KEY);
  if (refreshToken && refreshTokenTTL > 600) {
    const response2 = await fetch(
      `${config_default.bkash.baseUrl}/tokenized/checkout/token/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          username: config_default.bkash.username,
          password: config_default.bkash.password
        },
        body: JSON.stringify({
          app_key: config_default.bkash.appKey,
          app_secret: config_default.bkash.appSecret,
          refresh_token: refreshToken
        })
      }
    );
    if (!response2.ok) {
      throw new appError_default(
        StatusCodes7.BAD_GATEWAY,
        "bKash token refresh failed."
      );
    }
    const result2 = await response2.json();
    if (!result2.id_token) {
      throw new appError_default(
        StatusCodes7.BAD_GATEWAY,
        "bKash did not return a valid ID token."
      );
    }
    await redis.set(ID_TOKEN_KEY, result2.id_token, "EX", 60 * 60);
    if (result2.refresh_token) {
      await redis.set(
        REFRESH_TOKEN_KEY,
        result2.refresh_token,
        "EX",
        60 * 60 * 24 * 28
      );
    }
    return result2.id_token;
  }
  const response = await fetch(
    `${config_default.bkash.baseUrl}/tokenized/checkout/token/grant`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        username: config_default.bkash.username,
        password: config_default.bkash.password
      },
      body: JSON.stringify({
        app_key: config_default.bkash.appKey,
        app_secret: config_default.bkash.appSecret
      })
    }
  );
  if (!response.ok) {
    throw new appError_default(
      StatusCodes7.BAD_GATEWAY,
      "bKash token grant failed."
    );
  }
  const result = await response.json();
  if (!result.id_token || !result.refresh_token) {
    throw new appError_default(
      StatusCodes7.BAD_GATEWAY,
      "bKash returned an invalid token response."
    );
  }
  await redis.set(ID_TOKEN_KEY, result.id_token, "EX", 60 * 60);
  await redis.set(
    REFRESH_TOKEN_KEY,
    result.refresh_token,
    "EX",
    60 * 60 * 24 * 28
  );
  return result.id_token;
};

// src/app/modules/payment/payment.constant.ts
var paymentQueryConfig = {
  filterableFields: {
    proposalId: "string",
    clientId: "string",
    provider: { type: "enum", enum: { STRIPE: "STRIPE", BKASH: "BKASH", SSLCOMMERZ: "SSLCOMMERZ", MANUAL: "MANUAL" } },
    status: {
      type: "enum",
      enum: { PENDING: "PENDING", PROCESSING: "PROCESSING", SUCCEEDED: "SUCCEEDED", FAILED: "FAILED", REFUNDED: "REFUNDED", CANCELLED: "CANCELLED" }
    }
  },
  sortableFields: ["createdAt", "paidAt", "amount"],
  includableRelations: ["proposal", "client"],
  defaultSortField: "createdAt"
};

// src/app/modules/notification/notification.service.ts
import { StatusCodes as StatusCodes8 } from "http-status-codes";

// src/app/modules/notification/notification.constant.ts
var notificationQueryConfig = {
  filterableFields: {
    isRead: "boolean",
    type: {
      type: "enum",
      enum: {
        LEAD_NEW: "LEAD_NEW",
        LEAD_ASSIGNED: "LEAD_ASSIGNED",
        LEAD_STATUS_CHANGED: "LEAD_STATUS_CHANGED",
        PROPOSAL_SENT: "PROPOSAL_SENT",
        PROPOSAL_ACCEPTED: "PROPOSAL_ACCEPTED",
        PROPOSAL_REJECTED: "PROPOSAL_REJECTED",
        PROJECT_UPDATE: "PROJECT_UPDATE",
        TASK_ASSIGNED: "TASK_ASSIGNED",
        TASK_DUE: "TASK_DUE",
        CONSULTATION_SCHEDULED: "CONSULTATION_SCHEDULED",
        MESSAGE_RECEIVED: "MESSAGE_RECEIVED",
        REVIEW_RECEIVED: "REVIEW_RECEIVED",
        SEO_REPORT: "SEO_REPORT",
        SYSTEM: "SYSTEM"
      }
    }
  },
  sortableFields: ["createdAt"],
  defaultSortField: "createdAt"
};

// src/app/modules/notification/notification.service.ts
var notificationDelegate = prisma.notification;
var createNotification = async (payload) => prisma.notification.create({ data: payload });
var notifyAdmins = async (payload) => {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  await Promise.all(admins.map((admin) => createNotification({ ...payload, userId: admin.id })));
};
var createNotificationInDB = async (payload) => {
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new appError_default(StatusCodes8.BAD_REQUEST, "The provided userId does not match any user.");
  }
  return createNotification(payload);
};
var getMyNotificationsFromDB = async (userId, query) => {
  const effectiveQuery = { ...query, userId };
  const queryBuilder = new QueryBuilder(notificationDelegate, notificationQueryConfig);
  return queryBuilder.execute(effectiveQuery);
};
var assertOwnedNotification = async (id, userId) => {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) {
    throw new appError_default(StatusCodes8.NOT_FOUND, "Notification not found.");
  }
  if (notification.userId !== userId) {
    throw new appError_default(StatusCodes8.FORBIDDEN, "You do not have access to this notification.");
  }
  return notification;
};
var markNotificationReadInDB = async (id, userId) => {
  await assertOwnedNotification(id, userId);
  return prisma.notification.update({ where: { id }, data: { isRead: true, readAt: /* @__PURE__ */ new Date() } });
};
var markAllNotificationsReadInDB = async (userId) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: /* @__PURE__ */ new Date() }
  });
};
var deleteMyNotificationFromDB = async (id, userId) => {
  await assertOwnedNotification(id, userId);
  await prisma.notification.delete({ where: { id } });
};
var notificationService = {
  createNotification,
  notifyAdmins,
  createNotificationInDB,
  getMyNotificationsFromDB,
  markNotificationReadInDB,
  markAllNotificationsReadInDB,
  deleteMyNotificationFromDB
};

// src/app/modules/payment/payment.service.ts
var paymentDelegate = prisma.payment;
var primaryClientUrl = () => config_default.app.clientUrl.split(",")[0]?.trim() ?? "";
var assertCanPayForProposal = async (proposalId, requestedBy) => {
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) {
    throw new appError_default(StatusCodes9.BAD_REQUEST, "The provided proposalId does not match any proposal.");
  }
  if (proposal.status === "DRAFT") {
    throw new appError_default(StatusCodes9.BAD_REQUEST, "This proposal hasn't been sent yet, so it can't be paid for.");
  }
  if (proposal.status === "REJECTED" || proposal.status === "EXPIRED") {
    throw new appError_default(StatusCodes9.BAD_REQUEST, `This proposal is ${proposal.status.toLowerCase()} and can no longer be paid for.`);
  }
  if (requestedBy.role === "CLIENT") {
    const client = await prisma.client.findUnique({ where: { userId: requestedBy.id } });
    if (!client || proposal.clientId !== client.id) {
      throw new appError_default(StatusCodes9.FORBIDDEN, "You can only pay for your own proposals.");
    }
  }
  return proposal;
};
var notifyProposalCreatorOfPayment = async (proposalId, providerLabel) => {
  try {
    const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
    if (proposal) {
      await createNotification({
        userId: proposal.createdById,
        type: "PROPOSAL_ACCEPTED",
        entityType: "PROPOSAL",
        entityId: proposal.id,
        title: "Payment received",
        message: `${providerLabel} payment for proposal ${proposal.proposalNumber} has been received.`
      });
    }
  } catch (error) {
    console.error("[Payment] Failed to send payment-received notification:", error);
  }
};
var createStripeCheckoutInDB = async (proposalId, requestedBy) => {
  const proposal = await assertCanPayForProposal(proposalId, requestedBy);
  const clientUrl = primaryClientUrl();
  const successUrl = `${clientUrl}/proposals/${proposal.id}?payment=success`;
  const cancelUrl = `${clientUrl}/proposals/${proposal.id}?payment=cancelled`;
  const unitAmount = Math.round(proposal.total.toNumber() * 100);
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: proposal.currency.toLowerCase(),
          unit_amount: unitAmount,
          product_data: { name: `Proposal ${proposal.proposalNumber}`, description: proposal.title }
        }
      }
    ],
    metadata: { proposalId: proposal.id }
  });
  const payment = await prisma.payment.create({
    data: {
      proposalId: proposal.id,
      clientId: proposal.clientId,
      provider: "STRIPE",
      providerPaymentId: session.id,
      amount: proposal.total,
      currency: proposal.currency,
      status: "PENDING"
    }
  });
  return { checkoutUrl: session.url, payment };
};
var markPaymentSucceededByProviderIdInDB = async (providerPaymentId) => {
  const payment = await prisma.payment.findUnique({ where: { providerPaymentId } });
  if (!payment) {
    console.warn(`[Payment] No payment record found for providerPaymentId ${providerPaymentId}`);
    return;
  }
  if (payment.status === "SUCCEEDED") {
    return;
  }
  const updated = await prisma.payment.update({ where: { id: payment.id }, data: { status: "SUCCEEDED", paidAt: /* @__PURE__ */ new Date() } });
  if (updated.proposalId) {
    await notifyProposalCreatorOfPayment(updated.proposalId, "Stripe");
  }
  return updated;
};
var markPaymentFailedByProviderIdInDB = async (providerPaymentId, reason) => {
  const payment = await prisma.payment.findUnique({ where: { providerPaymentId } });
  if (!payment) {
    console.warn(`[Payment] No payment record found for providerPaymentId ${providerPaymentId}`);
    return;
  }
  return prisma.payment.update({
    where: { id: payment.id },
    data: { status: "FAILED", ...reason !== void 0 && { metadata: { reason } } }
  });
};
var createBkashPaymentInDB = async (proposalId, requestedBy) => {
  const proposal = await assertCanPayForProposal(proposalId, requestedBy);
  if (proposal.currency !== "BDT") {
    throw new appError_default(StatusCodes9.BAD_REQUEST, "bKash only supports BDT-denominated proposals. Use Stripe for other currencies.");
  }
  if (!config_default.bkash.baseUrl || !config_default.bkash.appKey || !config_default.bkash.callbackUrl) {
    throw new appError_default(StatusCodes9.SERVICE_UNAVAILABLE, "bKash is not configured.");
  }
  const idToken = await getBkashIdToken();
  const response = await fetch(`${config_default.bkash.baseUrl}/tokenized/checkout/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: idToken,
      "X-APP-Key": config_default.bkash.appKey
    },
    body: JSON.stringify({
      mode: "0011",
      payerReference: proposal.id,
      callbackURL: config_default.bkash.callbackUrl,
      amount: proposal.total.toFixed(2),
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: proposal.proposalNumber
    })
  });
  if (!response.ok) {
    throw new appError_default(StatusCodes9.BAD_GATEWAY, "bKash payment creation failed.");
  }
  const result = await response.json();
  if (!result.paymentID || !result.bkashURL) {
    throw new appError_default(StatusCodes9.BAD_GATEWAY, result.statusMessage ?? "bKash did not return a valid payment session.");
  }
  const payment = await prisma.payment.create({
    data: {
      proposalId: proposal.id,
      clientId: proposal.clientId,
      provider: "BKASH",
      providerPaymentId: result.paymentID,
      amount: proposal.total,
      currency: "BDT",
      status: "PENDING"
    }
  });
  return { paymentUrl: result.bkashURL, payment };
};
var handleBkashCallbackInDB = async (paymentID, redirectStatus) => {
  const payment = await prisma.payment.findUnique({ where: { providerPaymentId: paymentID } });
  if (!payment) {
    throw new appError_default(StatusCodes9.NOT_FOUND, "Payment record not found for this bKash paymentID.");
  }
  if (redirectStatus !== "success") {
    const status = redirectStatus === "cancel" ? "CANCELLED" : "FAILED";
    await prisma.payment.update({ where: { id: payment.id }, data: { status } });
    return { payment, redirectStatus: "failed" };
  }
  if (!config_default.bkash.baseUrl || !config_default.bkash.appKey) {
    throw new appError_default(StatusCodes9.SERVICE_UNAVAILABLE, "bKash is not configured.");
  }
  const idToken = await getBkashIdToken();
  const response = await fetch(`${config_default.bkash.baseUrl}/tokenized/checkout/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: idToken,
      "X-APP-Key": config_default.bkash.appKey
    },
    body: JSON.stringify({ paymentID })
  });
  if (!response.ok) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    throw new appError_default(StatusCodes9.BAD_GATEWAY, "bKash payment execution failed.");
  }
  const result = await response.json();
  if (result.transactionStatus !== "Completed") {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return { payment, redirectStatus: "failed" };
  }
  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "SUCCEEDED", paidAt: /* @__PURE__ */ new Date(), metadata: { trxID: result.trxID } }
  });
  if (updated.proposalId) {
    await notifyProposalCreatorOfPayment(updated.proposalId, "bKash");
  }
  return { payment: updated, redirectStatus: "success" };
};
var createSslcommerzPaymentInDB = async (proposalId, requestedBy) => {
  const proposal = await assertCanPayForProposal(proposalId, requestedBy);
  if (proposal.currency !== "BDT") {
    throw new appError_default(StatusCodes9.BAD_REQUEST, "SSLCommerz only supports BDT-denominated proposals. Use Stripe for other currencies.");
  }
  if (!config_default.sslcommerz.storeId || !config_default.sslcommerz.storePassword) {
    throw new appError_default(StatusCodes9.SERVICE_UNAVAILABLE, "SSLCommerz is not configured.");
  }
  const client = proposal.clientId ? await prisma.client.findUnique({ where: { id: proposal.clientId } }) : null;
  const tranId = `${proposal.proposalNumber}-${Date.now()}`;
  const backendBaseUrl = config_default.betterAuth.url ?? primaryClientUrl();
  const apiResponse = await sslcommerz.init({
    total_amount: proposal.total.toNumber(),
    currency: "BDT",
    tran_id: tranId,
    success_url: `${backendBaseUrl}/api/v1/payments/sslcommerz/callback?status=success`,
    fail_url: `${backendBaseUrl}/api/v1/payments/sslcommerz/callback?status=fail`,
    cancel_url: `${backendBaseUrl}/api/v1/payments/sslcommerz/callback?status=cancel`,
    ipn_url: `${backendBaseUrl}/api/v1/payments/sslcommerz/callback?status=ipn`,
    shipping_method: "NO",
    product_name: `Proposal ${proposal.proposalNumber}`,
    product_category: "Service",
    product_profile: "general",
    cus_name: client?.name ?? "Customer",
    cus_email: client?.email ?? "customer@example.com",
    cus_add1: client?.location ?? "N/A",
    cus_city: "N/A",
    cus_country: "Bangladesh",
    cus_phone: client?.phone ?? "N/A"
  });
  if (apiResponse.status !== "SUCCESS" || !apiResponse.GatewayPageURL) {
    throw new appError_default(StatusCodes9.BAD_GATEWAY, apiResponse.failedreason ?? "SSLCommerz session creation failed.");
  }
  const payment = await prisma.payment.create({
    data: {
      proposalId: proposal.id,
      clientId: proposal.clientId,
      provider: "SSLCOMMERZ",
      providerPaymentId: tranId,
      amount: proposal.total,
      currency: "BDT",
      status: "PENDING"
    }
  });
  return { paymentUrl: apiResponse.GatewayPageURL, payment };
};
var handleSslcommerzCallbackInDB = async (tranId, status, valId) => {
  const payment = await prisma.payment.findUnique({ where: { providerPaymentId: tranId } });
  if (!payment) {
    throw new appError_default(StatusCodes9.NOT_FOUND, "Payment record not found for this transaction ID.");
  }
  if (status !== "success" || !valId) {
    const failedStatus = status === "cancel" ? "CANCELLED" : "FAILED";
    await prisma.payment.update({ where: { id: payment.id }, data: { status: failedStatus } });
    return { payment, redirectStatus: "failed" };
  }
  const validation = await sslcommerz.validate({ val_id: valId });
  if (validation.status !== "VALID" && validation.status !== "VALIDATED") {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return { payment, redirectStatus: "failed" };
  }
  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "SUCCEEDED", paidAt: /* @__PURE__ */ new Date(), metadata: { valId } }
  });
  if (updated.proposalId) {
    await notifyProposalCreatorOfPayment(updated.proposalId, "SSLCommerz");
  }
  return { payment: updated, redirectStatus: "success" };
};
var getAllPaymentsFromDB = async (query) => {
  const queryBuilder = new QueryBuilder(paymentDelegate, paymentQueryConfig);
  return queryBuilder.execute(query);
};
var getPaymentByIdFromDB = async (id) => {
  const payment = await prisma.payment.findUnique({ where: { id }, include: { proposal: true, client: true } });
  if (!payment) {
    throw new appError_default(StatusCodes9.NOT_FOUND, "Payment not found.");
  }
  return payment;
};
var getMyPaymentsFromDB = async (userId, query) => {
  const client = await prisma.client.findUnique({ where: { userId } });
  if (!client) {
    throw new appError_default(StatusCodes9.BAD_REQUEST, "No client profile is linked to your account.");
  }
  const effectiveQuery = { ...query, clientId: client.id };
  const queryBuilder = new QueryBuilder(paymentDelegate, paymentQueryConfig);
  return queryBuilder.execute(effectiveQuery);
};
var refundStripePaymentInDB = async (id) => {
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) {
    throw new appError_default(StatusCodes9.NOT_FOUND, "Payment not found.");
  }
  if (payment.provider !== "STRIPE") {
    throw new appError_default(StatusCodes9.BAD_REQUEST, "Only Stripe payments can be refunded through this endpoint.");
  }
  if (payment.status !== "SUCCEEDED") {
    throw new appError_default(StatusCodes9.BAD_REQUEST, "Only a successfully paid payment can be refunded.");
  }
  if (!payment.providerPaymentId) {
    throw new appError_default(StatusCodes9.BAD_REQUEST, "This payment has no associated Stripe session.");
  }
  const session = await getStripe().checkout.sessions.retrieve(payment.providerPaymentId);
  if (!session.payment_intent) {
    throw new appError_default(StatusCodes9.BAD_REQUEST, "No payment intent found for this session.");
  }
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent.id;
  await getStripe().refunds.create({ payment_intent: paymentIntentId });
  return prisma.payment.update({ where: { id }, data: { status: "REFUNDED" } });
};
var paymentService = {
  createStripeCheckoutInDB,
  markPaymentSucceededByProviderIdInDB,
  markPaymentFailedByProviderIdInDB,
  createBkashPaymentInDB,
  handleBkashCallbackInDB,
  createSslcommerzPaymentInDB,
  handleSslcommerzCallbackInDB,
  getAllPaymentsFromDB,
  getPaymentByIdFromDB,
  getMyPaymentsFromDB,
  refundStripePaymentInDB
};

// src/app/modules/webhook/webhook.controller.ts
var handleStripeWebhook = catchAsync(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (!config_default.stripe.webhookSecret || !signature) {
    res.status(StatusCodes10.BAD_REQUEST).json({ success: false, message: "Stripe webhook is not configured." });
    return;
  }
  let event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, signature, config_default.stripe.webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature.";
    res.status(StatusCodes10.BAD_REQUEST).json({ success: false, message: `Webhook signature verification failed: ${message}` });
    return;
  }
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      await paymentService.markPaymentSucceededByProviderIdInDB(session.id);
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object;
      await paymentService.markPaymentFailedByProviderIdInDB(session.id, "Checkout session expired.");
      break;
    }
    case "payment_intent.payment_failed": {
      const intent = event.data.object;
      console.warn(`[Stripe Webhook] payment_intent.payment_failed \u2014 ${intent.id}`);
      break;
    }
    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }
  res.status(StatusCodes10.OK).json({ received: true });
});
var webhookController = {
  handleStripeWebhook
};

// src/app/modules/webhook/webhook.routes.ts
var router = Router();
router.post(
  "/stripe",
  express.raw({
    type: "application/json"
  }),
  webhookController.handleStripeWebhook
);
var webhookRoutes = router;

// src/app/routes/index.ts
import { Router as Router40 } from "express";

// src/app/modules/auth/auth.routes.ts
import { Router as Router2 } from "express";

// src/app/middlewares/requireAuth.ts
import { fromNodeHeaders } from "better-auth/node";
import { StatusCodes as StatusCodes12 } from "http-status-codes";

// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer, emailOTP, twoFactor } from "better-auth/plugins";

// src/app/utils/emailTemplates.ts
var verificationEmailTemplate = (name, url) => `
  <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
    <h2>Verify your email</h2>
    <p>Hi ${name},</p>
    <p>Please verify your email address to activate your account.</p>
    <p><a href="${url}" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">Verify Email</a></p>
    <p style="font-size: 13px; color: #666;">If the button doesn't work, copy this link: ${url}</p>
  </div>
`;
var resetPasswordEmailTemplate = (name, url) => `
  <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
    <h2>Reset your password</h2>
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. This link expires shortly for your security.</p>
    <p><a href="${url}" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a></p>
    <p style="font-size: 13px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
  </div>
`;
var welcomeEmailTemplate = (name) => `
  <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
    <h2>Welcome, ${name}!</h2>
    <p>Thanks for joining. Your account has been created successfully.</p>
  </div>
`;
var otpEmailTemplate = (name, otp, expirationMinutes, purpose = "verify your email") => `
  <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
    <h2>Verification Code</h2>
    <p>Hi ${name}, use the code below to ${purpose}.</p>
    <div style="display:inline-block;padding:12px 24px;background:#f0f4ff;color:#007bff;font-size:28px;font-weight:bold;letter-spacing:8px;border-radius:4px;margin-top:20px;">${otp}</div>
    <p style="font-size: 13px; color: #666; margin-top: 16px;">This code will expire in ${expirationMinutes} minutes. If you didn't request this, please ignore this email.</p>
  </div>
`;

// src/lib/nodemailer.ts
import nodemailer from "nodemailer";
var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config_default.email.smtpUser,
    pass: config_default.email.smtpPassword
  }
});

// src/app/utils/sendEmail.ts
var sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: config_default.email.smtpUser,
      to,
      subject,
      html
    });
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
  }
};

// src/app/utils/bruteForceGuard.ts
var MAX_ATTEMPTS = 5;
var LOCKOUT_SECONDS = 15 * 60;
var ATTEMPT_WINDOW_SECONDS = 15 * 60;
var attemptsKey = (identifier) => `login:attempts:${identifier}`;
var lockKey = (identifier) => `login:locked:${identifier}`;
var isLocked = async (identifier) => {
  if (!redis) {
    return false;
  }
  try {
    const locked = await redis.get(lockKey(identifier));
    return Boolean(locked);
  } catch (error) {
    console.error(
      "[BruteForce] Failed to check lock status:",
      error
    );
    return false;
  }
};
var recordFailedAttempt = async (identifier) => {
  if (!redis) {
    return;
  }
  try {
    const key = attemptsKey(identifier);
    const attempts = await redis.incr(key);
    if (attempts === 1) {
      await redis.expire(
        key,
        ATTEMPT_WINDOW_SECONDS
      );
    }
    if (attempts >= MAX_ATTEMPTS) {
      await redis.set(
        lockKey(identifier),
        "1",
        "EX",
        LOCKOUT_SECONDS
      );
      await redis.del(key);
    }
  } catch (error) {
    console.error(
      "[BruteForce] Failed to record failed attempt:",
      error
    );
  }
};
var clearFailedAttempts = async (identifier) => {
  if (!redis) {
    return;
  }
  try {
    await redis.del(attemptsKey(identifier));
  } catch (error) {
    console.error(
      "[BruteForce] Failed to clear failed attempts:",
      error
    );
  }
};

// src/app/utils/verifyCaptcha.ts
import { StatusCodes as StatusCodes11 } from "http-status-codes";
var verifyCaptcha = async (token) => {
  if (!config_default.captcha.hcaptchaSecretKey) return;
  const response = await fetch("https://hcaptcha.com/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      secret: config_default.captcha.hcaptchaSecretKey,
      response: token
    })
  });
  if (!response.ok) {
    throw new appError_default(
      StatusCodes11.BAD_GATEWAY,
      "Captcha verification service is unavailable."
    );
  }
  const result = await response.json();
  if (!result.success) {
    throw new appError_default(
      StatusCodes11.BAD_REQUEST,
      "Captcha verification failed."
    );
  }
};

// src/lib/auth.validation.ts
import { z as z2 } from "zod";
var passwordPolicy = z2.string().min(8, "Password must be at least 8 characters.").max(128, "Password must be at most 128 characters.").regex(/[a-z]/, "Password must include at least one lowercase letter.").regex(/[A-Z]/, "Password must include at least one uppercase letter.").regex(/[0-9]/, "Password must include at least one number.").regex(/[^a-zA-Z0-9]/, "Password must include at least one special character.");
var signUpEmailValidation = z2.object({
  name: z2.string().trim().min(2, "Name must be at least 2 characters.").max(100, "Name must be at most 100 characters."),
  email: z2.string().trim().toLowerCase().email("A valid email address is required."),
  password: passwordPolicy
});
var signInEmailValidation = z2.object({
  email: z2.string().trim().toLowerCase().email("A valid email address is required."),
  password: z2.string().min(1, "Password is required.")
});

// src/lib/auth.ts
var socialProviders = {};
if (config_default.oauth.google.clientId && config_default.oauth.google.clientSecret) {
  socialProviders.google = {
    clientId: config_default.oauth.google.clientId,
    clientSecret: config_default.oauth.google.clientSecret
  };
}
if (config_default.oauth.github.clientId && config_default.oauth.github.clientSecret) {
  socialProviders.github = {
    clientId: config_default.oauth.github.clientId,
    clientSecret: config_default.oauth.github.clientSecret
  };
}
var trustedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...config_default.app.clientUrl.split(",").map((origin) => origin.trim()).filter(Boolean)
].filter(
  (origin, index, origins) => origins.indexOf(origin) === index
);
var APP_NAME = "Nexivo AI";
var auth = betterAuth({
  /**
   * IMPORTANT:
   * This must be the URL of the Better Auth server.
   *
   * Development:
   * http://localhost:5000
   *
   * OAuth callback:
   * http://localhost:5000/api/auth/callback/google
   */
  baseURL: config_default.betterAuth.url,
  /**
   * Better Auth API base path.
   */
  basePath: "/api/auth",
  /**
   * ============================================================
   * Database
   * ============================================================
   */
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  /**
   * ============================================================
   * User
   * ============================================================
   */
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        /**
         * Matches:
         * role UserRole @default(CLIENT)
         */
        defaultValue: "CLIENT",
        /**
         * Users cannot choose their role during signup.
         *
         * Public signup:
         * CLIENT
         *
         * Staff:
         * Created through Staff module
         *
         * Admin:
         * Seed / role promotion
         */
        input: false
      }
    }
  },
  /**
   * ============================================================
   * Email + Password
   * ============================================================
   */
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: config_default.app.env === "production",
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: resetPasswordEmailTemplate(
          user.name ?? "there",
          url
        )
      });
    }
  },
  /**
   * ============================================================
   * Email Verification
   * ============================================================
   */
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        html: verificationEmailTemplate(
          user.name ?? "there",
          url
        )
      });
    }
  },
  /**
   * ============================================================
   * Social Providers
   * ============================================================
   */
  socialProviders,
  /**
   * ============================================================
   * Session
   * ============================================================
   */
  session: {
    expiresIn: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60
  },
  /**
   * ============================================================
   * Trusted Origins
   * ============================================================
   */
  trustedOrigins,
  /**
   * ============================================================
   * Cookie Configuration
   * ============================================================
   */
  advanced: {
    useSecureCookies: config_default.app.env === "production",
    defaultCookieAttributes: {
      sameSite: config_default.app.env === "production" ? "none" : "lax",
      secure: config_default.app.env === "production"
    }
  },
  /**
   * ============================================================
   * Plugins
   * ============================================================
   */
  plugins: [
    bearer(),
    twoFactor({
      issuer: APP_NAME
    }),
    emailOTP({
      otpLength: 6,
      expiresIn: 5 * 60,
      allowedAttempts: 5,
      overrideDefaultEmailVerification: true,
      sendVerificationOTP: async ({
        email,
        otp,
        type
      }) => {
        const user = await prisma.user.findUnique({
          where: { email }
        });
        const name = user?.name ?? "there";
        const subjectAndPurpose = type === "sign-in" ? {
          subject: "Your sign-in code",
          purpose: "sign in"
        } : type === "email-verification" ? {
          subject: "Verify your email",
          purpose: "verify your email"
        } : {
          subject: "Reset your password",
          purpose: "reset your password"
        };
        await sendEmail({
          to: email,
          subject: subjectAndPurpose.subject,
          html: otpEmailTemplate(
            name,
            otp,
            5,
            subjectAndPurpose.purpose
          )
        });
      }
    })
  ],
  /**
   * ============================================================
   * Request Lifecycle Hooks
   * ============================================================
   */
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        const parsed2 = signUpEmailValidation.safeParse(ctx.body);
        if (!parsed2.success) {
          throw new APIError("BAD_REQUEST", {
            message: parsed2.error.issues[0]?.message ?? "Invalid registration details."
          });
        }
      }
      if (ctx.path === "/sign-in/email") {
        const parsed2 = signInEmailValidation.safeParse(ctx.body);
        if (!parsed2.success) {
          throw new APIError("BAD_REQUEST", {
            message: parsed2.error.issues[0]?.message ?? "Invalid login details."
          });
        }
      }
      if (ctx.path === "/sign-in/email") {
        const email = ctx.body?.email;
        if (email && await isLocked(email)) {
          throw new APIError("TOO_MANY_REQUESTS", {
            message: "Too many failed login attempts. Please try again in 15 minutes."
          });
        }
      }
      if (ctx.path === "/sign-up/email") {
        const captchaToken = ctx.body?.captchaToken;
        if (config_default.captcha.hcaptchaSecretKey) {
          if (!captchaToken) {
            throw new APIError("BAD_REQUEST", {
              message: "Captcha token is required."
            });
          }
          await verifyCaptcha(captchaToken);
        }
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/email") {
        const email = ctx.body?.email;
        const returned = ctx.context.returned;
        const failed = Boolean(
          returned && typeof returned === "object" && "status" in returned && (returned.status ?? 0) >= 400
        );
        if (email) {
          if (failed) {
            await recordFailedAttempt(email);
          } else {
            await clearFailedAttempts(email);
          }
        }
      }
    })
  },
  /**
   * ============================================================
   * Database Hooks
   * ============================================================
   *
   * Runs for:
   * - Email/password signup
   * - Google signup
   * - GitHub signup
   *
   * ============================================================
   */
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await sendEmail({
            to: user.email,
            subject: `Welcome, ${user.name}!`,
            html: welcomeEmailTemplate(user.name)
          });
          const role = user.role ?? "CLIENT";
          if (role === "CLIENT" && user.email !== config_default.superAdmin.email) {
            try {
              const existingClient = await prisma.client.findUnique({
                where: {
                  userId: user.id
                }
              });
              if (!existingClient) {
                await prisma.client.create({
                  data: {
                    userId: user.id,
                    name: user.name || user.email.split("@")[0] || "Client",
                    email: user.email
                  }
                });
              }
            } catch (error) {
              console.error(
                "[Auth] Failed to auto-create Client profile:",
                error
              );
            }
          }
        }
      }
    }
  }
});

// src/app/middlewares/requireAuth.ts
var requireAuth = catchAsync(async (req, _res, next) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session?.user) {
    throw new appError_default(StatusCodes12.UNAUTHORIZED, "You are not logged in. Please log in to access this resource.");
  }
  req.user = session.user;
  next();
});
var requireRole = (...roles) => {
  return catchAsync(async (req, _res, next) => {
    if (!req.user) {
      throw new appError_default(StatusCodes12.UNAUTHORIZED, "You are not logged in.");
    }
    if (roles.length && !roles.includes(req.user.role)) {
      throw new appError_default(StatusCodes12.FORBIDDEN, "You don't have permission to access this resource.");
    }
    next();
  });
};

// src/app/modules/auth/auth.controller.ts
import { StatusCodes as StatusCodes13 } from "http-status-codes";

// src/app/utils/sendResponse.ts
var sendResponse = (res, payload) => {
  const { success, statusCode, message, data, meta } = payload;
  res.status(statusCode).json({ success, statusCode, message, data, ...meta && { meta } });
};

// src/app/modules/auth/auth.controller.ts
var getMySession = catchAsync(async (req, res) => {
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes13.OK,
    message: "Session is active.",
    data: {
      id: req.user?.id,
      email: req.user?.email,
      role: req.user?.role,
      emailVerified: req.user?.emailVerified
    }
  });
});

// src/app/modules/auth/auth.routes.ts
var router2 = Router2();
router2.get("/session", requireAuth, getMySession);
var authRoutes = router2;

// src/app/modules/user/user.routes.ts
import { Router as Router3 } from "express";

// src/app/middlewares/validateRequest.ts
import { StatusCodes as StatusCodes14 } from "http-status-codes";
var validateRequest = (schema) => {
  return async (req, _res, next) => {
    const result = await schema.safeParseAsync(req.body ?? {});
    if (!result.success) {
      return next(
        new appError_default(
          StatusCodes14.BAD_REQUEST,
          result.error.issues[0]?.message ?? "Validation failed.",
          "VALIDATION_ERROR",
          result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message
          }))
        )
      );
    }
    req.body = result.data;
    next();
  };
};

// src/app/modules/user/user.validation.ts
import { z as z3 } from "zod";
var updateMeValidation = z3.object({
  name: z3.string().min(2, "Name must be at least 2 characters.").max(100, "Name too long.").optional(),
  image: z3.string().url("Image must be a valid URL.").optional()
}).strict().refine((data) => Object.keys(data).length > 0, { message: "At least one field (name or image) must be provided." });
var updateUserRoleValidation = z3.object({
  role: z3.enum(["ADMIN", "STAFF", "CLIENT"], { message: "Role must be ADMIN, STAFF, or CLIENT." })
});
var updateUserStatusValidation = z3.object({
  status: z3.enum(["ACTIVE", "INACTIVE", "SUSPENDED"], { message: "Status must be ACTIVE, INACTIVE, or SUSPENDED." })
});

// src/app/modules/user/user.controller.ts
import { StatusCodes as StatusCodes16 } from "http-status-codes";

// src/app/modules/user/user.service.ts
import { StatusCodes as StatusCodes15 } from "http-status-codes";

// src/app/modules/user/user.constant.ts
var userQueryConfig = {
  searchableFields: ["email", "name"],
  filterableFields: {
    email: "string",
    name: "string",
    role: { type: "enum", enum: { ADMIN: "ADMIN", STAFF: "STAFF", CLIENT: "CLIENT" } },
    status: { type: "enum", enum: { ACTIVE: "ACTIVE", INACTIVE: "INACTIVE", SUSPENDED: "SUSPENDED" } }
  },
  sortableFields: ["createdAt", "updatedAt", "email", "name", "lastLoginAt"],
  includableRelations: ["staffProfile", "clientProfile"],
  defaultSortField: "createdAt"
};

// src/app/modules/user/user.service.ts
var omitPassword = (user) => {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
};
var userDelegate = prisma.user;
var getAllUsersFromDB = async (query) => {
  const queryBuilder = new QueryBuilder(userDelegate, userQueryConfig);
  const { data, meta } = await queryBuilder.execute(query);
  return { data: data.map(omitPassword), meta };
};
var getUserByIdFromDB = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { staffProfile: true, clientProfile: true }
  });
  if (!user) {
    throw new appError_default(StatusCodes15.NOT_FOUND, "User not found.");
  }
  return omitPassword(user);
};
var updateUserRoleInDB = async (id, role) => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new appError_default(StatusCodes15.NOT_FOUND, "User not found.");
  }
  const updated = await prisma.user.update({ where: { id }, data: { role } });
  return omitPassword(updated);
};
var updateUserStatusInDB = async (id, status) => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new appError_default(StatusCodes15.NOT_FOUND, "User not found.");
  }
  const updated = await prisma.user.update({ where: { id }, data: { status } });
  return omitPassword(updated);
};
var updateMyProfileInDB = async (id, payload) => {
  const updated = await prisma.user.update({
    where: { id },
    data: payload
  });
  return omitPassword(updated);
};
var userService = {
  getAllUsersFromDB,
  getUserByIdFromDB,
  updateUserRoleInDB,
  updateUserStatusInDB,
  updateMyProfileInDB
};

// src/app/modules/user/user.controller.ts
var getAllUsers = catchAsync(async (req, res) => {
  const { data, meta } = await userService.getAllUsersFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes16.OK,
    message: "Users retrieved successfully.",
    data,
    meta
  });
});
var getMe = catchAsync(async (req, res) => {
  const user = await userService.getUserByIdFromDB(req.user?.id ?? "");
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes16.OK,
    message: "Profile retrieved successfully.",
    data: user
  });
});
var updateMe = catchAsync(async (req, res) => {
  const user = await userService.updateMyProfileInDB(req.user?.id ?? "", req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes16.OK,
    message: "Profile updated successfully.",
    data: user
  });
});
var getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUserByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes16.OK,
    message: "User retrieved successfully.",
    data: user
  });
});
var updateUserRole = catchAsync(async (req, res) => {
  const user = await userService.updateUserRoleInDB(req.params.id, req.body.role);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes16.OK,
    message: "User role updated successfully.",
    data: user
  });
});
var updateUserStatus = catchAsync(async (req, res) => {
  const user = await userService.updateUserStatusInDB(req.params.id, req.body.status);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes16.OK,
    message: "User status updated successfully.",
    data: user
  });
});
var userController = {
  getAllUsers,
  getMe,
  updateMe,
  getUserById,
  updateUserRole,
  updateUserStatus
};

// src/app/modules/user/user.routes.ts
var router3 = Router3();
router3.get("/me", requireAuth, userController.getMe);
router3.patch(
  "/me",
  requireAuth,
  validateRequest(updateMeValidation),
  userController.updateMe
);
router3.get("/", requireAuth, requireRole("ADMIN"), userController.getAllUsers);
router3.get("/:id", requireAuth, requireRole("ADMIN"), userController.getUserById);
router3.patch(
  "/:id/role",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest(updateUserRoleValidation),
  userController.updateUserRole
);
router3.patch(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest(updateUserStatusValidation),
  userController.updateUserStatus
);
var userRoutes = router3;

// src/app/modules/staff/staff.routes.ts
import { Router as Router4 } from "express";

// src/app/modules/staff/staff.validation.ts
import { z as z4 } from "zod";
var staffRoleEnum = z4.enum(["OWNER", "MANAGER", "DEVELOPER", "DESIGNER", "MARKETING", "SALES", "SUPPORT"]);
var staffStatusEnum = z4.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"]);
var createStaffValidation = z4.object({
  userId: z4.string().min(1).optional(),
  employeeId: z4.string().min(1).optional(),
  fullName: z4.string().min(1, "Full name is required.").max(150),
  email: z4.string().email("A valid email is required."),
  phone: z4.string().min(1).optional(),
  role: staffRoleEnum.default("SUPPORT"),
  designation: z4.string().min(1).optional(),
  department: z4.string().min(1).optional(),
  bio: z4.string().max(2e3).optional(),
  avatar: z4.string().url().optional(),
  hireDate: z4.coerce.date().optional()
});
var updateStaffValidation = z4.object({
  userId: z4.string().min(1).nullable().optional(),
  employeeId: z4.string().min(1).nullable().optional(),
  fullName: z4.string().min(1).max(150).optional(),
  email: z4.string().email().optional(),
  phone: z4.string().min(1).nullable().optional(),
  role: staffRoleEnum.optional(),
  designation: z4.string().min(1).nullable().optional(),
  department: z4.string().min(1).nullable().optional(),
  bio: z4.string().max(2e3).nullable().optional(),
  avatar: z4.string().url().nullable().optional(),
  hireDate: z4.coerce.date().nullable().optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
var updateStaffStatusValidation = z4.object({
  status: staffStatusEnum
});

// src/app/modules/staff/staff.controller.ts
import { StatusCodes as StatusCodes18 } from "http-status-codes";

// src/app/modules/staff/staff.service.ts
import { StatusCodes as StatusCodes17 } from "http-status-codes";

// src/app/modules/staff/staff.constant.ts
var staffQueryConfig = {
  searchableFields: ["fullName", "email", "employeeId"],
  filterableFields: {
    fullName: "string",
    email: "string",
    employeeId: "string",
    department: "string",
    role: {
      type: "enum",
      enum: {
        OWNER: "OWNER",
        MANAGER: "MANAGER",
        DEVELOPER: "DEVELOPER",
        DESIGNER: "DESIGNER",
        MARKETING: "MARKETING",
        SALES: "SALES",
        SUPPORT: "SUPPORT"
      }
    },
    status: {
      type: "enum",
      enum: { ACTIVE: "ACTIVE", INACTIVE: "INACTIVE", ON_LEAVE: "ON_LEAVE", TERMINATED: "TERMINATED" }
    }
  },
  sortableFields: ["createdAt", "updatedAt", "fullName", "hireDate"],
  includableRelations: ["user", "assignedLeads", "assignedTasks", "projectMemberships"],
  defaultSortField: "createdAt"
};

// src/app/modules/staff/staff.service.ts
var staffDelegate = prisma.staff;
var assertUserExistsAndUnlinked = async (userId, excludeStaffId) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { staffProfile: true } });
  if (!user) {
    throw new appError_default(StatusCodes17.BAD_REQUEST, "The provided userId does not match any user.");
  }
  if (user.staffProfile && user.staffProfile.id !== excludeStaffId) {
    throw new appError_default(StatusCodes17.CONFLICT, "This user is already linked to another staff profile.");
  }
};
var createStaffInDB = async (payload) => {
  if (payload.userId) {
    await assertUserExistsAndUnlinked(payload.userId);
  }
  return prisma.staff.create({ data: payload });
};
var getAllStaffFromDB = async (query) => {
  const queryBuilder = new QueryBuilder(staffDelegate, staffQueryConfig);
  return queryBuilder.execute(query);
};
var getStaffByIdFromDB = async (id) => {
  const staff = await prisma.staff.findUnique({
    where: { id },
    include: { user: { select: { id: true, email: true, name: true, image: true } } }
  });
  if (!staff) {
    throw new appError_default(StatusCodes17.NOT_FOUND, "Staff member not found.");
  }
  return staff;
};
var updateStaffInDB = async (id, payload) => {
  const existing = await prisma.staff.findUnique({ where: { id } });
  if (!existing) {
    throw new appError_default(StatusCodes17.NOT_FOUND, "Staff member not found.");
  }
  if (payload.userId) {
    await assertUserExistsAndUnlinked(payload.userId, id);
  }
  return prisma.staff.update({ where: { id }, data: payload });
};
var updateStaffStatusInDB = async (id, status) => {
  const existing = await prisma.staff.findUnique({ where: { id } });
  if (!existing) {
    throw new appError_default(StatusCodes17.NOT_FOUND, "Staff member not found.");
  }
  return prisma.staff.update({ where: { id }, data: { status } });
};
var deleteStaffFromDB = async (id) => {
  const existing = await prisma.staff.findUnique({ where: { id } });
  if (!existing) {
    throw new appError_default(StatusCodes17.NOT_FOUND, "Staff member not found.");
  }
  await prisma.staff.delete({ where: { id } });
};
var staffService = {
  createStaffInDB,
  getAllStaffFromDB,
  getStaffByIdFromDB,
  updateStaffInDB,
  updateStaffStatusInDB,
  deleteStaffFromDB
};

// src/app/modules/staff/staff.controller.ts
var createStaff = catchAsync(async (req, res) => {
  const staff = await staffService.createStaffInDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes18.CREATED,
    message: "Staff member created successfully.",
    data: staff
  });
});
var getAllStaff = catchAsync(async (req, res) => {
  const { data, meta } = await staffService.getAllStaffFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes18.OK,
    message: "Staff members retrieved successfully.",
    data,
    meta
  });
});
var getStaffById = catchAsync(async (req, res) => {
  const staff = await staffService.getStaffByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes18.OK,
    message: "Staff member retrieved successfully.",
    data: staff
  });
});
var updateStaff = catchAsync(async (req, res) => {
  const staff = await staffService.updateStaffInDB(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes18.OK,
    message: "Staff member updated successfully.",
    data: staff
  });
});
var updateStaffStatus = catchAsync(async (req, res) => {
  const staff = await staffService.updateStaffStatusInDB(req.params.id, req.body.status);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes18.OK,
    message: "Staff status updated successfully.",
    data: staff
  });
});
var deleteStaff = catchAsync(async (req, res) => {
  await staffService.deleteStaffFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes18.OK,
    message: "Staff member deleted successfully.",
    data: null
  });
});
var staffController = {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  updateStaffStatus,
  deleteStaff
};

// src/app/modules/staff/staff.routes.ts
var router4 = Router4();
router4.post("/", requireAuth, requireRole("ADMIN"), validateRequest(createStaffValidation), staffController.createStaff);
router4.get("/", requireAuth, requireRole("ADMIN", "STAFF"), staffController.getAllStaff);
router4.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), staffController.getStaffById);
router4.patch("/:id", requireAuth, requireRole("ADMIN"), validateRequest(updateStaffValidation), staffController.updateStaff);
router4.patch(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest(updateStaffStatusValidation),
  staffController.updateStaffStatus
);
router4.delete("/:id", requireAuth, requireRole("ADMIN"), staffController.deleteStaff);
var staffRoutes = router4;

// src/app/modules/client/client.routes.ts
import { Router as Router5 } from "express";

// src/app/modules/client/client.validation.ts
import { z as z5 } from "zod";
var createClientValidation = z5.object({
  userId: z5.string().min(1).optional(),
  name: z5.string().min(1, "Name is required.").max(150),
  email: z5.string().email("A valid email is required."),
  phone: z5.string().min(1).optional(),
  company: z5.string().min(1).optional(),
  website: z5.string().url().optional(),
  location: z5.string().min(1).optional(),
  notes: z5.string().max(2e3).optional()
});
var updateClientValidation = z5.object({
  userId: z5.string().min(1).nullable().optional(),
  name: z5.string().min(1).max(150).optional(),
  email: z5.string().email().optional(),
  phone: z5.string().min(1).nullable().optional(),
  company: z5.string().min(1).nullable().optional(),
  website: z5.string().url().nullable().optional(),
  location: z5.string().min(1).nullable().optional(),
  notes: z5.string().max(2e3).nullable().optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
var updateMyClientProfileValidation = z5.object({
  name: z5.string().min(1).max(150).optional(),
  phone: z5.string().min(1).nullable().optional(),
  company: z5.string().min(1).nullable().optional(),
  website: z5.string().url().nullable().optional(),
  location: z5.string().min(1).nullable().optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
var updateClientActiveValidation = z5.object({
  isActive: z5.boolean()
});

// src/app/modules/client/client.controller.ts
import { StatusCodes as StatusCodes20 } from "http-status-codes";

// src/app/modules/client/client.service.ts
import { StatusCodes as StatusCodes19 } from "http-status-codes";

// src/app/modules/client/client.constant.ts
var clientQueryConfig = {
  searchableFields: ["name", "email", "company"],
  filterableFields: {
    name: "string",
    email: "string",
    company: "string",
    isActive: "boolean"
  },
  sortableFields: ["createdAt", "updatedAt", "name"],
  includableRelations: ["user", "leads", "projects", "proposals", "reviews", "appreciations"],
  defaultSortField: "createdAt"
};

// src/app/modules/client/client.service.ts
var clientDelegate = prisma.client;
var assertUserExistsAndUnlinked2 = async (userId, excludeClientId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { clientProfile: true }
  });
  if (!user) {
    throw new appError_default(
      StatusCodes19.BAD_REQUEST,
      "The provided userId does not match any user."
    );
  }
  if (user.clientProfile && user.clientProfile.id !== excludeClientId) {
    throw new appError_default(
      StatusCodes19.CONFLICT,
      "This user is already linked to another client profile."
    );
  }
};
var createClientInDB = async (payload) => {
  if (payload.userId) {
    await assertUserExistsAndUnlinked2(payload.userId);
  }
  return prisma.client.create({
    data: payload
  });
};
var getAllClientsFromDB = async (query) => {
  const queryBuilder = new QueryBuilder(
    clientDelegate,
    clientQueryConfig
  );
  return queryBuilder.execute(query);
};
var getClientByIdFromDB = async (id) => {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true, image: true } }
    }
  });
  if (!client) {
    throw new appError_default(StatusCodes19.NOT_FOUND, "Client not found.");
  }
  return client;
};
var getMyClientProfileFromDB = async (userId) => {
  const client = await prisma.client.findUnique({ where: { userId } });
  if (!client) {
    throw new appError_default(
      StatusCodes19.NOT_FOUND,
      "No client profile is linked to your account."
    );
  }
  return client;
};
var updateClientInDB = async (id, payload) => {
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) {
    throw new appError_default(StatusCodes19.NOT_FOUND, "Client not found.");
  }
  if (payload.userId) {
    await assertUserExistsAndUnlinked2(payload.userId, id);
  }
  return prisma.client.update({
    where: { id },
    data: payload
  });
};
var updateMyClientProfileInDB = async (userId, payload) => {
  const existing = await prisma.client.findUnique({ where: { userId } });
  if (!existing) {
    throw new appError_default(
      StatusCodes19.NOT_FOUND,
      "No client profile is linked to your account."
    );
  }
  return prisma.client.update({
    where: { userId },
    data: payload
  });
};
var updateClientActiveInDB = async (id, isActive) => {
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) {
    throw new appError_default(StatusCodes19.NOT_FOUND, "Client not found.");
  }
  return prisma.client.update({ where: { id }, data: { isActive } });
};
var deleteClientFromDB = async (id) => {
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) {
    throw new appError_default(StatusCodes19.NOT_FOUND, "Client not found.");
  }
  await prisma.client.delete({ where: { id } });
};
var clientService = {
  createClientInDB,
  getAllClientsFromDB,
  getClientByIdFromDB,
  getMyClientProfileFromDB,
  updateClientInDB,
  updateMyClientProfileInDB,
  updateClientActiveInDB,
  deleteClientFromDB
};

// src/app/modules/client/client.controller.ts
var createClient = catchAsync(async (req, res) => {
  const client = await clientService.createClientInDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes20.CREATED,
    message: "Client created successfully.",
    data: client
  });
});
var getAllClients = catchAsync(async (req, res) => {
  const { data, meta } = await clientService.getAllClientsFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes20.OK,
    message: "Clients retrieved successfully.",
    data,
    meta
  });
});
var getClientById = catchAsync(async (req, res) => {
  const client = await clientService.getClientByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes20.OK,
    message: "Client retrieved successfully.",
    data: client
  });
});
var getMyClientProfile = catchAsync(async (req, res) => {
  const client = await clientService.getMyClientProfileFromDB(req.user?.id ?? "");
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes20.OK,
    message: "Client profile retrieved successfully.",
    data: client
  });
});
var updateMyClientProfile = catchAsync(async (req, res) => {
  const client = await clientService.updateMyClientProfileInDB(req.user?.id ?? "", req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes20.OK,
    message: "Client profile updated successfully.",
    data: client
  });
});
var updateClient = catchAsync(async (req, res) => {
  const client = await clientService.updateClientInDB(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes20.OK,
    message: "Client updated successfully.",
    data: client
  });
});
var updateClientActive = catchAsync(async (req, res) => {
  const client = await clientService.updateClientActiveInDB(req.params.id, req.body.isActive);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes20.OK,
    message: "Client status updated successfully.",
    data: client
  });
});
var deleteClient = catchAsync(async (req, res) => {
  await clientService.deleteClientFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes20.OK,
    message: "Client deleted successfully.",
    data: null
  });
});
var clientController = {
  createClient,
  getAllClients,
  getClientById,
  getMyClientProfile,
  updateMyClientProfile,
  updateClient,
  updateClientActive,
  deleteClient
};

// src/app/modules/client/client.routes.ts
var router5 = Router5();
router5.get("/me", requireAuth, requireRole("CLIENT"), clientController.getMyClientProfile);
router5.patch(
  "/me",
  requireAuth,
  requireRole("CLIENT"),
  validateRequest(updateMyClientProfileValidation),
  clientController.updateMyClientProfile
);
router5.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(createClientValidation),
  clientController.createClient
);
router5.get("/", requireAuth, requireRole("ADMIN", "STAFF"), clientController.getAllClients);
router5.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), clientController.getClientById);
router5.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateClientValidation),
  clientController.updateClient
);
router5.patch(
  "/:id/active",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateClientActiveValidation),
  clientController.updateClientActive
);
router5.delete("/:id", requireAuth, requireRole("ADMIN"), clientController.deleteClient);
var clientRoutes = router5;

// src/app/modules/service/service.routes.ts
import { Router as Router6 } from "express";

// src/app/modules/service/service.validation.ts
import { z as z6 } from "zod";
var slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var slugField = z6.string().min(1, "Slug is required.").max(150).regex(slugPattern, "Slug must be lowercase, alphanumeric, and hyphen-separated (e.g. 'seo-services').");
var createServiceValidation = z6.object({
  slug: slugField,
  name: z6.string().min(1, "Name is required.").max(150),
  shortName: z6.string().min(1).max(60).optional(),
  tagline: z6.string().min(1).max(200).optional(),
  description: z6.string().max(5e3).optional(),
  icon: z6.string().min(1).optional(),
  coverImage: z6.string().url().optional(),
  features: z6.unknown().optional(),
  process: z6.unknown().optional(),
  startingPrice: z6.coerce.number().nonnegative().optional(),
  currency: z6.string().length(3).default("USD"),
  isActive: z6.boolean().default(true),
  isFeatured: z6.boolean().default(false),
  order: z6.coerce.number().int().default(0),
  seoTitle: z6.string().max(160).optional(),
  seoDescription: z6.string().max(300).optional()
});
var updateServiceValidation = z6.object({
  slug: slugField.optional(),
  name: z6.string().min(1).max(150).optional(),
  shortName: z6.string().min(1).max(60).nullable().optional(),
  tagline: z6.string().min(1).max(200).nullable().optional(),
  description: z6.string().max(5e3).nullable().optional(),
  icon: z6.string().min(1).nullable().optional(),
  coverImage: z6.string().url().nullable().optional(),
  features: z6.unknown().nullable().optional(),
  process: z6.unknown().nullable().optional(),
  startingPrice: z6.coerce.number().nonnegative().nullable().optional(),
  currency: z6.string().length(3).optional(),
  isActive: z6.boolean().optional(),
  isFeatured: z6.boolean().optional(),
  order: z6.coerce.number().int().optional(),
  seoTitle: z6.string().max(160).nullable().optional(),
  seoDescription: z6.string().max(300).nullable().optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

// src/app/modules/service/service.controller.ts
import { StatusCodes as StatusCodes22 } from "http-status-codes";

// src/app/modules/service/service.service.ts
import { StatusCodes as StatusCodes21 } from "http-status-codes";

// src/app/modules/service/service.constant.ts
var serviceQueryConfig = {
  searchableFields: ["name", "shortName", "tagline", "description"],
  filterableFields: {
    slug: "string",
    name: "string",
    isActive: "boolean",
    isFeatured: "boolean"
  },
  sortableFields: ["order", "createdAt", "updatedAt", "name", "startingPrice"],
  includableRelations: ["pricingPlans", "portfolioItems", "caseStudyItems"]
  // No defaultSortField override: QueryBuilder's built-in default-sort always
  // applies "desc", which would be wrong for the "order" column (it should
  // read ascending — 0, 1, 2...). getAllServicesFromDB injects an explicit
  // `sortBy=order&sortOrder=asc` default instead when the caller doesn't sort.
};

// src/app/modules/service/service.service.ts
var serviceDelegate = prisma.service;
var toPrismaData = (payload) => ({
  ...payload,
  ...payload.startingPrice !== void 0 && {
    startingPrice: payload.startingPrice === null ? null : new prismaNamespace_exports.Decimal(payload.startingPrice)
  },
  ...payload.features !== void 0 && {
    features: payload.features === null ? prismaNamespace_exports.JsonNull : payload.features
  },
  ...payload.process !== void 0 && {
    process: payload.process === null ? prismaNamespace_exports.JsonNull : payload.process
  }
});
var createServiceInDB = async (payload) => {
  return prisma.service.create({ data: toPrismaData(payload) });
};
var getAllServicesFromDB = async (query, { publicOnly }) => {
  const effectiveQuery = { ...query };
  if (publicOnly) {
    effectiveQuery.isActive = "true";
  }
  if (!effectiveQuery.sort && !effectiveQuery.sortBy) {
    effectiveQuery.sortBy = "order";
    effectiveQuery.sortOrder = "asc";
  }
  const queryBuilder = new QueryBuilder(serviceDelegate, serviceQueryConfig);
  return queryBuilder.execute(effectiveQuery);
};
var getServiceBySlugFromDB = async (slug, { publicOnly }) => {
  const service = await prisma.service.findUnique({
    where: { slug },
    include: {
      pricingPlans: {
        ...publicOnly && { where: { isActive: true } },
        orderBy: { order: "asc" }
      }
    }
  });
  if (!service || publicOnly && !service.isActive) {
    throw new appError_default(StatusCodes21.NOT_FOUND, "Service not found.");
  }
  return service;
};
var getServiceByIdFromDB = async (id) => {
  const service = await prisma.service.findUnique({
    where: { id },
    include: { pricingPlans: { orderBy: { order: "asc" } } }
  });
  if (!service) {
    throw new appError_default(StatusCodes21.NOT_FOUND, "Service not found.");
  }
  return service;
};
var updateServiceInDB = async (id, payload) => {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    throw new appError_default(StatusCodes21.NOT_FOUND, "Service not found.");
  }
  return prisma.service.update({ where: { id }, data: toPrismaData(payload) });
};
var deleteServiceFromDB = async (id) => {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    throw new appError_default(StatusCodes21.NOT_FOUND, "Service not found.");
  }
  await prisma.service.delete({ where: { id } });
};
var serviceService = {
  createServiceInDB,
  getAllServicesFromDB,
  getServiceBySlugFromDB,
  getServiceByIdFromDB,
  updateServiceInDB,
  deleteServiceFromDB
};

// src/app/modules/service/service.controller.ts
var createService = catchAsync(async (req, res) => {
  const service = await serviceService.createServiceInDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes22.CREATED,
    message: "Service created successfully.",
    data: service
  });
});
var getAllServicesPublic = catchAsync(async (req, res) => {
  const { data, meta } = await serviceService.getAllServicesFromDB(req.query, {
    publicOnly: true
  });
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes22.OK,
    message: "Services retrieved successfully.",
    data,
    meta
  });
});
var getAllServicesAdmin = catchAsync(async (req, res) => {
  const { data, meta } = await serviceService.getAllServicesFromDB(req.query, {
    publicOnly: false
  });
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes22.OK,
    message: "Services retrieved successfully.",
    data,
    meta
  });
});
var getServiceBySlugPublic = catchAsync(async (req, res) => {
  const service = await serviceService.getServiceBySlugFromDB(req.params.slug, { publicOnly: true });
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes22.OK,
    message: "Service retrieved successfully.",
    data: service
  });
});
var getServiceByIdAdmin = catchAsync(async (req, res) => {
  const service = await serviceService.getServiceByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes22.OK,
    message: "Service retrieved successfully.",
    data: service
  });
});
var updateService = catchAsync(async (req, res) => {
  const service = await serviceService.updateServiceInDB(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes22.OK,
    message: "Service updated successfully.",
    data: service
  });
});
var deleteService = catchAsync(async (req, res) => {
  await serviceService.deleteServiceFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes22.OK,
    message: "Service deleted successfully.",
    data: null
  });
});
var serviceController = {
  createService,
  getAllServicesPublic,
  getAllServicesAdmin,
  getServiceBySlugPublic,
  getServiceByIdAdmin,
  updateService,
  deleteService
};

// src/app/modules/service/service.routes.ts
var router6 = Router6();
router6.get("/", serviceController.getAllServicesPublic);
router6.get("/manage", requireAuth, requireRole("ADMIN", "STAFF"), serviceController.getAllServicesAdmin);
router6.get("/manage/:id", requireAuth, requireRole("ADMIN", "STAFF"), serviceController.getServiceByIdAdmin);
router6.get("/:slug", serviceController.getServiceBySlugPublic);
router6.post("/", requireAuth, requireRole("ADMIN"), validateRequest(createServiceValidation), serviceController.createService);
router6.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest(updateServiceValidation),
  serviceController.updateService
);
router6.delete("/:id", requireAuth, requireRole("ADMIN"), serviceController.deleteService);
var serviceRoutes = router6;

// src/app/modules/pricingPlan/pricingPlan.routes.ts
import { Router as Router7 } from "express";

// src/app/modules/pricingPlan/pricingPlan.validation.ts
import { z as z7 } from "zod";
var slugPattern2 = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var slugField2 = z7.string().min(1, "Slug is required.").max(150).regex(slugPattern2, "Slug must be lowercase, alphanumeric, and hyphen-separated.");
var billingIntervalEnum = z7.enum(["ONE_TIME", "MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"]);
var createPricingPlanValidation = z7.object({
  serviceId: z7.string().min(1, "serviceId is required."),
  slug: slugField2,
  name: z7.string().min(1, "Name is required.").max(150),
  description: z7.string().max(3e3).optional(),
  price: z7.coerce.number().nonnegative("Price cannot be negative."),
  currency: z7.string().length(3).default("USD"),
  billingInterval: billingIntervalEnum.default("ONE_TIME"),
  features: z7.unknown().optional(),
  isPopular: z7.boolean().default(false),
  isActive: z7.boolean().default(true),
  order: z7.coerce.number().int().default(0)
});
var updatePricingPlanValidation = z7.object({
  serviceId: z7.string().min(1).optional(),
  slug: slugField2.optional(),
  name: z7.string().min(1).max(150).optional(),
  description: z7.string().max(3e3).nullable().optional(),
  price: z7.coerce.number().nonnegative().optional(),
  currency: z7.string().length(3).optional(),
  billingInterval: billingIntervalEnum.optional(),
  features: z7.unknown().nullable().optional(),
  isPopular: z7.boolean().optional(),
  isActive: z7.boolean().optional(),
  order: z7.coerce.number().int().optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

// src/app/modules/pricingPlan/pricingPlan.controller.ts
import { StatusCodes as StatusCodes24 } from "http-status-codes";

// src/app/modules/pricingPlan/pricingPlan.service.ts
import { StatusCodes as StatusCodes23 } from "http-status-codes";

// src/app/modules/pricingPlan/pricingPlan.constant.ts
var pricingPlanQueryConfig = {
  searchableFields: ["name", "description"],
  filterableFields: {
    serviceId: "string",
    slug: "string",
    isActive: "boolean",
    isPopular: "boolean",
    billingInterval: {
      type: "enum",
      enum: { ONE_TIME: "ONE_TIME", MONTHLY: "MONTHLY", QUARTERLY: "QUARTERLY", YEARLY: "YEARLY", CUSTOM: "CUSTOM" }
    }
  },
  sortableFields: ["order", "price", "createdAt", "updatedAt", "name"],
  includableRelations: ["service"]
};

// src/app/modules/pricingPlan/pricingPlan.service.ts
var pricingPlanDelegate = prisma.pricingPlan;
var assertServiceExists = async (serviceId) => {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    throw new appError_default(StatusCodes23.BAD_REQUEST, "The provided serviceId does not match any service.");
  }
};
var toPrismaData2 = (payload) => ({
  ...payload,
  ...payload.price !== void 0 && { price: new prismaNamespace_exports.Decimal(payload.price) },
  ...payload.features !== void 0 && {
    features: payload.features === null ? prismaNamespace_exports.JsonNull : payload.features
  }
});
var createPricingPlanInDB = async (payload) => {
  await assertServiceExists(payload.serviceId);
  return prisma.pricingPlan.create({ data: toPrismaData2(payload) });
};
var getAllPricingPlansFromDB = async (query, { publicOnly }) => {
  const effectiveQuery = { ...query };
  if (publicOnly) {
    effectiveQuery.isActive = "true";
  }
  if (!effectiveQuery.sort && !effectiveQuery.sortBy) {
    effectiveQuery.sortBy = "order";
    effectiveQuery.sortOrder = "asc";
  }
  const queryBuilder = new QueryBuilder(pricingPlanDelegate, pricingPlanQueryConfig);
  return queryBuilder.execute(effectiveQuery);
};
var getPricingPlanByIdFromDB = async (id) => {
  const plan = await prisma.pricingPlan.findUnique({ where: { id }, include: { service: true } });
  if (!plan) {
    throw new appError_default(StatusCodes23.NOT_FOUND, "Pricing plan not found.");
  }
  return plan;
};
var updatePricingPlanInDB = async (id, payload) => {
  const existing = await prisma.pricingPlan.findUnique({ where: { id } });
  if (!existing) {
    throw new appError_default(StatusCodes23.NOT_FOUND, "Pricing plan not found.");
  }
  if (payload.serviceId) {
    await assertServiceExists(payload.serviceId);
  }
  return prisma.pricingPlan.update({ where: { id }, data: toPrismaData2(payload) });
};
var deletePricingPlanFromDB = async (id) => {
  const existing = await prisma.pricingPlan.findUnique({ where: { id } });
  if (!existing) {
    throw new appError_default(StatusCodes23.NOT_FOUND, "Pricing plan not found.");
  }
  await prisma.pricingPlan.delete({ where: { id } });
};
var pricingPlanService = {
  createPricingPlanInDB,
  getAllPricingPlansFromDB,
  getPricingPlanByIdFromDB,
  updatePricingPlanInDB,
  deletePricingPlanFromDB
};

// src/app/modules/pricingPlan/pricingPlan.controller.ts
var createPricingPlan = catchAsync(async (req, res) => {
  const plan = await pricingPlanService.createPricingPlanInDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes24.CREATED,
    message: "Pricing plan created successfully.",
    data: plan
  });
});
var getAllPricingPlansPublic = catchAsync(async (req, res) => {
  const { data, meta } = await pricingPlanService.getAllPricingPlansFromDB(req.query, {
    publicOnly: true
  });
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes24.OK,
    message: "Pricing plans retrieved successfully.",
    data,
    meta
  });
});
var getAllPricingPlansAdmin = catchAsync(async (req, res) => {
  const { data, meta } = await pricingPlanService.getAllPricingPlansFromDB(req.query, {
    publicOnly: false
  });
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes24.OK,
    message: "Pricing plans retrieved successfully.",
    data,
    meta
  });
});
var getPricingPlanById = catchAsync(async (req, res) => {
  const plan = await pricingPlanService.getPricingPlanByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes24.OK,
    message: "Pricing plan retrieved successfully.",
    data: plan
  });
});
var updatePricingPlan = catchAsync(async (req, res) => {
  const plan = await pricingPlanService.updatePricingPlanInDB(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes24.OK,
    message: "Pricing plan updated successfully.",
    data: plan
  });
});
var deletePricingPlan = catchAsync(async (req, res) => {
  await pricingPlanService.deletePricingPlanFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes24.OK,
    message: "Pricing plan deleted successfully.",
    data: null
  });
});
var pricingPlanController = {
  createPricingPlan,
  getAllPricingPlansPublic,
  getAllPricingPlansAdmin,
  getPricingPlanById,
  updatePricingPlan,
  deletePricingPlan
};

// src/app/modules/pricingPlan/pricingPlan.routes.ts
var router7 = Router7();
router7.get("/", pricingPlanController.getAllPricingPlansPublic);
router7.get("/manage", requireAuth, requireRole("ADMIN", "STAFF"), pricingPlanController.getAllPricingPlansAdmin);
router7.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), pricingPlanController.getPricingPlanById);
router7.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest(createPricingPlanValidation),
  pricingPlanController.createPricingPlan
);
router7.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest(updatePricingPlanValidation),
  pricingPlanController.updatePricingPlan
);
router7.delete("/:id", requireAuth, requireRole("ADMIN"), pricingPlanController.deletePricingPlan);
var pricingPlanRoutes = router7;

// src/app/modules/lead/lead.routes.ts
import { Router as Router8 } from "express";

// src/app/modules/lead/lead.validation.ts
import { z as z8 } from "zod";
var leadSourceEnum = z8.enum(["WEBSITE", "REFERRAL", "SOCIAL_MEDIA", "EMAIL_CAMPAIGN", "PHONE", "WALK_IN", "OTHER"]);
var leadPriorityEnum = z8.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
var leadStatusEnum = z8.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATING", "CONVERTED", "LOST"]);
var createLeadValidation = z8.object({
  serviceId: z8.string().min(1).optional(),
  name: z8.string().min(1, "Name is required.").max(150),
  email: z8.string().email("A valid email is required."),
  phone: z8.string().min(1).optional(),
  company: z8.string().min(1).optional(),
  website: z8.string().url().optional(),
  location: z8.string().min(1).optional(),
  budget: z8.string().min(1).optional(),
  timeline: z8.string().min(1).optional(),
  message: z8.string().max(3e3).optional(),
  source: leadSourceEnum.default("WEBSITE")
});
var updateLeadValidation = z8.object({
  serviceId: z8.string().min(1).nullable().optional(),
  name: z8.string().min(1).max(150).optional(),
  email: z8.string().email().optional(),
  phone: z8.string().min(1).nullable().optional(),
  company: z8.string().min(1).nullable().optional(),
  website: z8.string().url().nullable().optional(),
  location: z8.string().min(1).nullable().optional(),
  budget: z8.string().min(1).nullable().optional(),
  timeline: z8.string().min(1).nullable().optional(),
  message: z8.string().max(3e3).nullable().optional(),
  priority: leadPriorityEnum.optional(),
  followUpAt: z8.coerce.date().nullable().optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
var updateLeadStatusValidation = z8.object({
  status: leadStatusEnum
});
var assignLeadValidation = z8.object({
  staffId: z8.string().min(1).nullable()
});
var addLeadNoteValidation = z8.object({
  content: z8.string().min(1, "Note content is required.").max(5e3)
});

// src/app/modules/lead/lead.controller.ts
import { StatusCodes as StatusCodes26 } from "http-status-codes";

// src/app/modules/lead/lead.service.ts
import { StatusCodes as StatusCodes25 } from "http-status-codes";

// src/app/modules/lead/lead.constant.ts
var leadQueryConfig = {
  searchableFields: ["name", "email", "company", "phone"],
  filterableFields: {
    name: "string",
    email: "string",
    company: "string",
    serviceId: "string",
    clientId: "string",
    assignedStaffId: "string",
    status: {
      type: "enum",
      enum: {
        NEW: "NEW",
        CONTACTED: "CONTACTED",
        QUALIFIED: "QUALIFIED",
        PROPOSAL_SENT: "PROPOSAL_SENT",
        NEGOTIATING: "NEGOTIATING",
        CONVERTED: "CONVERTED",
        LOST: "LOST"
      }
    },
    priority: { type: "enum", enum: { LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH", URGENT: "URGENT" } },
    source: {
      type: "enum",
      enum: {
        WEBSITE: "WEBSITE",
        REFERRAL: "REFERRAL",
        SOCIAL_MEDIA: "SOCIAL_MEDIA",
        EMAIL_CAMPAIGN: "EMAIL_CAMPAIGN",
        PHONE: "PHONE",
        WALK_IN: "WALK_IN",
        OTHER: "OTHER"
      }
    }
  },
  sortableFields: ["createdAt", "updatedAt", "followUpAt", "priority", "name"],
  includableRelations: ["service", "client", "assignedStaff"],
  defaultSortField: "createdAt"
};

// src/app/modules/lead/lead.service.ts
var leadDelegate = prisma.lead;
var logLeadActivity = async (leadId, type, description, createdById, metadata) => {
  await prisma.leadActivity.create({
    data: {
      leadId,
      type,
      description,
      ...createdById !== void 0 && { createdById },
      ...metadata !== void 0 && { metadata }
    }
  });
};
var assertLeadExists = async (id) => {
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    throw new appError_default(StatusCodes25.NOT_FOUND, "Lead not found.");
  }
  return lead;
};
var createLeadInDB = async (payload) => {
  if (payload.serviceId) {
    const service = await prisma.service.findUnique({ where: { id: payload.serviceId } });
    if (!service) {
      throw new appError_default(StatusCodes25.BAD_REQUEST, "The provided serviceId does not match any service.");
    }
  }
  const lead = await prisma.lead.create({ data: payload });
  await logLeadActivity(lead.id, "CREATED", `Lead captured from ${payload.source}.`);
  try {
    await notifyAdmins({
      type: "LEAD_NEW",
      entityType: "LEAD",
      entityId: lead.id,
      title: "New lead received",
      message: `${lead.name} submitted a new lead via ${payload.source}.`
    });
  } catch (error) {
    console.error("[Lead] Failed to notify admins of new lead:", error);
  }
  return lead;
};
var getAllLeadsFromDB = async (query) => {
  const queryBuilder = new QueryBuilder(leadDelegate, leadQueryConfig);
  return queryBuilder.execute(query);
};
var getLeadByIdFromDB = async (id) => {
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      service: true,
      client: true,
      assignedStaff: true,
      notes: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
      consultations: true,
      proposals: { select: { id: true, proposalNumber: true, title: true, status: true, total: true } }
    }
  });
  if (!lead) {
    throw new appError_default(StatusCodes25.NOT_FOUND, "Lead not found.");
  }
  return lead;
};
var updateLeadInDB = async (id, payload, actorId) => {
  await assertLeadExists(id);
  if (payload.serviceId) {
    const service = await prisma.service.findUnique({ where: { id: payload.serviceId } });
    if (!service) {
      throw new appError_default(StatusCodes25.BAD_REQUEST, "The provided serviceId does not match any service.");
    }
  }
  const updated = await prisma.lead.update({ where: { id }, data: payload });
  await logLeadActivity(id, "UPDATED", "Lead details updated.", actorId);
  return updated;
};
var updateLeadStatusInDB = async (id, status, actorId) => {
  const existing = await assertLeadExists(id);
  const updated = await prisma.lead.update({ where: { id }, data: { status } });
  await logLeadActivity(id, "STATUS_CHANGED", `Status changed from ${existing.status} to ${status}.`, actorId);
  if (existing.assignedStaffId) {
    try {
      const staff = await prisma.staff.findUnique({ where: { id: existing.assignedStaffId }, select: { userId: true } });
      if (staff?.userId) {
        await createNotification({
          userId: staff.userId,
          type: "LEAD_STATUS_CHANGED",
          entityType: "LEAD",
          entityId: id,
          title: "Lead status updated",
          message: `${existing.name}'s lead status changed to ${status}.`
        });
      }
    } catch (error) {
      console.error("[Lead] Failed to notify staff of status change:", error);
    }
  }
  return updated;
};
var assignLeadToStaffInDB = async (id, staffId, actorId) => {
  const lead = await assertLeadExists(id);
  let staff = null;
  if (staffId) {
    staff = await prisma.staff.findUnique({ where: { id: staffId }, select: { id: true, userId: true } });
    if (!staff) {
      throw new appError_default(StatusCodes25.BAD_REQUEST, "The provided staffId does not match any staff member.");
    }
  }
  const updated = await prisma.lead.update({ where: { id }, data: { assignedStaffId: staffId } });
  await logLeadActivity(
    id,
    "ASSIGNED",
    staffId ? "Lead assigned to a staff member." : "Lead unassigned.",
    actorId
  );
  if (staff?.userId) {
    try {
      await createNotification({
        userId: staff.userId,
        type: "LEAD_ASSIGNED",
        entityType: "LEAD",
        entityId: id,
        title: "A lead was assigned to you",
        message: `You've been assigned to follow up with ${lead.name}.`
      });
    } catch (error) {
      console.error("[Lead] Failed to notify assigned staff:", error);
    }
  }
  return updated;
};
var addLeadNoteInDB = async (leadId, content, actorId) => {
  await assertLeadExists(leadId);
  const note = await prisma.leadNote.create({ data: { leadId, content } });
  await logLeadActivity(leadId, "NOTE_ADDED", "A note was added to this lead.", actorId);
  return note;
};
var getLeadNotesFromDB = async (leadId) => {
  await assertLeadExists(leadId);
  return prisma.leadNote.findMany({ where: { leadId }, orderBy: { createdAt: "desc" } });
};
var getLeadActivitiesFromDB = async (leadId) => {
  await assertLeadExists(leadId);
  return prisma.leadActivity.findMany({
    where: { leadId },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { id: true, name: true, email: true } } }
  });
};
var convertLeadToClientInDB = async (id, actorId) => {
  const lead = await assertLeadExists(id);
  if (lead.clientId) {
    throw new appError_default(StatusCodes25.CONFLICT, "This lead has already been converted to a client.");
  }
  const email = lead.email.toLowerCase();
  const existingClient = await prisma.client.findUnique({ where: { email } });
  const client = existingClient ? await prisma.client.update({
    where: { id: existingClient.id },
    data: {
      phone: existingClient.phone ?? lead.phone,
      company: existingClient.company ?? lead.company,
      website: existingClient.website ?? lead.website,
      location: existingClient.location ?? lead.location
    }
  }) : await prisma.client.create({
    data: {
      name: lead.name,
      email,
      phone: lead.phone,
      company: lead.company,
      website: lead.website,
      location: lead.location
    }
  });
  const updatedLead = await prisma.lead.update({
    where: { id },
    data: { clientId: client.id, status: "CONVERTED" }
  });
  await logLeadActivity(id, "CONVERTED", "Lead converted to a client.", actorId);
  return { lead: updatedLead, client };
};
var deleteLeadFromDB = async (id) => {
  await assertLeadExists(id);
  await prisma.lead.delete({ where: { id } });
};
var leadService = {
  createLeadInDB,
  getAllLeadsFromDB,
  getLeadByIdFromDB,
  updateLeadInDB,
  updateLeadStatusInDB,
  assignLeadToStaffInDB,
  addLeadNoteInDB,
  getLeadNotesFromDB,
  getLeadActivitiesFromDB,
  convertLeadToClientInDB,
  deleteLeadFromDB
};

// src/app/modules/lead/lead.controller.ts
var createLead = catchAsync(async (req, res) => {
  const lead = await leadService.createLeadInDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes26.CREATED,
    message: "Thank you! Your request has been received \u2014 we'll be in touch shortly.",
    data: lead
  });
});
var getAllLeads = catchAsync(async (req, res) => {
  const { data, meta } = await leadService.getAllLeadsFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes26.OK,
    message: "Leads retrieved successfully.",
    data,
    meta
  });
});
var getLeadById = catchAsync(async (req, res) => {
  const lead = await leadService.getLeadByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes26.OK,
    message: "Lead retrieved successfully.",
    data: lead
  });
});
var updateLead = catchAsync(async (req, res) => {
  const lead = await leadService.updateLeadInDB(req.params.id, req.body, req.user?.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes26.OK,
    message: "Lead updated successfully.",
    data: lead
  });
});
var updateLeadStatus = catchAsync(async (req, res) => {
  const lead = await leadService.updateLeadStatusInDB(req.params.id, req.body.status, req.user?.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes26.OK,
    message: "Lead status updated successfully.",
    data: lead
  });
});
var assignLead = catchAsync(async (req, res) => {
  const lead = await leadService.assignLeadToStaffInDB(req.params.id, req.body.staffId, req.user?.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes26.OK,
    message: "Lead assignment updated successfully.",
    data: lead
  });
});
var convertLeadToClient = catchAsync(async (req, res) => {
  const result = await leadService.convertLeadToClientInDB(req.params.id, req.user?.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes26.OK,
    message: "Lead converted to client successfully.",
    data: result
  });
});
var addLeadNote = catchAsync(async (req, res) => {
  const note = await leadService.addLeadNoteInDB(req.params.id, req.body.content, req.user?.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes26.CREATED,
    message: "Note added successfully.",
    data: note
  });
});
var getLeadNotes = catchAsync(async (req, res) => {
  const notes = await leadService.getLeadNotesFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes26.OK,
    message: "Notes retrieved successfully.",
    data: notes
  });
});
var getLeadActivities = catchAsync(async (req, res) => {
  const activities = await leadService.getLeadActivitiesFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes26.OK,
    message: "Activities retrieved successfully.",
    data: activities
  });
});
var deleteLead = catchAsync(async (req, res) => {
  await leadService.deleteLeadFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes26.OK,
    message: "Lead deleted successfully.",
    data: null
  });
});
var leadController = {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  updateLeadStatus,
  assignLead,
  convertLeadToClient,
  addLeadNote,
  getLeadNotes,
  getLeadActivities,
  deleteLead
};

// src/app/modules/lead/lead.routes.ts
var router8 = Router8();
router8.post("/", publicRateLimiter, validateRequest(createLeadValidation), leadController.createLead);
router8.get("/", requireAuth, requireRole("ADMIN", "STAFF"), leadController.getAllLeads);
router8.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), leadController.getLeadById);
router8.patch("/:id", requireAuth, requireRole("ADMIN", "STAFF"), validateRequest(updateLeadValidation), leadController.updateLead);
router8.patch(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateLeadStatusValidation),
  leadController.updateLeadStatus
);
router8.patch(
  "/:id/assign",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(assignLeadValidation),
  leadController.assignLead
);
router8.post("/:id/convert", requireAuth, requireRole("ADMIN", "STAFF"), leadController.convertLeadToClient);
router8.get("/:id/notes", requireAuth, requireRole("ADMIN", "STAFF"), leadController.getLeadNotes);
router8.post(
  "/:id/notes",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(addLeadNoteValidation),
  leadController.addLeadNote
);
router8.get("/:id/activities", requireAuth, requireRole("ADMIN", "STAFF"), leadController.getLeadActivities);
router8.delete("/:id", requireAuth, requireRole("ADMIN"), leadController.deleteLead);
var leadRoutes = router8;

// src/app/modules/consultation/consultation.routes.ts
import { Router as Router9 } from "express";

// src/app/modules/consultation/consultation.validation.ts
import { z as z9 } from "zod";
var consultationStatusEnum = z9.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]);
var createConsultationValidation = z9.object({
  leadId: z9.string().min(1, "leadId is required."),
  serviceId: z9.string().min(1).optional(),
  preferredDate: z9.coerce.date().optional(),
  preferredTime: z9.string().min(1).optional(),
  notes: z9.string().max(2e3).optional()
});
var updateConsultationValidation = z9.object({
  serviceId: z9.string().min(1).nullable().optional(),
  preferredDate: z9.coerce.date().nullable().optional(),
  preferredTime: z9.string().min(1).nullable().optional(),
  notes: z9.string().max(2e3).nullable().optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
var updateConsultationStatusValidation = z9.object({
  status: consultationStatusEnum
});
var assignConsultationValidation = z9.object({
  staffId: z9.string().min(1).nullable()
});

// src/app/modules/consultation/consultation.controller.ts
import { StatusCodes as StatusCodes28 } from "http-status-codes";

// src/app/modules/consultation/consultation.service.ts
import { StatusCodes as StatusCodes27 } from "http-status-codes";

// src/app/modules/consultation/consultation.constant.ts
var consultationQueryConfig = {
  filterableFields: {
    leadId: "string",
    serviceId: "string",
    assignedStaffId: "string",
    status: {
      type: "enum",
      enum: { PENDING: "PENDING", CONFIRMED: "CONFIRMED", COMPLETED: "COMPLETED", CANCELLED: "CANCELLED", NO_SHOW: "NO_SHOW" }
    },
    preferredDate: "date"
  },
  sortableFields: ["createdAt", "updatedAt", "preferredDate"],
  includableRelations: ["lead", "service", "assignedStaff"]
};

// src/app/modules/consultation/consultation.service.ts
var consultationDelegate = prisma.consultation;
var assertLeadExists2 = async (leadId) => {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    throw new appError_default(StatusCodes27.BAD_REQUEST, "The provided leadId does not match any lead.");
  }
};
var assertServiceExists2 = async (serviceId) => {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    throw new appError_default(StatusCodes27.BAD_REQUEST, "The provided serviceId does not match any service.");
  }
};
var assertConsultationExists = async (id) => {
  const consultation = await prisma.consultation.findUnique({ where: { id } });
  if (!consultation) {
    throw new appError_default(StatusCodes27.NOT_FOUND, "Consultation not found.");
  }
  return consultation;
};
var createConsultationInDB = async (payload) => {
  await assertLeadExists2(payload.leadId);
  if (payload.serviceId) {
    await assertServiceExists2(payload.serviceId);
  }
  const consultation = await prisma.consultation.create({ data: payload });
  await prisma.leadActivity.create({
    data: {
      leadId: payload.leadId,
      type: "MEETING_SCHEDULED",
      description: "A consultation was scheduled for this lead."
    }
  });
  return consultation;
};
var getAllConsultationsFromDB = async (query) => {
  const queryBuilder = new QueryBuilder(consultationDelegate, consultationQueryConfig);
  return queryBuilder.execute(query);
};
var getConsultationByIdFromDB = async (id) => {
  const consultation = await prisma.consultation.findUnique({
    where: { id },
    include: { lead: true, service: true, assignedStaff: true }
  });
  if (!consultation) {
    throw new appError_default(StatusCodes27.NOT_FOUND, "Consultation not found.");
  }
  return consultation;
};
var updateConsultationInDB = async (id, payload) => {
  await assertConsultationExists(id);
  if (payload.serviceId) {
    await assertServiceExists2(payload.serviceId);
  }
  return prisma.consultation.update({ where: { id }, data: payload });
};
var updateConsultationStatusInDB = async (id, status) => {
  await assertConsultationExists(id);
  return prisma.consultation.update({ where: { id }, data: { status } });
};
var assignConsultationToStaffInDB = async (id, staffId) => {
  await assertConsultationExists(id);
  let staff = null;
  if (staffId) {
    staff = await prisma.staff.findUnique({ where: { id: staffId }, select: { id: true, userId: true } });
    if (!staff) {
      throw new appError_default(StatusCodes27.BAD_REQUEST, "The provided staffId does not match any staff member.");
    }
  }
  const updated = await prisma.consultation.update({ where: { id }, data: { assignedStaffId: staffId } });
  if (staff?.userId) {
    try {
      await createNotification({
        userId: staff.userId,
        type: "CONSULTATION_SCHEDULED",
        entityType: "CONSULTATION",
        entityId: id,
        title: "Consultation assigned to you",
        message: "You've been assigned to handle a scheduled consultation."
      });
    } catch (error) {
      console.error("[Consultation] Failed to notify assigned staff:", error);
    }
  }
  return updated;
};
var deleteConsultationFromDB = async (id) => {
  await assertConsultationExists(id);
  await prisma.consultation.delete({ where: { id } });
};
var consultationService = {
  createConsultationInDB,
  getAllConsultationsFromDB,
  getConsultationByIdFromDB,
  updateConsultationInDB,
  updateConsultationStatusInDB,
  assignConsultationToStaffInDB,
  deleteConsultationFromDB
};

// src/app/modules/consultation/consultation.controller.ts
var createConsultation = catchAsync(async (req, res) => {
  const consultation = await consultationService.createConsultationInDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes28.CREATED,
    message: "Consultation scheduled successfully.",
    data: consultation
  });
});
var getAllConsultations = catchAsync(async (req, res) => {
  const { data, meta } = await consultationService.getAllConsultationsFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes28.OK,
    message: "Consultations retrieved successfully.",
    data,
    meta
  });
});
var getConsultationById = catchAsync(async (req, res) => {
  const consultation = await consultationService.getConsultationByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes28.OK,
    message: "Consultation retrieved successfully.",
    data: consultation
  });
});
var updateConsultation = catchAsync(async (req, res) => {
  const consultation = await consultationService.updateConsultationInDB(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes28.OK,
    message: "Consultation updated successfully.",
    data: consultation
  });
});
var updateConsultationStatus = catchAsync(async (req, res) => {
  const consultation = await consultationService.updateConsultationStatusInDB(req.params.id, req.body.status);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes28.OK,
    message: "Consultation status updated successfully.",
    data: consultation
  });
});
var assignConsultation = catchAsync(async (req, res) => {
  const consultation = await consultationService.assignConsultationToStaffInDB(req.params.id, req.body.staffId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes28.OK,
    message: "Consultation assignment updated successfully.",
    data: consultation
  });
});
var deleteConsultation = catchAsync(async (req, res) => {
  await consultationService.deleteConsultationFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes28.OK,
    message: "Consultation deleted successfully.",
    data: null
  });
});
var consultationController = {
  createConsultation,
  getAllConsultations,
  getConsultationById,
  updateConsultation,
  updateConsultationStatus,
  assignConsultation,
  deleteConsultation
};

// src/app/modules/consultation/consultation.routes.ts
var router9 = Router9();
router9.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(createConsultationValidation),
  consultationController.createConsultation
);
router9.get("/", requireAuth, requireRole("ADMIN", "STAFF"), consultationController.getAllConsultations);
router9.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), consultationController.getConsultationById);
router9.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateConsultationValidation),
  consultationController.updateConsultation
);
router9.patch(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateConsultationStatusValidation),
  consultationController.updateConsultationStatus
);
router9.patch(
  "/:id/assign",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(assignConsultationValidation),
  consultationController.assignConsultation
);
router9.delete("/:id", requireAuth, requireRole("ADMIN"), consultationController.deleteConsultation);
var consultationRoutes = router9;

// src/app/modules/proposal/proposal.routes.ts
import { Router as Router10 } from "express";

// src/app/modules/proposal/proposal.validation.ts
import { z as z10 } from "zod";
var proposalItemValidation = z10.object({
  serviceId: z10.string().min(1).optional(),
  pricingPlanId: z10.string().min(1).optional(),
  title: z10.string().min(1, "Item title is required.").max(200),
  description: z10.string().max(2e3).optional(),
  quantity: z10.coerce.number().int().positive().default(1),
  unitPrice: z10.coerce.number().nonnegative("Unit price cannot be negative.")
});
var createProposalValidation = z10.object({
  leadId: z10.string().min(1).optional(),
  clientId: z10.string().min(1).optional(),
  projectId: z10.string().min(1).optional(),
  title: z10.string().min(1, "Title is required.").max(200),
  introduction: z10.string().max(5e3).optional(),
  terms: z10.string().max(5e3).optional(),
  notes: z10.string().max(3e3).optional(),
  discount: z10.coerce.number().nonnegative().default(0),
  tax: z10.coerce.number().nonnegative().default(0),
  currency: z10.string().length(3).default("USD"),
  validUntil: z10.coerce.date().optional(),
  items: z10.array(proposalItemValidation).min(1, "At least one line item is required.")
});
var updateProposalValidation = z10.object({
  leadId: z10.string().min(1).nullable().optional(),
  clientId: z10.string().min(1).nullable().optional(),
  projectId: z10.string().min(1).nullable().optional(),
  title: z10.string().min(1).max(200).optional(),
  introduction: z10.string().max(5e3).nullable().optional(),
  terms: z10.string().max(5e3).nullable().optional(),
  notes: z10.string().max(3e3).nullable().optional(),
  discount: z10.coerce.number().nonnegative().optional(),
  tax: z10.coerce.number().nonnegative().optional(),
  currency: z10.string().length(3).optional(),
  validUntil: z10.coerce.date().nullable().optional(),
  items: z10.array(proposalItemValidation).min(1).optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

// src/app/modules/proposal/proposal.controller.ts
import { StatusCodes as StatusCodes30 } from "http-status-codes";

// src/app/modules/proposal/proposal.service.ts
import { StatusCodes as StatusCodes29 } from "http-status-codes";

// src/app/modules/proposal/proposal.constant.ts
var proposalQueryConfig = {
  searchableFields: ["title", "proposalNumber"],
  filterableFields: {
    proposalNumber: "string",
    title: "string",
    leadId: "string",
    clientId: "string",
    projectId: "string",
    createdById: "string",
    status: {
      type: "enum",
      enum: { DRAFT: "DRAFT", SENT: "SENT", VIEWED: "VIEWED", ACCEPTED: "ACCEPTED", REJECTED: "REJECTED", EXPIRED: "EXPIRED" }
    },
    validUntil: "date"
  },
  sortableFields: ["createdAt", "updatedAt", "validUntil", "total", "proposalNumber"],
  includableRelations: ["lead", "client", "project", "createdBy", "items"],
  defaultSortField: "createdAt"
};

// src/app/modules/proposal/proposal.service.ts
var proposalDelegate = prisma.proposal;
var assertReferencesExist = async (payload) => {
  if (payload.leadId) {
    const lead = await prisma.lead.findUnique({ where: { id: payload.leadId } });
    if (!lead) throw new appError_default(StatusCodes29.BAD_REQUEST, "The provided leadId does not match any lead.");
  }
  if (payload.clientId) {
    const client = await prisma.client.findUnique({ where: { id: payload.clientId } });
    if (!client) throw new appError_default(StatusCodes29.BAD_REQUEST, "The provided clientId does not match any client.");
  }
  if (payload.projectId) {
    const project = await prisma.project.findUnique({ where: { id: payload.projectId } });
    if (!project) throw new appError_default(StatusCodes29.BAD_REQUEST, "The provided projectId does not match any project.");
  }
};
var buildItemsData = (items) => {
  let subtotal = new prismaNamespace_exports.Decimal(0);
  const data = items.map((item) => {
    const unitPrice = new prismaNamespace_exports.Decimal(item.unitPrice);
    const total = unitPrice.times(item.quantity);
    subtotal = subtotal.plus(total);
    return {
      ...item.serviceId !== void 0 && { serviceId: item.serviceId },
      ...item.pricingPlanId !== void 0 && { pricingPlanId: item.pricingPlanId },
      title: item.title,
      ...item.description !== void 0 && { description: item.description },
      quantity: item.quantity,
      unitPrice,
      total
    };
  });
  return { data, subtotal };
};
var generateProposalNumber = async () => {
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await prisma.proposal.count({ where: { proposalNumber: { startsWith: `PRO-${year}-` } } });
    const sequence = String(count + 1 + attempt).padStart(4, "0");
    const candidate = `PRO-${year}-${sequence}`;
    const existing = await prisma.proposal.findUnique({ where: { proposalNumber: candidate } });
    if (!existing) return candidate;
  }
  throw new appError_default(StatusCodes29.INTERNAL_SERVER_ERROR, "Failed to generate a unique proposal number. Please try again.");
};
var assertProposalExists = async (id) => {
  const proposal = await prisma.proposal.findUnique({ where: { id } });
  if (!proposal) {
    throw new appError_default(StatusCodes29.NOT_FOUND, "Proposal not found.");
  }
  return proposal;
};
var assertIsDraft = (proposal) => {
  if (proposal.status !== "DRAFT") {
    throw new appError_default(StatusCodes29.BAD_REQUEST, "Only proposals in DRAFT status can be modified or deleted.");
  }
};
var createProposalInDB = async (payload, createdById) => {
  await assertReferencesExist(payload);
  const { data: itemsData, subtotal } = buildItemsData(payload.items);
  const discount = new prismaNamespace_exports.Decimal(payload.discount);
  const tax = new prismaNamespace_exports.Decimal(payload.tax);
  const total = subtotal.minus(discount).plus(tax);
  const proposalNumber = await generateProposalNumber();
  return prisma.proposal.create({
    data: {
      ...payload.leadId !== void 0 && { leadId: payload.leadId },
      ...payload.clientId !== void 0 && { clientId: payload.clientId },
      ...payload.projectId !== void 0 && { projectId: payload.projectId },
      proposalNumber,
      title: payload.title,
      ...payload.introduction !== void 0 && { introduction: payload.introduction },
      ...payload.terms !== void 0 && { terms: payload.terms },
      ...payload.notes !== void 0 && { notes: payload.notes },
      subtotal,
      discount,
      tax,
      total,
      currency: payload.currency,
      ...payload.validUntil !== void 0 && { validUntil: payload.validUntil },
      createdById,
      items: { create: itemsData }
    },
    include: { items: true }
  });
};
var getAllProposalsFromDB = async (query) => {
  const queryBuilder = new QueryBuilder(proposalDelegate, proposalQueryConfig);
  return queryBuilder.execute(query);
};
var getProposalByIdFromDB = async (id) => {
  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      items: { include: { service: true, pricingPlan: true } },
      lead: true,
      client: true,
      project: true,
      createdBy: { select: { id: true, name: true, email: true } },
      payments: { orderBy: { createdAt: "desc" } }
    }
  });
  if (!proposal) {
    throw new appError_default(StatusCodes29.NOT_FOUND, "Proposal not found.");
  }
  return proposal;
};
var updateProposalInDB = async (id, payload) => {
  const existing = await assertProposalExists(id);
  assertIsDraft(existing);
  await assertReferencesExist(payload);
  let subtotal = existing.subtotal;
  let itemsUpdate;
  if (payload.items) {
    const built = buildItemsData(payload.items);
    subtotal = built.subtotal;
    itemsUpdate = { deleteMany: {}, create: built.data };
  }
  const discount = payload.discount !== void 0 ? new prismaNamespace_exports.Decimal(payload.discount) : existing.discount;
  const tax = payload.tax !== void 0 ? new prismaNamespace_exports.Decimal(payload.tax) : existing.tax;
  const total = subtotal.minus(discount).plus(tax);
  return prisma.proposal.update({
    where: { id },
    data: {
      ...payload.leadId !== void 0 && { leadId: payload.leadId },
      ...payload.clientId !== void 0 && { clientId: payload.clientId },
      ...payload.projectId !== void 0 && { projectId: payload.projectId },
      ...payload.title !== void 0 && { title: payload.title },
      ...payload.introduction !== void 0 && { introduction: payload.introduction },
      ...payload.terms !== void 0 && { terms: payload.terms },
      ...payload.notes !== void 0 && { notes: payload.notes },
      ...payload.currency !== void 0 && { currency: payload.currency },
      ...payload.validUntil !== void 0 && { validUntil: payload.validUntil },
      subtotal,
      discount,
      tax,
      total,
      ...itemsUpdate && { items: itemsUpdate }
    },
    include: { items: true }
  });
};
var sendProposalInDB = async (id) => {
  const existing = await assertProposalExists(id);
  if (existing.status !== "DRAFT") {
    throw new appError_default(StatusCodes29.BAD_REQUEST, "Only a DRAFT proposal can be sent.");
  }
  const updated = await prisma.proposal.update({ where: { id }, data: { status: "SENT", sentAt: /* @__PURE__ */ new Date() } });
  if (existing.clientId) {
    try {
      const client = await prisma.client.findUnique({ where: { id: existing.clientId }, select: { userId: true } });
      if (client?.userId) {
        await createNotification({
          userId: client.userId,
          type: "PROPOSAL_SENT",
          entityType: "PROPOSAL",
          entityId: id,
          title: "New proposal received",
          message: `A new proposal "${existing.title}" (${existing.proposalNumber}) has been sent to you.`
        });
      }
    } catch (error) {
      console.error("[Proposal] Failed to notify client of sent proposal:", error);
    }
  }
  return updated;
};
var markProposalViewedInDB = async (id) => {
  const existing = await assertProposalExists(id);
  if (existing.status !== "SENT") {
    throw new appError_default(StatusCodes29.BAD_REQUEST, "Only a SENT proposal can be marked as viewed.");
  }
  return prisma.proposal.update({ where: { id }, data: { status: "VIEWED", viewedAt: /* @__PURE__ */ new Date() } });
};
var acceptProposalInDB = async (id) => {
  const existing = await assertProposalExists(id);
  if (existing.status !== "SENT" && existing.status !== "VIEWED") {
    throw new appError_default(StatusCodes29.BAD_REQUEST, "Only a SENT or VIEWED proposal can be accepted.");
  }
  const updated = await prisma.proposal.update({ where: { id }, data: { status: "ACCEPTED", acceptedAt: /* @__PURE__ */ new Date() } });
  try {
    await createNotification({
      userId: existing.createdById,
      type: "PROPOSAL_ACCEPTED",
      entityType: "PROPOSAL",
      entityId: id,
      title: "Proposal accepted! \u{1F389}",
      message: `Your proposal "${existing.title}" (${existing.proposalNumber}) was accepted.`
    });
  } catch (error) {
    console.error("[Proposal] Failed to notify creator of acceptance:", error);
  }
  return updated;
};
var rejectProposalInDB = async (id) => {
  const existing = await assertProposalExists(id);
  if (existing.status !== "SENT" && existing.status !== "VIEWED") {
    throw new appError_default(StatusCodes29.BAD_REQUEST, "Only a SENT or VIEWED proposal can be rejected.");
  }
  const updated = await prisma.proposal.update({ where: { id }, data: { status: "REJECTED", rejectedAt: /* @__PURE__ */ new Date() } });
  try {
    await createNotification({
      userId: existing.createdById,
      type: "PROPOSAL_REJECTED",
      entityType: "PROPOSAL",
      entityId: id,
      title: "Proposal rejected",
      message: `Your proposal "${existing.title}" (${existing.proposalNumber}) was rejected.`
    });
  } catch (error) {
    console.error("[Proposal] Failed to notify creator of rejection:", error);
  }
  return updated;
};
var deleteProposalFromDB = async (id) => {
  const existing = await assertProposalExists(id);
  assertIsDraft(existing);
  await prisma.proposal.delete({ where: { id } });
};
var proposalService = {
  createProposalInDB,
  getAllProposalsFromDB,
  getProposalByIdFromDB,
  updateProposalInDB,
  sendProposalInDB,
  markProposalViewedInDB,
  acceptProposalInDB,
  rejectProposalInDB,
  deleteProposalFromDB
};

// src/app/modules/proposal/proposal.controller.ts
var createProposal = catchAsync(async (req, res) => {
  const proposal = await proposalService.createProposalInDB(req.body, req.user?.id ?? "");
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes30.CREATED,
    message: "Proposal created successfully.",
    data: proposal
  });
});
var getAllProposals = catchAsync(async (req, res) => {
  const { data, meta } = await proposalService.getAllProposalsFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes30.OK,
    message: "Proposals retrieved successfully.",
    data,
    meta
  });
});
var getProposalById = catchAsync(async (req, res) => {
  const proposal = await proposalService.getProposalByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes30.OK,
    message: "Proposal retrieved successfully.",
    data: proposal
  });
});
var updateProposal = catchAsync(async (req, res) => {
  const proposal = await proposalService.updateProposalInDB(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes30.OK,
    message: "Proposal updated successfully.",
    data: proposal
  });
});
var sendProposal = catchAsync(async (req, res) => {
  const proposal = await proposalService.sendProposalInDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes30.OK,
    message: "Proposal sent successfully.",
    data: proposal
  });
});
var markProposalViewed = catchAsync(async (req, res) => {
  const proposal = await proposalService.markProposalViewedInDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes30.OK,
    message: "Proposal marked as viewed.",
    data: proposal
  });
});
var acceptProposal = catchAsync(async (req, res) => {
  const proposal = await proposalService.acceptProposalInDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes30.OK,
    message: "Proposal accepted.",
    data: proposal
  });
});
var rejectProposal = catchAsync(async (req, res) => {
  const proposal = await proposalService.rejectProposalInDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes30.OK,
    message: "Proposal rejected.",
    data: proposal
  });
});
var deleteProposal = catchAsync(async (req, res) => {
  await proposalService.deleteProposalFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes30.OK,
    message: "Proposal deleted successfully.",
    data: null
  });
});
var proposalController = {
  createProposal,
  getAllProposals,
  getProposalById,
  updateProposal,
  sendProposal,
  markProposalViewed,
  acceptProposal,
  rejectProposal,
  deleteProposal
};

// src/app/modules/proposal/proposal.routes.ts
var router10 = Router10();
router10.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(createProposalValidation),
  proposalController.createProposal
);
router10.get("/", requireAuth, requireRole("ADMIN", "STAFF"), proposalController.getAllProposals);
router10.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), proposalController.getProposalById);
router10.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateProposalValidation),
  proposalController.updateProposal
);
router10.post("/:id/send", requireAuth, requireRole("ADMIN", "STAFF"), proposalController.sendProposal);
router10.post("/:id/mark-viewed", requireAuth, requireRole("ADMIN", "STAFF"), proposalController.markProposalViewed);
router10.post("/:id/accept", requireAuth, requireRole("ADMIN", "STAFF"), proposalController.acceptProposal);
router10.post("/:id/reject", requireAuth, requireRole("ADMIN", "STAFF"), proposalController.rejectProposal);
router10.delete("/:id", requireAuth, requireRole("ADMIN"), proposalController.deleteProposal);
var proposalRoutes = router10;

// src/app/modules/project/project.routes.ts
import { Router as Router11 } from "express";

// src/app/modules/project/project.validation.ts
import { z as z11 } from "zod";
var slugPattern3 = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var slugField3 = z11.string().min(1, "Slug is required.").max(150).regex(slugPattern3, "Slug must be lowercase, alphanumeric, and hyphen-separated.");
var projectTypeEnum = z11.enum(["CLIENT_PROJECT", "INTERNAL_PROJECT", "RESEARCH", "MAINTENANCE"]);
var projectStatusEnum = z11.enum(["PLANNING", "IN_PROGRESS", "ON_HOLD", "REVIEW", "COMPLETED", "CANCELLED"]);
var createProjectValidation = z11.object({
  clientId: z11.string().min(1).optional(),
  serviceId: z11.string().min(1).optional(),
  name: z11.string().min(1, "Name is required.").max(200),
  slug: slugField3,
  projectType: projectTypeEnum.default("CLIENT_PROJECT"),
  description: z11.string().max(5e3).optional(),
  budget: z11.coerce.number().nonnegative().optional(),
  currency: z11.string().length(3).default("USD"),
  startDate: z11.coerce.date().optional(),
  deadline: z11.coerce.date().optional()
});
var updateProjectValidation = z11.object({
  clientId: z11.string().min(1).nullable().optional(),
  serviceId: z11.string().min(1).nullable().optional(),
  name: z11.string().min(1).max(200).optional(),
  slug: slugField3.optional(),
  projectType: projectTypeEnum.optional(),
  description: z11.string().max(5e3).nullable().optional(),
  budget: z11.coerce.number().nonnegative().nullable().optional(),
  currency: z11.string().length(3).optional(),
  startDate: z11.coerce.date().nullable().optional(),
  deadline: z11.coerce.date().nullable().optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
var updateProjectStatusValidation = z11.object({
  status: projectStatusEnum
});
var updateProjectProgressValidation = z11.object({
  progress: z11.coerce.number().int().min(0, "Progress cannot be below 0.").max(100, "Progress cannot exceed 100.")
});

// src/app/modules/project/project.controller.ts
import { StatusCodes as StatusCodes32 } from "http-status-codes";

// src/app/modules/project/project.service.ts
import { StatusCodes as StatusCodes31 } from "http-status-codes";

// src/app/modules/project/project.constant.ts
var projectQueryConfig = {
  searchableFields: ["name", "description"],
  filterableFields: {
    name: "string",
    slug: "string",
    clientId: "string",
    serviceId: "string",
    projectType: {
      type: "enum",
      enum: {
        CLIENT_PROJECT: "CLIENT_PROJECT",
        INTERNAL_PROJECT: "INTERNAL_PROJECT",
        RESEARCH: "RESEARCH",
        MAINTENANCE: "MAINTENANCE"
      }
    },
    status: {
      type: "enum",
      enum: {
        PLANNING: "PLANNING",
        IN_PROGRESS: "IN_PROGRESS",
        ON_HOLD: "ON_HOLD",
        REVIEW: "REVIEW",
        COMPLETED: "COMPLETED",
        CANCELLED: "CANCELLED"
      }
    },
    deadline: "date"
  },
  sortableFields: ["createdAt", "updatedAt", "deadline", "startDate", "name", "progress"],
  includableRelations: ["client", "service", "members", "milestones", "tasks", "files"],
  defaultSortField: "createdAt"
};

// src/app/modules/project/project.service.ts
var projectDelegate = prisma.project;
var assertClientExists = async (clientId) => {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    throw new appError_default(
      StatusCodes31.BAD_REQUEST,
      "The provided clientId does not match any client."
    );
  }
};
var assertProjectExists = async (id) => {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    throw new appError_default(StatusCodes31.NOT_FOUND, "Project not found.");
  }
  return project;
};
var toPrismaData3 = (payload) => ({
  ...payload,
  ...payload.budget !== void 0 && {
    budget: payload.budget === null ? null : new prismaNamespace_exports.Decimal(payload.budget)
  }
});
var createProjectInDB = async (payload) => {
  if (payload.clientId) {
    await assertClientExists(payload.clientId);
  }
  return prisma.project.create({
    data: toPrismaData3(payload)
  });
};
var getAllProjectsFromDB = async (query) => {
  const queryBuilder = new QueryBuilder(
    projectDelegate,
    projectQueryConfig
  );
  return queryBuilder.execute(query);
};
var getProjectByIdFromDB = async (id) => {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      members: { include: { staff: true } },
      milestones: { orderBy: { order: "asc" } },
      tasks: { orderBy: { createdAt: "desc" } },
      files: { orderBy: { createdAt: "desc" } }
    }
  });
  if (!project) {
    throw new appError_default(StatusCodes31.NOT_FOUND, "Project not found.");
  }
  return project;
};
var updateProjectInDB = async (id, payload) => {
  await assertProjectExists(id);
  if (payload.clientId) {
    await assertClientExists(payload.clientId);
  }
  return prisma.project.update({
    where: { id },
    data: toPrismaData3(payload)
  });
};
var updateProjectStatusInDB = async (id, status) => {
  const existing = await assertProjectExists(id);
  const completedAt = status === "COMPLETED" ? /* @__PURE__ */ new Date() : existing.status === "COMPLETED" ? null : existing.completedAt;
  return prisma.project.update({
    where: { id },
    data: { status, completedAt }
  });
};
var updateProjectProgressInDB = async (id, progress) => {
  await assertProjectExists(id);
  return prisma.project.update({ where: { id }, data: { progress } });
};
var deleteProjectFromDB = async (id) => {
  await assertProjectExists(id);
  await prisma.project.delete({ where: { id } });
};
var projectService = {
  createProjectInDB,
  getAllProjectsFromDB,
  getProjectByIdFromDB,
  updateProjectInDB,
  updateProjectStatusInDB,
  updateProjectProgressInDB,
  deleteProjectFromDB
};

// src/app/modules/project/project.controller.ts
var createProject = catchAsync(async (req, res) => {
  const project = await projectService.createProjectInDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes32.CREATED,
    message: "Project created successfully.",
    data: project
  });
});
var getAllProjects = catchAsync(async (req, res) => {
  const { data, meta } = await projectService.getAllProjectsFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes32.OK,
    message: "Projects retrieved successfully.",
    data,
    meta
  });
});
var getProjectById = catchAsync(async (req, res) => {
  const project = await projectService.getProjectByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes32.OK,
    message: "Project retrieved successfully.",
    data: project
  });
});
var updateProject = catchAsync(async (req, res) => {
  const project = await projectService.updateProjectInDB(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes32.OK,
    message: "Project updated successfully.",
    data: project
  });
});
var updateProjectStatus = catchAsync(async (req, res) => {
  const project = await projectService.updateProjectStatusInDB(req.params.id, req.body.status);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes32.OK,
    message: "Project status updated successfully.",
    data: project
  });
});
var updateProjectProgress = catchAsync(async (req, res) => {
  const project = await projectService.updateProjectProgressInDB(req.params.id, req.body.progress);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes32.OK,
    message: "Project progress updated successfully.",
    data: project
  });
});
var deleteProject = catchAsync(async (req, res) => {
  await projectService.deleteProjectFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes32.OK,
    message: "Project deleted successfully.",
    data: null
  });
});
var projectController = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  updateProjectStatus,
  updateProjectProgress,
  deleteProject
};

// src/app/modules/project/project.routes.ts
var router11 = Router11();
router11.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(createProjectValidation),
  projectController.createProject
);
router11.get("/", requireAuth, requireRole("ADMIN", "STAFF"), projectController.getAllProjects);
router11.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), projectController.getProjectById);
router11.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateProjectValidation),
  projectController.updateProject
);
router11.patch(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateProjectStatusValidation),
  projectController.updateProjectStatus
);
router11.patch(
  "/:id/progress",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateProjectProgressValidation),
  projectController.updateProjectProgress
);
router11.delete("/:id", requireAuth, requireRole("ADMIN"), projectController.deleteProject);
var projectRoutes = router11;

// src/app/modules/projectMember/projectMember.routes.ts
import { Router as Router12 } from "express";

// src/app/modules/projectMember/projectMember.validation.ts
import { z as z12 } from "zod";
var projectMemberRoleEnum = z12.enum(["LEAD", "MEMBER", "REVIEWER", "OBSERVER"]);
var addProjectMemberValidation = z12.object({
  projectId: z12.string().min(1, "projectId is required."),
  staffId: z12.string().min(1, "staffId is required."),
  role: projectMemberRoleEnum.default("MEMBER")
});
var updateProjectMemberRoleValidation = z12.object({
  role: projectMemberRoleEnum
});

// src/app/modules/projectMember/projectMember.controller.ts
import { StatusCodes as StatusCodes34 } from "http-status-codes";

// src/app/modules/projectMember/projectMember.service.ts
import { StatusCodes as StatusCodes33 } from "http-status-codes";

// src/app/modules/projectMember/projectMember.constant.ts
var projectMemberQueryConfig = {
  filterableFields: {
    projectId: "string",
    staffId: "string",
    role: { type: "enum", enum: { LEAD: "LEAD", MEMBER: "MEMBER", REVIEWER: "REVIEWER", OBSERVER: "OBSERVER" } }
  },
  sortableFields: ["createdAt"],
  includableRelations: ["project", "staff"],
  defaultSortField: "createdAt"
};

// src/app/modules/projectMember/projectMember.service.ts
var projectMemberDelegate = prisma.projectMember;
var addProjectMemberInDB = async (payload) => {
  const project = await prisma.project.findUnique({ where: { id: payload.projectId } });
  if (!project) {
    throw new appError_default(StatusCodes33.BAD_REQUEST, "The provided projectId does not match any project.");
  }
  const staff = await prisma.staff.findUnique({ where: { id: payload.staffId } });
  if (!staff) {
    throw new appError_default(StatusCodes33.BAD_REQUEST, "The provided staffId does not match any staff member.");
  }
  const existing = await prisma.projectMember.findUnique({
    where: { projectId_staffId: { projectId: payload.projectId, staffId: payload.staffId } }
  });
  if (existing) {
    throw new appError_default(StatusCodes33.CONFLICT, "This staff member is already on the project.");
  }
  return prisma.projectMember.create({ data: payload });
};
var getAllProjectMembersFromDB = async (query) => {
  const queryBuilder = new QueryBuilder(projectMemberDelegate, projectMemberQueryConfig);
  return queryBuilder.execute(query);
};
var getProjectMemberByIdFromDB = async (id) => {
  const member = await prisma.projectMember.findUnique({ where: { id }, include: { project: true, staff: true } });
  if (!member) {
    throw new appError_default(StatusCodes33.NOT_FOUND, "Project member not found.");
  }
  return member;
};
var updateProjectMemberRoleInDB = async (id, role) => {
  const existing = await prisma.projectMember.findUnique({ where: { id } });
  if (!existing) {
    throw new appError_default(StatusCodes33.NOT_FOUND, "Project member not found.");
  }
  return prisma.projectMember.update({ where: { id }, data: { role } });
};
var removeProjectMemberFromDB = async (id) => {
  const existing = await prisma.projectMember.findUnique({ where: { id } });
  if (!existing) {
    throw new appError_default(StatusCodes33.NOT_FOUND, "Project member not found.");
  }
  await prisma.projectMember.delete({ where: { id } });
};
var projectMemberService = {
  addProjectMemberInDB,
  getAllProjectMembersFromDB,
  getProjectMemberByIdFromDB,
  updateProjectMemberRoleInDB,
  removeProjectMemberFromDB
};

// src/app/modules/projectMember/projectMember.controller.ts
var addProjectMember = catchAsync(async (req, res) => {
  const member = await projectMemberService.addProjectMemberInDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes34.CREATED,
    message: "Member added to project successfully.",
    data: member
  });
});
var getAllProjectMembers = catchAsync(async (req, res) => {
  const { data, meta } = await projectMemberService.getAllProjectMembersFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes34.OK,
    message: "Project members retrieved successfully.",
    data,
    meta
  });
});
var getProjectMemberById = catchAsync(async (req, res) => {
  const member = await projectMemberService.getProjectMemberByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes34.OK,
    message: "Project member retrieved successfully.",
    data: member
  });
});
var updateProjectMemberRole = catchAsync(async (req, res) => {
  const member = await projectMemberService.updateProjectMemberRoleInDB(req.params.id, req.body.role);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes34.OK,
    message: "Project member role updated successfully.",
    data: member
  });
});
var removeProjectMember = catchAsync(async (req, res) => {
  await projectMemberService.removeProjectMemberFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes34.OK,
    message: "Member removed from project successfully.",
    data: null
  });
});
var projectMemberController = {
  addProjectMember,
  getAllProjectMembers,
  getProjectMemberById,
  updateProjectMemberRole,
  removeProjectMember
};

// src/app/modules/projectMember/projectMember.routes.ts
var router12 = Router12();
router12.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(addProjectMemberValidation),
  projectMemberController.addProjectMember
);
router12.get("/", requireAuth, requireRole("ADMIN", "STAFF"), projectMemberController.getAllProjectMembers);
router12.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), projectMemberController.getProjectMemberById);
router12.patch(
  "/:id/role",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateProjectMemberRoleValidation),
  projectMemberController.updateProjectMemberRole
);
router12.delete("/:id", requireAuth, requireRole("ADMIN", "STAFF"), projectMemberController.removeProjectMember);
var projectMemberRoutes = router12;

// src/app/modules/projectMilestone/projectMilestone.routes.ts
import { Router as Router13 } from "express";

// src/app/modules/projectMilestone/projectMilestone.validation.ts
import { z as z13 } from "zod";
var milestoneStatusEnum = z13.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"]);
var createMilestoneValidation = z13.object({
  projectId: z13.string().min(1, "projectId is required."),
  title: z13.string().min(1, "Title is required.").max(200),
  description: z13.string().max(3e3).optional(),
  startDate: z13.coerce.date().optional(),
  dueDate: z13.coerce.date().optional(),
  order: z13.coerce.number().int().default(0)
});
var updateMilestoneValidation = z13.object({
  title: z13.string().min(1).max(200).optional(),
  description: z13.string().max(3e3).nullable().optional(),
  startDate: z13.coerce.date().nullable().optional(),
  dueDate: z13.coerce.date().nullable().optional(),
  order: z13.coerce.number().int().optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
var updateMilestoneStatusValidation = z13.object({
  status: milestoneStatusEnum
});

// src/app/modules/projectMilestone/projectMilestone.controller.ts
import { StatusCodes as StatusCodes36 } from "http-status-codes";

// src/app/modules/projectMilestone/projectMilestone.service.ts
import { StatusCodes as StatusCodes35 } from "http-status-codes";

// src/app/modules/projectMilestone/projectMilestone.constant.ts
var projectMilestoneQueryConfig = {
  searchableFields: ["title", "description"],
  filterableFields: {
    projectId: "string",
    status: { type: "enum", enum: { PENDING: "PENDING", IN_PROGRESS: "IN_PROGRESS", COMPLETED: "COMPLETED", BLOCKED: "BLOCKED" } },
    dueDate: "date"
  },
  sortableFields: ["order", "createdAt", "dueDate", "startDate"],
  includableRelations: ["project", "tasks"]
};

// src/app/modules/projectMilestone/projectMilestone.service.ts
var milestoneDelegate = prisma.projectMilestone;
var assertProjectExists2 = async (projectId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new appError_default(StatusCodes35.BAD_REQUEST, "The provided projectId does not match any project.");
  }
};
var assertMilestoneExists = async (id) => {
  const milestone = await prisma.projectMilestone.findUnique({ where: { id } });
  if (!milestone) {
    throw new appError_default(StatusCodes35.NOT_FOUND, "Milestone not found.");
  }
  return milestone;
};
var createMilestoneInDB = async (payload) => {
  await assertProjectExists2(payload.projectId);
  return prisma.projectMilestone.create({ data: payload });
};
var getAllMilestonesFromDB = async (query) => {
  const effectiveQuery = { ...query };
  if (!effectiveQuery.sort && !effectiveQuery.sortBy) {
    effectiveQuery.sortBy = "order";
    effectiveQuery.sortOrder = "asc";
  }
  const queryBuilder = new QueryBuilder(milestoneDelegate, projectMilestoneQueryConfig);
  return queryBuilder.execute(effectiveQuery);
};
var getMilestoneByIdFromDB = async (id) => {
  const milestone = await prisma.projectMilestone.findUnique({
    where: { id },
    include: { project: true, tasks: { orderBy: { createdAt: "desc" } } }
  });
  if (!milestone) {
    throw new appError_default(StatusCodes35.NOT_FOUND, "Milestone not found.");
  }
  return milestone;
};
var updateMilestoneInDB = async (id, payload) => {
  await assertMilestoneExists(id);
  return prisma.projectMilestone.update({ where: { id }, data: payload });
};
var updateMilestoneStatusInDB = async (id, status) => {
  const existing = await assertMilestoneExists(id);
  const completedAt = status === "COMPLETED" ? /* @__PURE__ */ new Date() : existing.status === "COMPLETED" ? null : existing.completedAt;
  return prisma.projectMilestone.update({ where: { id }, data: { status, completedAt } });
};
var deleteMilestoneFromDB = async (id) => {
  await assertMilestoneExists(id);
  await prisma.projectMilestone.delete({ where: { id } });
};
var projectMilestoneService = {
  createMilestoneInDB,
  getAllMilestonesFromDB,
  getMilestoneByIdFromDB,
  updateMilestoneInDB,
  updateMilestoneStatusInDB,
  deleteMilestoneFromDB
};

// src/app/modules/projectMilestone/projectMilestone.controller.ts
var createMilestone = catchAsync(async (req, res) => {
  const milestone = await projectMilestoneService.createMilestoneInDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes36.CREATED,
    message: "Milestone created successfully.",
    data: milestone
  });
});
var getAllMilestones = catchAsync(async (req, res) => {
  const { data, meta } = await projectMilestoneService.getAllMilestonesFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes36.OK,
    message: "Milestones retrieved successfully.",
    data,
    meta
  });
});
var getMilestoneById = catchAsync(async (req, res) => {
  const milestone = await projectMilestoneService.getMilestoneByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes36.OK,
    message: "Milestone retrieved successfully.",
    data: milestone
  });
});
var updateMilestone = catchAsync(async (req, res) => {
  const milestone = await projectMilestoneService.updateMilestoneInDB(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes36.OK,
    message: "Milestone updated successfully.",
    data: milestone
  });
});
var updateMilestoneStatus = catchAsync(async (req, res) => {
  const milestone = await projectMilestoneService.updateMilestoneStatusInDB(req.params.id, req.body.status);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes36.OK,
    message: "Milestone status updated successfully.",
    data: milestone
  });
});
var deleteMilestone = catchAsync(async (req, res) => {
  await projectMilestoneService.deleteMilestoneFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes36.OK,
    message: "Milestone deleted successfully.",
    data: null
  });
});
var projectMilestoneController = {
  createMilestone,
  getAllMilestones,
  getMilestoneById,
  updateMilestone,
  updateMilestoneStatus,
  deleteMilestone
};

// src/app/modules/projectMilestone/projectMilestone.routes.ts
var router13 = Router13();
router13.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(createMilestoneValidation),
  projectMilestoneController.createMilestone
);
router13.get("/", requireAuth, requireRole("ADMIN", "STAFF"), projectMilestoneController.getAllMilestones);
router13.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), projectMilestoneController.getMilestoneById);
router13.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateMilestoneValidation),
  projectMilestoneController.updateMilestone
);
router13.patch(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateMilestoneStatusValidation),
  projectMilestoneController.updateMilestoneStatus
);
router13.delete("/:id", requireAuth, requireRole("ADMIN", "STAFF"), projectMilestoneController.deleteMilestone);
var projectMilestoneRoutes = router13;

// src/app/modules/projectTask/projectTask.routes.ts
import { Router as Router14 } from "express";

// src/app/modules/projectTask/projectTask.validation.ts
import { z as z14 } from "zod";
var taskStatusEnum = z14.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "COMPLETED", "CANCELLED"]);
var taskPriorityEnum = z14.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
var createTaskValidation = z14.object({
  projectId: z14.string().min(1, "projectId is required."),
  milestoneId: z14.string().min(1).optional(),
  assignedStaffId: z14.string().min(1).optional(),
  title: z14.string().min(1, "Title is required.").max(200),
  description: z14.string().max(3e3).optional(),
  priority: taskPriorityEnum.default("MEDIUM"),
  dueDate: z14.coerce.date().optional()
});
var updateTaskValidation = z14.object({
  milestoneId: z14.string().min(1).nullable().optional(),
  assignedStaffId: z14.string().min(1).nullable().optional(),
  title: z14.string().min(1).max(200).optional(),
  description: z14.string().max(3e3).nullable().optional(),
  priority: taskPriorityEnum.optional(),
  dueDate: z14.coerce.date().nullable().optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
var updateTaskStatusValidation = z14.object({
  status: taskStatusEnum
});

// src/app/modules/projectTask/projectTask.controller.ts
import { StatusCodes as StatusCodes38 } from "http-status-codes";

// src/app/modules/projectTask/projectTask.service.ts
import { StatusCodes as StatusCodes37 } from "http-status-codes";

// src/app/modules/projectTask/projectTask.constant.ts
var projectTaskQueryConfig = {
  searchableFields: ["title", "description"],
  filterableFields: {
    projectId: "string",
    milestoneId: "string",
    assignedStaffId: "string",
    status: {
      type: "enum",
      enum: {
        TODO: "TODO",
        IN_PROGRESS: "IN_PROGRESS",
        IN_REVIEW: "IN_REVIEW",
        BLOCKED: "BLOCKED",
        COMPLETED: "COMPLETED",
        CANCELLED: "CANCELLED"
      }
    },
    priority: { type: "enum", enum: { LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH", URGENT: "URGENT" } },
    dueDate: "date"
  },
  sortableFields: ["createdAt", "updatedAt", "dueDate", "priority", "title"],
  includableRelations: ["project", "milestone", "assignedStaff"],
  defaultSortField: "createdAt"
};

// src/app/modules/projectTask/projectTask.service.ts
var taskDelegate = prisma.projectTask;
var assertProjectExists3 = async (projectId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new appError_default(StatusCodes37.BAD_REQUEST, "The provided projectId does not match any project.");
  }
};
var assertMilestoneBelongsToProject = async (milestoneId, projectId) => {
  const milestone = await prisma.projectMilestone.findUnique({ where: { id: milestoneId } });
  if (!milestone) {
    throw new appError_default(StatusCodes37.BAD_REQUEST, "The provided milestoneId does not match any milestone.");
  }
  if (milestone.projectId !== projectId) {
    throw new appError_default(StatusCodes37.BAD_REQUEST, "The provided milestone does not belong to this task's project.");
  }
};
var assertStaffExists = async (staffId) => {
  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff) {
    throw new appError_default(StatusCodes37.BAD_REQUEST, "The provided assignedStaffId does not match any staff member.");
  }
};
var assertTaskExists = async (id) => {
  const task = await prisma.projectTask.findUnique({ where: { id } });
  if (!task) {
    throw new appError_default(StatusCodes37.NOT_FOUND, "Task not found.");
  }
  return task;
};
var notifyStaffOfTaskAssignment = async (staffId, taskId, title) => {
  try {
    const staff = await prisma.staff.findUnique({ where: { id: staffId }, select: { userId: true } });
    if (staff?.userId) {
      await createNotification({
        userId: staff.userId,
        type: "TASK_ASSIGNED",
        entityType: "TASK",
        entityId: taskId,
        title: "New task assigned",
        message: `You've been assigned to: ${title}`
      });
    }
  } catch (error) {
    console.error("[ProjectTask] Failed to notify assigned staff:", error);
  }
};
var createTaskInDB = async (payload) => {
  await assertProjectExists3(payload.projectId);
  if (payload.milestoneId) {
    await assertMilestoneBelongsToProject(payload.milestoneId, payload.projectId);
  }
  if (payload.assignedStaffId) {
    await assertStaffExists(payload.assignedStaffId);
  }
  const task = await prisma.projectTask.create({ data: payload });
  if (payload.assignedStaffId) {
    await notifyStaffOfTaskAssignment(payload.assignedStaffId, task.id, task.title);
  }
  return task;
};
var getAllTasksFromDB = async (query) => {
  const queryBuilder = new QueryBuilder(taskDelegate, projectTaskQueryConfig);
  return queryBuilder.execute(query);
};
var getTaskByIdFromDB = async (id) => {
  const task = await prisma.projectTask.findUnique({
    where: { id },
    include: { project: true, milestone: true, assignedStaff: true }
  });
  if (!task) {
    throw new appError_default(StatusCodes37.NOT_FOUND, "Task not found.");
  }
  return task;
};
var updateTaskInDB = async (id, payload) => {
  const existing = await assertTaskExists(id);
  if (payload.milestoneId) {
    await assertMilestoneBelongsToProject(payload.milestoneId, existing.projectId);
  }
  if (payload.assignedStaffId) {
    await assertStaffExists(payload.assignedStaffId);
  }
  const updated = await prisma.projectTask.update({ where: { id }, data: payload });
  if (payload.assignedStaffId && payload.assignedStaffId !== existing.assignedStaffId) {
    await notifyStaffOfTaskAssignment(payload.assignedStaffId, id, updated.title);
  }
  return updated;
};
var updateTaskStatusInDB = async (id, status) => {
  const existing = await assertTaskExists(id);
  const completedAt = status === "COMPLETED" ? /* @__PURE__ */ new Date() : existing.status === "COMPLETED" ? null : existing.completedAt;
  return prisma.projectTask.update({ where: { id }, data: { status, completedAt } });
};
var deleteTaskFromDB = async (id) => {
  await assertTaskExists(id);
  await prisma.projectTask.delete({ where: { id } });
};
var notifyDueTasksInDB = async () => {
  const now = /* @__PURE__ */ new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1e3);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueSoonTasks = await prisma.projectTask.findMany({
    where: {
      dueDate: { gte: now, lte: in24h },
      status: { notIn: ["COMPLETED", "CANCELLED"] },
      assignedStaffId: { not: null }
    },
    include: { assignedStaff: { select: { userId: true } } }
  });
  let notified = 0;
  for (const task of dueSoonTasks) {
    if (!task.assignedStaff?.userId) continue;
    const alreadyNotifiedToday = await prisma.notification.findFirst({
      where: {
        userId: task.assignedStaff.userId,
        type: "TASK_DUE",
        entityId: task.id,
        createdAt: { gte: startOfToday }
      }
    });
    if (alreadyNotifiedToday) continue;
    try {
      await createNotification({
        userId: task.assignedStaff.userId,
        type: "TASK_DUE",
        entityType: "TASK",
        entityId: task.id,
        title: "Task due soon",
        message: `"${task.title}" is due within 24 hours.`
      });
      notified += 1;
    } catch (error) {
      console.error("[ProjectTask] Failed to send due-task notification:", error);
    }
  }
  return { checked: dueSoonTasks.length, notified };
};
var projectTaskService = {
  createTaskInDB,
  getAllTasksFromDB,
  getTaskByIdFromDB,
  updateTaskInDB,
  updateTaskStatusInDB,
  deleteTaskFromDB,
  notifyDueTasksInDB
};

// src/app/modules/projectTask/projectTask.controller.ts
var createTask = catchAsync(async (req, res) => {
  const task = await projectTaskService.createTaskInDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes38.CREATED,
    message: "Task created successfully.",
    data: task
  });
});
var getAllTasks = catchAsync(async (req, res) => {
  const { data, meta } = await projectTaskService.getAllTasksFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes38.OK,
    message: "Tasks retrieved successfully.",
    data,
    meta
  });
});
var getTaskById = catchAsync(async (req, res) => {
  const task = await projectTaskService.getTaskByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes38.OK,
    message: "Task retrieved successfully.",
    data: task
  });
});
var updateTask = catchAsync(async (req, res) => {
  const task = await projectTaskService.updateTaskInDB(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes38.OK,
    message: "Task updated successfully.",
    data: task
  });
});
var updateTaskStatus = catchAsync(async (req, res) => {
  const task = await projectTaskService.updateTaskStatusInDB(req.params.id, req.body.status);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes38.OK,
    message: "Task status updated successfully.",
    data: task
  });
});
var deleteTask = catchAsync(async (req, res) => {
  await projectTaskService.deleteTaskFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes38.OK,
    message: "Task deleted successfully.",
    data: null
  });
});
var projectTaskController = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask
};

// src/app/modules/projectTask/projectTask.routes.ts
var router14 = Router14();
router14.post("/", requireAuth, requireRole("ADMIN", "STAFF"), validateRequest(createTaskValidation), projectTaskController.createTask);
router14.get("/", requireAuth, requireRole("ADMIN", "STAFF"), projectTaskController.getAllTasks);
router14.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), projectTaskController.getTaskById);
router14.patch("/:id", requireAuth, requireRole("ADMIN", "STAFF"), validateRequest(updateTaskValidation), projectTaskController.updateTask);
router14.patch(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateTaskStatusValidation),
  projectTaskController.updateTaskStatus
);
router14.delete("/:id", requireAuth, requireRole("ADMIN", "STAFF"), projectTaskController.deleteTask);
var projectTaskRoutes = router14;

// src/app/modules/projectFile/projectFile.routes.ts
import { Router as Router15 } from "express";

// src/app/middlewares/upload.ts
import { StatusCodes as StatusCodes39 } from "http-status-codes";
import multer from "multer";
var storage = multer.memoryStorage();
var IMAGE_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
var DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv"
];
var makeUploader = (allowedMimeTypes, maxSizeBytes, label) => multer({
  storage,
  limits: { fileSize: maxSizeBytes },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new appError_default(StatusCodes39.BAD_REQUEST, `This file type is not allowed for ${label}.`));
    }
    cb(null, true);
  }
});
var imageUpload = makeUploader(IMAGE_MIME_TYPES, 5 * 1024 * 1024, "images");
var documentUpload = makeUploader([...IMAGE_MIME_TYPES, ...DOCUMENT_MIME_TYPES], 20 * 1024 * 1024, "documents");

// src/app/modules/projectFile/projectFile.validation.ts
import { z as z15 } from "zod";
var uploadProjectFileValidation = z15.object({
  projectId: z15.string().min(1, "projectId is required."),
  description: z15.string().max(500).optional()
});

// src/app/modules/projectFile/projectFile.controller.ts
import { StatusCodes as StatusCodes42 } from "http-status-codes";

// src/app/modules/projectFile/projectFile.service.ts
import { StatusCodes as StatusCodes41 } from "http-status-codes";

// src/app/modules/projectFile/projectFile.constant.ts
var projectFileQueryConfig = {
  searchableFields: ["fileName", "description"],
  filterableFields: {
    projectId: "string",
    category: { type: "enum", enum: { IMAGE: "IMAGE", VIDEO: "VIDEO", DOCUMENT: "DOCUMENT", AUDIO: "AUDIO", OTHER: "OTHER" } }
  },
  sortableFields: ["createdAt", "fileName", "size"],
  includableRelations: ["project"],
  defaultSortField: "createdAt"
};

// src/app/utils/fileUploader.ts
import { StatusCodes as StatusCodes40 } from "http-status-codes";

// src/lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
if (!config_default.cloudinary.cloudName || !config_default.cloudinary.apiKey || !config_default.cloudinary.apiSecret) {
  throw new appError_default(
    500,
    "Cloudinary is not properly configured."
  );
}
cloudinary.config({
  cloud_name: config_default.cloudinary.cloudName,
  api_key: config_default.cloudinary.apiKey,
  api_secret: config_default.cloudinary.apiSecret
});

// src/app/utils/fileUploader.ts
var uploadFileToCloudinary = async (buffer, fileName, folder = "uploads") => {
  if (!buffer || !fileName) {
    throw new appError_default(StatusCodes40.BAD_REQUEST, "File buffer or file name is missing.");
  }
  const fileNameWithoutExtension = fileName.split(".").slice(0, -1).join(".").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${fileNameWithoutExtension}`;
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder, public_id: uniqueName, resource_type: "auto" }, (error, result) => {
      if (error || !result) {
        return reject(new appError_default(StatusCodes40.INTERNAL_SERVER_ERROR, "Cloudinary upload failed."));
      }
      resolve(result);
    }).end(buffer);
  });
};
var deleteFileFromCloudinary = async (publicId) => {
  await cloudinary.uploader.destroy(publicId);
};

// src/app/modules/projectFile/projectFile.service.ts
var fileDelegate = prisma.projectFile;
var resolveFileCategory = (mimeType) => {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType.startsWith("audio/")) return "AUDIO";
  if (mimeType === "application/pdf" || mimeType.includes("word") || mimeType === "text/plain" || mimeType === "text/csv") {
    return "DOCUMENT";
  }
  return "OTHER";
};
var assertProjectExists4 = async (projectId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new appError_default(StatusCodes41.BAD_REQUEST, "The provided projectId does not match any project.");
  }
};
var uploadProjectFileInDB = async (projectId, file, description) => {
  await assertProjectExists4(projectId);
  const uploadResult = await uploadFileToCloudinary(file.buffer, file.originalname, `projects/${projectId}`);
  return prisma.projectFile.create({
    data: {
      projectId,
      fileName: file.originalname,
      fileUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      mimeType: file.mimetype,
      size: file.size,
      category: resolveFileCategory(file.mimetype),
      ...description !== void 0 && { description }
    }
  });
};
var getAllProjectFilesFromDB = async (query) => {
  const queryBuilder = new QueryBuilder(fileDelegate, projectFileQueryConfig);
  return queryBuilder.execute(query);
};
var getProjectFileByIdFromDB = async (id) => {
  const file = await prisma.projectFile.findUnique({ where: { id }, include: { project: true } });
  if (!file) {
    throw new appError_default(StatusCodes41.NOT_FOUND, "File not found.");
  }
  return file;
};
var deleteProjectFileFromDB = async (id) => {
  const existing = await prisma.projectFile.findUnique({ where: { id } });
  if (!existing) {
    throw new appError_default(StatusCodes41.NOT_FOUND, "File not found.");
  }
  if (existing.publicId) {
    try {
      await deleteFileFromCloudinary(existing.publicId);
    } catch (error) {
      console.error("[ProjectFile] Failed to delete Cloudinary asset:", error);
    }
  }
  await prisma.projectFile.delete({ where: { id } });
};
var projectFileService = {
  uploadProjectFileInDB,
  getAllProjectFilesFromDB,
  getProjectFileByIdFromDB,
  deleteProjectFileFromDB
};

// src/app/modules/projectFile/projectFile.controller.ts
var uploadProjectFile = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new appError_default(StatusCodes42.BAD_REQUEST, "A file is required (field name: 'file').");
  }
  const file = await projectFileService.uploadProjectFileInDB(req.body.projectId, req.file, req.body.description);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes42.CREATED,
    message: "File uploaded successfully.",
    data: file
  });
});
var getAllProjectFiles = catchAsync(async (req, res) => {
  const { data, meta } = await projectFileService.getAllProjectFilesFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes42.OK,
    message: "Files retrieved successfully.",
    data,
    meta
  });
});
var getProjectFileById = catchAsync(async (req, res) => {
  const file = await projectFileService.getProjectFileByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes42.OK,
    message: "File retrieved successfully.",
    data: file
  });
});
var deleteProjectFile = catchAsync(async (req, res) => {
  await projectFileService.deleteProjectFileFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes42.OK,
    message: "File deleted successfully.",
    data: null
  });
});
var projectFileController = {
  uploadProjectFile,
  getAllProjectFiles,
  getProjectFileById,
  deleteProjectFile
};

// src/app/modules/projectFile/projectFile.routes.ts
var router15 = Router15();
router15.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  documentUpload.single("file"),
  validateRequest(uploadProjectFileValidation),
  projectFileController.uploadProjectFile
);
router15.get("/", requireAuth, requireRole("ADMIN", "STAFF"), projectFileController.getAllProjectFiles);
router15.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), projectFileController.getProjectFileById);
router15.delete("/:id", requireAuth, requireRole("ADMIN", "STAFF"), projectFileController.deleteProjectFile);
var projectFileRoutes = router15;

// src/app/modules/clientReview/clientReview.routes.ts
import { Router as Router16 } from "express";

// src/app/modules/clientReview/clientReview.validation.ts
import { z as z16 } from "zod";
var createClientReviewValidation = z16.object({
  projectId: z16.string().min(1).optional(),
  rating: z16.coerce.number().int().min(1).max(5).default(5),
  title: z16.string().min(1).max(150).optional(),
  content: z16.string().min(1, "Review content is required.").max(3e3),
  serviceQuality: z16.coerce.number().int().min(1).max(5).optional(),
  communication: z16.coerce.number().int().min(1).max(5).optional(),
  delivery: z16.coerce.number().int().min(1).max(5).optional()
});
var updateReviewApprovalValidation = z16.object({
  isApproved: z16.boolean()
});
var updateReviewFeaturedValidation = z16.object({
  isFeatured: z16.boolean()
});

// src/app/modules/clientReview/clientReview.controller.ts
import { StatusCodes as StatusCodes44 } from "http-status-codes";

// src/app/modules/clientReview/clientReview.service.ts
import { StatusCodes as StatusCodes43 } from "http-status-codes";

// src/app/modules/clientReview/clientReview.constant.ts
var clientReviewQueryConfig = {
  searchableFields: ["title", "content"],
  filterableFields: {
    clientId: "string",
    projectId: "string",
    rating: "number",
    isApproved: "boolean",
    isFeatured: "boolean"
  },
  sortableFields: ["createdAt", "rating"],
  includableRelations: ["client", "project"],
  defaultSortField: "createdAt"
};

// src/app/modules/clientReview/clientReview.service.ts
var reviewDelegate = prisma.clientReview;
var getClientIdForUser = async (userId) => {
  const client = await prisma.client.findUnique({ where: { userId } });
  if (!client) {
    throw new appError_default(StatusCodes43.BAD_REQUEST, "No client profile is linked to your account.");
  }
  return client.id;
};
var createMyClientReviewInDB = async (userId, payload) => {
  const clientId = await getClientIdForUser(userId);
  if (payload.projectId) {
    const project = await prisma.project.findUnique({ where: { id: payload.projectId } });
    if (!project) {
      throw new appError_default(StatusCodes43.BAD_REQUEST, "The provided projectId does not match any project.");
    }
    if (project.clientId !== clientId) {
      throw new appError_default(StatusCodes43.FORBIDDEN, "You can only review your own projects.");
    }
  }
  const review = await prisma.clientReview.create({ data: { ...payload, clientId } });
  try {
    await notifyAdmins({
      type: "REVIEW_RECEIVED",
      entityType: "REVIEW",
      entityId: review.id,
      title: "New client review submitted",
      message: `A new ${payload.rating}-star review was submitted and is awaiting approval.`
    });
  } catch (error) {
    console.error("[ClientReview] Failed to notify admins:", error);
  }
  return review;
};
var getAllClientReviewsFromDB = async (query, { publicOnly }) => {
  const effectiveQuery = { ...query };
  if (publicOnly) {
    effectiveQuery.isApproved = "true";
  }
  const queryBuilder = new QueryBuilder(reviewDelegate, clientReviewQueryConfig);
  return queryBuilder.execute(effectiveQuery);
};
var getClientReviewByIdFromDB = async (id) => {
  const review = await prisma.clientReview.findUnique({ where: { id }, include: { client: true, project: true } });
  if (!review) {
    throw new appError_default(StatusCodes43.NOT_FOUND, "Review not found.");
  }
  return review;
};
var updateReviewApprovalInDB = async (id, isApproved) => {
  const existing = await prisma.clientReview.findUnique({ where: { id } });
  if (!existing) {
    throw new appError_default(StatusCodes43.NOT_FOUND, "Review not found.");
  }
  return prisma.clientReview.update({ where: { id }, data: { isApproved } });
};
var updateReviewFeaturedInDB = async (id, isFeatured) => {
  const existing = await prisma.clientReview.findUnique({ where: { id } });
  if (!existing) {
    throw new appError_default(StatusCodes43.NOT_FOUND, "Review not found.");
  }
  if (isFeatured && !existing.isApproved) {
    throw new appError_default(StatusCodes43.BAD_REQUEST, "Only an approved review can be featured.");
  }
  return prisma.clientReview.update({ where: { id }, data: { isFeatured } });
};
var deleteClientReviewFromDB = async (id) => {
  const existing = await prisma.clientReview.findUnique({ where: { id } });
  if (!existing) {
    throw new appError_default(StatusCodes43.NOT_FOUND, "Review not found.");
  }
  await prisma.clientReview.delete({ where: { id } });
};
var clientReviewService = {
  createMyClientReviewInDB,
  getAllClientReviewsFromDB,
  getClientReviewByIdFromDB,
  updateReviewApprovalInDB,
  updateReviewFeaturedInDB,
  deleteClientReviewFromDB
};

// src/app/modules/clientReview/clientReview.controller.ts
var createMyClientReview = catchAsync(async (req, res) => {
  const review = await clientReviewService.createMyClientReviewInDB(req.user?.id ?? "", req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes44.CREATED,
    message: "Thank you for your feedback! It will appear after review.",
    data: review
  });
});
var getAllClientReviewsPublic = catchAsync(async (req, res) => {
  const { data, meta } = await clientReviewService.getAllClientReviewsFromDB(req.query, {
    publicOnly: true
  });
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes44.OK,
    message: "Reviews retrieved successfully.",
    data,
    meta
  });
});
var getAllClientReviewsAdmin = catchAsync(async (req, res) => {
  const { data, meta } = await clientReviewService.getAllClientReviewsFromDB(req.query, {
    publicOnly: false
  });
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes44.OK,
    message: "Reviews retrieved successfully.",
    data,
    meta
  });
});
var getClientReviewById = catchAsync(async (req, res) => {
  const review = await clientReviewService.getClientReviewByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes44.OK,
    message: "Review retrieved successfully.",
    data: review
  });
});
var updateReviewApproval = catchAsync(async (req, res) => {
  const review = await clientReviewService.updateReviewApprovalInDB(req.params.id, req.body.isApproved);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes44.OK,
    message: "Review approval updated successfully.",
    data: review
  });
});
var updateReviewFeatured = catchAsync(async (req, res) => {
  const review = await clientReviewService.updateReviewFeaturedInDB(req.params.id, req.body.isFeatured);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes44.OK,
    message: "Review featured status updated successfully.",
    data: review
  });
});
var deleteClientReview = catchAsync(async (req, res) => {
  await clientReviewService.deleteClientReviewFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes44.OK,
    message: "Review deleted successfully.",
    data: null
  });
});
var clientReviewController = {
  createMyClientReview,
  getAllClientReviewsPublic,
  getAllClientReviewsAdmin,
  getClientReviewById,
  updateReviewApproval,
  updateReviewFeatured,
  deleteClientReview
};

// src/app/modules/clientReview/clientReview.routes.ts
var router16 = Router16();
router16.get("/", clientReviewController.getAllClientReviewsPublic);
router16.post(
  "/me",
  requireAuth,
  requireRole("CLIENT"),
  validateRequest(createClientReviewValidation),
  clientReviewController.createMyClientReview
);
router16.get("/manage", requireAuth, requireRole("ADMIN", "STAFF"), clientReviewController.getAllClientReviewsAdmin);
router16.get("/manage/:id", requireAuth, requireRole("ADMIN", "STAFF"), clientReviewController.getClientReviewById);
router16.patch(
  "/:id/approval",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateReviewApprovalValidation),
  clientReviewController.updateReviewApproval
);
router16.patch(
  "/:id/featured",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateReviewFeaturedValidation),
  clientReviewController.updateReviewFeatured
);
router16.delete("/:id", requireAuth, requireRole("ADMIN"), clientReviewController.deleteClientReview);
var clientReviewRoutes = router16;

// src/app/modules/clientAppreciation/clientAppreciation.routes.ts
import { Router as Router17 } from "express";

// src/app/modules/clientAppreciation/clientAppreciation.controller.ts
import { StatusCodes as StatusCodes46 } from "http-status-codes";

// src/app/modules/clientAppreciation/clientAppreciation.service.ts
import { StatusCodes as StatusCodes45 } from "http-status-codes";

// src/app/modules/clientAppreciation/clientAppreciation.constant.ts
var clientAppreciationQueryConfig = {
  searchableFields: ["title", "description"],
  filterableFields: {
    clientId: "string",
    projectId: "string",
    type: {
      type: "enum",
      enum: {
        THANK_YOU_NOTE: "THANK_YOU_NOTE",
        GIFT: "GIFT",
        REFERRAL: "REFERRAL",
        BONUS: "BONUS",
        TESTIMONIAL: "TESTIMONIAL",
        OTHER: "OTHER"
      }
    },
    receivedAt: "date"
  },
  sortableFields: ["createdAt", "receivedAt"],
  includableRelations: ["client", "project"],
  defaultSortField: "receivedAt"
};

// src/app/modules/clientAppreciation/clientAppreciation.service.ts
var appreciationDelegate = prisma.clientAppreciation;
var toPrismaData4 = (payload) => ({
  ...payload,
  ...payload.amount !== void 0 && { amount: payload.amount === null ? null : new prismaNamespace_exports.Decimal(payload.amount) }
});
var assertClientExists2 = async (clientId) => {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    throw new appError_default(StatusCodes45.BAD_REQUEST, "The provided clientId does not match any client.");
  }
};
var assertProjectExists5 = async (projectId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new appError_default(StatusCodes45.BAD_REQUEST, "The provided projectId does not match any project.");
  }
};
var assertAppreciationExists = async (id) => {
  const appreciation = await prisma.clientAppreciation.findUnique({ where: { id } });
  if (!appreciation) {
    throw new appError_default(StatusCodes45.NOT_FOUND, "Appreciation record not found.");
  }
  return appreciation;
};
var createAppreciationInDB = async (payload) => {
  await assertClientExists2(payload.clientId);
  if (payload.projectId) {
    await assertProjectExists5(payload.projectId);
  }
  return prisma.clientAppreciation.create({ data: toPrismaData4(payload) });
};
var getAllAppreciationsFromDB = async (query) => {
  const queryBuilder = new QueryBuilder(appreciationDelegate, clientAppreciationQueryConfig);
  return queryBuilder.execute(query);
};
var getAppreciationByIdFromDB = async (id) => {
  const appreciation = await prisma.clientAppreciation.findUnique({
    where: { id },
    include: { client: true, project: true }
  });
  if (!appreciation) {
    throw new appError_default(StatusCodes45.NOT_FOUND, "Appreciation record not found.");
  }
  return appreciation;
};
var updateAppreciationInDB = async (id, payload) => {
  await assertAppreciationExists(id);
  if (payload.projectId) {
    await assertProjectExists5(payload.projectId);
  }
  return prisma.clientAppreciation.update({ where: { id }, data: toPrismaData4(payload) });
};
var deleteAppreciationFromDB = async (id) => {
  await assertAppreciationExists(id);
  await prisma.clientAppreciation.delete({ where: { id } });
};
var clientAppreciationService = {
  createAppreciationInDB,
  getAllAppreciationsFromDB,
  getAppreciationByIdFromDB,
  updateAppreciationInDB,
  deleteAppreciationFromDB
};

// src/app/modules/clientAppreciation/clientAppreciation.controller.ts
var createAppreciation = catchAsync(async (req, res) => {
  const appreciation = await clientAppreciationService.createAppreciationInDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes46.CREATED,
    message: "Appreciation record created successfully.",
    data: appreciation
  });
});
var getAllAppreciations = catchAsync(async (req, res) => {
  const { data, meta } = await clientAppreciationService.getAllAppreciationsFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes46.OK,
    message: "Appreciation records retrieved successfully.",
    data,
    meta
  });
});
var getAppreciationById = catchAsync(async (req, res) => {
  const appreciation = await clientAppreciationService.getAppreciationByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes46.OK,
    message: "Appreciation record retrieved successfully.",
    data: appreciation
  });
});
var updateAppreciation = catchAsync(async (req, res) => {
  const appreciation = await clientAppreciationService.updateAppreciationInDB(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes46.OK,
    message: "Appreciation record updated successfully.",
    data: appreciation
  });
});
var deleteAppreciation = catchAsync(async (req, res) => {
  await clientAppreciationService.deleteAppreciationFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes46.OK,
    message: "Appreciation record deleted successfully.",
    data: null
  });
});

// src/app/modules/clientAppreciation/clientAppreciation.validation.ts
import { z as z17 } from "zod";
var appreciationTypeEnum = z17.enum(["THANK_YOU_NOTE", "GIFT", "REFERRAL", "BONUS", "TESTIMONIAL", "OTHER"]);
var createAppreciationValidation = z17.object({
  clientId: z17.string().min(1, "clientId is required."),
  projectId: z17.string().min(1).optional(),
  type: appreciationTypeEnum,
  amount: z17.coerce.number().nonnegative().optional(),
  currency: z17.string().length(3).optional(),
  title: z17.string().min(1).max(150).optional(),
  description: z17.string().max(2e3).optional(),
  receivedAt: z17.coerce.date().optional()
});
var updateAppreciationValidation = z17.object({
  projectId: z17.string().min(1).nullable().optional(),
  type: appreciationTypeEnum.optional(),
  amount: z17.coerce.number().nonnegative().nullable().optional(),
  currency: z17.string().length(3).nullable().optional(),
  title: z17.string().min(1).max(150).nullable().optional(),
  description: z17.string().max(2e3).nullable().optional(),
  receivedAt: z17.coerce.date().optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

// src/app/modules/clientAppreciation/clientAppreciation.routes.ts
var router17 = Router17();
router17.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(createAppreciationValidation),
  createAppreciation
);
router17.get("/", requireAuth, requireRole("ADMIN", "STAFF"), getAllAppreciations);
router17.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), getAppreciationById);
router17.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateAppreciationValidation),
  updateAppreciation
);
router17.delete("/:id", requireAuth, requireRole("ADMIN"), deleteAppreciation);
var clientAppreciationRoutes = router17;

// src/app/modules/caseStudy/caseStudy.routes.ts
import { Router as Router18 } from "express";

// src/app/modules/caseStudy/caseStudy.validation.ts
import { z as z18 } from "zod";
var slugPattern4 = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var slugField4 = z18.string().min(1, "Slug is required.").max(150).regex(slugPattern4, "Slug must be lowercase, alphanumeric, and hyphen-separated.");
var caseStudyStatusEnum = z18.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
var createCaseStudyValidation = z18.object({
  title: z18.string().min(1, "Title is required.").max(200),
  slug: slugField4,
  clientName: z18.string().min(1).optional(),
  industry: z18.string().min(1).optional(),
  location: z18.string().min(1).optional(),
  coverImage: z18.string().url().optional(),
  problem: z18.string().max(5e3).optional(),
  strategy: z18.string().max(5e3).optional(),
  implementation: z18.string().max(5e3).optional(),
  results: z18.string().max(5e3).optional(),
  metrics: z18.unknown().optional(),
  seoTitle: z18.string().max(160).optional(),
  seoDescription: z18.string().max(300).optional(),
  isFeatured: z18.boolean().default(false)
});
var updateCaseStudyValidation = z18.object({
  title: z18.string().min(1).max(200).optional(),
  slug: slugField4.optional(),
  clientName: z18.string().min(1).nullable().optional(),
  industry: z18.string().min(1).nullable().optional(),
  location: z18.string().min(1).nullable().optional(),
  coverImage: z18.string().url().nullable().optional(),
  problem: z18.string().max(5e3).nullable().optional(),
  strategy: z18.string().max(5e3).nullable().optional(),
  implementation: z18.string().max(5e3).nullable().optional(),
  results: z18.string().max(5e3).nullable().optional(),
  metrics: z18.unknown().nullable().optional(),
  seoTitle: z18.string().max(160).nullable().optional(),
  seoDescription: z18.string().max(300).nullable().optional(),
  isFeatured: z18.boolean().optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
var updateCaseStudyStatusValidation = z18.object({
  status: caseStudyStatusEnum
});
var linkCaseStudyServiceValidation = z18.object({
  serviceId: z18.string().min(1, "serviceId is required.")
});

// src/app/modules/caseStudy/caseStudy.controller.ts
import { StatusCodes as StatusCodes48 } from "http-status-codes";

// src/app/modules/caseStudy/caseStudy.service.ts
import { StatusCodes as StatusCodes47 } from "http-status-codes";

// src/app/modules/caseStudy/caseStudy.constant.ts
var caseStudyQueryConfig = {
  searchableFields: ["title", "clientName", "industry", "problem", "results"],
  filterableFields: {
    slug: "string",
    industry: "string",
    status: { type: "enum", enum: { DRAFT: "DRAFT", PUBLISHED: "PUBLISHED", ARCHIVED: "ARCHIVED" } },
    isFeatured: "boolean"
  },
  sortableFields: ["createdAt", "publishedAt", "title"],
  includableRelations: ["services"],
  defaultSortField: "createdAt"
};

// src/app/modules/caseStudy/caseStudy.service.ts
var caseStudyDelegate = prisma.caseStudy;
var toPrismaData5 = (payload) => ({
  ...payload,
  ...payload.metrics !== void 0 && {
    metrics: payload.metrics === null ? prismaNamespace_exports.JsonNull : payload.metrics
  }
});
var assertCaseStudyExists = async (id) => {
  const caseStudy = await prisma.caseStudy.findUnique({ where: { id } });
  if (!caseStudy) {
    throw new appError_default(StatusCodes47.NOT_FOUND, "Case study not found.");
  }
  return caseStudy;
};
var createCaseStudyInDB = async (payload) => {
  return prisma.caseStudy.create({ data: toPrismaData5(payload) });
};
var getAllCaseStudiesFromDB = async (query, { publicOnly }) => {
  const effectiveQuery = { ...query };
  if (publicOnly) {
    effectiveQuery.status = "PUBLISHED";
  }
  const queryBuilder = new QueryBuilder(caseStudyDelegate, caseStudyQueryConfig);
  return queryBuilder.execute(effectiveQuery);
};
var getCaseStudyBySlugFromDB = async (slug, { publicOnly }) => {
  const caseStudy = await prisma.caseStudy.findUnique({
    where: { slug },
    include: { services: { include: { service: true } } }
  });
  if (!caseStudy || publicOnly && caseStudy.status !== "PUBLISHED") {
    throw new appError_default(StatusCodes47.NOT_FOUND, "Case study not found.");
  }
  return caseStudy;
};
var getCaseStudyByIdFromDB = async (id) => {
  const caseStudy = await prisma.caseStudy.findUnique({
    where: { id },
    include: { services: { include: { service: true } } }
  });
  if (!caseStudy) {
    throw new appError_default(StatusCodes47.NOT_FOUND, "Case study not found.");
  }
  return caseStudy;
};
var updateCaseStudyInDB = async (id, payload) => {
  await assertCaseStudyExists(id);
  return prisma.caseStudy.update({ where: { id }, data: toPrismaData5(payload) });
};
var updateCaseStudyStatusInDB = async (id, status) => {
  const existing = await assertCaseStudyExists(id);
  const publishedAt = status === "PUBLISHED" && !existing.publishedAt ? /* @__PURE__ */ new Date() : existing.publishedAt;
  return prisma.caseStudy.update({ where: { id }, data: { status, publishedAt } });
};
var linkCaseStudyServiceInDB = async (caseStudyId, serviceId) => {
  await assertCaseStudyExists(caseStudyId);
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    throw new appError_default(StatusCodes47.BAD_REQUEST, "The provided serviceId does not match any service.");
  }
  const existing = await prisma.caseStudyService.findUnique({
    where: { caseStudyId_serviceId: { caseStudyId, serviceId } }
  });
  if (existing) {
    throw new appError_default(StatusCodes47.CONFLICT, "This service is already linked to this case study.");
  }
  return prisma.caseStudyService.create({ data: { caseStudyId, serviceId } });
};
var unlinkCaseStudyServiceFromDB = async (caseStudyId, serviceId) => {
  const existing = await prisma.caseStudyService.findUnique({
    where: { caseStudyId_serviceId: { caseStudyId, serviceId } }
  });
  if (!existing) {
    throw new appError_default(StatusCodes47.NOT_FOUND, "This service is not linked to this case study.");
  }
  await prisma.caseStudyService.delete({ where: { caseStudyId_serviceId: { caseStudyId, serviceId } } });
};
var deleteCaseStudyFromDB = async (id) => {
  await assertCaseStudyExists(id);
  await prisma.caseStudy.delete({ where: { id } });
};
var caseStudyService = {
  createCaseStudyInDB,
  getAllCaseStudiesFromDB,
  getCaseStudyBySlugFromDB,
  getCaseStudyByIdFromDB,
  updateCaseStudyInDB,
  updateCaseStudyStatusInDB,
  linkCaseStudyServiceInDB,
  unlinkCaseStudyServiceFromDB,
  deleteCaseStudyFromDB
};

// src/app/modules/caseStudy/caseStudy.controller.ts
var createCaseStudy = catchAsync(
  async (req, res) => {
    const caseStudy = await caseStudyService.createCaseStudyInDB(req.body);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes48.CREATED,
      message: "Case study created successfully.",
      data: caseStudy
    });
  }
);
var getAllCaseStudiesPublic = catchAsync(
  async (req, res) => {
    const { data, meta } = await caseStudyService.getAllCaseStudiesFromDB(
      req.query,
      { publicOnly: true }
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes48.OK,
      message: "Case studies retrieved successfully.",
      data,
      meta
    });
  }
);
var getAllCaseStudiesAdmin = catchAsync(
  async (req, res) => {
    const { data, meta } = await caseStudyService.getAllCaseStudiesFromDB(
      req.query,
      { publicOnly: false }
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes48.OK,
      message: "Case studies retrieved successfully.",
      data,
      meta
    });
  }
);
var getCaseStudyBySlugPublic = catchAsync(
  async (req, res) => {
    const caseStudy = await caseStudyService.getCaseStudyBySlugFromDB(
      req.params.slug,
      { publicOnly: true }
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes48.OK,
      message: "Case study retrieved successfully.",
      data: caseStudy
    });
  }
);
var getCaseStudyByIdAdmin = catchAsync(
  async (req, res) => {
    const caseStudy = await caseStudyService.getCaseStudyByIdFromDB(
      req.params.id
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes48.OK,
      message: "Case study retrieved successfully.",
      data: caseStudy
    });
  }
);
var updateCaseStudy = catchAsync(
  async (req, res) => {
    const caseStudy = await caseStudyService.updateCaseStudyInDB(
      req.params.id,
      req.body
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes48.OK,
      message: "Case study updated successfully.",
      data: caseStudy
    });
  }
);
var updateCaseStudyStatus = catchAsync(
  async (req, res) => {
    const caseStudy = await caseStudyService.updateCaseStudyStatusInDB(
      req.params.id,
      req.body.status
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes48.OK,
      message: "Case study status updated successfully.",
      data: caseStudy
    });
  }
);
var linkCaseStudyService = catchAsync(
  async (req, res) => {
    const link = await caseStudyService.linkCaseStudyServiceInDB(
      req.params.id,
      req.body.serviceId
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes48.CREATED,
      message: "Service linked successfully.",
      data: link
    });
  }
);
var unlinkCaseStudyService = catchAsync(
  async (req, res) => {
    await caseStudyService.unlinkCaseStudyServiceFromDB(
      req.params.id,
      req.params.serviceId
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes48.OK,
      message: "Service unlinked successfully.",
      data: null
    });
  }
);
var deleteCaseStudy = catchAsync(
  async (req, res) => {
    await caseStudyService.deleteCaseStudyFromDB(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes48.OK,
      message: "Case study deleted successfully.",
      data: null
    });
  }
);
var caseStudyController = {
  createCaseStudy,
  getAllCaseStudiesPublic,
  getAllCaseStudiesAdmin,
  getCaseStudyBySlugPublic,
  getCaseStudyByIdAdmin,
  updateCaseStudy,
  updateCaseStudyStatus,
  linkCaseStudyService,
  unlinkCaseStudyService,
  deleteCaseStudy
};

// src/app/modules/caseStudy/caseStudy.routes.ts
var router18 = Router18();
router18.get("/", caseStudyController.getAllCaseStudiesPublic);
router18.get("/manage", requireAuth, requireRole("ADMIN", "STAFF"), caseStudyController.getAllCaseStudiesAdmin);
router18.get("/manage/:id", requireAuth, requireRole("ADMIN", "STAFF"), caseStudyController.getCaseStudyByIdAdmin);
router18.get("/:slug", caseStudyController.getCaseStudyBySlugPublic);
router18.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(createCaseStudyValidation),
  caseStudyController.createCaseStudy
);
router18.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateCaseStudyValidation),
  caseStudyController.updateCaseStudy
);
router18.patch(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateCaseStudyStatusValidation),
  caseStudyController.updateCaseStudyStatus
);
router18.post(
  "/:id/services",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(linkCaseStudyServiceValidation),
  caseStudyController.linkCaseStudyService
);
router18.delete("/:id/services/:serviceId", requireAuth, requireRole("ADMIN", "STAFF"), caseStudyController.unlinkCaseStudyService);
router18.delete("/:id", requireAuth, requireRole("ADMIN"), caseStudyController.deleteCaseStudy);
var caseStudyRoutes = router18;

// src/app/modules/testimonial/testimonial.routes.ts
import { Router as Router19 } from "express";

// src/app/modules/testimonial/testimonial.validation.ts
import { z as z19 } from "zod";
var testimonialStatusEnum = z19.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
var createTestimonialValidation = z19.object({
  clientName: z19.string().min(1, "Client name is required.").max(150),
  clientRole: z19.string().min(1).max(100).optional(),
  companyName: z19.string().min(1).max(150).optional(),
  clientImage: z19.string().url().optional(),
  content: z19.string().min(1, "Content is required.").max(2e3),
  rating: z19.coerce.number().int().min(1).max(5).default(5),
  serviceName: z19.string().min(1).max(150).optional(),
  isFeatured: z19.boolean().default(false)
});
var updateTestimonialValidation = z19.object({
  clientName: z19.string().min(1).max(150).optional(),
  clientRole: z19.string().min(1).max(100).nullable().optional(),
  companyName: z19.string().min(1).max(150).nullable().optional(),
  clientImage: z19.string().url().nullable().optional(),
  content: z19.string().min(1).max(2e3).optional(),
  rating: z19.coerce.number().int().min(1).max(5).optional(),
  serviceName: z19.string().min(1).max(150).nullable().optional(),
  isFeatured: z19.boolean().optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
var updateTestimonialStatusValidation = z19.object({
  status: testimonialStatusEnum
});

// src/app/modules/testimonial/testimonial.controller.ts
import { StatusCodes as StatusCodes50 } from "http-status-codes";

// src/app/modules/testimonial/testimonial.service.ts
import { StatusCodes as StatusCodes49 } from "http-status-codes";

// src/app/modules/testimonial/testimonial.constant.ts
var testimonialQueryConfig = {
  searchableFields: ["clientName", "companyName", "content", "serviceName"],
  filterableFields: {
    status: { type: "enum", enum: { DRAFT: "DRAFT", PUBLISHED: "PUBLISHED", ARCHIVED: "ARCHIVED" } },
    isFeatured: "boolean",
    rating: "number"
  },
  sortableFields: ["createdAt", "publishedAt", "rating"]
};

// src/app/modules/testimonial/testimonial.service.ts
var testimonialDelegate = prisma.testimonial;
var assertTestimonialExists = async (id) => {
  const testimonial = await prisma.testimonial.findUnique({ where: { id } });
  if (!testimonial) {
    throw new appError_default(StatusCodes49.NOT_FOUND, "Testimonial not found.");
  }
  return testimonial;
};
var createTestimonialInDB = async (payload) => {
  return prisma.testimonial.create({ data: payload });
};
var getAllTestimonialsFromDB = async (query, { publicOnly }) => {
  const effectiveQuery = { ...query };
  if (publicOnly) {
    effectiveQuery.status = "PUBLISHED";
  }
  const queryBuilder = new QueryBuilder(testimonialDelegate, testimonialQueryConfig);
  return queryBuilder.execute(effectiveQuery);
};
var getTestimonialByIdFromDB = async (id) => {
  return assertTestimonialExists(id);
};
var updateTestimonialInDB = async (id, payload) => {
  await assertTestimonialExists(id);
  return prisma.testimonial.update({ where: { id }, data: payload });
};
var updateTestimonialStatusInDB = async (id, status) => {
  const existing = await assertTestimonialExists(id);
  const publishedAt = status === "PUBLISHED" && !existing.publishedAt ? /* @__PURE__ */ new Date() : existing.publishedAt;
  return prisma.testimonial.update({ where: { id }, data: { status, publishedAt } });
};
var deleteTestimonialFromDB = async (id) => {
  await assertTestimonialExists(id);
  await prisma.testimonial.delete({ where: { id } });
};
var testimonialService = {
  createTestimonialInDB,
  getAllTestimonialsFromDB,
  getTestimonialByIdFromDB,
  updateTestimonialInDB,
  updateTestimonialStatusInDB,
  deleteTestimonialFromDB
};

// src/app/modules/testimonial/testimonial.controller.ts
var createTestimonial = catchAsync(
  async (req, res) => {
    const testimonial = await testimonialService.createTestimonialInDB(
      req.body
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes50.CREATED,
      message: "Testimonial created successfully.",
      data: testimonial
    });
  }
);
var getAllTestimonialsPublic = catchAsync(
  async (req, res) => {
    const { data, meta } = await testimonialService.getAllTestimonialsFromDB(
      req.query,
      { publicOnly: true }
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes50.OK,
      message: "Testimonials retrieved successfully.",
      data,
      meta
    });
  }
);
var getAllTestimonialsAdmin = catchAsync(
  async (req, res) => {
    const { data, meta } = await testimonialService.getAllTestimonialsFromDB(
      req.query,
      { publicOnly: false }
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes50.OK,
      message: "Testimonials retrieved successfully.",
      data,
      meta
    });
  }
);
var getTestimonialById = catchAsync(
  async (req, res) => {
    const testimonial = await testimonialService.getTestimonialByIdFromDB(
      req.params.id
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes50.OK,
      message: "Testimonial retrieved successfully.",
      data: testimonial
    });
  }
);
var updateTestimonial = catchAsync(
  async (req, res) => {
    const testimonial = await testimonialService.updateTestimonialInDB(
      req.params.id,
      req.body
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes50.OK,
      message: "Testimonial updated successfully.",
      data: testimonial
    });
  }
);
var updateTestimonialStatus = catchAsync(
  async (req, res) => {
    const testimonial = await testimonialService.updateTestimonialStatusInDB(
      req.params.id,
      req.body.status
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes50.OK,
      message: "Testimonial status updated successfully.",
      data: testimonial
    });
  }
);
var deleteTestimonial = catchAsync(
  async (req, res) => {
    await testimonialService.deleteTestimonialFromDB(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes50.OK,
      message: "Testimonial deleted successfully.",
      data: null
    });
  }
);
var testimonialController = {
  createTestimonial,
  getAllTestimonialsPublic,
  getAllTestimonialsAdmin,
  getTestimonialById,
  updateTestimonial,
  updateTestimonialStatus,
  deleteTestimonial
};

// src/app/modules/testimonial/testimonial.routes.ts
var router19 = Router19();
router19.get("/", testimonialController.getAllTestimonialsPublic);
router19.get("/manage", requireAuth, requireRole("ADMIN", "STAFF"), testimonialController.getAllTestimonialsAdmin);
router19.get("/manage/:id", requireAuth, requireRole("ADMIN", "STAFF"), testimonialController.getTestimonialById);
router19.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(createTestimonialValidation),
  testimonialController.createTestimonial
);
router19.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateTestimonialValidation),
  testimonialController.updateTestimonial
);
router19.patch(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateTestimonialStatusValidation),
  testimonialController.updateTestimonialStatus
);
router19.delete("/:id", requireAuth, requireRole("ADMIN"), testimonialController.deleteTestimonial);
var testimonialRoutes = router19;

// src/app/modules/faq/faq.routes.ts
import { Router as Router20 } from "express";

// src/app/modules/faq/faq.validation.ts
import { z as z20 } from "zod";
var createFaqValidation = z20.object({
  question: z20.string().min(1, "Question is required.").max(300),
  answer: z20.string().min(1, "Answer is required.").max(5e3),
  category: z20.string().min(1).max(100).optional(),
  isActive: z20.boolean().default(true),
  order: z20.coerce.number().int().default(0)
});
var updateFaqValidation = z20.object({
  question: z20.string().min(1).max(300).optional(),
  answer: z20.string().min(1).max(5e3).optional(),
  category: z20.string().min(1).max(100).nullable().optional(),
  isActive: z20.boolean().optional(),
  order: z20.coerce.number().int().optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

// src/app/modules/faq/faq.controller.ts
import { StatusCodes as StatusCodes52 } from "http-status-codes";

// src/app/modules/faq/faq.service.ts
import { StatusCodes as StatusCodes51 } from "http-status-codes";

// src/app/modules/faq/faq.constant.ts
var faqQueryConfig = {
  searchableFields: ["question", "answer"],
  filterableFields: {
    category: "string",
    isActive: "boolean"
  },
  sortableFields: ["order", "createdAt"]
};

// src/app/modules/faq/faq.service.ts
var faqDelegate = prisma.fAQ;
var assertFaqExists = async (id) => {
  const faq = await prisma.fAQ.findUnique({ where: { id } });
  if (!faq) {
    throw new appError_default(StatusCodes51.NOT_FOUND, "FAQ not found.");
  }
  return faq;
};
var createFaqInDB = async (payload) => {
  return prisma.fAQ.create({ data: payload });
};
var getAllFaqsFromDB = async (query, { publicOnly }) => {
  const effectiveQuery = { ...query };
  if (publicOnly) {
    effectiveQuery.isActive = "true";
  }
  if (!effectiveQuery.sort && !effectiveQuery.sortBy) {
    effectiveQuery.sortBy = "order";
    effectiveQuery.sortOrder = "asc";
  }
  const queryBuilder = new QueryBuilder(faqDelegate, faqQueryConfig);
  return queryBuilder.execute(effectiveQuery);
};
var getFaqByIdFromDB = async (id) => {
  return assertFaqExists(id);
};
var updateFaqInDB = async (id, payload) => {
  await assertFaqExists(id);
  return prisma.fAQ.update({ where: { id }, data: payload });
};
var deleteFaqFromDB = async (id) => {
  await assertFaqExists(id);
  await prisma.fAQ.delete({ where: { id } });
};
var faqService = {
  createFaqInDB,
  getAllFaqsFromDB,
  getFaqByIdFromDB,
  updateFaqInDB,
  deleteFaqFromDB
};

// src/app/modules/faq/faq.controller.ts
var createFaq = catchAsync(async (req, res) => {
  const faq = await faqService.createFaqInDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes52.CREATED,
    message: "FAQ created successfully.",
    data: faq
  });
});
var getAllFaqsPublic = catchAsync(
  async (req, res) => {
    const { data, meta } = await faqService.getAllFaqsFromDB(
      req.query,
      { publicOnly: true }
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes52.OK,
      message: "FAQs retrieved successfully.",
      data,
      meta
    });
  }
);
var getAllFaqsAdmin = catchAsync(
  async (req, res) => {
    const { data, meta } = await faqService.getAllFaqsFromDB(
      req.query,
      { publicOnly: false }
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes52.OK,
      message: "FAQs retrieved successfully.",
      data,
      meta
    });
  }
);
var getFaqById = catchAsync(async (req, res) => {
  const faq = await faqService.getFaqByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes52.OK,
    message: "FAQ retrieved successfully.",
    data: faq
  });
});
var updateFaq = catchAsync(async (req, res) => {
  const faq = await faqService.updateFaqInDB(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes52.OK,
    message: "FAQ updated successfully.",
    data: faq
  });
});
var deleteFaq = catchAsync(async (req, res) => {
  await faqService.deleteFaqFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes52.OK,
    message: "FAQ deleted successfully.",
    data: null
  });
});
var faqController = {
  createFaq,
  getAllFaqsPublic,
  getAllFaqsAdmin,
  getFaqById,
  updateFaq,
  deleteFaq
};

// src/app/modules/faq/faq.routes.ts
var router20 = Router20();
router20.get("/", faqController.getAllFaqsPublic);
router20.get("/manage", requireAuth, requireRole("ADMIN", "STAFF"), faqController.getAllFaqsAdmin);
router20.get("/manage/:id", requireAuth, requireRole("ADMIN", "STAFF"), faqController.getFaqById);
router20.post("/", requireAuth, requireRole("ADMIN", "STAFF"), validateRequest(createFaqValidation), faqController.createFaq);
router20.patch("/:id", requireAuth, requireRole("ADMIN", "STAFF"), validateRequest(updateFaqValidation), faqController.updateFaq);
router20.delete("/:id", requireAuth, requireRole("ADMIN"), faqController.deleteFaq);
var faqRoutes = router20;

// src/app/modules/blogCategory/blogCategory.routes.ts
import { Router as Router21 } from "express";

// src/app/modules/blogCategory/blogCategory.validation.ts
import { z as z21 } from "zod";
var slugPattern5 = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var slugField5 = z21.string().min(1).max(150).regex(slugPattern5, "Slug must be lowercase, alphanumeric, and hyphen-separated.");
var createBlogCategoryValidation = z21.object({
  name: z21.string().min(1, "Name is required.").max(100),
  slug: slugField5,
  description: z21.string().max(1e3).optional(),
  isActive: z21.boolean().default(true)
});
var updateBlogCategoryValidation = z21.object({
  name: z21.string().min(1).max(100).optional(),
  slug: slugField5.optional(),
  description: z21.string().max(1e3).nullable().optional(),
  isActive: z21.boolean().optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

// src/app/modules/blogCategory/blogCategory.controller.ts
import { StatusCodes as StatusCodes54 } from "http-status-codes";

// src/app/modules/blogCategory/blogCategory.service.ts
import { StatusCodes as StatusCodes53 } from "http-status-codes";

// src/app/modules/blogCategory/blogCategory.constant.ts
var blogCategoryQueryConfig = {
  searchableFields: ["name", "description"],
  filterableFields: { slug: "string", isActive: "boolean" },
  sortableFields: ["name", "createdAt"],
  includableRelations: ["posts"]
};

// src/app/modules/blogCategory/blogCategory.service.ts
var categoryDelegate = prisma.blogCategory;
var assertExists = async (id) => {
  const category = await prisma.blogCategory.findUnique({ where: { id } });
  if (!category) {
    throw new appError_default(StatusCodes53.NOT_FOUND, "Blog category not found.");
  }
  return category;
};
var createBlogCategoryInDB = async (payload) => prisma.blogCategory.create({
  data: payload
});
var getAllBlogCategoriesFromDB = async (query, { publicOnly }) => {
  const effectiveQuery = { ...query };
  if (publicOnly) {
    effectiveQuery.isActive = "true";
  }
  const queryBuilder = new QueryBuilder(
    categoryDelegate,
    blogCategoryQueryConfig
  );
  return queryBuilder.execute(effectiveQuery);
};
var getBlogCategoryByIdFromDB = async (id) => assertExists(id);
var updateBlogCategoryInDB = async (id, payload) => {
  await assertExists(id);
  return prisma.blogCategory.update({
    where: { id },
    data: payload
  });
};
var deleteBlogCategoryFromDB = async (id) => {
  await assertExists(id);
  await prisma.blogCategory.delete({ where: { id } });
};
var blogCategoryService = {
  createBlogCategoryInDB,
  getAllBlogCategoriesFromDB,
  getBlogCategoryByIdFromDB,
  updateBlogCategoryInDB,
  deleteBlogCategoryFromDB
};

// src/app/modules/blogCategory/blogCategory.controller.ts
var createBlogCategory = catchAsync(async (req, res) => {
  const category = await blogCategoryService.createBlogCategoryInDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes54.CREATED,
    message: "Category created successfully.",
    data: category
  });
});
var getAllBlogCategoriesPublic = catchAsync(
  async (req, res) => {
    const { data, meta } = await blogCategoryService.getAllBlogCategoriesFromDB(
      req.query,
      { publicOnly: true }
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes54.OK,
      message: "Categories retrieved successfully.",
      data,
      meta
    });
  }
);
var getAllBlogCategoriesAdmin = catchAsync(
  async (req, res) => {
    const { data, meta } = await blogCategoryService.getAllBlogCategoriesFromDB(
      req.query,
      { publicOnly: false }
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes54.OK,
      message: "Categories retrieved successfully.",
      data,
      meta
    });
  }
);
var getBlogCategoryById = catchAsync(async (req, res) => {
  const category = await blogCategoryService.getBlogCategoryByIdFromDB(
    req.params.id
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes54.OK,
    message: "Category retrieved successfully.",
    data: category
  });
});
var updateBlogCategory = catchAsync(async (req, res) => {
  const category = await blogCategoryService.updateBlogCategoryInDB(
    req.params.id,
    req.body
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes54.OK,
    message: "Category updated successfully.",
    data: category
  });
});
var deleteBlogCategory = catchAsync(async (req, res) => {
  await blogCategoryService.deleteBlogCategoryFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes54.OK,
    message: "Category deleted successfully.",
    data: null
  });
});
var blogCategoryController = {
  createBlogCategory,
  getAllBlogCategoriesPublic,
  getAllBlogCategoriesAdmin,
  getBlogCategoryById,
  updateBlogCategory,
  deleteBlogCategory
};

// src/app/modules/blogCategory/blogCategory.routes.ts
var router21 = Router21();
router21.get("/", blogCategoryController.getAllBlogCategoriesPublic);
router21.get("/manage", requireAuth, requireRole("ADMIN", "STAFF"), blogCategoryController.getAllBlogCategoriesAdmin);
router21.get("/manage/:id", requireAuth, requireRole("ADMIN", "STAFF"), blogCategoryController.getBlogCategoryById);
router21.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(createBlogCategoryValidation),
  blogCategoryController.createBlogCategory
);
router21.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateBlogCategoryValidation),
  blogCategoryController.updateBlogCategory
);
router21.delete("/:id", requireAuth, requireRole("ADMIN"), blogCategoryController.deleteBlogCategory);
var blogCategoryRoutes = router21;

// src/app/modules/blogTag/blogTag.routes.ts
import { Router as Router22 } from "express";

// src/app/modules/blogTag/blogTag.validation.ts
import { z as z22 } from "zod";
var slugPattern6 = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var slugField6 = z22.string().min(1).max(100).regex(slugPattern6, "Slug must be lowercase, alphanumeric, and hyphen-separated.");
var createBlogTagValidation = z22.object({
  name: z22.string().min(1, "Name is required.").max(60),
  slug: slugField6
});
var updateBlogTagValidation = z22.object({
  name: z22.string().min(1).max(60).optional(),
  slug: slugField6.optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

// src/app/modules/blogTag/blogTag.controller.ts
import { StatusCodes as StatusCodes56 } from "http-status-codes";

// src/app/modules/blogTag/blogTag.service.ts
import { StatusCodes as StatusCodes55 } from "http-status-codes";

// src/app/modules/blogTag/blogTag.constant.ts
var blogTagQueryConfig = {
  searchableFields: ["name"],
  filterableFields: { slug: "string" },
  sortableFields: ["name", "createdAt"]
};

// src/app/modules/blogTag/blogTag.service.ts
var tagDelegate = prisma.blogTag;
var assertExists2 = async (id) => {
  const tag = await prisma.blogTag.findUnique({ where: { id } });
  if (!tag) {
    throw new appError_default(StatusCodes55.NOT_FOUND, "Blog tag not found.");
  }
  return tag;
};
var createBlogTagInDB = async (payload) => prisma.blogTag.create({ data: payload });
var getAllBlogTagsFromDB = async (query) => {
  const queryBuilder = new QueryBuilder(tagDelegate, blogTagQueryConfig);
  return queryBuilder.execute(query);
};
var getBlogTagByIdFromDB = async (id) => assertExists2(id);
var updateBlogTagInDB = async (id, payload) => {
  await assertExists2(id);
  return prisma.blogTag.update({ where: { id }, data: payload });
};
var deleteBlogTagFromDB = async (id) => {
  await assertExists2(id);
  await prisma.blogTag.delete({ where: { id } });
};
var blogTagService = {
  createBlogTagInDB,
  getAllBlogTagsFromDB,
  getBlogTagByIdFromDB,
  updateBlogTagInDB,
  deleteBlogTagFromDB
};

// src/app/modules/blogTag/blogTag.controller.ts
var createBlogTag = catchAsync(async (req, res) => {
  const tag = await blogTagService.createBlogTagInDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes56.CREATED,
    message: "Tag created successfully.",
    data: tag
  });
});
var getAllBlogTags = catchAsync(
  async (req, res) => {
    const { data, meta } = await blogTagService.getAllBlogTagsFromDB(
      req.query
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes56.OK,
      message: "Tags retrieved successfully.",
      data,
      meta
    });
  }
);
var getBlogTagById = catchAsync(
  async (req, res) => {
    const tag = await blogTagService.getBlogTagByIdFromDB(
      req.params.id
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes56.OK,
      message: "Tag retrieved successfully.",
      data: tag
    });
  }
);
var updateBlogTag = catchAsync(async (req, res) => {
  const tag = await blogTagService.updateBlogTagInDB(
    req.params.id,
    req.body
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes56.OK,
    message: "Tag updated successfully.",
    data: tag
  });
});
var deleteBlogTag = catchAsync(async (req, res) => {
  await blogTagService.deleteBlogTagFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes56.OK,
    message: "Tag deleted successfully.",
    data: null
  });
});
var blogTagController = {
  createBlogTag,
  getAllBlogTags,
  getBlogTagById,
  updateBlogTag,
  deleteBlogTag
};

// src/app/modules/blogTag/blogTag.routes.ts
var router22 = Router22();
router22.get("/", blogTagController.getAllBlogTags);
router22.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), blogTagController.getBlogTagById);
router22.post("/", requireAuth, requireRole("ADMIN", "STAFF"), validateRequest(createBlogTagValidation), blogTagController.createBlogTag);
router22.patch("/:id", requireAuth, requireRole("ADMIN", "STAFF"), validateRequest(updateBlogTagValidation), blogTagController.updateBlogTag);
router22.delete("/:id", requireAuth, requireRole("ADMIN"), blogTagController.deleteBlogTag);
var blogTagRoutes = router22;

// src/app/modules/blogPost/blogPost.routes.ts
import { Router as Router23 } from "express";

// src/app/modules/blogPost/blogPost.validation.ts
import { z as z23 } from "zod";
var slugPattern7 = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var slugField7 = z23.string().min(1).max(200).regex(slugPattern7, "Slug must be lowercase, alphanumeric, and hyphen-separated.");
var postStatusEnum = z23.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
var createBlogPostValidation = z23.object({
  categoryId: z23.string().min(1).optional(),
  title: z23.string().min(1, "Title is required.").max(200),
  slug: slugField7,
  excerpt: z23.string().max(500).optional(),
  content: z23.string().min(1, "Content is required."),
  featuredImage: z23.string().url().optional(),
  seoTitle: z23.string().max(160).optional(),
  seoDescription: z23.string().max(300).optional(),
  canonicalUrl: z23.string().url().optional(),
  schemaMarkup: z23.unknown().optional(),
  tagIds: z23.array(z23.string().min(1)).default([])
});
var updateBlogPostValidation = z23.object({
  categoryId: z23.string().min(1).nullable().optional(),
  title: z23.string().min(1).max(200).optional(),
  slug: slugField7.optional(),
  excerpt: z23.string().max(500).nullable().optional(),
  content: z23.string().min(1).optional(),
  featuredImage: z23.string().url().nullable().optional(),
  seoTitle: z23.string().max(160).nullable().optional(),
  seoDescription: z23.string().max(300).nullable().optional(),
  canonicalUrl: z23.string().url().nullable().optional(),
  schemaMarkup: z23.unknown().nullable().optional(),
  tagIds: z23.array(z23.string().min(1)).optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
var updateBlogPostStatusValidation = z23.object({
  status: postStatusEnum
});

// src/app/modules/blogPost/blogPost.controller.ts
import { StatusCodes as StatusCodes58 } from "http-status-codes";

// src/app/modules/blogPost/blogPost.service.ts
import { StatusCodes as StatusCodes57 } from "http-status-codes";

// src/app/modules/blogPost/blogPost.constant.ts
var blogPostQueryConfig = {
  searchableFields: ["title", "excerpt", "content"],
  filterableFields: {
    slug: "string",
    categoryId: "string",
    authorId: "string",
    status: { type: "enum", enum: { DRAFT: "DRAFT", PUBLISHED: "PUBLISHED", ARCHIVED: "ARCHIVED" } }
  },
  sortableFields: ["createdAt", "publishedAt", "title"],
  includableRelations: ["category", "author", "tags"],
  defaultSortField: "createdAt"
};

// src/app/modules/blogPost/blogPost.service.ts
var postDelegate = prisma.blogPost;
var toPrismaData6 = (payload) => ({
  ...payload,
  ...payload.schemaMarkup !== void 0 && {
    schemaMarkup: payload.schemaMarkup === null ? prismaNamespace_exports.JsonNull : payload.schemaMarkup
  }
});
var assertCategoryExists = async (categoryId) => {
  const category = await prisma.blogCategory.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw new appError_default(StatusCodes57.BAD_REQUEST, "The provided categoryId does not match any category.");
  }
};
var assertTagsExist = async (tagIds) => {
  if (tagIds.length === 0) return;
  const uniqueIds = Array.from(new Set(tagIds));
  const found = await prisma.blogTag.findMany({ where: { id: { in: uniqueIds } } });
  if (found.length !== uniqueIds.length) {
    throw new appError_default(StatusCodes57.BAD_REQUEST, "One or more provided tagIds do not match any tag.");
  }
};
var assertPostExists = async (id) => {
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) {
    throw new appError_default(StatusCodes57.NOT_FOUND, "Blog post not found.");
  }
  return post;
};
var setPostTags = async (postId, tagIds) => {
  await prisma.blogPostTag.deleteMany({ where: { postId } });
  const uniqueIds = Array.from(new Set(tagIds));
  if (uniqueIds.length > 0) {
    await prisma.blogPostTag.createMany({
      data: uniqueIds.map((tagId) => ({ postId, tagId })),
      skipDuplicates: true
    });
  }
};
var createBlogPostInDB = async (payload, authorId) => {
  if (payload.categoryId) {
    await assertCategoryExists(payload.categoryId);
  }
  await assertTagsExist(payload.tagIds);
  const { tagIds, ...rest } = payload;
  const post = await prisma.blogPost.create({
    data: { ...toPrismaData6(rest), ...authorId !== void 0 && { authorId } }
  });
  if (tagIds.length > 0) {
    await setPostTags(post.id, tagIds);
  }
  return post;
};
var getAllBlogPostsFromDB = async (query, { publicOnly }) => {
  const effectiveQuery = { ...query };
  if (publicOnly) {
    effectiveQuery.status = "PUBLISHED";
  }
  const queryBuilder = new QueryBuilder(postDelegate, blogPostQueryConfig);
  return queryBuilder.execute(effectiveQuery);
};
var getBlogPostBySlugFromDB = async (slug, { publicOnly }) => {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      category: true,
      author: { select: { id: true, name: true, image: true } },
      tags: { include: { tag: true } }
    }
  });
  if (!post || publicOnly && post.status !== "PUBLISHED") {
    throw new appError_default(StatusCodes57.NOT_FOUND, "Blog post not found.");
  }
  return post;
};
var getBlogPostByIdFromDB = async (id) => {
  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: {
      category: true,
      author: { select: { id: true, name: true, image: true } },
      tags: { include: { tag: true } }
    }
  });
  if (!post) {
    throw new appError_default(StatusCodes57.NOT_FOUND, "Blog post not found.");
  }
  return post;
};
var updateBlogPostInDB = async (id, payload) => {
  await assertPostExists(id);
  if (payload.categoryId) {
    await assertCategoryExists(payload.categoryId);
  }
  if (payload.tagIds) {
    await assertTagsExist(payload.tagIds);
  }
  const { tagIds, ...rest } = payload;
  const updated = await prisma.blogPost.update({ where: { id }, data: toPrismaData6(rest) });
  if (tagIds) {
    await setPostTags(id, tagIds);
  }
  return updated;
};
var updateBlogPostStatusInDB = async (id, status) => {
  const existing = await assertPostExists(id);
  const publishedAt = status === "PUBLISHED" && !existing.publishedAt ? /* @__PURE__ */ new Date() : existing.publishedAt;
  return prisma.blogPost.update({ where: { id }, data: { status, publishedAt } });
};
var deleteBlogPostFromDB = async (id) => {
  await assertPostExists(id);
  await prisma.blogPost.delete({ where: { id } });
};
var blogPostService = {
  createBlogPostInDB,
  getAllBlogPostsFromDB,
  getBlogPostBySlugFromDB,
  getBlogPostByIdFromDB,
  updateBlogPostInDB,
  updateBlogPostStatusInDB,
  deleteBlogPostFromDB
};

// src/app/modules/blogPost/blogPost.controller.ts
var createBlogPost = catchAsync(
  async (req, res) => {
    const post = await blogPostService.createBlogPostInDB(
      req.body,
      req.user?.id
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes58.CREATED,
      message: "Blog post created successfully.",
      data: post
    });
  }
);
var getAllBlogPostsPublic = catchAsync(
  async (req, res) => {
    const { data, meta } = await blogPostService.getAllBlogPostsFromDB(
      req.query,
      { publicOnly: true }
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes58.OK,
      message: "Blog posts retrieved successfully.",
      data,
      meta
    });
  }
);
var getAllBlogPostsAdmin = catchAsync(
  async (req, res) => {
    const { data, meta } = await blogPostService.getAllBlogPostsFromDB(
      req.query,
      { publicOnly: false }
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes58.OK,
      message: "Blog posts retrieved successfully.",
      data,
      meta
    });
  }
);
var getBlogPostBySlugPublic = catchAsync(
  async (req, res) => {
    const post = await blogPostService.getBlogPostBySlugFromDB(
      req.params.slug,
      { publicOnly: true }
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes58.OK,
      message: "Blog post retrieved successfully.",
      data: post
    });
  }
);
var getBlogPostByIdAdmin = catchAsync(
  async (req, res) => {
    const post = await blogPostService.getBlogPostByIdFromDB(
      req.params.id
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes58.OK,
      message: "Blog post retrieved successfully.",
      data: post
    });
  }
);
var updateBlogPost = catchAsync(
  async (req, res) => {
    const post = await blogPostService.updateBlogPostInDB(
      req.params.id,
      req.body
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes58.OK,
      message: "Blog post updated successfully.",
      data: post
    });
  }
);
var updateBlogPostStatus = catchAsync(
  async (req, res) => {
    const post = await blogPostService.updateBlogPostStatusInDB(
      req.params.id,
      req.body.status
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes58.OK,
      message: "Blog post status updated successfully.",
      data: post
    });
  }
);
var deleteBlogPost = catchAsync(
  async (req, res) => {
    await blogPostService.deleteBlogPostFromDB(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes58.OK,
      message: "Blog post deleted successfully.",
      data: null
    });
  }
);
var blogPostController = {
  createBlogPost,
  getAllBlogPostsPublic,
  getAllBlogPostsAdmin,
  getBlogPostBySlugPublic,
  getBlogPostByIdAdmin,
  updateBlogPost,
  updateBlogPostStatus,
  deleteBlogPost
};

// src/app/modules/blogPost/blogPost.routes.ts
var router23 = Router23();
router23.get("/", blogPostController.getAllBlogPostsPublic);
router23.get("/manage", requireAuth, requireRole("ADMIN", "STAFF"), blogPostController.getAllBlogPostsAdmin);
router23.get("/manage/:id", requireAuth, requireRole("ADMIN", "STAFF"), blogPostController.getBlogPostByIdAdmin);
router23.get("/:slug", blogPostController.getBlogPostBySlugPublic);
router23.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(createBlogPostValidation),
  blogPostController.createBlogPost
);
router23.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateBlogPostValidation),
  blogPostController.updateBlogPost
);
router23.patch(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateBlogPostStatusValidation),
  blogPostController.updateBlogPostStatus
);
router23.delete("/:id", requireAuth, requireRole("ADMIN"), blogPostController.deleteBlogPost);
var blogPostRoutes = router23;

// src/app/modules/media/media.routes.ts
import { Router as Router24 } from "express";

// src/app/modules/media/media.validation.ts
import { z as z24 } from "zod";
var uploadMediaValidation = z24.object({
  altText: z24.string().max(200).optional(),
  caption: z24.string().max(300).optional()
});
var updateMediaValidation = z24.object({
  altText: z24.string().max(200).nullable().optional(),
  caption: z24.string().max(300).nullable().optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

// src/app/modules/media/media.controller.ts
import { StatusCodes as StatusCodes60 } from "http-status-codes";

// src/app/modules/media/media.service.ts
import { StatusCodes as StatusCodes59 } from "http-status-codes";

// src/app/modules/media/media.constant.ts
var mediaQueryConfig = {
  searchableFields: ["fileName", "altText", "caption"],
  filterableFields: {
    category: { type: "enum", enum: { IMAGE: "IMAGE", VIDEO: "VIDEO", DOCUMENT: "DOCUMENT", AUDIO: "AUDIO", OTHER: "OTHER" } }
  },
  sortableFields: ["createdAt", "fileName", "size"],
  defaultSortField: "createdAt"
};

// src/app/modules/media/media.service.ts
var mediaDelegate = prisma.media;
var resolveFileCategory2 = (mimeType) => {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType.startsWith("audio/")) return "AUDIO";
  if (mimeType === "application/pdf" || mimeType.includes("word") || mimeType === "text/plain" || mimeType === "text/csv") {
    return "DOCUMENT";
  }
  return "OTHER";
};
var uploadMediaInDB = async (file, altText, caption) => {
  const uploadResult = await uploadFileToCloudinary(file.buffer, file.originalname, "media-library");
  return prisma.media.create({
    data: {
      fileName: file.originalname,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      mimeType: file.mimetype,
      size: file.size,
      category: resolveFileCategory2(file.mimetype),
      width: uploadResult.width ?? null,
      height: uploadResult.height ?? null,
      ...altText !== void 0 && { altText },
      ...caption !== void 0 && { caption }
    }
  });
};
var getAllMediaFromDB = async (query) => {
  const queryBuilder = new QueryBuilder(mediaDelegate, mediaQueryConfig);
  return queryBuilder.execute(query);
};
var getMediaByIdFromDB = async (id) => {
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) {
    throw new appError_default(StatusCodes59.NOT_FOUND, "Media not found.");
  }
  return media;
};
var updateMediaInDB = async (id, payload) => {
  const existing = await prisma.media.findUnique({ where: { id } });
  if (!existing) {
    throw new appError_default(StatusCodes59.NOT_FOUND, "Media not found.");
  }
  return prisma.media.update({ where: { id }, data: payload });
};
var deleteMediaFromDB = async (id) => {
  const existing = await prisma.media.findUnique({ where: { id } });
  if (!existing) {
    throw new appError_default(StatusCodes59.NOT_FOUND, "Media not found.");
  }
  if (existing.publicId) {
    try {
      await deleteFileFromCloudinary(existing.publicId);
    } catch (error) {
      console.error("[Media] Failed to delete Cloudinary asset:", error);
    }
  }
  await prisma.media.delete({ where: { id } });
};
var mediaService = {
  uploadMediaInDB,
  getAllMediaFromDB,
  getMediaByIdFromDB,
  updateMediaInDB,
  deleteMediaFromDB
};

// src/app/modules/media/media.controller.ts
var uploadMedia = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new appError_default(
      StatusCodes60.BAD_REQUEST,
      "A file is required (field name: 'file')."
    );
  }
  const media = await mediaService.uploadMediaInDB(
    req.file,
    req.body.altText,
    req.body.caption
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes60.CREATED,
    message: "Media uploaded successfully.",
    data: media
  });
});
var getAllMedia = catchAsync(async (req, res) => {
  const { data, meta } = await mediaService.getAllMediaFromDB(
    req.query
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes60.OK,
    message: "Media retrieved successfully.",
    data,
    meta
  });
});
var getMediaById = catchAsync(async (req, res) => {
  const media = await mediaService.getMediaByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes60.OK,
    message: "Media retrieved successfully.",
    data: media
  });
});
var updateMedia = catchAsync(async (req, res) => {
  const media = await mediaService.updateMediaInDB(
    req.params.id,
    req.body
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes60.OK,
    message: "Media updated successfully.",
    data: media
  });
});
var deleteMedia = catchAsync(async (req, res) => {
  await mediaService.deleteMediaFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes60.OK,
    message: "Media deleted successfully.",
    data: null
  });
});
var mediaController = {
  uploadMedia,
  getAllMedia,
  getMediaById,
  updateMedia,
  deleteMedia
};

// src/app/modules/media/media.routes.ts
var router24 = Router24();
router24.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  documentUpload.single("file"),
  validateRequest(uploadMediaValidation),
  mediaController.uploadMedia
);
router24.get("/", requireAuth, requireRole("ADMIN", "STAFF"), mediaController.getAllMedia);
router24.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), mediaController.getMediaById);
router24.patch("/:id", requireAuth, requireRole("ADMIN", "STAFF"), validateRequest(updateMediaValidation), mediaController.updateMedia);
router24.delete("/:id", requireAuth, requireRole("ADMIN", "STAFF"), mediaController.deleteMedia);
var mediaRoutes = router24;

// src/app/modules/seo/keywordRanking.routes.ts
import { StatusCodes as StatusCodes62 } from "http-status-codes";
import { Router as Router25 } from "express";
import { z as z25 } from "zod";

// src/app/modules/seo/seo.utils.ts
import { StatusCodes as StatusCodes61 } from "http-status-codes";
var assertProjectExists6 = async (projectId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new appError_default(StatusCodes61.BAD_REQUEST, "The provided projectId does not match any project.");
  }
};

// src/app/modules/seo/keywordRanking.routes.ts
var searchEngineEnum = z25.enum(["GOOGLE", "BING"]);
var deviceEnum = z25.enum(["DESKTOP", "MOBILE"]);
var createValidation = z25.object({
  projectId: z25.string().min(1, "projectId is required."),
  keyword: z25.string().min(1, "Keyword is required.").max(200),
  targetUrl: z25.string().url().optional(),
  searchEngine: searchEngineEnum.default("GOOGLE"),
  device: deviceEnum.default("DESKTOP"),
  location: z25.string().min(1).optional(),
  rank: z25.coerce.number().int().min(0).optional()
});
var updateValidation = z25.object({
  rank: z25.coerce.number().int().min(0).nullable().optional(),
  location: z25.string().min(1).nullable().optional(),
  targetUrl: z25.string().url().nullable().optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
var queryConfig = {
  filterableFields: {
    projectId: "string",
    keyword: "string",
    searchEngine: { type: "enum", enum: { GOOGLE: "GOOGLE", BING: "BING" } },
    device: { type: "enum", enum: { DESKTOP: "DESKTOP", MOBILE: "MOBILE" } }
  },
  searchableFields: ["keyword"],
  sortableFields: ["checkedAt", "createdAt", "rank"],
  defaultSortField: "checkedAt"
};
var delegate = prisma.keywordRanking;
var assertExists3 = async (id) => {
  const record = await prisma.keywordRanking.findUnique({ where: { id } });
  if (!record) throw new appError_default(StatusCodes62.NOT_FOUND, "Keyword ranking record not found.");
  return record;
};
var createRecord = async (payload) => {
  await assertProjectExists6(payload.projectId);
  const latest = await prisma.keywordRanking.findFirst({
    where: { projectId: payload.projectId, keyword: payload.keyword, searchEngine: payload.searchEngine, device: payload.device },
    orderBy: { checkedAt: "desc" }
  });
  return prisma.keywordRanking.create({
    data: { ...payload, previousRank: latest?.rank ?? null }
  });
};
var updateRecord = async (id, payload) => {
  await assertExists3(id);
  return prisma.keywordRanking.update({ where: { id }, data: payload });
};
var deleteRecord = async (id) => {
  await assertExists3(id);
  await prisma.keywordRanking.delete({ where: { id } });
};
var router25 = Router25();
router25.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(createValidation),
  catchAsync(async (req, res) => {
    const record = await createRecord(req.body);
    sendResponse(res, { success: true, statusCode: StatusCodes62.CREATED, message: "Keyword ranking recorded successfully.", data: record });
  })
);
router25.get(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    const queryBuilder = new QueryBuilder(delegate, queryConfig);
    const { data, meta } = await queryBuilder.execute(req.query);
    sendResponse(res, { success: true, statusCode: StatusCodes62.OK, message: "Keyword rankings retrieved successfully.", data, meta });
  })
);
router25.get(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    const record = await assertExists3(req.params.id);
    sendResponse(res, { success: true, statusCode: StatusCodes62.OK, message: "Keyword ranking retrieved successfully.", data: record });
  })
);
router25.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateValidation),
  catchAsync(async (req, res) => {
    const record = await updateRecord(req.params.id, req.body);
    sendResponse(res, { success: true, statusCode: StatusCodes62.OK, message: "Keyword ranking updated successfully.", data: record });
  })
);
router25.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    await deleteRecord(req.params.id);
    sendResponse(res, { success: true, statusCode: StatusCodes62.OK, message: "Keyword ranking deleted successfully.", data: null });
  })
);
var keywordRankingRoutes = router25;

// src/app/modules/seo/backlink.routes.ts
import { StatusCodes as StatusCodes63 } from "http-status-codes";
import { Router as Router26 } from "express";
import { z as z26 } from "zod";
var backlinkStatusEnum = z26.enum(["PROSPECTING", "OUTREACH_SENT", "NEGOTIATING", "ACQUIRED", "LIVE", "REMOVED"]);
var createValidation2 = z26.object({
  projectId: z26.string().min(1, "projectId is required."),
  sourceUrl: z26.string().url("A valid sourceUrl is required."),
  targetUrl: z26.string().url("A valid targetUrl is required."),
  anchorText: z26.string().min(1).optional(),
  domainAuthority: z26.coerce.number().int().min(0).max(100).optional(),
  notes: z26.string().max(2e3).optional()
});
var updateValidation2 = z26.object({
  sourceUrl: z26.string().url().optional(),
  targetUrl: z26.string().url().optional(),
  anchorText: z26.string().min(1).nullable().optional(),
  domainAuthority: z26.coerce.number().int().min(0).max(100).nullable().optional(),
  notes: z26.string().max(2e3).nullable().optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
var updateStatusValidation = z26.object({ status: backlinkStatusEnum });
var queryConfig2 = {
  filterableFields: {
    projectId: "string",
    status: {
      type: "enum",
      enum: { PROSPECTING: "PROSPECTING", OUTREACH_SENT: "OUTREACH_SENT", NEGOTIATING: "NEGOTIATING", ACQUIRED: "ACQUIRED", LIVE: "LIVE", REMOVED: "REMOVED" }
    }
  },
  searchableFields: ["sourceUrl", "targetUrl", "anchorText"],
  sortableFields: ["createdAt", "acquiredAt", "domainAuthority"],
  defaultSortField: "createdAt"
};
var delegate2 = prisma.backlink;
var assertExists4 = async (id) => {
  const record = await prisma.backlink.findUnique({ where: { id } });
  if (!record) throw new appError_default(StatusCodes63.NOT_FOUND, "Backlink record not found.");
  return record;
};
var createRecord2 = async (payload) => {
  await assertProjectExists6(payload.projectId);
  return prisma.backlink.create({ data: payload });
};
var updateRecord2 = async (id, payload) => {
  await assertExists4(id);
  return prisma.backlink.update({ where: { id }, data: payload });
};
var updateStatus = async (id, status) => {
  const existing = await assertExists4(id);
  const acquiredAt = status === "ACQUIRED" && !existing.acquiredAt ? /* @__PURE__ */ new Date() : existing.acquiredAt;
  return prisma.backlink.update({ where: { id }, data: { status, acquiredAt } });
};
var deleteRecord2 = async (id) => {
  await assertExists4(id);
  await prisma.backlink.delete({ where: { id } });
};
var router26 = Router26();
router26.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(createValidation2),
  catchAsync(async (req, res) => {
    const record = await createRecord2(req.body);
    sendResponse(res, { success: true, statusCode: StatusCodes63.CREATED, message: "Backlink recorded successfully.", data: record });
  })
);
router26.get(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    const queryBuilder = new QueryBuilder(delegate2, queryConfig2);
    const { data, meta } = await queryBuilder.execute(req.query);
    sendResponse(res, { success: true, statusCode: StatusCodes63.OK, message: "Backlinks retrieved successfully.", data, meta });
  })
);
router26.get(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    const record = await assertExists4(req.params.id);
    sendResponse(res, { success: true, statusCode: StatusCodes63.OK, message: "Backlink retrieved successfully.", data: record });
  })
);
router26.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateValidation2),
  catchAsync(async (req, res) => {
    const record = await updateRecord2(req.params.id, req.body);
    sendResponse(res, { success: true, statusCode: StatusCodes63.OK, message: "Backlink updated successfully.", data: record });
  })
);
router26.patch(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateStatusValidation),
  catchAsync(async (req, res) => {
    const record = await updateStatus(req.params.id, req.body.status);
    sendResponse(res, { success: true, statusCode: StatusCodes63.OK, message: "Backlink status updated successfully.", data: record });
  })
);
router26.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    await deleteRecord2(req.params.id);
    sendResponse(res, { success: true, statusCode: StatusCodes63.OK, message: "Backlink deleted successfully.", data: null });
  })
);
var backlinkRoutes = router26;

// src/app/modules/seo/citation.routes.ts
import { StatusCodes as StatusCodes64 } from "http-status-codes";
import { Router as Router27 } from "express";
import { z as z27 } from "zod";
var citationStatusEnum = z27.enum(["PENDING", "SUBMITTED", "LIVE", "REJECTED"]);
var createValidation3 = z27.object({
  projectId: z27.string().min(1, "projectId is required."),
  directoryName: z27.string().min(1, "Directory name is required.").max(150),
  url: z27.string().url().optional(),
  notes: z27.string().max(2e3).optional()
});
var updateValidation3 = z27.object({
  directoryName: z27.string().min(1).max(150).optional(),
  url: z27.string().url().nullable().optional(),
  notes: z27.string().max(2e3).nullable().optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
var updateStatusValidation2 = z27.object({ status: citationStatusEnum });
var queryConfig3 = {
  filterableFields: {
    projectId: "string",
    status: { type: "enum", enum: { PENDING: "PENDING", SUBMITTED: "SUBMITTED", LIVE: "LIVE", REJECTED: "REJECTED" } }
  },
  searchableFields: ["directoryName"],
  sortableFields: ["createdAt", "submittedAt"],
  defaultSortField: "createdAt"
};
var delegate3 = prisma.citation;
var assertExists5 = async (id) => {
  const record = await prisma.citation.findUnique({ where: { id } });
  if (!record) throw new appError_default(StatusCodes64.NOT_FOUND, "Citation record not found.");
  return record;
};
var createRecord3 = async (payload) => {
  await assertProjectExists6(payload.projectId);
  return prisma.citation.create({ data: payload });
};
var updateRecord3 = async (id, payload) => {
  await assertExists5(id);
  return prisma.citation.update({ where: { id }, data: payload });
};
var updateStatus2 = async (id, status) => {
  const existing = await assertExists5(id);
  const submittedAt = status === "SUBMITTED" && !existing.submittedAt ? /* @__PURE__ */ new Date() : existing.submittedAt;
  return prisma.citation.update({ where: { id }, data: { status, submittedAt } });
};
var deleteRecord3 = async (id) => {
  await assertExists5(id);
  await prisma.citation.delete({ where: { id } });
};
var router27 = Router27();
router27.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(createValidation3),
  catchAsync(async (req, res) => {
    const record = await createRecord3(req.body);
    sendResponse(res, { success: true, statusCode: StatusCodes64.CREATED, message: "Citation recorded successfully.", data: record });
  })
);
router27.get(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    const queryBuilder = new QueryBuilder(delegate3, queryConfig3);
    const { data, meta } = await queryBuilder.execute(req.query);
    sendResponse(res, { success: true, statusCode: StatusCodes64.OK, message: "Citations retrieved successfully.", data, meta });
  })
);
router27.get(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    const record = await assertExists5(req.params.id);
    sendResponse(res, { success: true, statusCode: StatusCodes64.OK, message: "Citation retrieved successfully.", data: record });
  })
);
router27.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateValidation3),
  catchAsync(async (req, res) => {
    const record = await updateRecord3(req.params.id, req.body);
    sendResponse(res, { success: true, statusCode: StatusCodes64.OK, message: "Citation updated successfully.", data: record });
  })
);
router27.patch(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateStatusValidation2),
  catchAsync(async (req, res) => {
    const record = await updateStatus2(req.params.id, req.body.status);
    sendResponse(res, { success: true, statusCode: StatusCodes64.OK, message: "Citation status updated successfully.", data: record });
  })
);
router27.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    await deleteRecord3(req.params.id);
    sendResponse(res, { success: true, statusCode: StatusCodes64.OK, message: "Citation deleted successfully.", data: null });
  })
);
var citationRoutes = router27;

// src/app/modules/seo/googleBusinessProfile.routes.ts
import { StatusCodes as StatusCodes65 } from "http-status-codes";
import { Router as Router28 } from "express";
import { z as z28 } from "zod";
var upsertValidation = z28.object({
  businessName: z28.string().min(1, "Business name is required.").max(200),
  gbpUrl: z28.string().url().optional(),
  category: z28.string().min(1).optional(),
  address: z28.string().min(1).optional(),
  phone: z28.string().min(1).optional(),
  notes: z28.string().max(2e3).optional()
});
var updateVerificationValidation = z28.object({ isVerified: z28.boolean() });
var assertExists6 = async (projectId) => {
  const profile = await prisma.googleBusinessProfile.findUnique({ where: { projectId } });
  if (!profile) throw new appError_default(StatusCodes65.NOT_FOUND, "No Google Business Profile is linked to this project yet.");
  return profile;
};
var router28 = Router28();
router28.put(
  "/:projectId",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(upsertValidation),
  catchAsync(async (req, res) => {
    const projectId = req.params.projectId;
    await assertProjectExists6(projectId);
    const profile = await prisma.googleBusinessProfile.upsert({
      where: { projectId },
      create: { projectId, ...req.body },
      update: req.body
    });
    sendResponse(res, { success: true, statusCode: StatusCodes65.OK, message: "Google Business Profile saved successfully.", data: profile });
  })
);
router28.get(
  "/:projectId",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    const profile = await assertExists6(req.params.projectId);
    sendResponse(res, { success: true, statusCode: StatusCodes65.OK, message: "Google Business Profile retrieved successfully.", data: profile });
  })
);
router28.patch(
  "/:projectId/verification",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateVerificationValidation),
  catchAsync(async (req, res) => {
    const projectId = req.params.projectId;
    await assertExists6(projectId);
    const profile = await prisma.googleBusinessProfile.update({ where: { projectId }, data: { isVerified: req.body.isVerified } });
    sendResponse(res, { success: true, statusCode: StatusCodes65.OK, message: "Verification status updated successfully.", data: profile });
  })
);
router28.patch(
  "/:projectId/mark-optimized",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    const projectId = req.params.projectId;
    await assertExists6(projectId);
    const profile = await prisma.googleBusinessProfile.update({ where: { projectId }, data: { lastOptimizedAt: /* @__PURE__ */ new Date() } });
    sendResponse(res, { success: true, statusCode: StatusCodes65.OK, message: "Marked as optimized.", data: profile });
  })
);
router28.delete(
  "/:projectId",
  requireAuth,
  requireRole("ADMIN"),
  catchAsync(async (req, res) => {
    await assertExists6(req.params.projectId);
    await prisma.googleBusinessProfile.delete({ where: { projectId: req.params.projectId } });
    sendResponse(res, { success: true, statusCode: StatusCodes65.OK, message: "Google Business Profile deleted successfully.", data: null });
  })
);
var googleBusinessProfileRoutes = router28;

// src/app/modules/seo/seoAudit.routes.ts
import { StatusCodes as StatusCodes66 } from "http-status-codes";
import { Router as Router29 } from "express";
import { z as z29 } from "zod";
var createValidation4 = z29.object({
  projectId: z29.string().min(1, "projectId is required."),
  title: z29.string().min(1).max(200).optional(),
  score: z29.coerce.number().int().min(0).max(100).optional(),
  issues: z29.unknown().optional(),
  reportUrl: z29.string().url().optional(),
  summary: z29.string().max(3e3).optional()
});
var queryConfig4 = {
  filterableFields: { projectId: "string" },
  searchableFields: ["title", "summary"],
  sortableFields: ["auditDate", "createdAt", "score"],
  defaultSortField: "auditDate"
};
var delegate4 = prisma.sEOAudit;
var assertExists7 = async (id) => {
  const record = await prisma.sEOAudit.findUnique({ where: { id } });
  if (!record) throw new appError_default(StatusCodes66.NOT_FOUND, "SEO audit not found.");
  return record;
};
var createRecord4 = async (payload) => {
  await assertProjectExists6(payload.projectId);
  const { issues, ...rest } = payload;
  const audit = await prisma.sEOAudit.create({
    data: { ...rest, ...issues !== void 0 && { issues } }
  });
  try {
    const project = await prisma.project.findUnique({ where: { id: payload.projectId }, include: { client: true } });
    if (project?.client?.userId) {
      await createNotification({
        userId: project.client.userId,
        type: "SEO_REPORT",
        entityType: "PROJECT",
        entityId: project.id,
        title: "New SEO audit available",
        message: `A new SEO audit report is ready for "${project.name}".`
      });
    }
  } catch (error) {
    console.error("[SEOAudit] Failed to notify client of new report:", error);
  }
  return audit;
};
var deleteRecord4 = async (id) => {
  await assertExists7(id);
  await prisma.sEOAudit.delete({ where: { id } });
};
var router29 = Router29();
router29.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(createValidation4),
  catchAsync(async (req, res) => {
    const record = await createRecord4(req.body);
    sendResponse(res, { success: true, statusCode: StatusCodes66.CREATED, message: "SEO audit recorded successfully.", data: record });
  })
);
router29.get(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    const queryBuilder = new QueryBuilder(delegate4, queryConfig4);
    const { data, meta } = await queryBuilder.execute(req.query);
    sendResponse(res, { success: true, statusCode: StatusCodes66.OK, message: "SEO audits retrieved successfully.", data, meta });
  })
);
router29.get(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    const record = await assertExists7(req.params.id);
    sendResponse(res, { success: true, statusCode: StatusCodes66.OK, message: "SEO audit retrieved successfully.", data: record });
  })
);
router29.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    await deleteRecord4(req.params.id);
    sendResponse(res, { success: true, statusCode: StatusCodes66.OK, message: "SEO audit deleted successfully.", data: null });
  })
);
var seoAuditRoutes = router29;

// src/app/modules/seo/performanceReport.routes.ts
import { StatusCodes as StatusCodes67 } from "http-status-codes";
import { Router as Router30 } from "express";
import { z as z30 } from "zod";
var deviceEnum2 = z30.enum(["DESKTOP", "MOBILE"]);
var createValidation5 = z30.object({
  projectId: z30.string().min(1, "projectId is required."),
  pageUrl: z30.string().url("A valid pageUrl is required."),
  device: deviceEnum2.default("MOBILE"),
  performanceScore: z30.coerce.number().int().min(0).max(100).optional(),
  seoScore: z30.coerce.number().int().min(0).max(100).optional(),
  metrics: z30.unknown().optional(),
  reportUrl: z30.string().url().optional()
});
var queryConfig5 = {
  filterableFields: {
    projectId: "string",
    pageUrl: "string",
    device: { type: "enum", enum: { DESKTOP: "DESKTOP", MOBILE: "MOBILE" } }
  },
  sortableFields: ["checkedAt", "createdAt", "performanceScore", "seoScore"],
  defaultSortField: "checkedAt"
};
var delegate5 = prisma.performanceReport;
var assertExists8 = async (id) => {
  const record = await prisma.performanceReport.findUnique({ where: { id } });
  if (!record) throw new appError_default(StatusCodes67.NOT_FOUND, "Performance report not found.");
  return record;
};
var createRecord5 = async (payload) => {
  await assertProjectExists6(payload.projectId);
  const { metrics, ...rest } = payload;
  return prisma.performanceReport.create({
    data: { ...rest, ...metrics !== void 0 && { metrics } }
  });
};
var deleteRecord5 = async (id) => {
  await assertExists8(id);
  await prisma.performanceReport.delete({ where: { id } });
};
var router30 = Router30();
router30.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(createValidation5),
  catchAsync(async (req, res) => {
    const record = await createRecord5(req.body);
    sendResponse(res, { success: true, statusCode: StatusCodes67.CREATED, message: "Performance report recorded successfully.", data: record });
  })
);
router30.get(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    const queryBuilder = new QueryBuilder(delegate5, queryConfig5);
    const { data, meta } = await queryBuilder.execute(req.query);
    sendResponse(res, { success: true, statusCode: StatusCodes67.OK, message: "Performance reports retrieved successfully.", data, meta });
  })
);
router30.get(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    const record = await assertExists8(req.params.id);
    sendResponse(res, { success: true, statusCode: StatusCodes67.OK, message: "Performance report retrieved successfully.", data: record });
  })
);
router30.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    await deleteRecord5(req.params.id);
    sendResponse(res, { success: true, statusCode: StatusCodes67.OK, message: "Performance report deleted successfully.", data: null });
  })
);
var performanceReportRoutes = router30;

// src/app/modules/seo/reviewMonitor.routes.ts
import { StatusCodes as StatusCodes68 } from "http-status-codes";
import { Router as Router31 } from "express";
import { z as z31 } from "zod";
var platformEnum = z31.enum(["GOOGLE", "FACEBOOK", "YELP", "TRUSTPILOT", "OTHER"]);
var createValidation6 = z31.object({
  projectId: z31.string().min(1, "projectId is required."),
  platform: platformEnum.default("GOOGLE"),
  // schema stores rating as Decimal(2,1) — one decimal place, e.g. 4.5
  rating: z31.coerce.number().min(0).max(9.9).optional(),
  reviewCount: z31.coerce.number().int().min(0).optional()
});
var queryConfig6 = {
  filterableFields: {
    projectId: "string",
    platform: { type: "enum", enum: { GOOGLE: "GOOGLE", FACEBOOK: "FACEBOOK", YELP: "YELP", TRUSTPILOT: "TRUSTPILOT", OTHER: "OTHER" } }
  },
  sortableFields: ["checkedAt", "createdAt", "reviewCount"],
  defaultSortField: "checkedAt"
};
var delegate6 = prisma.reviewMonitor;
var assertExists9 = async (id) => {
  const record = await prisma.reviewMonitor.findUnique({ where: { id } });
  if (!record) throw new appError_default(StatusCodes68.NOT_FOUND, "Review monitor record not found.");
  return record;
};
var createRecord6 = async (payload) => {
  await assertProjectExists6(payload.projectId);
  const { rating, ...rest } = payload;
  return prisma.reviewMonitor.create({
    data: { ...rest, ...rating !== void 0 && { rating: new prismaNamespace_exports.Decimal(rating) } }
  });
};
var deleteRecord6 = async (id) => {
  await assertExists9(id);
  await prisma.reviewMonitor.delete({ where: { id } });
};
var router31 = Router31();
router31.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(createValidation6),
  catchAsync(async (req, res) => {
    const record = await createRecord6(req.body);
    sendResponse(res, { success: true, statusCode: StatusCodes68.CREATED, message: "Review snapshot recorded successfully.", data: record });
  })
);
router31.get(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    const queryBuilder = new QueryBuilder(delegate6, queryConfig6);
    const { data, meta } = await queryBuilder.execute(req.query);
    sendResponse(res, { success: true, statusCode: StatusCodes68.OK, message: "Review monitor records retrieved successfully.", data, meta });
  })
);
router31.get(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    const record = await assertExists9(req.params.id);
    sendResponse(res, { success: true, statusCode: StatusCodes68.OK, message: "Review monitor record retrieved successfully.", data: record });
  })
);
router31.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    await deleteRecord6(req.params.id);
    sendResponse(res, { success: true, statusCode: StatusCodes68.OK, message: "Review monitor record deleted successfully.", data: null });
  })
);
var reviewMonitorRoutes = router31;

// src/app/modules/seo/serviceArea.routes.ts
import { StatusCodes as StatusCodes69 } from "http-status-codes";
import { Router as Router32 } from "express";
import { z as z32 } from "zod";
var slugPattern8 = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var createValidation7 = z32.object({
  projectId: z32.string().min(1, "projectId is required."),
  city: z32.string().min(1, "City is required.").max(150),
  state: z32.string().min(1).max(150).optional(),
  slug: z32.string().min(1).max(150).regex(slugPattern8, "Slug must be lowercase, alphanumeric, and hyphen-separated."),
  pageUrl: z32.string().url().optional()
});
var updateValidation4 = z32.object({
  city: z32.string().min(1).max(150).optional(),
  state: z32.string().min(1).max(150).nullable().optional(),
  pageUrl: z32.string().url().nullable().optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
var publishValidation = z32.object({ publishedAt: z32.coerce.date().nullable() });
var queryConfig7 = {
  searchableFields: ["city", "state"],
  filterableFields: { projectId: "string", slug: "string" },
  sortableFields: ["createdAt", "city", "publishedAt"],
  defaultSortField: "createdAt"
};
var delegate7 = prisma.serviceArea;
var assertExists10 = async (id) => {
  const record = await prisma.serviceArea.findUnique({ where: { id } });
  if (!record) throw new appError_default(StatusCodes69.NOT_FOUND, "Service area not found.");
  return record;
};
var createRecord7 = async (payload) => {
  await assertProjectExists6(payload.projectId);
  const existing = await prisma.serviceArea.findUnique({
    where: { projectId_slug: { projectId: payload.projectId, slug: payload.slug } }
  });
  if (existing) {
    throw new appError_default(StatusCodes69.CONFLICT, "A service area with this slug already exists for this project.");
  }
  return prisma.serviceArea.create({ data: payload });
};
var updateRecord4 = async (id, payload) => {
  await assertExists10(id);
  return prisma.serviceArea.update({ where: { id }, data: payload });
};
var setPublished = async (id, publishedAt) => {
  await assertExists10(id);
  return prisma.serviceArea.update({ where: { id }, data: { publishedAt } });
};
var deleteRecord7 = async (id) => {
  await assertExists10(id);
  await prisma.serviceArea.delete({ where: { id } });
};
var router32 = Router32();
router32.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(createValidation7),
  catchAsync(async (req, res) => {
    const record = await createRecord7(req.body);
    sendResponse(res, { success: true, statusCode: StatusCodes69.CREATED, message: "Service area created successfully.", data: record });
  })
);
router32.get(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    const queryBuilder = new QueryBuilder(delegate7, queryConfig7);
    const { data, meta } = await queryBuilder.execute(req.query);
    sendResponse(res, { success: true, statusCode: StatusCodes69.OK, message: "Service areas retrieved successfully.", data, meta });
  })
);
router32.get(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    const record = await assertExists10(req.params.id);
    sendResponse(res, { success: true, statusCode: StatusCodes69.OK, message: "Service area retrieved successfully.", data: record });
  })
);
router32.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateValidation4),
  catchAsync(async (req, res) => {
    const record = await updateRecord4(req.params.id, req.body);
    sendResponse(res, { success: true, statusCode: StatusCodes69.OK, message: "Service area updated successfully.", data: record });
  })
);
router32.patch(
  "/:id/publish",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(publishValidation),
  catchAsync(async (req, res) => {
    const record = await setPublished(req.params.id, req.body.publishedAt);
    sendResponse(res, { success: true, statusCode: StatusCodes69.OK, message: "Publish status updated successfully.", data: record });
  })
);
router32.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    await deleteRecord7(req.params.id);
    sendResponse(res, { success: true, statusCode: StatusCodes69.OK, message: "Service area deleted successfully.", data: null });
  })
);
var serviceAreaRoutes = router32;

// src/app/modules/seo/callLog.routes.ts
import { StatusCodes as StatusCodes70 } from "http-status-codes";
import { Router as Router33 } from "express";
import { z as z33 } from "zod";
var callStatusEnum = z33.enum(["COMPLETED", "MISSED", "VOICEMAIL"]);
var createValidation8 = z33.object({
  projectId: z33.string().min(1, "projectId is required."),
  twilioCallSid: z33.string().min(1).optional(),
  fromNumber: z33.string().min(1, "fromNumber is required."),
  toNumber: z33.string().min(1).optional(),
  duration: z33.coerce.number().int().min(0).optional(),
  recordingUrl: z33.string().url().optional(),
  status: callStatusEnum.default("COMPLETED")
});
var queryConfig8 = {
  filterableFields: {
    projectId: "string",
    fromNumber: "string",
    status: { type: "enum", enum: { COMPLETED: "COMPLETED", MISSED: "MISSED", VOICEMAIL: "VOICEMAIL" } }
  },
  sortableFields: ["receivedAt", "createdAt", "duration"],
  defaultSortField: "receivedAt"
};
var delegate8 = prisma.callLog;
var assertExists11 = async (id) => {
  const record = await prisma.callLog.findUnique({ where: { id } });
  if (!record) throw new appError_default(StatusCodes70.NOT_FOUND, "Call log not found.");
  return record;
};
var createRecord8 = async (payload) => {
  await assertProjectExists6(payload.projectId);
  return prisma.callLog.create({ data: payload });
};
var deleteRecord8 = async (id) => {
  await assertExists11(id);
  await prisma.callLog.delete({ where: { id } });
};
var router33 = Router33();
router33.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(createValidation8),
  catchAsync(async (req, res) => {
    const record = await createRecord8(req.body);
    sendResponse(res, { success: true, statusCode: StatusCodes70.CREATED, message: "Call log recorded successfully.", data: record });
  })
);
router33.get(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    const queryBuilder = new QueryBuilder(delegate8, queryConfig8);
    const { data, meta } = await queryBuilder.execute(req.query);
    sendResponse(res, { success: true, statusCode: StatusCodes70.OK, message: "Call logs retrieved successfully.", data, meta });
  })
);
router33.get(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    const record = await assertExists11(req.params.id);
    sendResponse(res, { success: true, statusCode: StatusCodes70.OK, message: "Call log retrieved successfully.", data: record });
  })
);
router33.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    await deleteRecord8(req.params.id);
    sendResponse(res, { success: true, statusCode: StatusCodes70.OK, message: "Call log deleted successfully.", data: null });
  })
);
var callLogRoutes = router33;

// src/app/modules/seo/trackingConfig.routes.ts
import { StatusCodes as StatusCodes71 } from "http-status-codes";
import { Router as Router34 } from "express";
import { z as z34 } from "zod";
var upsertValidation2 = z34.object({
  ga4MeasurementId: z34.string().min(1).optional(),
  gtmContainerId: z34.string().min(1).optional(),
  metaPixelId: z34.string().min(1).optional(),
  whatsappNumber: z34.string().min(1).optional(),
  conversionGoals: z34.unknown().optional()
});
var assertExists12 = async (projectId) => {
  const config3 = await prisma.trackingConfig.findUnique({ where: { projectId } });
  if (!config3) throw new appError_default(StatusCodes71.NOT_FOUND, "No tracking config is set up for this project yet.");
  return config3;
};
var router34 = Router34();
router34.put(
  "/:projectId",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(upsertValidation2),
  catchAsync(async (req, res) => {
    const projectId = req.params.projectId;
    await assertProjectExists6(projectId);
    const { conversionGoals, ...rest } = req.body;
    const jsonField = conversionGoals !== void 0 ? { conversionGoals } : {};
    const config3 = await prisma.trackingConfig.upsert({
      where: { projectId },
      create: { projectId, ...rest, ...jsonField },
      update: { ...rest, ...jsonField }
    });
    sendResponse(res, { success: true, statusCode: StatusCodes71.OK, message: "Tracking config saved successfully.", data: config3 });
  })
);
router34.get(
  "/:projectId",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  catchAsync(async (req, res) => {
    const config3 = await assertExists12(req.params.projectId);
    sendResponse(res, { success: true, statusCode: StatusCodes71.OK, message: "Tracking config retrieved successfully.", data: config3 });
  })
);
router34.delete(
  "/:projectId",
  requireAuth,
  requireRole("ADMIN"),
  catchAsync(async (req, res) => {
    await assertExists12(req.params.projectId);
    await prisma.trackingConfig.delete({ where: { projectId: req.params.projectId } });
    sendResponse(res, { success: true, statusCode: StatusCodes71.OK, message: "Tracking config deleted successfully.", data: null });
  })
);
var trackingConfigRoutes = router34;

// src/app/modules/contactMessage/contactMessage.routes.ts
import { Router as Router35 } from "express";

// src/app/modules/contactMessage/contactMessage.validation.ts
import { z as z35 } from "zod";
var contactMessageStatusEnum = z35.enum(["UNREAD", "READ", "REPLIED", "ARCHIVED", "SPAM"]);
var createContactMessageValidation = z35.object({
  name: z35.string().min(1, "Name is required.").max(150),
  email: z35.string().email("A valid email is required."),
  phone: z35.string().min(1).optional(),
  company: z35.string().min(1).optional(),
  subject: z35.string().min(1).max(200).optional(),
  message: z35.string().min(1, "Message is required.").max(5e3)
});
var updateContactMessageStatusValidation = z35.object({
  status: contactMessageStatusEnum
});

// src/app/modules/contactMessage/contactMessage.controller.ts
import { StatusCodes as StatusCodes73 } from "http-status-codes";

// src/app/modules/contactMessage/contactMessage.service.ts
import { StatusCodes as StatusCodes72 } from "http-status-codes";

// src/app/modules/contactMessage/contactMessage.constant.ts
var contactMessageQueryConfig = {
  searchableFields: ["name", "email", "company", "subject", "message"],
  filterableFields: {
    email: "string",
    status: { type: "enum", enum: { UNREAD: "UNREAD", READ: "READ", REPLIED: "REPLIED", ARCHIVED: "ARCHIVED", SPAM: "SPAM" } }
  },
  sortableFields: ["createdAt"],
  defaultSortField: "createdAt"
};

// src/app/modules/contactMessage/contactMessage.service.ts
var delegate9 = prisma.contactMessage;
var assertExists13 = async (id) => {
  const message = await prisma.contactMessage.findUnique({ where: { id } });
  if (!message) {
    throw new appError_default(StatusCodes72.NOT_FOUND, "Message not found.");
  }
  return message;
};
var createContactMessageInDB = async (payload) => {
  const contactMessage = await prisma.contactMessage.create({
    data: payload
  });
  try {
    await notifyAdmins({
      type: "MESSAGE_RECEIVED",
      entityType: "MESSAGE",
      entityId: contactMessage.id,
      title: "New contact message",
      message: `${payload.name} sent a message${payload.subject ? `: "${payload.subject}"` : "."}`
    });
  } catch (error) {
    console.error("[ContactMessage] Failed to notify admins:", error);
  }
  return contactMessage;
};
var getAllContactMessagesFromDB = async (query) => {
  const queryBuilder = new QueryBuilder(
    delegate9,
    contactMessageQueryConfig
  );
  return queryBuilder.execute(query);
};
var getContactMessageByIdFromDB = async (id) => {
  const message = await assertExists13(id);
  if (message.status === "UNREAD") {
    return prisma.contactMessage.update({
      where: { id },
      data: { status: "READ" }
    });
  }
  return message;
};
var updateContactMessageStatusInDB = async (id, status) => {
  const existing = await assertExists13(id);
  const repliedAt = status === "REPLIED" && !existing.repliedAt ? /* @__PURE__ */ new Date() : existing.repliedAt;
  return prisma.contactMessage.update({
    where: { id },
    data: { status, repliedAt }
  });
};
var deleteContactMessageFromDB = async (id) => {
  await assertExists13(id);
  await prisma.contactMessage.delete({ where: { id } });
};
var contactMessageService = {
  createContactMessageInDB,
  getAllContactMessagesFromDB,
  getContactMessageByIdFromDB,
  updateContactMessageStatusInDB,
  deleteContactMessageFromDB
};

// src/app/modules/contactMessage/contactMessage.controller.ts
var createContactMessage = catchAsync(
  async (req, res) => {
    const message = await contactMessageService.createContactMessageInDB(
      req.body
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes73.CREATED,
      message: "Thank you for reaching out! We'll get back to you soon.",
      data: message
    });
  }
);
var getAllContactMessages = catchAsync(
  async (req, res) => {
    const { data, meta } = await contactMessageService.getAllContactMessagesFromDB(
      req.query
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes73.OK,
      message: "Messages retrieved successfully.",
      data,
      meta
    });
  }
);
var getContactMessageById = catchAsync(
  async (req, res) => {
    const message = await contactMessageService.getContactMessageByIdFromDB(
      req.params.id
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes73.OK,
      message: "Message retrieved successfully.",
      data: message
    });
  }
);
var updateContactMessageStatus = catchAsync(
  async (req, res) => {
    const message = await contactMessageService.updateContactMessageStatusInDB(
      req.params.id,
      req.body.status
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes73.OK,
      message: "Message status updated successfully.",
      data: message
    });
  }
);
var deleteContactMessage = catchAsync(
  async (req, res) => {
    await contactMessageService.deleteContactMessageFromDB(
      req.params.id
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes73.OK,
      message: "Message deleted successfully.",
      data: null
    });
  }
);
var contactMessageController = {
  createContactMessage,
  getAllContactMessages,
  getContactMessageById,
  updateContactMessageStatus,
  deleteContactMessage
};

// src/app/modules/contactMessage/contactMessage.routes.ts
var router35 = Router35();
router35.post("/", publicRateLimiter, validateRequest(createContactMessageValidation), contactMessageController.createContactMessage);
router35.get("/", requireAuth, requireRole("ADMIN", "STAFF"), contactMessageController.getAllContactMessages);
router35.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), contactMessageController.getContactMessageById);
router35.patch(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updateContactMessageStatusValidation),
  contactMessageController.updateContactMessageStatus
);
router35.delete("/:id", requireAuth, requireRole("ADMIN", "STAFF"), contactMessageController.deleteContactMessage);
var contactMessageRoutes = router35;

// src/app/modules/notification/notification.routes.ts
import { Router as Router36 } from "express";

// src/app/modules/notification/notification.validation.ts
import { z as z36 } from "zod";
var notificationTypeEnum = z36.enum([
  "LEAD_NEW",
  "LEAD_ASSIGNED",
  "LEAD_STATUS_CHANGED",
  "PROPOSAL_SENT",
  "PROPOSAL_ACCEPTED",
  "PROPOSAL_REJECTED",
  "PROJECT_UPDATE",
  "TASK_ASSIGNED",
  "TASK_DUE",
  "CONSULTATION_SCHEDULED",
  "MESSAGE_RECEIVED",
  "REVIEW_RECEIVED",
  "SEO_REPORT",
  "SYSTEM"
]);
var notificationEntityTypeEnum = z36.enum(["LEAD", "PROPOSAL", "PROJECT", "TASK", "CONSULTATION", "MESSAGE", "REVIEW", "USER"]);
var createNotificationValidation = z36.object({
  userId: z36.string().min(1, "userId is required."),
  type: notificationTypeEnum,
  entityType: notificationEntityTypeEnum.optional(),
  entityId: z36.string().min(1).optional(),
  title: z36.string().min(1, "Title is required.").max(200),
  message: z36.string().min(1, "Message is required.").max(2e3)
});

// src/app/modules/notification/notification.controller.ts
import { StatusCodes as StatusCodes74 } from "http-status-codes";
var createNotification2 = catchAsync(
  async (req, res) => {
    const notification = await notificationService.createNotificationInDB(
      req.body
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes74.CREATED,
      message: "Notification created successfully.",
      data: notification
    });
  }
);
var getMyNotifications = catchAsync(
  async (req, res) => {
    const { data, meta } = await notificationService.getMyNotificationsFromDB(
      req.user?.id ?? "",
      req.query
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes74.OK,
      message: "Notifications retrieved successfully.",
      data,
      meta
    });
  }
);
var markNotificationRead = catchAsync(
  async (req, res) => {
    const notification = await notificationService.markNotificationReadInDB(
      req.params.id,
      req.user?.id ?? ""
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes74.OK,
      message: "Notification marked as read.",
      data: notification
    });
  }
);
var markAllNotificationsRead = catchAsync(
  async (req, res) => {
    await notificationService.markAllNotificationsReadInDB(req.user?.id ?? "");
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes74.OK,
      message: "All notifications marked as read.",
      data: null
    });
  }
);
var deleteMyNotification = catchAsync(
  async (req, res) => {
    await notificationService.deleteMyNotificationFromDB(
      req.params.id,
      req.user?.id ?? ""
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes74.OK,
      message: "Notification deleted successfully.",
      data: null
    });
  }
);
var notificationController = {
  createNotification: createNotification2,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteMyNotification
};

// src/app/modules/notification/notification.routes.ts
var router36 = Router36();
router36.get("/me", requireAuth, notificationController.getMyNotifications);
router36.patch("/me/read-all", requireAuth, notificationController.markAllNotificationsRead);
router36.patch("/:id/read", requireAuth, notificationController.markNotificationRead);
router36.delete("/:id", requireAuth, notificationController.deleteMyNotification);
router36.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest(createNotificationValidation),
  notificationController.createNotification
);
var notificationRoutes = router36;

// src/app/modules/siteSetting/siteSetting.routes.ts
import { Router as Router37 } from "express";

// src/app/modules/siteSetting/siteSetting.validation.ts
import { z as z37 } from "zod";
var keyPattern = /^[a-z0-9_]+$/;
var keyField = z37.string().min(1, "Key is required.").max(100).regex(keyPattern, "Key must be lowercase letters, numbers, and underscores only.");
var upsertSiteSettingValidation = z37.object({
  key: keyField,
  value: z37.string().max(5e3).optional(),
  description: z37.string().max(500).optional()
});

// src/app/modules/siteSetting/siteSetting.controller.ts
import { StatusCodes as StatusCodes76 } from "http-status-codes";

// src/app/modules/siteSetting/siteSetting.service.ts
import { StatusCodes as StatusCodes75 } from "http-status-codes";
var upsertSiteSettingInDB = async (payload) => {
  return prisma.siteSetting.upsert({
    where: { key: payload.key },
    create: payload,
    update: {
      ...payload.value !== void 0 && { value: payload.value },
      ...payload.description !== void 0 && { description: payload.description }
    }
  });
};
var getAllSiteSettingsFromDB = async () => {
  return prisma.siteSetting.findMany({ orderBy: { key: "asc" } });
};
var getSiteSettingByKeyFromDB = async (key) => {
  const setting = await prisma.siteSetting.findUnique({ where: { key } });
  if (!setting) {
    throw new appError_default(StatusCodes75.NOT_FOUND, "Setting not found.");
  }
  return setting;
};
var deleteSiteSettingFromDB = async (key) => {
  const existing = await prisma.siteSetting.findUnique({ where: { key } });
  if (!existing) {
    throw new appError_default(StatusCodes75.NOT_FOUND, "Setting not found.");
  }
  await prisma.siteSetting.delete({ where: { key } });
};
var siteSettingService = {
  upsertSiteSettingInDB,
  getAllSiteSettingsFromDB,
  getSiteSettingByKeyFromDB,
  deleteSiteSettingFromDB
};

// src/app/modules/siteSetting/siteSetting.controller.ts
var upsertSiteSetting = catchAsync(async (req, res) => {
  const setting = await siteSettingService.upsertSiteSettingInDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes76.OK,
    message: "Setting saved successfully.",
    data: setting
  });
});
var getAllSiteSettings = catchAsync(async (_req, res) => {
  const settings = await siteSettingService.getAllSiteSettingsFromDB();
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes76.OK,
    message: "Settings retrieved successfully.",
    data: settings
  });
});
var getSiteSettingByKey = catchAsync(async (req, res) => {
  const setting = await siteSettingService.getSiteSettingByKeyFromDB(
    req.params.key
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes76.OK,
    message: "Setting retrieved successfully.",
    data: setting
  });
});
var deleteSiteSetting = catchAsync(async (req, res) => {
  await siteSettingService.deleteSiteSettingFromDB(req.params.key);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes76.OK,
    message: "Setting deleted successfully.",
    data: null
  });
});
var siteSettingController = {
  upsertSiteSetting,
  getAllSiteSettings,
  getSiteSettingByKey,
  deleteSiteSetting
};

// src/app/modules/siteSetting/siteSetting.routes.ts
var router37 = Router37();
router37.put("/", requireAuth, requireRole("ADMIN"), validateRequest(upsertSiteSettingValidation), siteSettingController.upsertSiteSetting);
router37.get("/", requireAuth, requireRole("ADMIN", "STAFF"), siteSettingController.getAllSiteSettings);
router37.get("/:key", requireAuth, requireRole("ADMIN", "STAFF"), siteSettingController.getSiteSettingByKey);
router37.delete("/:key", requireAuth, requireRole("ADMIN"), siteSettingController.deleteSiteSetting);
var siteSettingRoutes = router37;

// src/app/modules/payment/payment.routes.ts
import { Router as Router38 } from "express";

// src/app/modules/payment/payment.validation.ts
import { z as z38 } from "zod";
var createStripeCheckoutValidation = z38.object({
  proposalId: z38.string().min(1, "proposalId is required.")
});
var createBkashCheckoutValidation = z38.object({
  proposalId: z38.string().min(1, "proposalId is required.")
});
var createSslcommerzCheckoutValidation = z38.object({
  proposalId: z38.string().min(1, "proposalId is required.")
});

// src/app/modules/payment/payment.controller.ts
import { StatusCodes as StatusCodes77 } from "http-status-codes";
var primaryClientUrl2 = () => config_default.app.clientUrl.split(",")[0]?.trim() ?? "";
var getRequestingUser = (req) => {
  if (!req.user) {
    throw new appError_default(StatusCodes77.UNAUTHORIZED, "You are not logged in.");
  }
  return {
    id: req.user.id,
    role: req.user.role
  };
};
var createStripeCheckout = catchAsync(async (req, res) => {
  const result = await paymentService.createStripeCheckoutInDB(
    req.body.proposalId,
    getRequestingUser(req)
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes77.CREATED,
    message: "Checkout session created successfully.",
    data: result
  });
});
var createBkashCheckout = catchAsync(async (req, res) => {
  const result = await paymentService.createBkashPaymentInDB(
    req.body.proposalId,
    getRequestingUser(req)
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes77.CREATED,
    message: "bKash payment session created successfully.",
    data: result
  });
});
var bkashCallback = catchAsync(async (req, res) => {
  const paymentID = req.query.paymentID;
  const status = req.query.status ?? "failure";
  if (!paymentID) {
    res.redirect(`${primaryClientUrl2()}/payments/error`);
    return;
  }
  try {
    const result = await paymentService.handleBkashCallbackInDB(
      paymentID,
      status
    );
    res.redirect(
      `${primaryClientUrl2()}/proposals/${result.payment.proposalId}?payment=${result.redirectStatus}`
    );
  } catch (error) {
    console.error("[Payment] bKash callback failed:", error);
    res.redirect(`${primaryClientUrl2()}/payments/error`);
  }
});
var createSslcommerzCheckout = catchAsync(
  async (req, res) => {
    const result = await paymentService.createSslcommerzPaymentInDB(
      req.body.proposalId,
      getRequestingUser(req)
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes77.CREATED,
      message: "SSLCommerz payment session created successfully.",
      data: result
    });
  }
);
var sslcommerzCallback = catchAsync(async (req, res) => {
  const source = { ...req.query, ...req.body };
  const tranId = source.tran_id;
  const status = req.query.status ?? source.status ?? "fail";
  const valId = source.val_id;
  if (!tranId) {
    res.redirect(`${primaryClientUrl2()}/payments/error`);
    return;
  }
  try {
    const result = await paymentService.handleSslcommerzCallbackInDB(
      tranId,
      status,
      valId
    );
    res.redirect(
      `${primaryClientUrl2()}/proposals/${result.payment.proposalId}?payment=${result.redirectStatus}`
    );
  } catch (error) {
    console.error("[Payment] SSLCommerz callback failed:", error);
    res.redirect(`${primaryClientUrl2()}/payments/error`);
  }
});
var getAllPayments = catchAsync(async (req, res) => {
  const { data, meta } = await paymentService.getAllPaymentsFromDB(
    req.query
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes77.OK,
    message: "Payments retrieved successfully.",
    data,
    meta
  });
});
var getPaymentById = catchAsync(async (req, res) => {
  const payment = await paymentService.getPaymentByIdFromDB(
    req.params.id
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes77.OK,
    message: "Payment retrieved successfully.",
    data: payment
  });
});
var getMyPayments = catchAsync(async (req, res) => {
  const { data, meta } = await paymentService.getMyPaymentsFromDB(
    req.user?.id ?? "",
    req.query
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes77.OK,
    message: "Payments retrieved successfully.",
    data,
    meta
  });
});
var refundStripePayment = catchAsync(async (req, res) => {
  const payment = await paymentService.refundStripePaymentInDB(
    req.params.id
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes77.OK,
    message: "Payment refunded successfully.",
    data: payment
  });
});
var paymentController = {
  createStripeCheckout,
  createBkashCheckout,
  bkashCallback,
  createSslcommerzCheckout,
  sslcommerzCallback,
  getAllPayments,
  getPaymentById,
  getMyPayments,
  refundStripePayment
};

// src/app/modules/payment/payment.routes.ts
var router38 = Router38();
router38.get("/bkash/callback", paymentController.bkashCallback);
router38.get("/sslcommerz/callback", paymentController.sslcommerzCallback);
router38.post("/sslcommerz/callback", paymentController.sslcommerzCallback);
router38.post(
  "/stripe/checkout",
  requireAuth,
  requireRole("ADMIN", "STAFF", "CLIENT"),
  validateRequest(createStripeCheckoutValidation),
  paymentController.createStripeCheckout
);
router38.post(
  "/bkash/checkout",
  requireAuth,
  requireRole("ADMIN", "STAFF", "CLIENT"),
  validateRequest(createBkashCheckoutValidation),
  paymentController.createBkashCheckout
);
router38.post(
  "/sslcommerz/checkout",
  requireAuth,
  requireRole("ADMIN", "STAFF", "CLIENT"),
  validateRequest(createSslcommerzCheckoutValidation),
  paymentController.createSslcommerzCheckout
);
router38.get("/me", requireAuth, requireRole("CLIENT"), paymentController.getMyPayments);
router38.get("/", requireAuth, requireRole("ADMIN", "STAFF"), paymentController.getAllPayments);
router38.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), paymentController.getPaymentById);
router38.post("/:id/refund", requireAuth, requireRole("ADMIN"), paymentController.refundStripePayment);
var paymentRoutes = router38;

// src/app/modules/portfolio/portfolio.routes.ts
import { Router as Router39 } from "express";

// src/app/modules/portfolio/portfolio.validation.ts
import { z as z39 } from "zod";
var slugPattern9 = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var slugField8 = z39.string().min(1, "Slug is required.").max(150).regex(slugPattern9, "Slug must be lowercase, alphanumeric, and hyphen-separated.");
var portfolioStatusEnum = z39.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
var createPortfolioValidation = z39.object({
  title: z39.string().min(1, "Title is required.").max(200),
  slug: slugField8,
  clientName: z39.string().min(1).optional(),
  industry: z39.string().min(1).optional(),
  location: z39.string().min(1).optional(),
  websiteUrl: z39.string().url().optional(),
  coverImage: z39.string().url().optional(),
  description: z39.string().max(5e3).optional(),
  technologies: z39.unknown().optional(),
  duration: z39.string().min(1).optional(),
  results: z39.unknown().optional(),
  seoTitle: z39.string().max(160).optional(),
  seoDescription: z39.string().max(300).optional(),
  isFeatured: z39.boolean().default(false)
});
var updatePortfolioValidation = z39.object({
  title: z39.string().min(1).max(200).optional(),
  slug: slugField8.optional(),
  clientName: z39.string().min(1).nullable().optional(),
  industry: z39.string().min(1).nullable().optional(),
  location: z39.string().min(1).nullable().optional(),
  websiteUrl: z39.string().url().nullable().optional(),
  coverImage: z39.string().url().nullable().optional(),
  description: z39.string().max(5e3).nullable().optional(),
  technologies: z39.unknown().nullable().optional(),
  duration: z39.string().min(1).nullable().optional(),
  results: z39.unknown().nullable().optional(),
  seoTitle: z39.string().max(160).nullable().optional(),
  seoDescription: z39.string().max(300).nullable().optional(),
  isFeatured: z39.boolean().optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
var updatePortfolioStatusValidation = z39.object({
  status: portfolioStatusEnum
});
var addPortfolioImageValidation = z39.object({
  altText: z39.string().max(200).optional(),
  caption: z39.string().max(300).optional(),
  order: z39.coerce.number().int().default(0)
});
var linkPortfolioServiceValidation = z39.object({
  serviceId: z39.string().min(1, "serviceId is required.")
});

// src/app/modules/portfolio/portfolio.controller.ts
import { StatusCodes as StatusCodes79 } from "http-status-codes";

// src/app/modules/portfolio/portfolio.service.ts
import { StatusCodes as StatusCodes78 } from "http-status-codes";

// src/app/modules/portfolio/portfolio.constant.ts
var portfolioQueryConfig = {
  searchableFields: ["title", "clientName", "industry", "description"],
  filterableFields: {
    slug: "string",
    industry: "string",
    status: { type: "enum", enum: { DRAFT: "DRAFT", PUBLISHED: "PUBLISHED", ARCHIVED: "ARCHIVED" } },
    isFeatured: "boolean"
  },
  sortableFields: ["createdAt", "publishedAt", "title"],
  includableRelations: ["images", "services"],
  defaultSortField: "createdAt"
};

// src/app/modules/portfolio/portfolio.service.ts
var portfolioDelegate = prisma.portfolio;
var toPrismaData7 = (payload) => ({
  ...payload,
  ...payload.technologies !== void 0 && {
    technologies: payload.technologies === null ? prismaNamespace_exports.JsonNull : payload.technologies
  },
  ...payload.results !== void 0 && {
    results: payload.results === null ? prismaNamespace_exports.JsonNull : payload.results
  }
});
var assertPortfolioExists = async (id) => {
  const portfolio = await prisma.portfolio.findUnique({ where: { id } });
  if (!portfolio) {
    throw new appError_default(StatusCodes78.NOT_FOUND, "Portfolio item not found.");
  }
  return portfolio;
};
var createPortfolioInDB = async (payload) => {
  return prisma.portfolio.create({ data: toPrismaData7(payload) });
};
var getAllPortfoliosFromDB = async (query, { publicOnly }) => {
  const effectiveQuery = { ...query };
  if (publicOnly) {
    effectiveQuery.status = "PUBLISHED";
  }
  const queryBuilder = new QueryBuilder(portfolioDelegate, portfolioQueryConfig);
  return queryBuilder.execute(effectiveQuery);
};
var getPortfolioBySlugFromDB = async (slug, { publicOnly }) => {
  const portfolio = await prisma.portfolio.findUnique({
    where: { slug },
    include: { images: { orderBy: { order: "asc" } }, services: { include: { service: true } } }
  });
  if (!portfolio || publicOnly && portfolio.status !== "PUBLISHED") {
    throw new appError_default(StatusCodes78.NOT_FOUND, "Portfolio item not found.");
  }
  return portfolio;
};
var getPortfolioByIdFromDB = async (id) => {
  const portfolio = await prisma.portfolio.findUnique({
    where: { id },
    include: { images: { orderBy: { order: "asc" } }, services: { include: { service: true } } }
  });
  if (!portfolio) {
    throw new appError_default(StatusCodes78.NOT_FOUND, "Portfolio item not found.");
  }
  return portfolio;
};
var updatePortfolioInDB = async (id, payload) => {
  await assertPortfolioExists(id);
  return prisma.portfolio.update({ where: { id }, data: toPrismaData7(payload) });
};
var updatePortfolioStatusInDB = async (id, status) => {
  const existing = await assertPortfolioExists(id);
  const publishedAt = status === "PUBLISHED" && !existing.publishedAt ? /* @__PURE__ */ new Date() : existing.publishedAt;
  return prisma.portfolio.update({ where: { id }, data: { status, publishedAt } });
};
var addPortfolioImageInDB = async (portfolioId, file, payload) => {
  await assertPortfolioExists(portfolioId);
  const uploadResult = await uploadFileToCloudinary(file.buffer, file.originalname, `portfolio/${portfolioId}`);
  return prisma.portfolioImage.create({
    data: {
      portfolioId,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      ...payload
    }
  });
};
var removePortfolioImageFromDB = async (imageId) => {
  const existing = await prisma.portfolioImage.findUnique({ where: { id: imageId } });
  if (!existing) {
    throw new appError_default(StatusCodes78.NOT_FOUND, "Portfolio image not found.");
  }
  if (existing.publicId) {
    try {
      await deleteFileFromCloudinary(existing.publicId);
    } catch (error) {
      console.error("[Portfolio] Failed to delete Cloudinary asset:", error);
    }
  }
  await prisma.portfolioImage.delete({ where: { id: imageId } });
};
var linkPortfolioServiceInDB = async (portfolioId, serviceId) => {
  await assertPortfolioExists(portfolioId);
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    throw new appError_default(StatusCodes78.BAD_REQUEST, "The provided serviceId does not match any service.");
  }
  const existing = await prisma.portfolioService.findUnique({
    where: { portfolioId_serviceId: { portfolioId, serviceId } }
  });
  if (existing) {
    throw new appError_default(StatusCodes78.CONFLICT, "This service is already linked to this portfolio item.");
  }
  return prisma.portfolioService.create({ data: { portfolioId, serviceId } });
};
var unlinkPortfolioServiceFromDB = async (portfolioId, serviceId) => {
  const existing = await prisma.portfolioService.findUnique({
    where: { portfolioId_serviceId: { portfolioId, serviceId } }
  });
  if (!existing) {
    throw new appError_default(StatusCodes78.NOT_FOUND, "This service is not linked to this portfolio item.");
  }
  await prisma.portfolioService.delete({ where: { portfolioId_serviceId: { portfolioId, serviceId } } });
};
var deletePortfolioFromDB = async (id) => {
  await assertPortfolioExists(id);
  await prisma.portfolio.delete({ where: { id } });
};
var portfolioService = {
  createPortfolioInDB,
  getAllPortfoliosFromDB,
  getPortfolioBySlugFromDB,
  getPortfolioByIdFromDB,
  updatePortfolioInDB,
  updatePortfolioStatusInDB,
  addPortfolioImageInDB,
  removePortfolioImageFromDB,
  linkPortfolioServiceInDB,
  unlinkPortfolioServiceFromDB,
  deletePortfolioFromDB
};

// src/app/modules/portfolio/portfolio.controller.ts
var createPortfolio = catchAsync(async (req, res) => {
  const portfolio = await portfolioService.createPortfolioInDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes79.CREATED,
    message: "Portfolio item created successfully.",
    data: portfolio
  });
});
var getAllPortfoliosPublic = catchAsync(async (req, res) => {
  const { data, meta } = await portfolioService.getAllPortfoliosFromDB(req.query, {
    publicOnly: true
  });
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes79.OK,
    message: "Portfolio items retrieved successfully.",
    data,
    meta
  });
});
var getAllPortfoliosAdmin = catchAsync(async (req, res) => {
  const { data, meta } = await portfolioService.getAllPortfoliosFromDB(req.query, {
    publicOnly: false
  });
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes79.OK,
    message: "Portfolio items retrieved successfully.",
    data,
    meta
  });
});
var getPortfolioBySlugPublic = catchAsync(async (req, res) => {
  const portfolio = await portfolioService.getPortfolioBySlugFromDB(req.params.slug, { publicOnly: true });
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes79.OK,
    message: "Portfolio item retrieved successfully.",
    data: portfolio
  });
});
var getPortfolioByIdAdmin = catchAsync(async (req, res) => {
  const portfolio = await portfolioService.getPortfolioByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes79.OK,
    message: "Portfolio item retrieved successfully.",
    data: portfolio
  });
});
var updatePortfolio = catchAsync(async (req, res) => {
  const portfolio = await portfolioService.updatePortfolioInDB(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes79.OK,
    message: "Portfolio item updated successfully.",
    data: portfolio
  });
});
var updatePortfolioStatus = catchAsync(async (req, res) => {
  const portfolio = await portfolioService.updatePortfolioStatusInDB(req.params.id, req.body.status);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes79.OK,
    message: "Portfolio status updated successfully.",
    data: portfolio
  });
});
var addPortfolioImage = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new appError_default(StatusCodes79.BAD_REQUEST, "An image file is required (field name: 'file').");
  }
  const image = await portfolioService.addPortfolioImageInDB(req.params.id, req.file, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes79.CREATED,
    message: "Image added successfully.",
    data: image
  });
});
var removePortfolioImage = catchAsync(async (req, res) => {
  await portfolioService.removePortfolioImageFromDB(req.params.imageId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes79.OK,
    message: "Image removed successfully.",
    data: null
  });
});
var linkPortfolioService = catchAsync(async (req, res) => {
  const link = await portfolioService.linkPortfolioServiceInDB(req.params.id, req.body.serviceId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes79.CREATED,
    message: "Service linked successfully.",
    data: link
  });
});
var unlinkPortfolioService = catchAsync(async (req, res) => {
  await portfolioService.unlinkPortfolioServiceFromDB(req.params.id, req.params.serviceId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes79.OK,
    message: "Service unlinked successfully.",
    data: null
  });
});
var deletePortfolio = catchAsync(async (req, res) => {
  await portfolioService.deletePortfolioFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes79.OK,
    message: "Portfolio item deleted successfully.",
    data: null
  });
});
var portfolioController = {
  createPortfolio,
  getAllPortfoliosPublic,
  getAllPortfoliosAdmin,
  getPortfolioBySlugPublic,
  getPortfolioByIdAdmin,
  updatePortfolio,
  updatePortfolioStatus,
  addPortfolioImage,
  removePortfolioImage,
  linkPortfolioService,
  unlinkPortfolioService,
  deletePortfolio
};

// src/app/modules/portfolio/portfolio.routes.ts
var router39 = Router39();
router39.get("/", portfolioController.getAllPortfoliosPublic);
router39.get("/manage", requireAuth, requireRole("ADMIN", "STAFF"), portfolioController.getAllPortfoliosAdmin);
router39.get("/manage/:id", requireAuth, requireRole("ADMIN", "STAFF"), portfolioController.getPortfolioByIdAdmin);
router39.get("/:slug", portfolioController.getPortfolioBySlugPublic);
router39.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(createPortfolioValidation),
  portfolioController.createPortfolio
);
router39.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updatePortfolioValidation),
  portfolioController.updatePortfolio
);
router39.patch(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(updatePortfolioStatusValidation),
  portfolioController.updatePortfolioStatus
);
router39.post(
  "/:id/images",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  imageUpload.single("file"),
  validateRequest(addPortfolioImageValidation),
  portfolioController.addPortfolioImage
);
router39.delete("/images/:imageId", requireAuth, requireRole("ADMIN", "STAFF"), portfolioController.removePortfolioImage);
router39.post(
  "/:id/services",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validateRequest(linkPortfolioServiceValidation),
  portfolioController.linkPortfolioService
);
router39.delete("/:id/services/:serviceId", requireAuth, requireRole("ADMIN", "STAFF"), portfolioController.unlinkPortfolioService);
router39.delete("/:id", requireAuth, requireRole("ADMIN"), portfolioController.deletePortfolio);
var portfolioRoutes = router39;

// src/app/routes/index.ts
var router40 = Router40();
var moduleRoutes = [
  { path: "/auth", route: authRoutes },
  { path: "/users", route: userRoutes },
  { path: "/staff", route: staffRoutes },
  { path: "/clients", route: clientRoutes },
  { path: "/services", route: serviceRoutes },
  { path: "/pricing-plans", route: pricingPlanRoutes },
  { path: "/leads", route: leadRoutes },
  { path: "/consultations", route: consultationRoutes },
  { path: "/proposals", route: proposalRoutes },
  { path: "/projects", route: projectRoutes },
  { path: "/project-members", route: projectMemberRoutes },
  { path: "/project-milestones", route: projectMilestoneRoutes },
  { path: "/project-tasks", route: projectTaskRoutes },
  { path: "/project-files", route: projectFileRoutes },
  { path: "/client-reviews", route: clientReviewRoutes },
  { path: "/client-appreciations", route: clientAppreciationRoutes },
  { path: "/portfolio", route: portfolioRoutes },
  { path: "/case-studies", route: caseStudyRoutes },
  { path: "/testimonials", route: testimonialRoutes },
  { path: "/faqs", route: faqRoutes },
  { path: "/blog-categories", route: blogCategoryRoutes },
  { path: "/blog-tags", route: blogTagRoutes },
  { path: "/blog-posts", route: blogPostRoutes },
  { path: "/media", route: mediaRoutes },
  { path: "/seo/keyword-rankings", route: keywordRankingRoutes },
  { path: "/seo/backlinks", route: backlinkRoutes },
  { path: "/seo/citations", route: citationRoutes },
  { path: "/seo/google-business-profiles", route: googleBusinessProfileRoutes },
  { path: "/seo/audits", route: seoAuditRoutes },
  { path: "/seo/performance-reports", route: performanceReportRoutes },
  { path: "/seo/review-monitors", route: reviewMonitorRoutes },
  { path: "/seo/service-areas", route: serviceAreaRoutes },
  { path: "/seo/call-logs", route: callLogRoutes },
  { path: "/seo/tracking-configs", route: trackingConfigRoutes },
  { path: "/contact-messages", route: contactMessageRoutes },
  { path: "/notifications", route: notificationRoutes },
  { path: "/site-settings", route: siteSettingRoutes },
  { path: "/payments", route: paymentRoutes }
];
for (const { path: path2, route } of moduleRoutes) {
  router40.use(path2, route);
}
var globalRoutes = router40;

// src/app.ts
var app = express2();
app.set("trust proxy", 1);
if (config_default.app.env === "production") {
  app.use(forceHttps);
}
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin"
    }
  })
);
app.use(
  (req, res, next) => {
    const startedAt = Date.now();
    res.on("finish", () => {
      console.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`
      );
    });
    next();
  }
);
var allowedOrigins = config_default.app.clientUrl.split(",").map((origin) => origin.trim()).filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
      "PATCH"
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "Origin",
      "X-Requested-With"
    ]
  })
);
app.use(
  "/api/auth/sign-in",
  authRateLimiter
);
app.use(
  "/api/auth/sign-up",
  authRateLimiter
);
app.use(
  "/api/auth/email-otp",
  authRateLimiter
);
app.use(
  "/api/auth/forget-password",
  authRateLimiter
);
app.use(
  "/api/v1/webhooks",
  webhookRoutes
);
app.all(
  "/api/auth/*splat",
  toNodeHandler(auth)
);
app.use(
  express2.json({
    limit: "10mb"
  })
);
app.use(sanitizeBody);
app.use(
  express2.urlencoded({
    extended: true,
    limit: "10mb"
  })
);
app.use(cookieParser());
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running."
  });
});
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      status: "healthy",
      database: "connected"
    });
  } catch (error) {
    console.error(
      "[Health] Database health check failed:",
      error
    );
    res.status(503).json({
      success: false,
      status: "unhealthy",
      database: "disconnected"
    });
  }
});
app.use(
  "/api/v1",
  generalRateLimiter,
  globalRoutes
);
app.use(notFound);
app.use(globalErrorHandler);
var app_default = app;

// src/server.ts
var PORT = config_default.app.port;
var server;
async function main() {
  try {
    await prisma.$connect();
    console.log("Connected to the database successfully.");
    server = app_default.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}
var shutdown = async (signal) => {
  console.log(`
${signal} received. Shutting down gracefully...`);
  server?.close(async () => {
    await prisma.$disconnect();
    console.log("Server closed, database disconnected.");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 1e4).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  shutdown("unhandledRejection");
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  shutdown("uncaughtException");
});
main();
//# sourceMappingURL=server.js.map