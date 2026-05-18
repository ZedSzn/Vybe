const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Resend } = require('resend');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Warn loudly if using default JWT secret in production
if ((process.env.JWT_SECRET || 'vybe_secret') === 'vybe_secret') {
  console.warn('⚠️  WARNING: JWT_SECRET is not set — using insecure default. Set JWT_SECRET in your .env file!');
}

// Disable Mongoose buffering globally — queries fail immediately if DB is down
// instead of queuing for 10 seconds and timing out
mongoose.set('bufferCommands', false);

const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping email to', to);
    return;
  }
  const fromDomain = process.env.EMAIL_FROM_DOMAIN || 'vybelivechat.com';
  const { data, error } = await resend.emails.send({
    from: `Vybe <noreply@${fromDomain}>`,
    to,
    subject,
    html,
  });
  if (error) {
    console.error('[email] Resend error:', error);
    throw new Error(error.message || 'Failed to send email');
  }
  return data;
}

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://vybelivechat.com',
  'https://www.vybelivechat.com',
  'https://vybe-ebon-delta.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean)

const corsOptions = {
  origin: (origin, cb) => {
    // allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true,
}

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
});

app.use(cors(corsOptions));

// Allow camera + microphone from any origin (required for mobile browsers)
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=*, microphone=*');
  next();
});

// ─── Stripe Webhook — before express.json() ────────────────────────────────────
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.json({ received: true });
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session      = event.data.object;
      const userId       = session.metadata?.userId;
      const purchaseType = session.metadata?.purchaseType;
      if (userId && session.payment_status === 'paid') {
        if (purchaseType === 'coin_purchase') {
          const coinsAmount = Number(session.metadata?.coinsAmount || 0);
          if (coinsAmount > 0) {
            // Idempotency: only process if not already completed
            const existing = await CoinPurchase.findOne({ stripeSessionId: session.id, status: 'completed' });
            if (!existing) {
              await addCoins(userId, coinsAmount, `Purchased ${coinsAmount} coins`, 'purchase');
              await CoinPurchase.findOneAndUpdate(
                { stripeSessionId: session.id },
                { status: 'completed', completedAt: new Date() },
              );
            }
          }
        } else if (purchaseType === 'subscription') {
          const plan             = session.metadata?.plan;
          const isTrial          = session.metadata?.isTrial === 'true';
          const stripeSubId      = session.subscription;
          const stripeCustomerId = session.customer;
          if (plan && stripeSubId) {
            const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
            const isTrialing = stripeSub.status === 'trialing';
            const trialEnd   = stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null;
            await Subscription.findOneAndUpdate(
              { userId },
              {
                userId, stripeSubscriptionId: stripeSubId, stripeCustomerId,
                plan, status: isTrialing ? 'trialing' : 'active',
                currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
                cancelAtPeriodEnd: false,
                isTrial: isTrial || isTrialing,
                trialEnd: trialEnd,
                updatedAt: new Date(),
              },
              { upsert: true, new: true },
            );
            await User.findByIdAndUpdate(userId, {
              isPremium:    true,
              isVip:        plan === 'vip',
              stripeCustomerId,
              trialActive:  isTrialing,
              trialUsed:    isTrial || isTrialing ? true : undefined,
            });
            if (isTrial || isTrialing) {
              const u = await User.findById(userId).select('email username');
              await createNotification(userId, 'system', '🎉 VIP Trial Started!',
                'Your 7-day VIP trial is active. Enjoy gender filter, country filter and your VIP badge!');
              await sendEmail({
                to: u.email,
                subject: '🎉 Your Vybe VIP trial has started!',
                html: `<p>Hi ${u.username},</p><p>Welcome to your 7-day VIP trial! You now have access to gender filter, country filter, and your VIP badge.</p><p>If you don't cancel before day 7, you'll be charged £12.99/month automatically.</p><p>You can cancel anytime from your subscription page. Cancelling immediately removes VIP access.</p>`,
              });
            } else {
              await createNotification(userId, 'system', '🎉 Subscription Active!',
                `Your Vybe ${plan === 'vip' ? 'VIP' : 'Basic'} plan is now active.`);
            }
          }
        } else {
          // Unban purchase — idempotency check
          const existingUnban = await UnbanPurchase.findOne({ stripeSessionId: session.id, status: 'completed' });
          if (!existingUnban) {
            await User.findByIdAndUpdate(userId, {
              isBanned: false, banReason: '', banType: null, banExpiresAt: null, bannedAt: null,
              $push: { banHistory: { action: 'unban', unbannedBy: 'payment', note: 'Ban removed via £4.99 unban purchase', timestamp: new Date() } },
            });
            await UnbanPurchase.findOneAndUpdate(
              { stripeSessionId: session.id },
              { status: 'completed', completedAt: new Date() },
            );
          }
        }
      }
    } else if (event.type === 'customer.subscription.updated') {
      const stripeSub = event.data.object;
      const sub = await Subscription.findOne({ stripeSubscriptionId: stripeSub.id });
      if (sub) {
        const newStatus = stripeSub.status === 'active'   ? 'active'
          : stripeSub.status === 'trialing'  ? 'trialing'
          : stripeSub.status === 'past_due'  ? 'past_due'
          : stripeSub.status === 'unpaid'    ? 'unpaid'
          : 'cancelled';
        await Subscription.findByIdAndUpdate(sub._id, {
          status: newStatus,
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          updatedAt: new Date(),
        });
        if (newStatus === 'active' || newStatus === 'trialing') {
          await User.findByIdAndUpdate(sub.userId, {
            isPremium:   true,
            isVip:       sub.plan === 'vip',
            trialActive: newStatus === 'trialing',
          });
        } else {
          await User.findByIdAndUpdate(sub.userId, { isPremium: false, isVip: false, trialActive: false });
        }
      }
    } else if (event.type === 'customer.subscription.trial_will_end') {
      // Fires 3 days before trial ends
      const stripeSub = event.data.object;
      const sub = await Subscription.findOne({ stripeSubscriptionId: stripeSub.id });
      if (sub) {
        const u = await User.findById(sub.userId).select('email username');
        const trialEnd = new Date(stripeSub.trial_end * 1000);
        await createNotification(sub.userId, 'system', '⏰ Trial Ending Soon',
          `Your VIP trial ends on ${trialEnd.toLocaleDateString()}. Cancel now to avoid being charged £12.99.`);
        await sendEmail({
          to: u.email,
          subject: '⏰ Your Vybe VIP trial ends in 3 days',
          html: `<p>Hi ${u.username},</p><p>Your VIP trial ends on ${trialEnd.toLocaleDateString()}.</p><p>If you don't cancel, you'll be charged £12.99/month automatically.</p><p>Cancel anytime from your <a href="${process.env.CLIENT_URL || 'https://vybe.chat'}/subscription">subscription page</a>. Note: cancelling immediately removes VIP access.</p>`,
        });
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const stripeSub = event.data.object;
      const sub = await Subscription.findOne({ stripeSubscriptionId: stripeSub.id });
      if (sub) {
        await Subscription.findByIdAndUpdate(sub._id, { status: 'cancelled', updatedAt: new Date() });
        await User.findByIdAndUpdate(sub.userId, { isPremium: false, isVip: false, trialActive: false });
        const u = await User.findById(sub.userId).select('email username');
        const isTrial = sub.isTrial;
        await createNotification(sub.userId, 'system', isTrial ? '❌ Trial Cancelled' : '❌ Subscription Cancelled',
          isTrial ? 'Your VIP trial has been cancelled. Your card will not be charged.' : 'Your Vybe subscription has been cancelled. You can resubscribe anytime.');
        await sendEmail({
          to: u.email,
          subject: isTrial ? 'Your Vybe VIP trial has been cancelled' : 'Your Vybe subscription has been cancelled',
          html: isTrial
            ? `<p>Hi ${u.username},</p><p>Your VIP trial has been cancelled and your VIP access has been removed immediately. Your card will not be charged.</p>`
            : `<p>Hi ${u.username},</p><p>Your Vybe subscription has been cancelled. You can resubscribe anytime at vybe.chat/subscription.</p>`,
        });
      }
    } else if (event.type === 'invoice.payment_failed') {
      const invoice   = event.data.object;
      const customerId = invoice.customer;
      const sub = await Subscription.findOne({ stripeCustomerId: customerId });
      if (sub) {
        await createNotification(sub.userId, 'system', '💳 Payment Failed',
          'Your subscription payment failed. Please update your payment method to keep your plan.');
      }
    } else if (event.type === 'invoice.payment_succeeded') {
      const invoice    = event.data.object;
      const stripeSubId = invoice.subscription;
      if (stripeSubId) {
        const sub = await Subscription.findOne({ stripeSubscriptionId: stripeSubId });
        if (sub) {
          const isFirstCharge = invoice.billing_reason === 'subscription_create' || invoice.billing_reason === 'subscription_cycle';
          if (isFirstCharge) {
            await Subscription.findByIdAndUpdate(sub._id, {
              status: 'active',
              currentPeriodEnd: new Date(invoice.period_end * 1000),
              updatedAt: new Date(),
            });
            await User.findByIdAndUpdate(sub.userId, { isPremium: true, isVip: sub.plan === 'vip', trialActive: false });
            const u = await User.findById(sub.userId).select('email username');
            const label = sub.plan === 'vip' ? 'VIP' : 'Basic';
            if (invoice.billing_reason === 'subscription_create' && sub.isTrial) {
              await createNotification(sub.userId, 'system', '✅ VIP Trial Converted',
                `Your trial has ended and you've been charged £12.99. Your VIP plan is now active.`);
              await sendEmail({
                to: u.email,
                subject: '✅ Your Vybe VIP subscription is now active',
                html: `<p>Hi ${u.username},</p><p>Your 7-day trial has ended and your VIP subscription is now active at £12.99/month.</p>`,
              });
            } else if (invoice.billing_reason === 'subscription_cycle') {
              await createNotification(sub.userId, 'system', `✅ ${label} Plan Renewed`,
                `Your Vybe ${label} plan has been renewed.`);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err.message);
  }

  res.json({ received: true });
});

// Raised limit: avatar, banner, and camera-background images are sent as base64.
app.use(express.json({ limit: '12mb' }));

// ─── MongoDB — retry connection ────────────────────────────────────────────────
let dbConnected = false;

async function connectMongo(attempt = 1) {
  const MAX = 3;
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    console.error('❌ MONGODB_URI is not set in .env');
    console.error('   → Add your Atlas URI: mongodb+srv://<user>:<pass>@cluster.xxxxx.mongodb.net/vybe?retryWrites=true&w=majority');
    return;
  }

  const safeUri = uri.replace(/:\/\/[^@]+@/, '://<credentials>@');
  console.log(`🔄 MongoDB connecting (attempt ${attempt}/${MAX})… ${safeUri}`);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS:          45000,
      bufferCommands:           false,  // fail fast — don't buffer when disconnected
    });
    dbConnected = true;
    console.log(`✅ MongoDB connected`);
  } catch (err) {
    console.error(`❌ MongoDB failed (attempt ${attempt}/${MAX}): ${err.message}`);
    if (attempt < MAX) {
      const delay = attempt * 5000;
      console.log(`⏳ Retrying in ${delay / 1000}s…`);
      await new Promise(r => setTimeout(r, delay));
      return connectMongo(attempt + 1);
    }
    console.error('💀 MongoDB unavailable after 3 attempts. Auth/profile routes will fail.');
    console.error('   → Fix: Set MONGODB_URI in backend/.env to your MongoDB Atlas connection string.');
    console.error('   → Atlas format: mongodb+srv://<user>:<pass>@cluster.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority');
  }
}

mongoose.connection.on('disconnected', () => {
  dbConnected = false;
  console.warn('⚠️  MongoDB disconnected');
});
mongoose.connection.on('reconnected', () => {
  dbConnected = true;
  console.log('✅ MongoDB reconnected');
});

connectMongo();

// ─── Schemas ───────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  username:       { type: String, required: true, unique: true, trim: true },
  email:          { type: String, required: true, unique: true, lowercase: true },
  password:       { type: String, required: true },
  isPremium:      { type: Boolean, default: false },
  isVip:          { type: Boolean, default: false },
  isAdmin:        { type: Boolean, default: false },
  isBanned:       { type: Boolean, default: false },
  banReason:      { type: String, default: '' },
  banType:        { type: String, enum: ['24h', '7d', '14d', '30d', 'permanent', null], default: null },
  banExpiresAt:   { type: Date, default: null },
  bannedAt:       { type: Date },
  violationCount: { type: Number, default: 0 },
  coins:          { type: Number, default: 0 },
  cashableCoins:  { type: Number, default: 0 }, // tips received — can only be cashed out, never spent
  gender:         { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  country:        { type: String, default: '' },
  createdAt:      { type: Date, default: Date.now },
  emailVerified:             { type: Boolean, default: false },
  emailVerificationToken:    { type: String, default: null },
  emailVerificationExpires:  { type: Date,   default: null },
  passwordResetToken:        { type: String, default: null },
  passwordResetExpires:      { type: Date,   default: null },
  banHistory: [{
    action:      { type: String, enum: ['ban', 'unban'], required: true },
    banType:     String,
    reason:      String,
    note:        String,
    unbannedBy:  String,
    timestamp:   { type: Date, default: Date.now },
  }],
  warnings: [{
    message:  String,
    read:     { type: Boolean, default: false },
    issuedAt: { type: Date, default: Date.now },
  }],
  // Profile
  bio:          { type: String, default: '', maxlength: 100 },
  avatar:       { type: String, default: '' }, // base64 data URI or URL
  referralCode: { type: String, unique: true, sparse: true },
  referredBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  referralCount: { type: Number, default: 0 }, // friends who signed up
  // Activity
  totalChats:    { type: Number, default: 0 },
  loginStreak:   { type: Number, default: 0 },
  giftsReceived:        { type: Number, default: 0 },
  countriesChattedWith: { type: [String], default: [] },
  longestStreak: { type: Number, default: 0 },
  lastLoginDate: { type: Date, default: null },
  // Gifting
  giftCollection:    { type: [String], default: [] }, // unlocked gift ids
  totalCoinsGifted:  { type: Number, default: 0 },
  weeklyCoinsGifted: { type: Number, default: 0 },
  gifterRank:        { type: String, default: 'Newcomer' },
  // Social
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Coin history (capped at 200 entries)
  coinHistory: [{
    amount:    Number,
    reason:    String,
    type:      { type: String, default: 'bonus' }, // signup|bonus|streak|referral|ad|chat_reward|purchase|tip_received|tip_sent|gift|boost|skip_queue|replay|cashout|cashout_refund|badge|border
    timestamp: { type: Date, default: Date.now },
  }],
  // Privacy
  privacyShowCountry: { type: Boolean, default: true },
  privacyShowBio:     { type: Boolean, default: true },
  allowFriendRequests:{ type: Boolean, default: true },
  // Coin economy extras
  paypalEmail:      { type: String, default: '' },
  tipsEarned:       { type: Number, default: 0 },
  boostedUntil:     { type: Date, default: null },
  stripeCustomerId: { type: String, default: null },
  trialUsed:        { type: Boolean, default: false },
  trialActive:      { type: Boolean, default: false },
  equippedBadges:   { type: [String], default: [] },
  borderColor:      { type: String, default: '' },
  animatedBorder:   { type: Boolean, default: false },
  accentColor:          { type: String, default: '' },
  bannerGradient:       { type: String, default: '' },
  bannerImage:          { type: String, default: '' },
  cameraBackground:     { type: String, default: 'none' },
  cameraBackgroundImage:{ type: String, default: '' },
});

const reportSchema = new mongoose.Schema({
  reportedSocketId: { type: String, required: true },
  reportedUserId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reporterSocketId: { type: String },
  reporterUserId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reason:   { type: String, required: true, enum: ['nudity', 'harassment', 'underage', 'spam', 'other'] },
  resolved: { type: Boolean, default: false },
  dismissed:  { type: Boolean, default: false },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolvedAt: { type: Date },
  createdAt:  { type: Date, default: Date.now },
});

const unbanPurchaseSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stripeSessionId: { type: String, required: true, unique: true },
  amount:          { type: Number, default: 4.99 },
  status:          { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  banType:         { type: String },
  createdAt:       { type: Date, default: Date.now },
  completedAt:     { type: Date },
});

const banAppealSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username:   { type: String },
  email:      { type: String },
  message:    { type: String, required: true },
  banReason:  { type: String },
  banType:    { type: String },
  status:     { type: String, enum: ['pending', 'resolved'], default: 'pending' },
  adminNote:  { type: String, default: '' },
  createdAt:  { type: Date, default: Date.now },
  resolvedAt: { type: Date },
});

const adminLogSchema = new mongoose.Schema({
  action:          { type: String, required: true },
  targetUserId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  targetUsername:  { type: String, default: '' },
  details:         { type: String, default: '' },
  timestamp:       { type: Date, default: Date.now },
});

const friendshipSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:    { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

const directMessageSchema = new mongoose.Schema({
  from:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:   { type: String, required: true, maxlength: 1000 },
  read:      { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
directMessageSchema.index({ from: 1, to: 1, createdAt: -1 });
directMessageSchema.index({ to: 1, read: 1 });

const notificationSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type:      { type: String, required: true }, // friend_request | coin_reward | streak | warning | system
  title:     { type: String, default: '' },
  message:   { type: String, default: '' },
  read:      { type: Boolean, default: false },
  data:      { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
});

const appSettingsSchema = new mongoose.Schema({
  maintenanceMode:     { type: Boolean, default: false },
  maintenanceMessage:  { type: String, default: 'Vybe is temporarily down for maintenance. Be back soon! 🚀' },
  reportThreshold:     { type: Number, default: 3 },
  announcement:        { type: String, default: '' },
  announcementActive:  { type: Boolean, default: false },
  adminPasswordHash:   { type: String, default: null },
  updatedAt:           { type: Date, default: Date.now },
});

const cashOutSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coinsAmount: { type: Number, required: true },
  gbpAmount:   { type: Number, required: true },
  paypalEmail: { type: String, required: true },
  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote:   { type: String, default: '' },
  createdAt:   { type: Date, default: Date.now },
  processedAt: { type: Date },
});

const coinPurchaseSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stripeSessionId: { type: String, required: true, unique: true },
  coinsAmount:     { type: Number, required: true },
  gbpAmount:       { type: Number, required: true },
  status:          { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  createdAt:       { type: Date, default: Date.now },
  completedAt:     { type: Date },
});

const subscriptionSchema = new mongoose.Schema({
  userId:               { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  stripeSubscriptionId: { type: String, required: true, unique: true },
  stripeCustomerId:     { type: String, required: true },
  plan:                 { type: String, enum: ['basic', 'vip'], required: true },
  status:               { type: String, enum: ['active', 'trialing', 'past_due', 'cancelled', 'unpaid', 'incomplete'], default: 'active' },
  currentPeriodEnd:     { type: Date },
  cancelAtPeriodEnd:    { type: Boolean, default: false },
  isTrial:              { type: Boolean, default: false },
  trialEnd:             { type: Date },
  createdAt:            { type: Date, default: Date.now },
  updatedAt:            { type: Date, default: Date.now },
});

const userBadgeSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  badgeId:     { type: String, required: true },
  purchasedAt: { type: Date, default: Date.now },
});
userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

const User            = mongoose.model('User',            userSchema);
const Report          = mongoose.model('Report',          reportSchema);
const UnbanPurchase   = mongoose.model('UnbanPurchase',   unbanPurchaseSchema);
const BanAppeal       = mongoose.model('BanAppeal',       banAppealSchema);
const AdminLog        = mongoose.model('AdminLog',        adminLogSchema);
const Friendship      = mongoose.model('Friendship',      friendshipSchema);
const AppSettings     = mongoose.model('AppSettings',     appSettingsSchema);
const Notification    = mongoose.model('Notification',    notificationSchema);
const CashOutRequest  = mongoose.model('CashOutRequest',  cashOutSchema);
const CoinPurchase    = mongoose.model('CoinPurchase',    coinPurchaseSchema);
const Subscription    = mongoose.model('Subscription',    subscriptionSchema);
const DirectMessage   = mongoose.model('DirectMessage',   directMessageSchema);
const UserBadge       = mongoose.model('UserBadge',       userBadgeSchema);

// ─── Settings cache ────────────────────────────────────────────────────────────
let settingsCache = null;
async function getSettings() {
  if (settingsCache) return settingsCache;
  settingsCache = await AppSettings.findOne() || await AppSettings.create({});
  return settingsCache;
}
function invalidateSettings() { settingsCache = null; }

// ─── Admin failed attempts tracking ──────────────────────────────────────────
const adminFailedAttempts = new Map(); // attemptKey → { count, lockedUntil }

// ─── Middleware ────────────────────────────────────────────────────────────────
const adminMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vybe_secret');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (!user.isAdmin && user.email !== process.env.ADMIN_EMAIL)
      return res.status(403).json({ error: 'Admin access required' });
    req.user = user;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vybe_secret');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};

// Returns 404 for non-admins so the route appears non-existent
const adminSecureMiddleware = (req, res, next) => {
  const token = req.headers['x-admin-token'] || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(404).json({ error: 'Not found' });
  try {
    const decoded = jwt.verify(token, process.env.ADMIN_SECRET || 'vybe_admin_secret_2024');
    if (decoded.type !== 'admin') return res.status(404).json({ error: 'Not found' });
    req.admin = decoded;
    next();
  } catch { res.status(404).json({ error: 'Not found' }); }
};

function getBanDuration(violationCount) {
  if (violationCount >= 4) return { banType: 'permanent', banExpiresAt: null };
  const durations = ['24h', '7d', '14d', '30d'];
  const ms        = [86400000, 604800000, 1209600000, 2592000000];
  return { banType: durations[violationCount], banExpiresAt: new Date(Date.now() + ms[violationCount]) };
}

const serializeUser = (user, extra = {}) => ({
  id:            user._id,
  username:      user.username,
  email:         user.email,
  isPremium:     user.isPremium,
  isVip:         user.isVip,
  isAdmin:       user.isAdmin || user.email === process.env.ADMIN_EMAIL,
  isOwner:       user.email === process.env.ADMIN_EMAIL,
  isBanned:      user.isBanned,
  banReason:     user.banReason,
  banType:       user.banType,
  banExpiresAt:  user.banExpiresAt,
  coins:         user.coins,
  cashableCoins: user.cashableCoins || 0,
  emailVerified: user.emailVerified ?? false,
  allowFriendRequests: user.allowFriendRequests !== false,
  bio:           user.bio       || '',
  avatar:        user.avatar    || '',
  referralCode:  user.referralCode || '',
  totalChats:    user.totalChats || 0,
  loginStreak:   user.loginStreak || 0,
  longestStreak: user.longestStreak || 0,
  giftsReceived:  user.giftsReceived || 0,
  countriesCount: (user.countriesChattedWith || []).length,
  gender:         user.gender         || 'other',
  country:        user.country        || '',
  createdAt:      user.createdAt,
  equippedBadges: user.equippedBadges || [],
  borderColor:    user.borderColor    || '',
  animatedBorder: user.animatedBorder || false,
  accentColor:           user.accentColor           || '',
  bannerGradient:        user.bannerGradient        || '',
  bannerImage:           user.bannerImage           || '',
  cameraBackground:      user.cameraBackground      || 'none',
  cameraBackgroundImage: user.cameraBackgroundImage || '',
  ...extra,
});

async function logAdminAction(action, targetUserId, targetUsername, details) {
  try { await AdminLog.create({ action, targetUserId: targetUserId || null, targetUsername: targetUsername || '', details: details || '' }); } catch {}
}

// ─── Helper: add coins + notify ───────────────────────────────────────────────
async function addCoins(userId, amount, reason, type = 'bonus') {
  try {
    const user = await User.findByIdAndUpdate(userId, {
      $inc: { coins: amount },
      $push: { coinHistory: { $each: [{ amount, reason, type, timestamp: new Date() }], $slice: -200 } },
    }, { new: true });
    if (user) {
      await createNotification(userId, 'coin_reward', `+${amount} Coins`, reason);
      // Notify if online
      for (const [socketId, data] of onlineUsers.entries()) {
        if (String(data.userId) === String(userId)) {
          io.to(socketId).emit('coin-update', { coins: user.coins, amount, reason });
        }
      }
    }
  } catch {}
}

// ─── Helper: generate referral code ───────────────────────────────────────────
function genReferralCode(username) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = username.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  while (code.length < 3) code += 'X';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ─── Helper: create notification ──────────────────────────────────────────────
async function createNotification(userId, type, title, message, data = {}) {
  try {
    const n = await Notification.create({ userId, type, title, message, data });
    for (const [socketId, d] of onlineUsers.entries()) {
      if (String(d.userId) === String(userId)) {
        io.to(socketId).emit('notification', { id: n._id, type, title, message, data, createdAt: n.createdAt });
      }
    }
  } catch {}
}

// Helper: push a ban event and kick the user off socket
function kickBannedUser(userId, reason, banType, banExpiresAt) {
  for (const [socketId, data] of onlineUsers.entries()) {
    if (String(data.userId) === String(userId)) {
      const s = io.sockets.sockets.get(socketId);
      if (s) {
        s.emit('you-are-banned', { reason, banType, banExpiresAt });
        setTimeout(() => s.disconnect(), 1500);
      }
    }
  }
}

// ─── Auth Rate Limiters ───────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
});

