// TEST DATA — gives an account spendable coins. Safe to delete.
// Run: node seed-coins.js
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect('mongodb://localhost:27017/vybe');
  const User = mongoose.connection.collection('users');
  const r = await User.updateOne({ username: 'ZZ_NZ' }, { $set: { coins: 20000 } });
  console.log(`ZZ_NZ: matched ${r.matchedCount}, modified ${r.modifiedCount}`);
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
