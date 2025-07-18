import nodemailer from 'nodemailer';
const sendReminderEmail = async ({ toEmail, name, itemName, daysLeft, type }) => {
    if (daysLeft > 3) return;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS  
    },
});
  console.log(`📨 Preparing to send ${type} email to ${toEmail}`);

  let subject = '';
  let html = '';

  const isExpired = daysLeft <= 0;

  if (!isExpired) {
    subject = `Reminder: Your ${type} for "${itemName}" expires in ${daysLeft} day(s)`;
  } else {
    subject = `Expired: Your ${type} for "${itemName}" has expired`;
  }

  html = `
    <div style="font-family: Arial, sans-serif; background-color: #f6f0fa; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto; color: #333;">
      <div style="text-align: center;">
        <h2 style="color: #a259ff;">${isExpired ? '⚠️ Expired Notice' : '⏰ Reminder'}</h2>
      </div>
      <p>Hi <strong>${name}</strong>,</p>
      <p>
        ${isExpired 
          ? `We wanted to let you know that your <strong>${type}</strong> for <strong>"${itemName}"</strong> has <span style="color: red;">expired</span>.`
          : `Your <strong>${type}</strong> for <strong>"${itemName}"</strong> will expire in <strong>${daysLeft} day(s)</strong>. Please take action before it's too late!`
        }
      </p>
      <p style="margin-top: 30px;">Best regards,<br><strong>QuestBuck Team</strong></p>
      <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
      <p style="font-size: 12px; color: #888; text-align: center;">This is an automated reminder email. Please do not reply.</p>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 ${type} email sent to ${toEmail} - Subject: ${subject}`);
  } catch (error) {
    console.error(`❌ Email failed to ${toEmail}:`, error.message, error.stack);
  }
};

export default sendReminderEmail;
