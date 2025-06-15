import nodemailer from 'nodemailer';

const sendResetEmail = async (toEmail, resetToken) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS  
    },
  });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Reset your password',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 20px auto; padding: 20px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
          .header { text-align: center; font-size: 24px; color: #4CAF50; margin-bottom: 20px; }
          .content { font-size: 16px; color: #333; }
          .content a { text-decoration: none; color: #fff; background-color: #4CAF50; padding: 10px 20px; border-radius: 5px; margin-top: 10px; display: inline-block; }
          .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Password Reset Request</div>
          <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset your password. Please click the button below to reset it:</p>
            <a href="${resetLink}">Reset Password</a>
            <p>If you didn't request this, you can safely ignore this email.</p>
          </div>
          <div class="footer"><p>— QuestBuck Team</p></div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

export default sendResetEmail;
