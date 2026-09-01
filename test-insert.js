const mongoose = require('mongoose');
const { Types } = mongoose;

async function run() {
  await mongoose.connect('mongodb+srv://fsd-project:KL1RbtuEQQshMOx6@cluster0.s3y9dlg.mongodb.net/bedders69');
  const user = await mongoose.connection.db.collection('users').findOne({});
  if (user) {
    await mongoose.connection.db.collection('payments').insertOne({
      user: user._id,
      membershipPlan: new Types.ObjectId('6a8ecb1e8179894512782fc1'), // from user's payload
      amount: 99,
      paymentType: 'membership',
      status: 'completed',
      stripePaymentIntentId: 'pi_dummy123',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log("Payment inserted for user:", user._id);
  } else {
    console.log("No user found");
  }
  process.exit(0);
}
run();