// ─── Auth Routes ───────────────────────────────────────────────────────────────
app.post('/api/auth/register', authLimiter, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database not connected. Check MONGODB_URI in your .env file.' });
  try {
    const { username, email, password, referralCode: refCode, gender } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (!['male', 'female'].includes(gender)) return res.status(400).json({ error: 'Please select your gender' });
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ error: 'Email or username already taken' });
    const isAdmin = email === process.env.ADMIN_EMAIL;

    // Generate unique referral code
    let myReferralCode = genReferralCode(username);
    let attempt = 0;
    while (await User.exists({ referralCode: myReferralCode }) && attempt++ < 10)
      myReferralCode = genReferralCode(username) + attempt;

    // Handle referral
    let referredBy = null;
    if (refCode) {
      const referrer = await User.findOne({ referralCode: refCode.toUpperCase() });
      if (referrer) referredBy = referrer._id;
    }

    const verifyToken   = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = await User.create({
      username, email,
      password: await bcrypt.hash(password, 10),
      gender,
      isAdmin,
      emailVerified: isAdmin,
      emailVerificationToken:   isAdmin ? null : verifyToken,
      emailVerificationExpires: isAdmin ? null : verifyExpires,
      referralCode: myReferralCode,
      referredBy,
    });


    // Award referral coins to both parties
    if (referredBy) {
      await addCoins(referredBy, 50, `Referral bonus — ${username} signed up using your link`, 'referral');
      await User.findByIdAndUpdate(referredBy, { $inc: { referralCount: 1 } });
      await addCoins(user._id, 50, 'Welcome bonus — joined via referral link', 'referral');
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to Vybe — verify your email',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0d0d18;color:#fff;padding:40px 32px;border-radius:16px;border:1px solid rgba(168,85,247,0.2);">
            <h2 style="color:#a855f7;margin:0 0 6px;">Welcome to Vybe, ${username}! 👋</h2>
            <p style="color:#aaa;margin:0 0 24px;font-size:14px;line-height:1.6;">
              Thanks for signing up. Your account is ready — just verify your email to unlock everything.
            </p>
            <a href="${clientUrl}/verify-email?token=${verifyToken}"
               style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
              Verify My Email
            </a>
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:32px 0;" />
            <p style="color:#555;font-size:12px;margin:0;">
              This link expires in 24 hours. If you didn't create a Vybe account, you can safely ignore this email.
            </p>
          </div>`,
      });
    } catch (emailErr) {
      console.error('[email] Failed to send welcome email:', emailErr.message);
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'vybe_secret', { expiresIn: '7d' });
    res.json({ token, user: serializeUser(user), emailVerificationSent: !isAdmin });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Verify email
app.get('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Missing token' });
    const user = await User.findOne({ emailVerificationToken: token, emailVerificationExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired verification link' });
    await User.findByIdAndUpdate(user._id, {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Resend verification email
app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: true }); // silent no-op for security
    if (user.emailVerified) return res.status(400).json({ error: 'Email already verified' });

    const verifyToken   = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await User.findByIdAndUpdate(user._id, {
      emailVerificationToken: verifyToken,
      emailVerificationExpires: verifyExpires,
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    await sendEmail({
      to: email,
      subject: 'Verify your Vybe account',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0d0d18;color:#fff;padding:32px;border-radius:16px;">
          <h2 style="color:#a855f7;">Verify your email</h2>
          <p style="color:#aaa;">Here's a fresh verification link for your Vybe account.</p>
          <a href="${clientUrl}/verify-email?token=${verifyToken}"
             style="display:inline-block;margin-top:24px;padding:14px 28px;background:#a855f7;color:#fff;border-radius:12px;text-decoration:none;font-weight:700;">
            Verify Email
          </a>
          <p style="color:#555;font-size:12px;margin-top:24px;">Link expires in 24 hours.</p>
        </div>`,
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Forgot password — sends reset link
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: true }); // silent no-op

    const resetToken   = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await User.findByIdAndUpdate(user._id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    await sendEmail({
      to: email,
      subject: 'Reset your Vybe password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0d0d18;color:#fff;padding:32px;border-radius:16px;">
          <h2 style="color:#a855f7;">Password Reset</h2>
          <p style="color:#aaa;">You requested a password reset for your Vybe account. Click below to set a new password.</p>
          <a href="${clientUrl}/reset-password?token=${resetToken}"
             style="display:inline-block;margin-top:24px;padding:14px 28px;background:#a855f7;color:#fff;border-radius:12px;text-decoration:none;font-weight:700;">
            Reset Password
          </a>
          <p style="color:#555;font-size:12px;margin-top:24px;">Link expires in 1 hour. If you didn't request this, ignore it.</p>
        </div>`,
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Reset password with token
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const user = await User.findOne({ passwordResetToken: token, passwordResetExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset link' });

    await User.findByIdAndUpdate(user._id, {
      password: await bcrypt.hash(password, 10),
      passwordResetToken: null,
      passwordResetExpires: null,
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database not connected. Check MONGODB_URI in your .env file.' });
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'No account found with that email' });
    if (!await bcrypt.compare(password, user.password)) return res.status(400).json({ error: 'Incorrect password' });
    if (!user.isAdmin && user.email === process.env.ADMIN_EMAIL)
      await User.findByIdAndUpdate(user._id, { isAdmin: true });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'vybe_secret', { expiresIn: '7d' });
    res.json({ token, user: serializeUser(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Admin Auth (separate credentials, separate JWT) ─────────────────────────
app.post('/api/admin-auth/login', async (req, res) => {
  const { username, password } = req.body;
  const attemptKey = req.ip || 'global';

  const attempts = adminFailedAttempts.get(attemptKey) || { count: 0, lockedUntil: null };
  if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
    const mins = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
    return res.status(429).json({ error: `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.` });
  }

  // Check stored hash or fall back to env var
  let passwordOk = false;
  try {
    const settings = await AppSettings.findOne();
    if (settings?.adminPasswordHash) {
      passwordOk = await bcrypt.compare(password, settings.adminPasswordHash);
    } else {
      passwordOk = password === (process.env.ADMIN_PASSWORD || 'vybe_admin_2024');
    }
  } catch { passwordOk = password === (process.env.ADMIN_PASSWORD || 'vybe_admin_2024'); }

  const validUsername = username === (process.env.ADMIN_USERNAME || 'vybe_admin');

  if (!validUsername || !passwordOk) {
    const newCount = (attempts.count || 0) + 1;
    const lockedUntil = newCount >= 3 ? Date.now() + 30 * 60 * 1000 : null;
    adminFailedAttempts.set(attemptKey, { count: newCount, lockedUntil });
    const remaining = Math.max(0, 3 - newCount);
    return res.status(401).json({
      error: lockedUntil
        ? 'Too many failed attempts. Locked for 30 minutes.'
        : `Invalid credentials.${remaining > 0 ? ` ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` : ''}`,
    });
  }

  adminFailedAttempts.delete(attemptKey);
  const token = jwt.sign({ type: 'admin' }, process.env.ADMIN_SECRET || 'vybe_admin_secret_2024', { expiresIn: '2h' });
  res.json({ token });
});

app.get('/api/admin-auth/verify', adminSecureMiddleware, (req, res) => {
  res.json({ valid: true });
});

// ─── Public Settings ──────────────────────────────────────────────────────────
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await getSettings();
    // Admins bypass maintenance mode
    const adminToken = req.headers['x-admin-token'];
    let isAdmin = false;
    if (adminToken) {
      try {
        const d = jwt.verify(adminToken, process.env.ADMIN_SECRET || 'vybe_admin_secret_2024');
        isAdmin = d.type === 'admin';
      } catch {}
    }
    res.json({
      maintenanceMode:    isAdmin ? false : settings.maintenanceMode,
      maintenanceMessage: settings.maintenanceMessage,
      announcementActive: settings.announcementActive,
      announcement:       settings.announcementActive ? settings.announcement : '',
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Report Routes ─────────────────────────────────────────────────────────────
app.post('/api/reports', async (req, res) => {
  try {
    const { reportedSocketId, reportedUserId, reporterSocketId, reporterUserId, reason } = req.body;

    // Admins cannot be reported
    if (reportedUserId) {
      const target = await User.findById(reportedUserId).select('isAdmin email');
      if (target?.isAdmin || target?.email === process.env.ADMIN_EMAIL) {
        return res.json({ success: true, autoSuspended: false });
      }
    }

    await Report.create({ reportedSocketId, reportedUserId: reportedUserId || null, reporterSocketId, reporterUserId: reporterUserId || null, reason });

    const settings = await getSettings();
    const threshold = settings.reportThreshold || 3;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await Report.countDocuments({ reportedSocketId, createdAt: { $gte: since } });

    let autoSuspended = false;
    if (recentCount >= threshold && reportedUserId) {
      autoSuspended = true;
      const targetUser = await User.findById(reportedUserId);
      if (targetUser && !targetUser.isBanned && !targetUser.isAdmin) {
        const newCount = (targetUser.violationCount || 0) + 1;
        const { banType, banExpiresAt } = getBanDuration(newCount - 1);
        const banReason = banType === 'permanent'
          ? 'Permanently banned: repeated violations of community guidelines.'
          : `Auto-suspended for ${banType}: ${threshold}+ reports in 24 hours. Pending admin review.`;
        await User.findByIdAndUpdate(reportedUserId, {
          isBanned: true, banReason, banType, banExpiresAt, bannedAt: new Date(), violationCount: newCount,
          $push: { banHistory: { action: 'ban', banType, reason: banReason, timestamp: new Date() } },
        });
        kickBannedUser(reportedUserId, banReason, banType, banExpiresAt);
      }
    }

    res.json({ success: true, autoSuspended });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Unban Purchase Routes ─────────────────────────────────────────────────────
app.post('/api/unban/create-session', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.isBanned) return res.status(400).json({ error: 'Account is not banned' });
    if (user.banType === 'permanent') return res.status(400).json({ error: 'Permanent bans cannot be removed' });
    if (!stripe) return res.status(503).json({ error: 'Payment system unavailable' });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: { name: 'Vybe Ban Removal', description: `Remove your ${user.banType} ban from Vybe` },
          unit_amount: 499,
        },
        quantity: 1,
      }],
      metadata: { userId: String(user._id) },
      success_url: `${clientUrl}/unban/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${clientUrl}/chat`,
    });

    await UnbanPurchase.create({ userId: user._id, stripeSessionId: session.id, amount: 4.99, banType: user.banType });
    res.json({ url: session.url });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/unban/verify', authMiddleware, async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ error: 'Missing session_id' });
    if (!stripe) return res.status(503).json({ error: 'Payment system unavailable' });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid') return res.status(400).json({ error: 'Payment not completed' });
    if (String(session.metadata?.userId) !== String(req.user._id))
      return res.status(403).json({ error: 'Session does not belong to this user' });

    const user = await User.findByIdAndUpdate(req.user._id, {
      isBanned: false, banReason: '', banType: null, banExpiresAt: null, bannedAt: null,
      $push: { banHistory: { action: 'unban', unbannedBy: 'payment', note: 'Removed via $4.99 unban purchase', timestamp: new Date() } },
    }, { new: true }).select('-password');

    await UnbanPurchase.findOneAndUpdate({ stripeSessionId: session_id }, { status: 'completed', completedAt: new Date() });
    res.json({ success: true, user: serializeUser(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Free ban appeal — stores a record and emails the support inbox.
app.post('/api/unban/appeal', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'Please write a message.' });
    if (message.length > 2000) return res.status(400).json({ error: 'Message too long (max 2000 chars).' });
    const user = await User.findById(req.user._id).select('username email banReason banType bannedAt');
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Only an appeal raised since the current ban began counts as pending —
    // a stale appeal from a previous ban must not block a fresh one.
    const existing = await BanAppeal.findOne({
      userId: req.user._id, status: 'pending',
      createdAt: { $gte: user.bannedAt || new Date(0) },
    });
    if (existing) return res.status(400).json({ error: 'You already have an appeal under review.' });

    await BanAppeal.create({
      userId: user._id, username: user.username, email: user.email,
      message: message.trim(), banReason: user.banReason, banType: user.banType,
    });

    const to = process.env.ADMIN_EMAIL;
    if (to) {
      const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
      await sendEmail({
        to,
        subject: `[Vybe Ban Appeal] ${escapeHtml(user.username || 'user')}`,
        html: `<p><strong>Ban appeal from:</strong> ${escapeHtml(user.username || '')} &lt;${escapeHtml(user.email || '')}&gt;</p>`
            + `<p style="color:#aaa;font-size:12px;">Ban type: ${escapeHtml(user.banType || '—')} · Reason: ${escapeHtml(user.banReason || '—')}</p>`
            + `<p>${safeMessage}</p>`,
      });
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to send appeal. Please try again.' }); }
});

// Whether the logged-in user already has an appeal awaiting review.
app.get('/api/unban/appeal-status', authMiddleware, async (req, res) => {
  try {
    const me = await User.findById(req.user._id).select('bannedAt');
    const pending = await BanAppeal.exists({
      userId: req.user._id, status: 'pending',
      createdAt: { $gte: me?.bannedAt || new Date(0) },
    });
    res.json({ pending: !!pending });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: list ban appeals
app.get('/api/admin-secure/appeals', adminSecureMiddleware, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const filter = status === 'all' ? {} : { status };
    const appeals = await BanAppeal.find(filter)
      .populate('userId', 'username email isBanned banType')
      .sort({ createdAt: -1 }).limit(100);
    res.json({ appeals });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: resolve an appeal — optionally send the user a reply in-app
app.post('/api/admin-secure/appeals/:id/resolve', adminSecureMiddleware, async (req, res) => {
  try {
    const { note = '' } = req.body;
    const appeal = await BanAppeal.findByIdAndUpdate(req.params.id,
      { status: 'resolved', adminNote: note, resolvedAt: new Date() }, { new: true });
    if (!appeal) return res.status(404).json({ error: 'Not found' });
    if (note && note.trim()) {
      await createNotification(appeal.userId, 'system', '📩 Response to your appeal', note.trim());
    }
    res.json({ success: true, appeal });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Friend Routes ─────────────────────────────────────────────────────────────
app.post('/api/friends/request', authMiddleware, async (req, res) => {
  try {
    const { recipientId } = req.body;
    if (!recipientId) return res.status(400).json({ error: 'recipientId required' });
    if (String(recipientId) === String(req.user._id)) return res.status(400).json({ error: 'Cannot add yourself' });

    const existing = await Friendship.findOne({
      $or: [
        { requester: req.user._id, recipient: recipientId },
        { requester: recipientId, recipient: req.user._id },
      ],
    });
    if (existing) return res.status(400).json({ error: existing.status === 'accepted' ? 'Already friends' : 'Request already sent' });

    const recipient = await User.findById(recipientId).select('allowFriendRequests');
    if (!recipient) return res.status(404).json({ error: 'User not found' });
    if (recipient.allowFriendRequests === false) {
      return res.status(403).json({ error: "This user isn't accepting friend requests" });
    }

    const friendship = await Friendship.create({ requester: req.user._id, recipient: recipientId });

    // Notify recipient
    for (const [socketId, data] of onlineUsers.entries()) {
      if (String(data.userId) === String(recipientId)) {
        io.to(socketId).emit('friend-request', { from: { id: req.user._id, username: req.user.username }, friendshipId: friendship._id });
      }
    }
    await createNotification(recipientId, 'friend_request', '👥 Friend request', `${req.user.username} sent you a friend request`, { friendshipId: friendship._id, fromUserId: req.user._id });
    res.json({ success: true, friendship });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/friends/respond/:id', authMiddleware, async (req, res) => {
  try {
    const { action } = req.body; // 'accept' | 'decline'
    const friendship = await Friendship.findById(req.params.id);
    if (!friendship) return res.status(404).json({ error: 'Request not found' });
    if (String(friendship.recipient) !== String(req.user._id)) return res.status(403).json({ error: 'Not your request' });

    friendship.status = action === 'accept' ? 'accepted' : 'declined';
    friendship.updatedAt = new Date();
    await friendship.save();

    if (action === 'accept') {
      for (const [socketId, data] of onlineUsers.entries()) {
        if (String(data.userId) === String(friendship.requester)) {
          io.to(socketId).emit('friend-accepted', { by: { id: req.user._id, username: req.user.username } });
        }
      }
      await createNotification(friendship.requester, 'friend_request', '🎉 Friend request accepted', `${req.user.username} accepted your friend request`);
    }
    res.json({ success: true, status: friendship.status });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/friends', authMiddleware, async (req, res) => {
  try {
    const friendships = await Friendship.find({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
      status: 'accepted',
    })
      .populate('requester', 'username gender country')
      .populate('recipient', 'username gender country');

    const friends = friendships.map((f) => {
      const friend = String(f.requester._id) === String(req.user._id) ? f.recipient : f.requester;
      const isOnline = [...onlineUsers.values()].some((u) => String(u.userId) === String(friend._id));
      return { friendshipId: f._id, friend, isOnline, since: f.updatedAt || f.createdAt };
    });
    res.json({ friends });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/friends/requests', authMiddleware, async (req, res) => {
  try {
    const requests = await Friendship.find({ recipient: req.user._id, status: 'pending' })
      .populate('requester', 'username gender country');
    res.json({ requests });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Pending friend requests the user has sent (outgoing)
app.get('/api/friends/sent', authMiddleware, async (req, res) => {
  try {
    const requests = await Friendship.find({ requester: req.user._id, status: 'pending' })
      .populate('recipient', 'username gender country');
    res.json({ requests });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/friends/:id', authMiddleware, async (req, res) => {
  try {
    const friendship = await Friendship.findById(req.params.id);
    if (!friendship) return res.status(404).json({ error: 'Not found' });
    if (String(friendship.requester) !== String(req.user._id) && String(friendship.recipient) !== String(req.user._id))
      return res.status(403).json({ error: 'Not your friendship' });
    await friendship.deleteOne();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── User Search ──────────────────────────────────────────────────────────────
app.get('/api/users/search', authMiddleware, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) return res.json({ users: [] });
    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      _id: { $ne: req.user._id },
    }).select('username _id').limit(10);

    const [friends, pending] = await Promise.all([
      Friendship.find({ $or: [{ requester: req.user._id }, { recipient: req.user._id }], status: 'accepted' }).select('requester recipient'),
      Friendship.find({ requester: req.user._id, status: 'pending' }).select('recipient'),
    ]);
    const friendIds  = new Set(friends.map(f => String(f.requester) === String(req.user._id) ? String(f.recipient) : String(f.requester)));
    const pendingIds = new Set(pending.map(p => String(p.recipient)));

    res.json({ users: users.map(u => ({
      _id: u._id, username: u.username,
      isFriend: friendIds.has(String(u._id)),
      requestSent: pendingIds.has(String(u._id)),
    }))});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── DM Routes ────────────────────────────────────────────────────────────────
app.get('/api/dm/conversations', authMiddleware, async (req, res) => {
  try {
    const friendships = await Friendship.find({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
      status: 'accepted',
    });
    const friendIds = friendships.map(f =>
      String(f.requester) === String(req.user._id) ? f.recipient : f.requester
    );
    const conversations = await Promise.all(friendIds.map(async (friendId) => {
      const unread = await DirectMessage.countDocuments({ from: friendId, to: req.user._id, read: false });
      return { userId: String(friendId), unread };
    }));
    res.json({ conversations });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/dm/:userId', authMiddleware, async (req, res) => {
  try {
    const messages = await DirectMessage.find({
      $or: [
        { from: req.user._id, to: req.params.userId },
        { from: req.params.userId, to: req.user._id },
      ],
    }).sort({ createdAt: 1 }).limit(100);
    res.json({ messages: messages.map(m => ({
      _id: m._id, content: m.content,
      fromMe: String(m.from) === String(req.user._id),
      createdAt: m.createdAt,
    }))});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/dm/:userId/read', authMiddleware, async (req, res) => {
  try {
    await DirectMessage.updateMany({ from: req.params.userId, to: req.user._id, read: false }, { $set: { read: true } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Duo HTTP Route ────────────────────────────────────────────────────────────
app.get('/api/duo/:code', (req, res) => {
  const squadId = inviteCodes.get(req.params.code.toUpperCase());
  if (!squadId) return res.status(404).json({ error: 'Invalid or expired invite link.' });
  const squad = squads.get(squadId);
  if (!squad || Date.now() > squad.expiresAt)
    return res.status(404).json({ error: 'Invite link has expired.' });
  if (squad.members.length >= 2)
    return res.status(400).json({ error: 'This duo is already full.' });
  res.json({ squadId: squad.id, code: squad.code, leaderName: squad.members[0]?.username || 'Someone', memberCount: squad.members.length, expiresAt: squad.expiresAt });
});

// ─── Legacy Admin Routes (backward compat) ────────────────────────────────────
app.get('/api/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const [totalReports, pendingReports, totalUsers, bannedUsers, unbanRevenue, unbanCount] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ resolved: false }),
      User.countDocuments(),
      User.countDocuments({ isBanned: true }),
      UnbanPurchase.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      UnbanPurchase.countDocuments({ status: 'completed' }),
    ]);
    res.json({ totalReports, pendingReports, totalUsers, bannedUsers, online: onlineUsers.size, unbanRevenue: unbanRevenue[0]?.total || 0, unbanCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/reports',    adminMiddleware, async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    const filter = status === 'pending' ? { resolved: false } : status === 'resolved' ? { resolved: true } : {};
    const [reports, total] = await Promise.all([
      Report.find(filter).sort({ createdAt: -1 }).limit(100)
        .populate('reportedUserId', 'username email isBanned')
        .populate('reporterUserId', 'username email'),
      Report.countDocuments(filter),
    ]);
    res.json({ reports, total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/users', adminMiddleware, async (req, res) => {
  try {
    const { search = '' } = req.query;
    const filter = search ? { $or: [{ username: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] } : {};
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).limit(100),
      User.countDocuments(filter),
    ]);
    res.json({ users, total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/unban-purchases', adminMiddleware, async (req, res) => {
  try {
    const purchases = await UnbanPurchase.find({ status: 'completed' }).sort({ completedAt: -1 }).limit(100).populate('userId', 'username email');
    res.json({ purchases });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/ban/:userId', adminMiddleware, async (req, res) => {
  try {
    const { reason = 'Banned by admin', banType = 'permanent' } = req.body;
    const banExpiresAt = banType === 'permanent' ? null : (() => {
      const ms = { '24h': 86400000, '7d': 604800000, '14d': 1209600000, '30d': 2592000000 };
      return new Date(Date.now() + (ms[banType] || 86400000));
    })();
    const user = await User.findByIdAndUpdate(req.params.userId,
      { isBanned: true, banReason: reason, banType, banExpiresAt, bannedAt: new Date(), $inc: { violationCount: 1 }, $push: { banHistory: { action: 'ban', banType, reason, timestamp: new Date() } } },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    kickBannedUser(req.params.userId, reason, banType, banExpiresAt);
    res.json({ success: true, user: serializeUser(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/unban/:userId', adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId,
      { isBanned: false, banReason: '', banType: null, banExpiresAt: null, bannedAt: null, $push: { banHistory: { action: 'unban', unbannedBy: 'admin', timestamp: new Date() } } },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user: serializeUser(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/resolve-report/:id', adminMiddleware, async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, { resolved: true, resolvedBy: req.user._id, resolvedAt: new Date() }, { new: true });
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Admin Secure Routes ───────────────────────────────────────────────────────

// Stats overview
app.get('/api/admin-secure/stats', adminSecureMiddleware, async (req, res) => {
  try {
    const [totalUsers, bannedUsers, totalReports, pendingReports, unbanData, totalFriendships, onlineFriends, coinPurchaseData, cashoutPendingData, cashoutApprovedData, tipsData] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBanned: true }),
      Report.countDocuments(),
      Report.countDocuments({ resolved: false, dismissed: false }),
      UnbanPurchase.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Friendship.countDocuments({ status: 'accepted' }),
      Promise.resolve(onlineUsers.size),
      CoinPurchase.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$gbpAmount' }, coins: { $sum: '$coinsAmount' }, count: { $sum: 1 } } }]),
      CashOutRequest.aggregate([{ $match: { status: 'pending' } }, { $group: { _id: null, total: { $sum: '$gbpAmount' }, count: { $sum: 1 } } }]),
      CashOutRequest.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: null, total: { $sum: '$gbpAmount' }, count: { $sum: 1 } } }]),
      User.aggregate([{ $group: { _id: null, totalTipsEarned: { $sum: '$tipsEarned' } } }]),
    ]);
    res.json({
      totalUsers, bannedUsers, totalReports, pendingReports,
      unbanRevenue: unbanData[0]?.total || 0,
      unbanCount:   unbanData[0]?.count || 0,
      totalFriendships, online: onlineFriends,
      coinRevenue:      coinPurchaseData[0]?.total  || 0,
      coinsPurchased:   coinPurchaseData[0]?.coins  || 0,
      coinPurchaseCount:coinPurchaseData[0]?.count  || 0,
      pendingCashouts:  cashoutPendingData[0]?.count || 0,
      pendingCashoutGbp:cashoutPendingData[0]?.total || 0,
      approvedCashoutGbp: cashoutApprovedData[0]?.total || 0,
      totalTipsEarned:  tipsData[0]?.totalTipsEarned || 0,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// User search
app.get('/api/admin-secure/users', adminSecureMiddleware, async (req, res) => {
  try {
    const { search = '', page = 1, limit = 50 } = req.query;
    const filter = search ? { $or: [{ username: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] } : {};
    const users = await User.find(filter).select('-password -banHistory -warnings').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    const total = await User.countDocuments(filter);
    const usersWithOnline = users.map((u) => ({
      ...u.toObject(),
      isOnline: [...onlineUsers.values()].some((s) => String(s.userId) === String(u._id)),
    }));
    res.json({ users: usersWithOnline, total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Full user profile
app.get('/api/admin-secure/users/:id/profile', adminSecureMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [reportsReceived, reportsMade, unbanPurchases] = await Promise.all([
      Report.countDocuments({ reportedUserId: user._id }),
      Report.countDocuments({ reporterUserId: user._id }),
      UnbanPurchase.find({ userId: user._id, status: 'completed' }).sort({ completedAt: -1 }),
    ]);

    res.json({
      user: { ...user.toObject(), password: undefined },
      reportsReceived,
      reportsMade,
      unbanPurchases,
      isOnline: [...onlineUsers.values()].some((s) => String(s.userId) === String(user._id)),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Ban user
app.post('/api/admin-secure/users/:id/ban', adminSecureMiddleware, async (req, res) => {
  try {
    const { reason = 'Banned by admin', banType = 'permanent' } = req.body;
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found' });

    const banExpiresAt = banType === 'permanent' ? null : (() => {
      const ms = { '24h': 86400000, '7d': 604800000, '14d': 1209600000, '30d': 2592000000 };
      return new Date(Date.now() + (ms[banType] || 86400000));
    })();

    const user = await User.findByIdAndUpdate(req.params.id, {
      isBanned: true, banReason: reason, banType, banExpiresAt, bannedAt: new Date(),
      $inc: { violationCount: 1 },
      $push: { banHistory: { action: 'ban', banType, reason, timestamp: new Date() } },
    }, { new: true }).select('-password');

    kickBannedUser(req.params.id, reason, banType, banExpiresAt);
    await logAdminAction('ban', user._id, user.username, `${banType}: ${reason}`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Unban user
app.post('/api/admin-secure/users/:id/unban', adminSecureMiddleware, async (req, res) => {
  try {
    const { note = '' } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, {
      isBanned: false, banReason: '', banType: null, banExpiresAt: null, bannedAt: null,
      $push: { banHistory: { action: 'unban', unbannedBy: 'admin', note, timestamp: new Date() } },
    }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    await BanAppeal.updateMany(
      { userId: user._id, status: 'pending' },
      { status: 'resolved', resolvedAt: new Date(), adminNote: 'Auto-resolved — user unbanned' });
    await logAdminAction('unban', user._id, user.username, note || 'Manually unbanned by admin');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Grant or revoke free membership
app.post('/api/admin-secure/users/:id/grant-membership', adminSecureMiddleware, async (req, res) => {
  try {
    const { plan } = req.body; // 'basic' | 'vip' | null (revoke)
    if (plan !== 'basic' && plan !== 'vip' && plan !== null) {
      return res.status(400).json({ error: 'Invalid plan — use basic, vip, or null' });
    }
    const update = { isPremium: plan !== null, isVip: plan === 'vip' };
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    await logAdminAction('grant-membership', user._id, user.username, plan ? `Granted free ${plan} membership` : 'Revoked membership');
    // Push updated membership flags to the user in real-time so they can use the features immediately
    for (const [socketId, data] of onlineUsers.entries()) {
      if (String(data.userId) === String(user._id)) {
        io.to(socketId).emit('membership-updated', { isPremium: user.isPremium, isVip: user.isVip });
      }
    }
    res.json({ success: true, isPremium: user.isPremium, isVip: user.isVip });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Warn user
app.post('/api/admin-secure/users/:id/warn', adminSecureMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    const user = await User.findByIdAndUpdate(req.params.id,
      { $push: { warnings: { message, issuedAt: new Date() } } },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Notify if online
    for (const [socketId, data] of onlineUsers.entries()) {
      if (String(data.userId) === String(req.params.id)) {
        io.to(socketId).emit('admin-warning', { message });
      }
    }
    await logAdminAction('warn', user._id, user.username, message);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete account
app.delete('/api/admin-secure/users/:id', adminSecureMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Kick if online
    kickBannedUser(req.params.id, 'Account deleted by admin.', 'permanent', null);
    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      Report.updateMany({ reportedUserId: req.params.id }, { reportedUserId: null }),
      Friendship.deleteMany({ $or: [{ requester: req.params.id }, { recipient: req.params.id }] }),
    ]);
    await logAdminAction('delete', req.params.id, user.username, 'Account permanently deleted');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Reports
app.get('/api/admin-secure/reports', adminSecureMiddleware, async (req, res) => {
  try {
    const { status = 'all', page = 1 } = req.query;
    const filter = status === 'pending' ? { resolved: false, dismissed: false }
      : status === 'resolved' ? { resolved: true }
      : status === 'dismissed' ? { dismissed: true } : {};
    const reports = await Report.find(filter).sort({ createdAt: -1 }).skip((page - 1) * 50).limit(50)
      .populate('reportedUserId', 'username email isBanned isAdmin')
      .populate('reporterUserId', 'username email');
    const total = await Report.countDocuments(filter);
    res.json({ reports, total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin-secure/reports/:id/resolve', adminSecureMiddleware, async (req, res) => {
  try {
    await Report.findByIdAndUpdate(req.params.id, { resolved: true, resolvedAt: new Date() });
    await logAdminAction('resolve-report', null, '', `Report ${req.params.id}`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin-secure/reports/:id/dismiss', adminSecureMiddleware, async (req, res) => {
  try {
    await Report.findByIdAndUpdate(req.params.id, { dismissed: true, resolved: true, resolvedAt: new Date() });
    await logAdminAction('dismiss-report', null, '', `Report ${req.params.id}`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Bans list
app.get('/api/admin-secure/bans', adminSecureMiddleware, async (req, res) => {
  try {
    const { filter = 'active', page = 1 } = req.query;
    const q = filter === 'permanent' ? { isBanned: true, banType: 'permanent' }
      : filter === 'temporary' ? { isBanned: true, banType: { $ne: 'permanent' } }
      : filter === 'paid-unban' ? {}
      : { isBanned: true };

    if (filter === 'paid-unban') {
      const purchases = await UnbanPurchase.find({ status: 'completed' })
        .sort({ completedAt: -1 }).skip((page - 1) * 50).limit(50)
        .populate('userId', 'username email isBanned banType');
      return res.json({ users: purchases.map((p) => p.userId), total: await UnbanPurchase.countDocuments({ status: 'completed' }) });
    }

    const users = await User.find(q).select('-password -warnings').sort({ bannedAt: -1 }).skip((page - 1) * 50).limit(50);
    const total = await User.countDocuments(q);
    res.json({ users, total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Friendships (admin view)
app.get('/api/admin-secure/users/:id/friends', adminSecureMiddleware, async (req, res) => {
  try {
    const friendships = await Friendship.find({
      $or: [{ requester: req.params.id }, { recipient: req.params.id }],
      status: 'accepted',
    }).populate('requester', 'username email').populate('recipient', 'username email');
    res.json({ friendships });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin-secure/friendships/:id', adminSecureMiddleware, async (req, res) => {
  try {
    const f = await Friendship.findByIdAndDelete(req.params.id);
    if (!f) return res.status(404).json({ error: 'Not found' });
    await logAdminAction('remove-friendship', null, '', `Friendship ${req.params.id}`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// User coin history (for cashout review)
app.get('/api/admin-secure/users/:id/coin-history', adminSecureMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('coinHistory coins cashableCoins tipsEarned username');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { type } = req.query;
    let history = [...(user.coinHistory || [])].reverse();
    if (type) history = history.filter(h => h.type === type);
    const tipTotal = user.coinHistory.filter(h => h.type === 'tip_received').reduce((s, h) => s + (h.amount || 0), 0);
    res.json({
      history: history.slice(0, 100),
      coins: user.coins,
      cashableCoins: user.cashableCoins || 0,
      tipsEarned: user.tipsEarned || 0,
      tipHistoryTotal: tipTotal,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Revenue
app.get('/api/admin-secure/revenue', adminSecureMiddleware, async (req, res) => {
  try {
    const [unbanTotal, unbanMonthly, recentUnbans, coinTotal, coinMonthly, subBasic, subVip, tipStats] = await Promise.all([
      UnbanPurchase.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      UnbanPurchase.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: { year: { $year: '$completedAt' }, month: { $month: '$completedAt' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
      ]),
      UnbanPurchase.find({ status: 'completed' }).sort({ completedAt: -1 }).limit(20).populate('userId', 'username email'),
      CoinPurchase.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$gbpAmount' }, count: { $sum: 1 }, coins: { $sum: '$coinsAmount' } } }]),
      CoinPurchase.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: { year: { $year: '$completedAt' }, month: { $month: '$completedAt' } }, total: { $sum: '$gbpAmount' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
      ]),
      Subscription.countDocuments({ status: 'active', plan: 'basic' }),
      Subscription.countDocuments({ status: 'active', plan: 'vip' }),
      User.aggregate([{ $group: { _id: null, totalTipsEarned: { $sum: '$tipsEarned' } } }]),
    ]);
    const subMrr            = (subBasic * 6.99) + (subVip * 12.99);
    const vybeTipCut        = (tipStats[0]?.totalTipsEarned || 0) * (0.30 / 0.70);
    res.json({
      unbanRevenue:        unbanTotal[0]?.total  || 0,
      unbanCount:          unbanTotal[0]?.count  || 0,
      coinRevenue:         coinTotal[0]?.total   || 0,
      coinCount:           coinTotal[0]?.count   || 0,
      coinsSold:           coinTotal[0]?.coins   || 0,
      subscriptionRevenue: subMrr,
      subscriptionBasic:   subBasic,
      subscriptionVip:     subVip,
      subscriptionCount:   subBasic + subVip,
      subscriptionMrr:     subMrr.toFixed(2),
      tipCutRevenue:       vybeTipCut.toFixed(2),
      monthlyBreakdown:    unbanMonthly,
      coinMonthly,
      recentTransactions:  recentUnbans,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Settings (admin get/set)
app.get('/api/admin-secure/settings', adminSecureMiddleware, async (req, res) => {
  try {
    const settings = await AppSettings.findOne() || {};
    res.json({
      maintenanceMode:    settings.maintenanceMode    || false,
      maintenanceMessage: settings.maintenanceMessage || '',
      reportThreshold:    settings.reportThreshold    || 3,
      announcement:       settings.announcement       || '',
      announcementActive: settings.announcementActive || false,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin-secure/settings', adminSecureMiddleware, async (req, res) => {
  try {
    const { maintenanceMode, maintenanceMessage, reportThreshold, announcement, announcementActive } = req.body;
    const update = { updatedAt: new Date() };
    if (maintenanceMode    !== undefined) update.maintenanceMode    = maintenanceMode;
    if (maintenanceMessage !== undefined) update.maintenanceMessage = maintenanceMessage;
    if (reportThreshold    !== undefined) update.reportThreshold    = reportThreshold;
    if (announcement       !== undefined) update.announcement       = announcement;
    if (announcementActive !== undefined) update.announcementActive = announcementActive;

    await AppSettings.findOneAndUpdate({}, update, { upsert: true, new: true });
    invalidateSettings();

    // Push maintenance state instantly to all connected clients
    if (maintenanceMode !== undefined) {
      const msg = maintenanceMessage !== undefined ? maintenanceMessage : 'Vybe is temporarily down for maintenance. Be back soon!';
      io.emit('maintenance-mode', { active: !!maintenanceMode, message: msg });
    }

    if (announcementActive && announcement) {
      io.emit('announcement', { message: announcement });
    }
    await logAdminAction('update-settings', null, '', JSON.stringify(update));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin-secure/settings/change-password', adminSecureMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });

    // Verify current password
    let currentOk = false;
    const settings = await AppSettings.findOne();
    if (settings?.adminPasswordHash) {
      currentOk = await bcrypt.compare(currentPassword, settings.adminPasswordHash);
    } else {
      currentOk = currentPassword === (process.env.ADMIN_PASSWORD || 'vybe_admin_2024');
    }
    if (!currentOk) return res.status(401).json({ error: 'Current password is incorrect' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await AppSettings.findOneAndUpdate({}, { adminPasswordHash: newHash }, { upsert: true });
    await logAdminAction('change-admin-password', null, '', 'Admin password changed');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Broadcast announcement
app.post('/api/admin-secure/broadcast', adminSecureMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });
    io.emit('announcement', { message });
    await logAdminAction('broadcast', null, '', message);
    res.json({ success: true, delivered: onlineUsers.size });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Activity logs
app.get('/api/admin-secure/logs', adminSecureMiddleware, async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const logs = await AdminLog.find().sort({ timestamp: -1 }).skip((page - 1) * 100).limit(100)
      .populate('targetUserId', 'username email');
    const total = await AdminLog.countDocuments();
    res.json({ logs, total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/online-count', (req, res) => res.json({ count: onlineUsers.size }));
app.get('/api/health',       (req, res) => res.json({ status: 'ok', online: onlineUsers.size }));

// ─── Daily Login / Streak ──────────────────────────────────────────────────────
app.post('/api/auth/daily-login', authMiddleware, async (req, res) => {
  try {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayMs = 86400000;

    // Atomic: only update if lastLoginDate is NOT today — prevents race condition double-claim
    const user = await User.findOneAndUpdate(
      { _id: req.user._id, $or: [{ lastLoginDate: null }, { lastLoginDate: { $lt: today } }] },
      { lastLoginDate: now },
      { new: false }, // return pre-update doc so we can compute streak from old values
    );
    if (!user) {
      // Already claimed today
      const current = await User.findById(req.user._id).select('loginStreak coins');
      return res.json({ success: true, alreadyClaimed: true, streak: current.loginStreak, coins: current.coins });
    }

    const last  = user.lastLoginDate ? new Date(user.lastLoginDate.getFullYear(), user.lastLoginDate.getMonth(), user.lastLoginDate.getDate()) : null;
    const diff  = last ? today - last : null;
    let newStreak   = diff === dayMs ? (user.loginStreak || 0) + 1 : 1;
    let coinsEarned = 10;
    let milestoneHit = null;
    if (newStreak === 3)  { coinsEarned += 30;  milestoneHit = { streak: 3,  bonus: 30  }; }
    if (newStreak === 7)  { coinsEarned += 100; milestoneHit = { streak: 7,  bonus: 100 }; }
    if (newStreak === 30) { coinsEarned += 500; milestoneHit = { streak: 30, bonus: 500 }; }
    await User.findByIdAndUpdate(user._id, {
      loginStreak:   newStreak,
      longestStreak: Math.max(user.longestStreak || 0, newStreak),
    });
    await addCoins(user._id, coinsEarned, milestoneHit
      ? `${newStreak}-day streak milestone! +${coinsEarned} coins`
      : 'Daily login reward', milestoneHit ? 'streak' : 'bonus');
    if (milestoneHit) {
      await createNotification(user._id, 'streak', `🔥 ${newStreak}-Day Streak!`,
        `You hit a ${newStreak}-day streak and earned ${milestoneHit.bonus} bonus coins!`);
    }
    const updated = await User.findById(user._id).select('coins loginStreak longestStreak');
    res.json({ success: true, alreadyClaimed: false, coinsEarned, streak: newStreak, milestoneHit, coins: updated.coins });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Lightweight balance endpoint for navbar polling
app.get('/api/me/balance', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('coins cashableCoins');
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ coins: user.coins, cashableCoins: user.cashableCoins });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── User Profile Routes ───────────────────────────────────────────────────────
app.get('/api/user/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const [friendCount] = await Promise.all([
      Friendship.countDocuments({ $or: [{ requester: user._id }, { recipient: user._id }], status: 'accepted' }),
    ]);
    res.json({ user: { ...user.toObject(), id: user._id, friendCount, isOnline: true, isOwner: user.email === process.env.ADMIN_EMAIL } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/user/:id/profile', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('username avatar bio gender country createdAt loginStreak longestStreak totalChats giftsReceived countriesChattedWith isPremium isVip emailVerified email privacyShowCountry privacyShowBio equippedBadges borderColor animatedBorder accentColor bannerGradient bannerImage cameraBackground giftCollection totalCoinsGifted gifterRank');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const friendCount = await Friendship.countDocuments({ $or: [{ requester: user._id }, { recipient: user._id }], status: 'accepted' });
    const isOnline    = [...onlineUsers.values()].some((s) => String(s.userId) === String(user._id));
    res.json({ user: {
      id: user._id, username: user.username,
      avatar:  user.avatar || '',
      bio:     user.privacyShowBio     ? (user.bio || '')     : '',
      country: user.privacyShowCountry ? (user.country || '') : '',
      gender: user.gender, createdAt: user.createdAt,
      loginStreak: user.loginStreak, longestStreak: user.longestStreak,
      totalChats: user.totalChats,
      giftsReceived: user.giftsReceived || 0,
      countriesCount: (user.countriesChattedWith || []).length,
      isPremium: user.isPremium, isVip: user.isVip,
      emailVerified: user.emailVerified, friendCount, isOnline,
      isOwner: user.email === process.env.ADMIN_EMAIL,
      equippedBadges: user.equippedBadges || [],
      borderColor: user.borderColor || '',
      animatedBorder: user.animatedBorder || false,
      accentColor: user.accentColor || '',
      bannerGradient: user.bannerGradient || '',
      bannerImage: user.bannerImage || '',
      cameraBackground: user.cameraBackground || 'none',
      giftCollection: user.giftCollection || [],
      totalCoinsGifted: user.totalCoinsGifted || 0,
      gifterRank: user.gifterRank || 'Newcomer',
    }});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const { bio, avatar, bannerImage, gender, country, privacyShowCountry, privacyShowBio, allowFriendRequests, cameraBackgroundImage } = req.body;
    const update = {};
    if (bio !== undefined)  update.bio    = String(bio).slice(0, 100);
    if (gender !== undefined) update.gender = gender;
    if (country !== undefined) update.country = country;
    if (privacyShowCountry !== undefined) update.privacyShowCountry = privacyShowCountry;
    if (privacyShowBio !== undefined)     update.privacyShowBio     = privacyShowBio;
    if (allowFriendRequests !== undefined) update.allowFriendRequests = allowFriendRequests;
    if (avatar !== undefined) {
      if (avatar && avatar.length > 700000) return res.status(400).json({ error: 'Avatar too large (max ~500KB)' });
      update.avatar = avatar;
    }
    if (bannerImage !== undefined) {
      if (bannerImage && bannerImage.length > 2800000) return res.status(400).json({ error: 'Banner image too large (max ~2MB)' });
      update.bannerImage = bannerImage;
    }
    if (cameraBackgroundImage !== undefined) {
      if (cameraBackgroundImage && cameraBackgroundImage.length > 4000000) return res.status(400).json({ error: 'Camera background image too large (max ~3MB)' });
      update.cameraBackgroundImage = cameraBackgroundImage;
    }
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password');
    res.json({ success: true, user: serializeUser(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Coin Routes ──────────────────────────────────────────────────────────────
app.get('/api/user/coins/history', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('coins cashableCoins coinHistory');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ coins: user.coins, cashableCoins: user.cashableCoins || 0, history: (user.coinHistory || []).slice().reverse() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const adWatchLog = new Map();
// Clean up stale entries daily — prevents unbounded memory growth
setInterval(() => {
  const today = new Date().toDateString();
  for (const [uid, entry] of adWatchLog.entries()) {
    if (entry.date !== today) adWatchLog.delete(uid);
  }
}, 24 * 60 * 60 * 1000);

app.post('/api/user/watch-ad', authMiddleware, async (req, res) => {
  try {
    const uid   = String(req.user._id);
    const today = new Date().toDateString();
    const entry = adWatchLog.get(uid) || { count: 0, date: today };
    if (entry.date !== today) { entry.count = 0; entry.date = today; }
    if (entry.count >= 10) return res.status(429).json({ error: 'Daily ad limit reached (10/day)' });
    entry.count++;
    adWatchLog.set(uid, entry);
    await addCoins(req.user._id, 5, 'Watched an ad', 'ad');
    const user = await User.findById(req.user._id).select('coins');
    res.json({ success: true, coins: user.coins, watched: entry.count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const GIFTS = {
  'small-vybe':     { name: 'Small Vybe',     coins: 50,   tier: 'Starter' },
  'vybe':           { name: 'Vybe',           coins: 100,  tier: 'Starter' },
  'big-vybe':       { name: 'Big Vybe',       coins: 250,  tier: 'Popular' },
  'mega-vybe':      { name: 'Mega Vybe',      coins: 500,  tier: 'Popular' },
  'ultra-vybe':     { name: 'Ultra Vybe',     coins: 1000, tier: 'Premium' },
  'legendary-vybe': { name: 'Legendary Vybe', coins: 5000, tier: 'Premium' },
};

const getGifterRank = (total) => {
  if (total >= 10000) return 'Vybe Legend';
  if (total >= 5000)  return 'Vybe Elite';
  if (total >= 1000)  return 'Vybe Ultra';
  if (total >= 500)   return 'Vybe Pro';
  if (total >= 100)   return 'Vybe Gifter';
  return 'Newcomer';
};

const BADGE_DEFS = [
  { id: 'star',         name: 'Rising Star',     icon: '⭐', cost: 200,  desc: 'For those making their mark on Vybe',       rarity: 'common'    },
  { id: 'verified',     name: 'Verified Viber',  icon: '✅', cost: 500,  desc: 'Gold checkmark — trusted community member', rarity: 'rare'      },
  { id: 'hot',          name: 'Hot',             icon: '🔥', cost: 300,  desc: 'You\'re trending on Vybe',                  rarity: 'common'    },
  { id: 'royalty',      name: 'Royalty',         icon: '👑', cost: 1000, desc: 'The most prestigious badge on Vybe',        rarity: 'legendary' },
  { id: 'diamond',      name: 'Diamond Member',  icon: '💎', cost: 800,  desc: 'Diamond tier — top 1% of Vybe',            rarity: 'epic'      },
  { id: 'rainbow',      name: 'Rainbow',         icon: '🌈', cost: 400,  desc: 'Colorful, vibrant and unmissable',          rarity: 'rare'      },
  { id: 'entertainer',  name: 'Entertainer',     icon: '🎭', cost: 350,  desc: 'For charismatic and entertaining chatters', rarity: 'uncommon'  },
  { id: 'globetrotter', name: 'Globetrotter',    icon: '🌍', cost: 450,  desc: 'Chatted with people from many countries',   rarity: 'rare'      },
  { id: 'flash',        name: 'Flash',           icon: '⚡', cost: 250,  desc: 'Fast connector — always in the action',     rarity: 'uncommon'  },
  { id: 'sharp',        name: 'Sharp',           icon: '🎯', cost: 300,  desc: 'Precision and focus — a premium badge',     rarity: 'common'    },
];

app.get('/api/badges', (req, res) => res.json({ badges: BADGE_DEFS }));

app.get('/api/badges/mine', authMiddleware, async (req, res) => {
  try {
    const owned = await UserBadge.find({ userId: req.user._id }).lean();
    const user  = await User.findById(req.user._id).select('equippedBadges coins').lean();
    res.json({ owned: owned.map(b => b.badgeId), equipped: user?.equippedBadges || [], coins: user?.coins || 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/badges/buy', authMiddleware, async (req, res) => {
  try {
    const { badgeId } = req.body;
    const def = BADGE_DEFS.find(b => b.id === badgeId);
    if (!def) return res.status(400).json({ error: 'Invalid badge' });
    const existing = await UserBadge.findOne({ userId: req.user._id, badgeId });
    if (existing) return res.status(400).json({ error: 'Badge already owned' });
    const user = await User.findById(req.user._id).select('coins');
    if (!user || user.coins < def.cost) return res.status(400).json({ error: 'Not enough coins' });
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { coins: -def.cost },
      $push: { coinHistory: { $each: [{ amount: -def.cost, reason: `Purchased badge: ${def.name}`, type: 'badge', timestamp: new Date() }], $slice: -200 } },
    });
    await UserBadge.create({ userId: req.user._id, badgeId });
    const updated = await User.findById(req.user._id).select('coins');
    res.json({ success: true, coins: updated.coins });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/badges/equip', authMiddleware, async (req, res) => {
  try {
    const { equippedBadges } = req.body;
    if (!Array.isArray(equippedBadges) || equippedBadges.length > 3)
      return res.status(400).json({ error: 'Max 3 equipped badges' });
    const owned = await UserBadge.find({ userId: req.user._id }).lean();
    const ownedIds = owned.map(b => b.badgeId);
    for (const id of equippedBadges) {
      if (!ownedIds.includes(id)) return res.status(400).json({ error: `Badge not owned: ${id}` });
    }
    await User.findByIdAndUpdate(req.user._id, { equippedBadges });
    res.json({ success: true, equippedBadges });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/user/border', authMiddleware, async (req, res) => {
  try {
    const { borderColor, animatedBorder } = req.body;
    const BORDER_COLORS = ['#7c3aed','#1b62f5','#ec4899','#f59e0b','#10b981','#ef4444','#8b5cf6','#06b6d4'];
    const BORDER_COST   = 150;
    const ANIMATED_COST = 400;
    const user = await User.findById(req.user._id).select('coins borderColor animatedBorder');
    if (!user) return res.status(404).json({ error: 'User not found' });
    let cost = 0;
    const update = {};
    if (borderColor !== undefined && borderColor !== user.borderColor) {
      if (borderColor && !BORDER_COLORS.includes(borderColor)) return res.status(400).json({ error: 'Invalid color' });
      if (borderColor) cost += BORDER_COST;
      update.borderColor = borderColor;
    }
    if (animatedBorder !== undefined && animatedBorder !== user.animatedBorder) {
      if (animatedBorder) cost += ANIMATED_COST;
      update.animatedBorder = animatedBorder;
    }
    if (cost > user.coins) return res.status(400).json({ error: 'Not enough coins' });
    if (cost > 0) {
      update.$inc = { coins: -cost };
      update.$push = { coinHistory: { $each: [{ amount: -cost, reason: 'Profile border customization', type: 'border', timestamp: new Date() }], $slice: -200 } };
    }
    await User.findByIdAndUpdate(req.user._id, update);
    const updated = await User.findById(req.user._id).select('coins borderColor animatedBorder');
    res.json({ success: true, coins: updated.coins, borderColor: updated.borderColor, animatedBorder: updated.animatedBorder });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/user/cosmetics', authMiddleware, async (req, res) => {
  try {
    const { accentColor, bannerGradient, cameraBackground } = req.body;
    const ACCENT_COLORS = ['#00D4FF','#ec4899','#f59e0b','#4ade80','#a78bfa','#06b6d4',''];
    const BANNER_GRADIENTS = ['default','sunset','ocean','forest','ember','aurora','midnight','rose',''];
    const CAMERA_BACKGROUNDS = ['none','custom'];
    const update = {};
    if (accentColor !== undefined) {
      if (!ACCENT_COLORS.includes(accentColor)) return res.status(400).json({ error: 'Invalid accent color' });
      update.accentColor = accentColor;
    }
    if (bannerGradient !== undefined) {
      if (!BANNER_GRADIENTS.includes(bannerGradient)) return res.status(400).json({ error: 'Invalid banner' });
      update.bannerGradient = bannerGradient;
    }
    if (cameraBackground !== undefined) {
      if (!CAMERA_BACKGROUNDS.includes(cameraBackground)) return res.status(400).json({ error: 'Invalid camera background' });
      update.cameraBackground = cameraBackground;
    }
    await User.findByIdAndUpdate(req.user._id, update);
    const updated = await User.findById(req.user._id).select('accentColor bannerGradient cameraBackground');
    res.json({ success: true, accentColor: updated.accentColor, bannerGradient: updated.bannerGradient, cameraBackground: updated.cameraBackground });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const COIN_PACKAGES = [
  { id: 'coins_100',  coins: 100,  amountGbp: 1.49,  label: '100 Coins',   popular: false },
  { id: 'coins_500',  coins: 500,  amountGbp: 5.99,  label: '500 Coins',   popular: false },
  { id: 'coins_1200', coins: 1200, amountGbp: 11.99, label: '1,200 Coins', popular: true  },
  { id: 'coins_3000', coins: 3000, amountGbp: 24.99, label: '3,000 Coins', popular: false },
  { id: 'coins_7000', coins: 7000, amountGbp: 49.99, label: '7,000 Coins', popular: false },
];
app.get('/api/gifts',           (req, res) => res.json({ gifts: GIFTS }));
app.get('/api/coins/packages',  (req, res) => res.json({ packages: COIN_PACKAGES }));

// ─── Buy Coins (Stripe checkout) ──────────────────────────────────────────────
app.post('/api/coins/buy', authMiddleware, async (req, res) => {
  try {
    const { packageId } = req.body;
    const pkg = COIN_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return res.status(400).json({ error: 'Invalid package' });
    if (!stripe) return res.status(503).json({ error: 'Payment system unavailable. Configure STRIPE_SECRET_KEY.' });
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency: 'gbp', product_data: { name: pkg.label, description: `Add ${pkg.coins} coins to your Vybe wallet` }, unit_amount: Math.round(pkg.amountGbp * 100) }, quantity: 1 }],
      metadata: { userId: String(req.user._id), purchaseType: 'coin_purchase', coinsAmount: String(pkg.coins), packageId: pkg.id },
      success_url: `${clientUrl}/wallet?success=1&coins=${pkg.coins}`,
      cancel_url:  `${clientUrl}/coins`,
    });
    await CoinPurchase.create({ userId: req.user._id, stripeSessionId: session.id, coinsAmount: pkg.coins, gbpAmount: pkg.amountGbp });
    res.json({ url: session.url });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Contact form ──────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'All fields are required.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email address.' });
    if (message.length > 2000) return res.status(400).json({ error: 'Message too long (max 2000 chars).' });
    const safeName    = escapeHtml(name);
    const safeEmail   = escapeHtml(email);
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
    const to = process.env.ADMIN_EMAIL;
    if (to) {
      await sendEmail({
        to,
        subject: `[Vybe Contact] ${safeName}`,
        html: `<p><strong>From:</strong> ${safeName} &lt;${safeEmail}&gt;</p><p style="color:#aaa;font-size:12px;">Reply-to: ${safeEmail}</p><p>${safeMessage}</p>`,
      });
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to send message. Please try again.' }); }
});
app.post('/api/user/send-gift', authMiddleware, async (req, res) => {
  try {
    const { recipientId, giftId, coins, room } = req.body;
    const amount = Math.floor(Number(coins));
    if (!Number.isFinite(amount) || amount < 10 || amount > 100000) {
      return res.status(400).json({ error: 'Invalid coin amount' });
    }
    const resolvedGiftId = GIFTS[giftId] ? giftId : 'vybe';
    const gift = GIFTS[resolvedGiftId];
    const sender = await User.findById(req.user._id).select('coins username totalCoinsGifted');
    if (!sender) return res.status(404).json({ error: 'User not found' });
    if (sender.coins < amount) return res.status(400).json({ error: 'Not enough coins' });

    // recipientId is the recipient's socket id — resolve their user account.
    const recipientData = onlineUsers.get(recipientId);
    const recipientUserId = recipientData?.userId;
    // DEV only: gifting a test bot (a connected socket with no real account) is
    // allowed so the gift flow can be tested — the sender is charged and the
    // animation plays, but there is no wallet to credit.
    const isTestGift = !recipientUserId && IS_DEV && !!recipientData;
    if (!recipientUserId && !isTestGift) {
      return res.status(400).json({ error: 'Recipient is not available' });
    }

    // Deduct from the sender's spendable balance; unlock the gift, bump
    // gifting totals, and recompute the gifter rank.
    const newTotalGifted = (sender.totalCoinsGifted || 0) + amount;
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { coins: -amount, totalCoinsGifted: amount, weeklyCoinsGifted: amount },
      $addToSet: { giftCollection: resolvedGiftId },
      $set: { gifterRank: getGifterRank(newTotalGifted) },
      $push: { coinHistory: { $each: [{ amount: -amount, reason: `Sent ${gift.name}`, type: 'gift', timestamp: new Date() }], $slice: -200 } },
    });
    // Add to the recipient's cashable balance (skipped for DEV test gifts)
    if (recipientUserId) {
      await User.findByIdAndUpdate(recipientUserId, {
        $inc: { cashableCoins: amount, giftsReceived: 1 },
        $push: { coinHistory: { $each: [{ amount, reason: `Received ${gift.name} from ${sender.username}`, type: 'gift', timestamp: new Date() }], $slice: -200 } },
      });
    }

    const payload = {
      giftId, giftName: gift.name, coins: amount,
      senderId: String(req.user._id), senderUsername: sender.username,
      recipientSocketId: recipientId,
    };
    // Broadcast to the whole room so every participant sees the animation
    if (room) io.to(room).emit('gift_received', payload);
    else      io.to(recipientId).emit('gift_received', payload);

    if (recipientUserId) {
      await createNotification(recipientUserId, 'coin_reward', '🎁 Gift received!',
        `${sender.username} sent you a ${gift.name} — ${amount} coins`);
    }

    const updated = await User.findById(req.user._id).select('coins');
    res.json({ success: true, coins: updated.coins });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Gifter Leaderboard ───────────────────────────────────────────────────────
app.get('/api/leaderboard/gifters', async (req, res) => {
  try {
    const allTime   = req.query.period === 'alltime';
    const sortField = allTime ? 'totalCoinsGifted' : 'weeklyCoinsGifted';
    const fields    = 'username avatar weeklyCoinsGifted totalCoinsGifted giftCollection gifterRank';

    // Optional auth — logged-in viewer is identified so their own row is flagged.
    let meId = null;
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try { meId = String(jwt.verify(token, process.env.JWT_SECRET || 'vybe_secret').id); } catch {}
    }

    const users = await User.find({ [sortField]: { $gt: 0 } })
      .sort({ [sortField]: -1 })
      .limit(50)
      .select(fields);

    const shape = (u, isMe) => ({
      username:          u.username,
      avatarUrl:         u.avatar || '',
      weeklyCoinsGifted: u.weeklyCoinsGifted || 0,
      totalCoinsGifted:  u.totalCoinsGifted || 0,
      giftCollection:    u.giftCollection || [],
      gifterRank:        u.gifterRank || 'Newcomer',
      isMe,
    });

    const leaders = users.map((u) => shape(u, meId && String(u._id) === meId));

    // Always include the viewer's own entry, even if outside the top 50.
    if (meId && !users.some((u) => String(u._id) === meId)) {
      const me = await User.findById(meId).select(fields);
      if (me && (me[sortField] || 0) > 0) leaders.push(shape(me, true));
    }

    res.json({ leaders });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Reset weeklyCoinsGifted every Monday 00:00 UTC. An hourly week-key check
// keeps this correct across server restarts (unlike an in-memory cron tick).
function mondayWeekKey() {
  const now = new Date();
  const daysSinceMonday = (now.getUTCDay() + 6) % 7; // 0=Sun..6=Sat → days since Mon
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday));
  return monday.toISOString().slice(0, 10);
}
let lastGifterWeek = mondayWeekKey();
setInterval(async () => {
  const wk = mondayWeekKey();
  if (wk === lastGifterWeek) return;
  lastGifterWeek = wk;
  try {
    await User.updateMany({ weeklyCoinsGifted: { $gt: 0 } }, { $set: { weeklyCoinsGifted: 0 } });
    console.log('🔄 Weekly gifter leaderboard reset');
  } catch (e) { console.error('Weekly gifter reset failed:', e.message); }
}, 60 * 60 * 1000);

// ─── Profile Boost (free) ─────────────────────────────────────────────────────
app.post('/api/coins/boost', authMiddleware, async (req, res) => {
  try {
    const BOOST_MS = 60 * 60 * 1000;
    const user = await User.findById(req.user._id).select('boostedUntil');
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.boostedUntil && user.boostedUntil > new Date())
      return res.json({ success: false, alreadyBoosted: true, boostedUntil: user.boostedUntil });
    const boostedUntil = new Date(Date.now() + BOOST_MS);
    await User.findByIdAndUpdate(req.user._id, { boostedUntil });
    for (const [socketId, d] of onlineUsers.entries()) {
      if (String(d.userId) === String(req.user._id)) onlineUsers.set(socketId, { ...d, boostedUntil });
    }
    res.json({ success: true, boostedUntil, coins: user.coins });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Skip Queue (free) ────────────────────────────────────────────────────────
app.post('/api/coins/skip-queue', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('_id');
    if (!user) return res.status(404).json({ error: 'User not found' });
    for (const [socketId, d] of onlineUsers.entries()) {
      if (String(d.userId) === String(req.user._id)) onlineUsers.set(socketId, { ...d, skipQueued: true });
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Replay Last Match ────────────────────────────────────────────────────────
app.post('/api/coins/replay-last', authMiddleware, async (req, res) => {
  try {
    const REPLAY_COST = 20;
    const user = await User.findById(req.user._id).select('coins');
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.coins < REPLAY_COST) return res.status(400).json({ error: `Not enough coins (${REPLAY_COST} required)` });
    const lastMatch = lastMatchInfo.get(String(req.user._id));
    if (!lastMatch) return res.status(404).json({ error: 'No recent match found. Play a chat first!' });
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { coins: -REPLAY_COST },
      $push: { coinHistory: { $each: [{ amount: -REPLAY_COST, reason: 'Replay last match', type: 'replay', timestamp: new Date() }], $slice: -200 } },
    });
    const updated = await User.findById(req.user._id).select('coins');
    res.json({ success: true, coins: updated.coins, lastMatch });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Update PayPal email ──────────────────────────────────────────────────────
app.put('/api/user/paypal-email', authMiddleware, async (req, res) => {
  try {
    const { paypalEmail } = req.body;
    if (!paypalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail))
      return res.status(400).json({ error: 'Invalid PayPal email' });
    await User.findByIdAndUpdate(req.user._id, { paypalEmail });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Cash Out ─────────────────────────────────────────────────────────────────
const CASHOUT_MIN      = 1000;
const GBP_PER_1K_COINS = 4.20; // £6 internal value × 70% after 30% platform fee
app.post('/api/cashout/request', authMiddleware, async (req, res) => {
  try {
    const { coinsAmount } = req.body;
    const amount = Math.floor(Number(coinsAmount));
    if (!amount || amount < CASHOUT_MIN) return res.status(400).json({ error: `Minimum cash out is ${CASHOUT_MIN} coins` });
    const user = await User.findById(req.user._id).select('coins cashableCoins tipsEarned paypalEmail');
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.paypalEmail) return res.status(400).json({ error: 'Set your PayPal email in wallet settings first' });
    if ((user.cashableCoins || 0) < CASHOUT_MIN) return res.status(400).json({ error: `You need at least ${CASHOUT_MIN} cashable coins (tips received) to cash out. You have ${user.cashableCoins || 0}.` });
    if ((user.cashableCoins || 0) < amount) return res.status(400).json({ error: `You only have ${user.cashableCoins || 0} cashable coins — not enough for this amount` });
    const pending = await CashOutRequest.findOne({ userId: req.user._id, status: 'pending' });
    if (pending) return res.status(400).json({ error: 'You already have a pending cash out request' });
    const gbpAmount = (amount / 1000) * GBP_PER_1K_COINS;
    // Atomic deduction: only succeeds if cashableCoins is still sufficient
    const updated = await User.findOneAndUpdate(
      { _id: req.user._id, cashableCoins: { $gte: amount } },
      {
        $inc: { cashableCoins: -amount },
        $push: { coinHistory: { $each: [{ amount: -amount, reason: `Cash out request £${gbpAmount.toFixed(2)}`, type: 'cashout', timestamp: new Date() }], $slice: -200 } },
      },
    );
    if (!updated) return res.status(400).json({ error: 'Insufficient cashable coins' });
    const request = await CashOutRequest.create({ userId: req.user._id, coinsAmount: amount, gbpAmount, paypalEmail: user.paypalEmail });
    res.json({ success: true, request });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/cashout/my-requests', authMiddleware, async (req, res) => {
  try {
    const requests = await CashOutRequest.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(20);
    res.json({ requests });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Admin: cashout requests ──────────────────────────────────────────────────
app.get('/api/admin-secure/cashout-requests', adminSecureMiddleware, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const filter = status === 'all' ? {} : { status };
    const requests = await CashOutRequest.find(filter).populate('userId', 'username email coins cashableCoins tipsEarned').sort({ createdAt: -1 }).limit(100);
    const enriched = requests.map(r => {
      const suspicious = r.userId && (
        (r.coinsAmount > (r.userId.tipsEarned || 0)) ||
        r.coinsAmount > 10000 ||
        !r.userId
      );
      return { ...r.toObject(), suspicious };
    });
    res.json({ requests: enriched });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/admin-secure/cashout/:id/approve', adminSecureMiddleware, async (req, res) => {
  try {
    const { note = '' } = req.body;
    const request = await CashOutRequest.findByIdAndUpdate(req.params.id,
      { status: 'approved', adminNote: note, processedAt: new Date() }, { new: true }
    ).populate('userId', '_id username email');
    if (!request) return res.status(404).json({ error: 'Not found' });
    await createNotification(request.userId._id, 'coin_reward', '✅ Cash out approved!',
      `Your cash out of £${request.gbpAmount.toFixed(2)} was approved and will be sent to ${request.paypalEmail}.${note ? ` Note: ${note}` : ''}`);
    res.json({ success: true, request });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/admin-secure/cashout/:id/reject', adminSecureMiddleware, async (req, res) => {
  try {
    const { note = '' } = req.body;
    const request = await CashOutRequest.findByIdAndUpdate(req.params.id,
      { status: 'rejected', adminNote: note, processedAt: new Date() }, { new: true }
    );
    if (!request) return res.status(404).json({ error: 'Not found' });
    await User.findByIdAndUpdate(request.userId, {
      $inc: { cashableCoins: request.coinsAmount },
      $push: { coinHistory: { $each: [{ amount: request.coinsAmount, reason: 'Cash out refund (request rejected)', type: 'cashout_refund', timestamp: new Date() }], $slice: -200 } },
    });
    await createNotification(request.userId, 'system', '❌ Cash out rejected',
      `Your cash out was rejected. ${note ? `Reason: ${note} — ` : ''}Your ${request.coinsAmount} coins have been refunded.`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Subscription Routes ──────────────────────────────────────────────────────
const SUBSCRIPTION_PLANS = {
  basic: { name: 'Vybe Basic', amount: 699,  gbp: 6.99  },
  vip:   { name: 'Vybe VIP',   amount: 1299, gbp: 12.99 },
};

// Checkout perk copy — shared so the trial and subscribe pages always match.
const VIP_PERKS   = 'Gender filter, country filter & VIP badge';
const BASIC_PERKS = 'Gender filter & Basic badge';

// Get current subscription status
app.get('/api/subscription/status', authMiddleware, async (req, res) => {
  try {
    const sub  = await Subscription.findOne({ userId: req.user._id });
    const user = await User.findById(req.user._id).select('isPremium isVip stripeCustomerId trialActive trialUsed');
    const trialDaysLeft = sub?.isTrial && sub?.trialEnd
      ? Math.max(0, Math.ceil((new Date(sub.trialEnd) - Date.now()) / 86400000))
      : null;
    res.json({
      subscription:   sub || null,
      isPremium:      user?.isPremium   || false,
      isVip:          user?.isVip       || false,
      trialActive:    user?.trialActive || false,
      trialUsed:      user?.trialUsed   || false,
      trialDaysLeft,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Start 7-day VIP trial
app.post('/api/subscription/trial', authMiddleware, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payments unavailable' });
  try {
    const user = await User.findById(req.user._id).select('email username stripeCustomerId trialUsed isPremium isVip');
    if (user.trialUsed)         return res.status(400).json({ error: 'You have already used your free trial.' });
    if (user.isVip || user.isPremium) return res.status(400).json({ error: 'You already have an active subscription.' });
    const existing = await Subscription.findOne({ userId: req.user._id, status: { $in: ['active', 'trialing', 'past_due'] } });
    if (existing)               return res.status(400).json({ error: 'You already have an active subscription.' });

    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
    const sessionParams = {
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'gbp',
          recurring: { interval: 'month' },
          product_data: {
            name: 'Vybe VIP',
            description: VIP_PERKS,
          },
          unit_amount: 1299,
        },
        quantity: 1,
      }],
      subscription_data: { trial_period_days: 7 },
      payment_method_collection: 'always',
      metadata: { userId: String(user._id), purchaseType: 'subscription', plan: 'vip', isTrial: 'true' },
      success_url: `${CLIENT_URL}/subscription?trial_success=true`,
      cancel_url:  `${CLIENT_URL}/`,
    };
    if (user.stripeCustomerId) sessionParams.customer = user.stripeCustomerId;
    else sessionParams.customer_email = user.email;

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ url: session.url });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create Stripe checkout session for subscription
app.post('/api/subscription/create', authMiddleware, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payments unavailable' });
  try {
    const { plan } = req.body;
    if (!SUBSCRIPTION_PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });

    const existing = await Subscription.findOne({ userId: req.user._id, status: { $in: ['active', 'past_due'] } });
    if (existing) return res.status(400).json({ error: 'You already have an active subscription' });

    const user     = await User.findById(req.user._id).select('email username stripeCustomerId');
    const planInfo = SUBSCRIPTION_PLANS[plan];
    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

    const sessionParams = {
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'gbp',
          recurring: { interval: 'month' },
          product_data: {
            name: planInfo.name,
            description: plan === 'basic' ? BASIC_PERKS : VIP_PERKS,
          },
          unit_amount: planInfo.amount,
        },
        quantity: 1,
      }],
      metadata: { userId: String(user._id), purchaseType: 'subscription', plan },
      success_url: `${CLIENT_URL}/subscription?success=true&plan=${plan}`,
      cancel_url:  `${CLIENT_URL}/subscription?cancelled=true`,
    };

    if (user.stripeCustomerId) {
      sessionParams.customer = user.stripeCustomerId;
    } else {
      sessionParams.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Cancel subscription — immediately revokes access
app.post('/api/subscription/cancel', authMiddleware, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payments unavailable' });
  try {
    const sub = await Subscription.findOne({ userId: req.user._id, status: { $in: ['active', 'trialing', 'past_due'] } });
    if (!sub) return res.status(404).json({ error: 'No active subscription found' });
    await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
    // Webhook customer.subscription.deleted handles DB + User updates
    res.json({ success: true, message: sub.isTrial
      ? 'Trial cancelled. Your VIP access has been removed and your card will not be charged.'
      : 'Your VIP access has been removed immediately.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Resume cancelled subscription (before period end)
app.post('/api/subscription/resume', authMiddleware, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payments unavailable' });
  try {
    const sub = await Subscription.findOne({ userId: req.user._id, cancelAtPeriodEnd: true });
    if (!sub) return res.status(404).json({ error: 'No cancellation found to resume' });
    await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: false });
    await Subscription.findByIdAndUpdate(sub._id, { cancelAtPeriodEnd: false, updatedAt: new Date() });
    res.json({ success: true, message: 'Subscription resumed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Change plan (upgrade Basic → VIP or downgrade VIP → Basic)
app.post('/api/subscription/change-plan', authMiddleware, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payments unavailable' });
  try {
    const { plan } = req.body;
    if (!SUBSCRIPTION_PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });
    const sub = await Subscription.findOne({ userId: req.user._id, status: 'active' });
    if (!sub) return res.status(404).json({ error: 'No active subscription' });
    if (sub.plan === plan) return res.status(400).json({ error: 'Already on this plan' });

    const planInfo   = SUBSCRIPTION_PLANS[plan];
    const stripeSub  = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
    const itemId     = stripeSub.items.data[0].id;

    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      items: [{ id: itemId, price_data: {
        currency: 'gbp',
        recurring: { interval: 'month' },
        product_data: { name: planInfo.name },
        unit_amount: planInfo.amount,
      }}],
      proration_behavior: 'always_invoice',
    });

    await Subscription.findByIdAndUpdate(sub._id, { plan, updatedAt: new Date() });
    await User.findByIdAndUpdate(req.user._id, { isPremium: true, isVip: plan === 'vip' });
    res.json({ success: true, plan });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Open Stripe customer portal for self-service billing management
app.post('/api/subscription/portal', authMiddleware, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payments unavailable' });
  try {
    const user = await User.findById(req.user._id).select('stripeCustomerId');
    if (!user?.stripeCustomerId) return res.status(400).json({ error: 'No billing account found' });
    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
    const portalSession = await stripe.billingPortal.sessions.create({
      customer:   user.stripeCustomerId,
      return_url: `${CLIENT_URL}/subscription`,
    });
    res.json({ url: portalSession.url });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: subscription analytics
app.get('/api/admin-secure/subscriptions', adminSecureMiddleware, async (req, res) => {
  try {
    const [total, basic, vip, recentSubs] = await Promise.all([
      Subscription.countDocuments({ status: 'active' }),
      Subscription.countDocuments({ status: 'active', plan: 'basic' }),
      Subscription.countDocuments({ status: 'active', plan: 'vip' }),
      Subscription.find({ status: 'active' })
        .sort({ createdAt: -1 }).limit(20)
        .populate('userId', 'username email'),
    ]);
    const mrr = (basic * 6.99) + (vip * 12.99);
    res.json({ total, basic, vip, mrr: mrr.toFixed(2), recentSubs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Block Routes ──────────────────────────────────────────────────────────────
app.post('/api/user/block/:id', authMiddleware, async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user._id)) return res.status(400).json({ error: 'Cannot block yourself' });
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { blockedUsers: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/user/block/:id', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull: { blockedUsers: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/user/blocks', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('blockedUsers', 'username avatar country');
    res.json({ blocked: user?.blockedUsers || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Notification Routes ──────────────────────────────────────────────────────
app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    const unreadCount   = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.json({ notifications, unreadCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { read: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/notifications', authMiddleware, async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Referral Routes ──────────────────────────────────────────────────────────
app.get('/api/referral/info', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('referralCode referralCount coins');
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.json({
      referralCode:  user.referralCode,
      referralLink:  `${clientUrl}/auth?ref=${user.referralCode}`,
      referralCount: user.referralCount || 0,
      coinsEarned:   (user.referralCount || 0) * 50,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/referral/leaderboard', async (req, res) => {
  try {
    const leaders = await User.find({ referralCount: { $gt: 0 } }).sort({ referralCount: -1 }).limit(20).select('username avatar referralCount');
    res.json({ leaders });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GDPR Routes ──────────────────────────────────────────────────────────────
app.post('/api/gdpr/download', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -emailVerificationToken -passwordResetToken');
    const [reports, friends, notifications] = await Promise.all([
      Report.find({ reporterUserId: req.user._id }),
      Friendship.find({ $or: [{ requester: req.user._id }, { recipient: req.user._id }] }),
      Notification.find({ userId: req.user._id }),
    ]);
    try {
      await sendEmail({
        to: user.email,
        subject: 'Your Vybe data export',
        html: `<div style="font-family:sans-serif;background:#0d0d18;color:#fff;padding:32px;border-radius:16px;">
          <h2 style="color:#a855f7;">Your Vybe Data</h2>
          <p>Exported: ${new Date().toISOString()}</p>
          <ul>
            <li>Username: ${user.username}</li><li>Email: ${user.email}</li>
            <li>Joined: ${user.createdAt}</li><li>Total chats: ${user.totalChats}</li>
            <li>Coins: ${user.coins}</li><li>Friends: ${friends.length}</li>
          </ul>
          <p style="color:#555;font-size:12px;">Contact support@vybelivechat.com for a full machine-readable export.</p>
        </div>`,
      });
    } catch {}
    res.json({ success: true, message: 'Data export sent to your email.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/gdpr/delete-account', authMiddleware, async (req, res) => {
  try {
    const { confirm } = req.body;
    if (confirm !== 'DELETE') return res.status(400).json({ error: 'Type DELETE to confirm' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    kickBannedUser(req.user._id, 'Account deleted.', 'permanent', null);
    await Promise.all([
      User.findByIdAndDelete(req.user._id),
      Report.updateMany({ reporterUserId: req.user._id }, { reporterUserId: null }),
      Friendship.deleteMany({ $or: [{ requester: req.user._id }, { recipient: req.user._id }] }),
      Notification.deleteMany({ userId: req.user._id }),
    ]);
    try {
      await sendEmail({ to: user.email, subject: 'Vybe account deleted',
        html: `<div style="font-family:sans-serif;background:#0d0d18;color:#fff;padding:32px;border-radius:16px;"><h2 style="color:#a855f7;">Account Deleted</h2><p>Your account <strong>${user.username}</strong> has been permanently deleted. Sorry to see you go.</p></div>`,
      });
    } catch {}
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── In-Memory State ──────────────────────────────────────────────────────────
const onlineUsers    = new Map();
const waitingQueue   = [];
const activePairs    = new Map();
const squads         = new Map();
const inviteCodes    = new Map();
const squadMatchBuf  = new Map();
const lastMatchInfo  = new Map(); // userId(string) → { username, userId }
const liveSquadPairs = new Map(); // socketId → [squadMateSocketId, ...]

// ─── Dev Bot (development only — stripped from production) ────────────────────
const IS_DEV     = process.env.NODE_ENV !== 'production';
const botTimers  = new Map(); // socketId → timeoutId

function spawnBotMatch(socket) {
  if (!IS_DEV) return;
  cancelBotTimer(socket.id);
  const timer = setTimeout(() => {
    botTimers.delete(socket.id);
    const inQueue = waitingQueue.some(e =>
      e.socketId === socket.id || (e.socketIds && e.socketIds.includes(socket.id))
    );
    if (!inQueue) return;
    for (let i = waitingQueue.length - 1; i >= 0; i--) {
      const e = waitingQueue[i];
      if (e.socketId === socket.id || (e.socketIds && e.socketIds.includes(socket.id))) waitingQueue.splice(i, 1);
    }
    const botId = `dev_bot_${Date.now()}`;
    const room  = `bot_room_${Date.now()}`;
    activePairs.set(socket.id, [botId]);
    socket.join(room);
    socket.emit('match-found', {
      room,
      peers:                [{ socketId: botId, isInitiator: true }],
      squadMates:           [],
      isInitiator:          true,
      partnerId:            botId,
      partnerUsername:      'TestBot',
      partnerUserId:        null,
      partnerAvatar:        null,
      partnerIsPremium:     false,
      partnerIsVip:         false,
      partnerEmailVerified: false,
      partnerCountry:       'US',
    });
    setTimeout(() => {
      socket.emit('chat-message', { message: 'Hello! This is a test connection.', timestamp: Date.now() });
    }, 1500);
  }, 3000);
  botTimers.set(socket.id, timer);
}

function cancelBotTimer(socketId) {
  const t = botTimers.get(socketId);
  if (t) { clearTimeout(t); botTimers.delete(socketId); }
}

function genSquadCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I)
  let suffix = '';
  for (let i = 0; i < 4; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `VY-${suffix}`;
}

function dissolveSquad(squadId) {
  const squad = squads.get(squadId);
  if (!squad) return;
  inviteCodes.delete(squad.code);
  squads.delete(squadId);
  squadMatchBuf.delete(squadId);
}

function findSoloMatch(socketId, prefs) {
  const me = onlineUsers.get(socketId) || {};
  const myBlocked = me.blockedIds || [];
  const now = new Date();
  const isValidCandidate = (c) => {
    if (c.socketId === socketId) return false;
    if (c.type !== 'solo') return false;
    if (c.mode !== (prefs.mode || 'solo')) return false;
    const them = onlineUsers.get(c.socketId) || {};
    if (me.userId   && (them.blockedIds || []).includes(String(me.userId)))  return false;
    if (them.userId && myBlocked.includes(String(them.userId)))              return false;
    const genderOk  = !prefs.filterGender  || c.gender  === prefs.filterGender;
    const countryOk = !prefs.filterCountry || c.country === prefs.filterCountry;
    const revGok    = !c.filterGender      || me.gender  === c.filterGender;
    const revCok    = !c.filterCountry     || me.country === c.filterCountry;
    return genderOk && countryOk && revGok && revCok;
  };
  // Boosted users first
  for (let i = 0; i < waitingQueue.length; i++) {
    const c = waitingQueue[i];
    const them = onlineUsers.get(c.socketId) || {};
    if (!them.boostedUntil || them.boostedUntil < now) continue;
    if (isValidCandidate(c)) { waitingQueue.splice(i, 1); return c; }
  }
  for (let i = 0; i < waitingQueue.length; i++) {
    const c = waitingQueue[i];
    if (isValidCandidate(c)) { waitingQueue.splice(i, 1); return c; }
  }
  return null;
}

function findSquadMatch(squadId) {
  for (let i = 0; i < waitingQueue.length; i++) {
    const c = waitingQueue[i];
    if (c.squadId && c.squadId === squadId) continue;
    waitingQueue.splice(i, 1);
    return c;
  }
  return null;
}

function emitMatchFound(allSocketIds, room, mySquadSocketIds, opponentSocketIds) {
  for (const sid of allSocketIds) {
    const others     = allSocketIds.filter(x => x !== sid);
    const peers      = others.map(peerId => ({ socketId: peerId, isInitiator: sid > peerId }));
    const myGroup    = mySquadSocketIds.includes(sid) ? mySquadSocketIds : opponentSocketIds;
    const squadMates = myGroup.filter(x => x !== sid);
    // Track live squad pairs for skip/end coordination
    if (squadMates.length > 0) liveSquadPairs.set(sid, squadMates);
    const partnerSid = peers.find(p => !squadMates.includes(p.socketId))?.socketId ?? null;
    const partnerData = partnerSid ? onlineUsers.get(partnerSid) : null;
    io.to(sid).emit('match-found', {
      room, peers, squadMates,
      isInitiator: peers[0]?.isInitiator ?? true,
      partnerId: peers[0]?.socketId ?? null,
      partnerUsername: partnerData?.username || null,
      partnerUserId: partnerData?.userId || null,
      partnerAvatar: partnerData?.avatar || null,
      partnerIsPremium: partnerData?.isPremium || false,
      partnerIsVip: partnerData?.isVip || false,
      partnerEmailVerified: partnerData?.emailVerified || false,
      partnerCountry: partnerData?.country || null,
    });
  }
}

// ─── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 ${socket.id}`);

  // User dismissed their warning modal — mark all their warnings read
  // so they don't reappear on the next login.
  socket.on('warnings-seen', async () => {
    try {
      const userId = onlineUsers.get(socket.id)?.userId;
      if (!userId || !dbConnected) return;
      const u = await User.findById(userId).select('warnings');
      if (u?.warnings?.length) {
        await User.updateOne({ _id: userId }, {
          $set: { warnings: u.warnings.map((w) => ({ _id: w._id, message: w.message, issuedAt: w.issuedAt, read: true })) },
        });
      }
    } catch {}
  });

  socket.on('register', async (data) => {
    let boostedUntil = null;
    // Verify JWT token if provided — prevents identity spoofing
    let verifiedUserId = null;
    const token = data.token || socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vybe_secret');
        verifiedUserId = String(decoded.id);
      } catch {
        // Invalid token — treat as unauthenticated
      }
    }
    // If a userId was claimed, it must match the verified token
    const claimedUserId = data.userId ? String(data.userId) : null;
    const resolvedUserId = verifiedUserId || (token ? null : claimedUserId);

    if (resolvedUserId && dbConnected) {
      try {
        const u = await User.findById(resolvedUserId).select('isBanned banReason banType banExpiresAt warnings isAdmin email boostedUntil');
        if (u?.isBanned) {
          if (u.banType !== 'permanent' && u.banExpiresAt && u.banExpiresAt < new Date()) {
            await User.findByIdAndUpdate(resolvedUserId, {
              isBanned: false, banReason: '', banType: null, banExpiresAt: null, bannedAt: null,
              $push: { banHistory: { action: 'unban', unbannedBy: 'expired', note: 'Ban expired automatically', timestamp: new Date() } },
            });
            socket.emit('ban-cleared');
          } else {
            socket.emit('you-are-banned', { reason: u.banReason, banType: u.banType, banExpiresAt: u.banExpiresAt });
            return;
          }
        } else {
          socket.emit('ban-cleared');
        }
        if (u?.warnings?.length) {
          const unread = u.warnings.filter((w) => !w.read);
          if (unread.length) {
            socket.emit('admin-warnings', unread);
            await User.updateMany({ _id: resolvedUserId }, { $set: { 'warnings.$[].read': true } });
          }
        }
        boostedUntil = u?.boostedUntil || null;
      } catch {}
    }
    onlineUsers.set(socket.id, { ...data, userId: resolvedUserId, socketId: socket.id, boostedUntil });
    io.emit('online-count', onlineUsers.size);

    // Emit active announcement
    try {
      const settings = await getSettings();
      if (settings.announcementActive && settings.announcement) {
        socket.emit('announcement', { message: settings.announcement });
      }
    } catch {}
  });

  socket.on('create-squad', (data) => {
    for (const [sid, squad] of squads.entries()) {
      if (squad.leaderId === socket.id) dissolveSquad(sid);
    }
    const code    = genSquadCode();
    const squadId = `sq_${Date.now()}_${genSquadCode()}`;
    const me      = onlineUsers.get(socket.id) || {};
    const squad   = {
      id: squadId, code, leaderId: socket.id,
      members: [{ socketId: socket.id, userId: me.userId || null, username: me.username || data?.username || 'User' }],
      createdAt: Date.now(), expiresAt: Date.now() + 10 * 60 * 1000,
    };
    squads.set(squadId, squad);
    inviteCodes.set(code, squadId);
    socket.join(squadId);
    setTimeout(() => {
      if (squads.has(squadId)) { io.to(squadId).emit('squad-expired'); dissolveSquad(squadId); }
    }, 10 * 60 * 1000);
    socket.emit('squad-created', { squadId, code, members: squad.members, leaderId: squad.leaderId, expiresAt: squad.expiresAt });
  });

  socket.on('join-squad', (data) => {
    const code    = (data?.code || '').toUpperCase();
    const squadId = inviteCodes.get(code);
    if (!squadId)                     { socket.emit('squad-error', { message: 'Invalid or expired invite link.' }); return; }
    const squad = squads.get(squadId);
    if (!squad)                       { socket.emit('squad-error', { message: 'Squad not found.' }); return; }
    if (Date.now() > squad.expiresAt) { socket.emit('squad-error', { message: 'Invite link has expired.' }); return; }
    if (squad.members.some(m => m.socketId === socket.id)) {
      socket.emit('squad-joined', { squadId, code: squad.code, members: squad.members, leaderId: squad.leaderId, expiresAt: squad.expiresAt });
      return;
    }
    if (squad.members.length >= 2) { socket.emit('squad-error', { message: 'This squad is already full.' }); return; }
    const me = onlineUsers.get(socket.id) || {};
    squad.members.push({ socketId: socket.id, userId: me.userId || null, username: me.username || data?.username || 'Guest' });
    socket.join(squadId);
    const payload = { squadId, code: squad.code, members: squad.members, leaderId: squad.leaderId, expiresAt: squad.expiresAt };
    io.to(squadId).emit('squad-updated', payload);
    socket.emit('squad-joined', payload);
  });

  socket.on('leave-squad', ({ squadId }) => {
    const squad = squads.get(squadId);
    if (!squad) return;
    squad.members = squad.members.filter(m => m.socketId !== socket.id);
    socket.leave(squadId);
    if (squad.members.length === 0) { dissolveSquad(squadId); }
    else {
      if (squad.leaderId === socket.id) squad.leaderId = squad.members[0].socketId;
      io.to(squadId).emit('squad-updated', { squadId, code: squad.code, members: squad.members, leaderId: squad.leaderId, expiresAt: squad.expiresAt });
    }
  });

  socket.on('kick-squad-member', ({ squadId, targetSocketId }) => {
    const squad = squads.get(squadId);
    if (!squad || squad.leaderId !== socket.id) return;
    squad.members = squad.members.filter(m => m.socketId !== targetSocketId);
    io.to(targetSocketId).emit('squad-kicked');
    io.sockets.sockets.get(targetSocketId)?.leave(squadId);
    io.to(squadId).emit('squad-updated', { squadId, code: squad.code, members: squad.members, leaderId: squad.leaderId, expiresAt: squad.expiresAt });
  });

  socket.on('squad-start-match', ({ squadId }) => {
    const squad = squads.get(squadId);
    if (!squad || squad.leaderId !== socket.id) return;
    if (squad.members.length < 2) { socket.emit('squad-error', { message: 'Need 2 members to start.' }); return; }
    io.to(squadId).emit('squad-navigate', { squadId, code: squad.code });
  });

  // Friend invite to squad via socket
  socket.on('invite-friend-to-squad', ({ friendUserId, squadCode }) => {
    for (const [socketId, data] of onlineUsers.entries()) {
      if (String(data.userId) === String(friendUserId)) {
        io.to(socketId).emit('squad-invite-from-friend', { from: onlineUsers.get(socket.id)?.username || 'Friend', code: squadCode });
      }
    }
  });

  socket.on('find-match', async (prefs) => {
    const me = onlineUsers.get(socket.id);
    let myBlockedIds = [];
    if (me?.userId && dbConnected) {
      try {
        const u = await User.findById(me.userId).select('isBanned banReason banType banExpiresAt blockedUsers');
        if (u?.isBanned) {
          if (u.banType !== 'permanent' && u.banExpiresAt && u.banExpiresAt < new Date()) {
            await User.findByIdAndUpdate(me.userId, { isBanned: false, banReason: '', banType: null, banExpiresAt: null, bannedAt: null });
          } else {
            socket.emit('you-are-banned', { reason: u.banReason, banType: u.banType, banExpiresAt: u.banExpiresAt });
            return;
          }
        }
        myBlockedIds = (u?.blockedUsers || []).map(String);
      } catch {}
    }
    // Attach block list to onlineUsers entry for use in findSoloMatch
    if (me) onlineUsers.set(socket.id, { ...me, blockedIds: myBlockedIds });

    cancelBotTimer(socket.id);
    for (let i = waitingQueue.length - 1; i >= 0; i--) {
      const e = waitingQueue[i];
      if (e.socketId === socket.id || (e.socketIds && e.socketIds.includes(socket.id))) waitingQueue.splice(i, 1);
    }

    if (prefs.squadId) {
      const squad = squads.get(prefs.squadId);
      if (!squad) { socket.emit('squad-error', { message: 'Squad expired or not found.' }); return; }
      const buf = squadMatchBuf.get(prefs.squadId) || [];
      if (!buf.includes(socket.id)) buf.push(socket.id);
      squadMatchBuf.set(prefs.squadId, buf);
      if (buf.length < squad.members.length) { socket.emit('waiting'); return; }
      const mySocketIds = [...buf];
      squadMatchBuf.delete(prefs.squadId);
      // Tell squad members about each other so they can pre-connect via WebRTC while searching
      for (const sid of mySocketIds) {
        const mates = mySocketIds.filter(x => x !== sid);
        if (mates.length > 0) {
          liveSquadPairs.set(sid, mates);
          io.to(sid).emit('squad-peer-ready', { mates });
        }
      }
      const opponent = findSquadMatch(prefs.squadId);
      if (opponent) {
        const opponentSocketIds = opponent.socketIds || [opponent.socketId];
        const allSocketIds = [...mySocketIds, ...opponentSocketIds];
        const room = `room_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        for (const sid of allSocketIds) { io.sockets.sockets.get(sid)?.join(room); activePairs.set(sid, allSocketIds.filter(x => x !== sid)); }
        emitMatchFound(allSocketIds, room, mySocketIds, opponentSocketIds);
      } else {
        const existing = waitingQueue.findIndex(e => e.squadId === prefs.squadId);
        if (existing !== -1) waitingQueue.splice(existing, 1);
        waitingQueue.push({ type: 'squad', socketIds: mySocketIds, squadId: prefs.squadId, mode: 'squad', filterGender: prefs.filterGender || null, filterCountry: prefs.filterCountry || '' });
        for (const sid of mySocketIds) io.to(sid).emit('waiting');
      }
      return;
    }

    const match = findSoloMatch(socket.id, prefs);
    if (match) {
      const room = `room_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const mySocketIds  = [socket.id];
      const oppSocketIds = match.socketIds || [match.socketId];
      const allSocketIds = [...mySocketIds, ...oppSocketIds];
      for (const sid of allSocketIds) { io.sockets.sockets.get(sid)?.join(room); activePairs.set(sid, allSocketIds.filter(x => x !== sid)); }
      emitMatchFound(allSocketIds, room, mySocketIds, oppSocketIds);
    } else {
      const userData = onlineUsers.get(socket.id) || {};
      const isBoosted = userData.boostedUntil && userData.boostedUntil > new Date();
      const queueEntry = { type: 'solo', socketId: socket.id, socketIds: [socket.id], gender: userData.gender || 'other', country: userData.country || '', mode: prefs.mode || 'solo', filterGender: prefs.filterGender || null, filterCountry: prefs.filterCountry || '' };
      if (isBoosted) waitingQueue.unshift(queueEntry); else waitingQueue.push(queueEntry);
      socket.emit('waiting');
      // The duo-test bot opts out so the server's dev bot can't hijack its stranger.
      if (!prefs.noDevBot) spawnBotMatch(socket);
    }
  });

  socket.on('webrtc-offer',         ({ offer,     to }) => io.to(to).emit('webrtc-offer',         { offer,     from: socket.id }));
  socket.on('webrtc-answer',        ({ answer,    to }) => io.to(to).emit('webrtc-answer',         { answer,    from: socket.id }));
  socket.on('webrtc-ice-candidate', ({ candidate, to }) => io.to(to).emit('webrtc-ice-candidate',  { candidate, from: socket.id }));
  socket.on('chat-message', ({ message, room }) => socket.to(room).emit('chat-message', { message, from: socket.id, timestamp: Date.now() }));

  async function recordChatCompletion(socketId, partnerSocketId) {
    const userData = onlineUsers.get(socketId);
    if (!userData?.userId) return;
    const update = { $inc: { totalChats: 1 } };
    const partnerCountry = partnerSocketId ? onlineUsers.get(partnerSocketId)?.country : '';
    if (partnerCountry && partnerCountry !== userData.country) {
      update.$addToSet = { countriesChattedWith: partnerCountry };
    }
    try {
      await User.findByIdAndUpdate(userData.userId, update);
    } catch {}
  }

  function storeLastMatch(mySocketId, partnerSocketIds) {
    const me = onlineUsers.get(mySocketId);
    if (!me?.userId) return;
    const partnerSocketId = partnerSocketIds[0];
    if (!partnerSocketId) return;
    const partner = onlineUsers.get(partnerSocketId);
    if (partner) {
      lastMatchInfo.set(String(me.userId), { username: partner.username || 'Anonymous', userId: partner.userId || null });
    }
  }

  socket.on('skip', () => {
    cancelBotTimer(socket.id);
    const partners = activePairs.get(socket.id);
    const mySquadMates = liveSquadPairs.get(socket.id) || [];
    if (partners?.length) {
      storeLastMatch(socket.id, partners);
      recordChatCompletion(socket.id, partners[0]);
      partners.forEach((p) => {
        storeLastMatch(p, [socket.id]);
        recordChatCompletion(p, socket.id);
        if (mySquadMates.includes(p)) {
          // Squad mate: tell them to requeue together (not that a stranger skipped them)
          io.to(p).emit('duo-requeue');
        } else {
          io.to(p).emit('partner-skipped');
        }
        const pp = activePairs.get(p);
        if (pp) { const u = pp.filter(x => x !== socket.id); u.length ? activePairs.set(p, u) : activePairs.delete(p); }
      });
      activePairs.delete(socket.id);
    }
  });

  socket.on('end-chat', () => {
    const partners = activePairs.get(socket.id);
    const mySquadMates = liveSquadPairs.get(socket.id) || [];
    if (partners?.length) {
      storeLastMatch(socket.id, partners);
      recordChatCompletion(socket.id, partners[0]);
      partners.forEach((p) => {
        storeLastMatch(p, [socket.id]);
        recordChatCompletion(p, socket.id);
        if (mySquadMates.includes(p)) {
          // Squad mate: tell them their partner ended (they'll go home)
          io.to(p).emit('duo-partner-ended');
        } else {
          io.to(p).emit('partner-left');
        }
        const pp = activePairs.get(p);
        if (pp) { const u = pp.filter(x => x !== socket.id); u.length ? activePairs.set(p, u) : activePairs.delete(p); }
      });
      activePairs.delete(socket.id);
    }
    liveSquadPairs.delete(socket.id);
  });

  socket.on('send-tip', async ({ amount, recipientSocketId }) => {
    if (!dbConnected) { socket.emit('tip-error', { message: 'Server unavailable, try again' }); return; }
    const TIP_MIN = 10, VYBE_CUT = 0.30;
    const tipAmount = Math.floor(Number(amount));
    if (!tipAmount || tipAmount < TIP_MIN || tipAmount <= 0) { socket.emit('tip-error', { message: `Minimum tip is ${TIP_MIN} coins` }); return; }
    const sender    = onlineUsers.get(socket.id);
    const recipient = onlineUsers.get(recipientSocketId);
    if (!sender?.userId) { socket.emit('tip-error', { message: 'You must be logged in to tip' }); return; }
    if (!recipient)      { socket.emit('tip-error', { message: 'Recipient not found' }); return; }
    try {
      const recipientShare = Math.floor(tipAmount * (1 - VYBE_CUT));
      // Atomic deduction: only succeeds if sender has enough coins
      const senderUpdated = await User.findOneAndUpdate(
        { _id: sender.userId, coins: { $gte: tipAmount } },
        {
          $inc: { coins: -tipAmount },
          $push: { coinHistory: { $each: [{ amount: -tipAmount, reason: `Tip to ${recipient.username || 'user'}`, type: 'tip_sent', timestamp: new Date() }], $slice: -200 } },
        },
        { new: true },
      );
      if (!senderUpdated) { socket.emit('tip-error', { message: 'Not enough coins' }); return; }
      if (recipient.userId) {
        await User.findByIdAndUpdate(recipient.userId, {
          $inc: { cashableCoins: recipientShare, tipsEarned: recipientShare },
          $push: { coinHistory: { $each: [{ amount: recipientShare, reason: `Tip from ${senderUpdated.username}`, type: 'tip_received', timestamp: new Date() }], $slice: -200 } },
        });
        const recipientDoc = await User.findById(recipient.userId).select('coins cashableCoins');
        io.to(recipientSocketId).emit('tip-received', { from: senderUpdated.username, amount: tipAmount, yourShare: recipientShare, coins: recipientDoc.coins, cashableCoins: recipientDoc.cashableCoins });
        await createNotification(recipient.userId, 'coin_reward', '💰 Tip received!', `${senderUpdated.username} tipped you ${recipientShare} coins`);
      }
      socket.emit('tip-sent', { to: recipient.username || 'user', amount: tipAmount, coins: senderUpdated.coins });
    } catch { socket.emit('tip-error', { message: 'Failed to send tip. Try again.' }); }
  });

  socket.on('dm-typing', ({ toUserId, isTyping }) => {
    const sender = onlineUsers.get(socket.id);
    if (!sender?.userId) return;
    for (const [sid, data] of onlineUsers.entries()) {
      if (String(data.userId) === String(toUserId)) {
        io.to(sid).emit('dm-typing', { fromUserId: String(sender.userId), isTyping: !!isTyping });
      }
    }
  });

  socket.on('dm-send', async ({ toUserId, content }) => {
    if (!content?.trim() || !toUserId) return;
    const sender = onlineUsers.get(socket.id);
    if (!sender?.userId) return;
    try {
      const msg = await DirectMessage.create({
        from: sender.userId, to: toUserId,
        content: content.trim().slice(0, 1000),
      });
      for (const [sid, data] of onlineUsers.entries()) {
        if (String(data.userId) === String(toUserId)) {
          io.to(sid).emit('dm-receive', {
            _id: msg._id, from: String(sender.userId),
            content: msg.content, createdAt: msg.createdAt,
          });
        }
      }
    } catch {}
  });

  socket.on('cancel-search', () => {
    for (let i = waitingQueue.length - 1; i >= 0; i--) {
      const e = waitingQueue[i];
      if (e.socketId === socket.id || (e.socketIds && e.socketIds.includes(socket.id))) waitingQueue.splice(i, 1);
    }
    socket.emit('search-cancelled');
  });

  socket.on('disconnect', () => {
    cancelBotTimer(socket.id);
    console.log(`❌ ${socket.id}`);
    onlineUsers.delete(socket.id);
    for (let i = waitingQueue.length - 1; i >= 0; i--) {
      const e = waitingQueue[i];
      if (e.socketId === socket.id || (e.socketIds && e.socketIds.includes(socket.id))) waitingQueue.splice(i, 1);
    }
    const partners = activePairs.get(socket.id);
    const mySquadMates = liveSquadPairs.get(socket.id) || [];
    if (partners?.length) {
      partners.forEach((p) => {
        if (mySquadMates.includes(p)) {
          io.to(p).emit('duo-partner-ended');
        } else {
          io.to(p).emit('partner-left');
        }
        const pp = activePairs.get(p);
        if (pp) { const u = pp.filter(x => x !== socket.id); u.length ? activePairs.set(p, u) : activePairs.delete(p); }
      });
      activePairs.delete(socket.id);
    }
    liveSquadPairs.delete(socket.id);
    for (const [squadId, squad] of squads.entries()) {
      if (!squad.members.some(m => m.socketId === socket.id)) continue;
      squad.members = squad.members.filter(m => m.socketId !== socket.id);
      if (squad.members.length === 0) { dissolveSquad(squadId); }
      else {
        if (squad.leaderId === socket.id) squad.leaderId = squad.members[0].socketId;
        io.to(squadId).emit('squad-updated', { squadId, code: squad.code, members: squad.members, leaderId: squad.leaderId, expiresAt: squad.expiresAt });
      }
      const buf = squadMatchBuf.get(squadId);
      if (buf) { const u = buf.filter(id => id !== socket.id); u.length ? squadMatchBuf.set(squadId, u) : squadMatchBuf.delete(squadId); }
    }
    io.emit('online-count', onlineUsers.size);
  });
});

// Serve React frontend in production
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }
  },
}));
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 Vybe server → http://localhost:${PORT}`));
