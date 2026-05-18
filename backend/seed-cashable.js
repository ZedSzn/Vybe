// TEST DATA — gives an account cashable coins so the cash-out flow can be
// tested end to end. Safe to delete. Run: node seed-cashable.js
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect('mongodb://localhost:27017/vybe');
  const User = mongoose.connection.collection('users');

  const r = await User.updateOne(
    { username: 'ZZ_NZ' },
    { $set: { cashableCoins: 10000, tipsEarned: 10000 } }
  );
  console.log(`ZZ_NZ: matched ${r.matchedCount}, modified ${r.modifiedCount}`);

  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
