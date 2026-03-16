// LEGACY: This file is not used. Email is handled by api-server.js
// backend/server.js - Email API Server
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // ✅ FIXED: Increased limit for PDF attachments

// Configure email transporter (using Gmail as example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail
    pass: process.env.EMAIL_PASS  // App-specific password
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email transporter error:', error);
  } else {
    console.log('✅ Email server is ready to send emails');
  }
});

// ========== EMAIL ROUTES ==========

// ✅ NEW: Send email with offer letter (for HR approval emails)
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html, attachments } = req.body;

    console.log('📧 Sending email to:', to);
    console.log('📎 Attachments:', attachments?.length || 0);

    // Prepare email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: html,
      attachments: attachments?.map(att => ({
        filename: att.filename,
        content: att.content.split(',')[1], // Remove data:application/pdf;base64, prefix
        encoding: 'base64'
      })) || []
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', info.messageId);
    
    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('❌ Email send error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

// Approve submission
app.post('/api/emails/approve', async (req, res) => {
  try {
    const { to, internName, pmEmail, type, item } = req.body;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      cc: pmEmail,
      subject: `✅ ${type} Approved`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1d7874 0%, #679289 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-badge { background: #4ade80; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🎉 Congratulations!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your submission has been approved</p>
            </div>
            <div class="content">
              <p>Hi ${internName},</p>
              
              <div class="success-badge">
                ✅ APPROVED
              </div>
              
              <p>Great work! Your <strong>${type}</strong> has been reviewed and approved by your Project Manager.</p>
              
              <div class="details">
                <h3 style="margin-top: 0;">Submission Details:</h3>
                <ul>
                  ${type === "Weekly Report" ? `
                    <li><strong>Week:</strong> ${item.weekNumber}</li>
                    <li><strong>Period:</strong> ${item.dateRange}</li>
                    <li><strong>Total Hours:</strong> ${item.totalHours}h</li>
                  ` : type === "Monthly Report" ? `
                    <li><strong>Month:</strong> ${item.month}</li>
                    <li><strong>Total Hours:</strong> ${item.totalHours}h</li>
                    <li><strong>Total Days:</strong> ${item.totalDays}</li>
                  ` : `
                    <li><strong>Project:</strong> ${item.projectName || item.title}</li>
                    <li><strong>Status:</strong> ${item.status}</li>
                  `}
                  <li><strong>Approved Date:</strong> ${new Date().toLocaleDateString()}</li>
                </ul>
              </div>
              
              <p>Keep up the excellent work! Your dedication and quality contributions are truly appreciated.</p>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>Project Management Team</strong>
              </p>
            </div>
            <div class="footer">
              <p>This is an automated email from the Intern Management System</p>
              <p>© 2025 Company Name. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    
    console.log(`✅ Approval email sent to ${to}`);
    res.status(200).json({ 
      success: true, 
      message: 'Approval email sent successfully' 
    });

  } catch (error) {
    console.error('❌ Error sending approval email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email', 
      error: error.message 
    });
  }
});

// Reject submission
app.post('/api/emails/reject', async (req, res) => {
  try {
    const { to, internName, pmEmail, type, reason, item } = req.body;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      cc: pmEmail,
      subject: `⚠️ ${type} Requires Revision`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #d90429 0%, #b00320 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .warning-badge { background: #f59e0b; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .feedback-box { background: #fff3cd; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">📝 Revision Required</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your submission needs some changes</p>
            </div>
            <div class="content">
              <p>Hi ${internName},</p>
              
              <div class="warning-badge">
                ⚠️ REVISION REQUIRED
              </div>
              
              <p>Thank you for your submission. Your <strong>${type}</strong> has been reviewed, and we need you to make some revisions before it can be approved.</p>
              
              <div class="details">
                <h3 style="margin-top: 0;">Submission Details:</h3>
                <ul>
                  ${type === "Weekly Report" ? `
                    <li><strong>Week:</strong> ${item.weekNumber}</li>
                    <li><strong>Period:</strong> ${item.dateRange}</li>
                  ` : type === "Monthly Report" ? `
                    <li><strong>Month:</strong> ${item.month}</li>
                  ` : `
                    <li><strong>Project:</strong> ${item.projectName || item.title}</li>
                  `}
                  <li><strong>Reviewed Date:</strong> ${new Date().toLocaleDateString()}</li>
                </ul>
              </div>
              
              <div class="feedback-box">
                <h3 style="margin-top: 0; color: #856404;">📋 Feedback:</h3>
                <p style="margin: 0; color: #856404;"><strong>${reason}</strong></p>
              </div>
              
              <p>Please review the feedback above, make the necessary changes, and resubmit your ${type.toLowerCase()}. If you have any questions, feel free to reach out to your Project Manager.</p>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>Project Management Team</strong>
              </p>
            </div>
            <div class="footer">
              <p>This is an automated email from the Intern Management System</p>
              <p>© 2025 Company Name. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    
    console.log(`✅ Rejection email sent to ${to}`);
    res.status(200).json({ 
      success: true, 
      message: 'Rejection email sent successfully' 
    });

  } catch (error) {
    console.error('❌ Error sending rejection email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email', 
      error: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Email API is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Email API server running on port ${PORT}`);
  console.log(`📧 Ready to send emails via ${process.env.EMAIL_USER}`);
  console.log(`
Available Endpoints:
  - POST /api/send-email (with attachments)
  - POST /api/emails/approve
  - POST /api/emails/reject
  - GET  /api/health
  `);
});

module.exports = app;
