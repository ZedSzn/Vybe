// TEST DATA — sets account stats so every status pill shows.
// Safe to delete. Run: node seed-pills.js
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect('mongodb://localhost:27017/vybe');
  const User = mongoose.connection.collection('users');

  const r = await User.updateOne(
    { username: 'ZZ_NZ' },
    { $set: {
      totalCoinsGifted: 12000,   // Gifter rank → Vybe Legend (10,000+)
      gifterRank: 'Vybe Legend',
      isPremium: true,           // subscription pill
      isVip: true,               // → shows VIP (the higher tier)
      emailVerified: true,       // Verified pill
      loginStreak: 45,           // Streak pill (7+)
      longestStreak: 45,         // Veteran pill (30+)
      totalChats: 150,           // Chatter pill (100+)
    } }
  );
  console.log(`ZZ_NZ: matched ${r.matchedCount}, modified ${r.modifiedCount}`);

  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
