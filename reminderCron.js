
import cron from 'node-cron';
import Subscription from './models/subcriptionmodel.js';
import Redemption from './models/redeemmodel.js';
import User from './models/usermodel.js';
import sendReminderEmail from './utils/sendReminderEmail.js';
console.log('🚀 Cron job file loaded');

export async function runReminderJob() {
  const now = new Date();
  console.log('🔔 Reminder Cron Running at', now.toISOString());

  try {
   
    const subscriptions = await Subscription.find({ status: 'active' });

    for (const sub of subscriptions) {
      const expiry = new Date(sub.subscription_end);
      const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

      const user = await User.findById(sub.user_id);
      if (!user?.email) continue;

      if (daysLeft > 0 && daysLeft <= 7) {
        
        await sendReminderEmail({
          toEmail: user.email,
          name: user.name,
          itemName: sub.subscription_type,
          daysLeft,
          type: 'subscription',
        });
      } else if (daysLeft <= 0) {
        
        sub.status = 'expired';
        await sub.save();

        await User.findByIdAndUpdate(sub.user_id, { subscription_status: 'inactive' });

        await sendReminderEmail({
          toEmail: user.email,
          name: user.name,
          itemName: sub.subscription_type,
          daysLeft: 0,
          type: 'subscription',
        });
      }
    }

 
    const redemptions = await Redemption.find({ status: 'active' });

    for (const redeem of redemptions) {
      const expiry = new Date(redeem.expires_at);
      const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

      const user = await User.findById(redeem.user_id);
      if (!user?.email) continue;

      if (daysLeft > 0 && daysLeft <= 5) {
        
        await sendReminderEmail({
          toEmail: user.email,
          name: user.name,
          itemName: redeem.item_name,
          daysLeft,
          type: 'redemption',
        });
      } else if (daysLeft <= 0) {
       
        redeem.status = 'expired';
        await redeem.save();

        await sendReminderEmail({
          toEmail: user.email,
          name: user.name,
          itemName: redeem.item_name,
          daysLeft: 0,
          type: 'redemption',
        });
      }
    }

    console.log('✅ Cron completed successfully');
  } catch (err) {
    console.error('❌ Cron error:', err.message);
  }
}


cron.schedule('* 8 * * *', () => {
  runReminderJob();
  console.log('📆 Scheduled daily reminder job triggered');
});
