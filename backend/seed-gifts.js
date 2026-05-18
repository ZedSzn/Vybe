// TEST DATA SEEDER — populates gift fields so the leaderboard + gift collection
// render with real content locally. Safe to delete. Run: node seed-gifts.js
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect('mongodb://localhost:27017/vybe');
  const User = mongoose.connection.collection('users');

  const updates = [
    { username: 'ZZ_NZ',       giftCollection: ['small-vybe', 'vybe', 'big-vybe', 'mega-vybe'], coins: 900, rank: 'Vybe Pro' },
    { username: 'testuser123', giftCollection: ['small-vybe', 'vybe'],                           coins: 150, rank: 'Vybe Gifter' },
  ];

  for (const u of updates) {
    const r = await User.updateOne(
      { username: u.username },
      { $set: {
        giftCollection: u.giftCollection,
        totalCoinsGifted: u.coins,
        weeklyCoinsGifted: u.coins,
        gifterRank: u.rank,
      } }
    );
    console.log(`${u.username}: matched ${r.matchedCount}, modified ${r.modifiedCount}`);
  }

  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
