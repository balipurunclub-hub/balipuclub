import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { registrations } from '@/lib/db/schema';

export async function POST(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { users, mailDate, mailTime, mailLocation, mailMapsLink, mailRouteLink, mailRouteImage } = await req.json();

    if (!users || !Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'No users provided' }, { status: 400 });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return NextResponse.json({ error: 'Email configuration missing on server' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      pool: true,
      maxConnections: 1,
      maxMessages: 100,
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let successCount = 0;
    let failCount = 0;

    // Pre-load map image if it's a local file
    let routeImageAttachment = null;
    let routeImageCidUrl = '';
    
    if (mailRouteImage && !mailRouteImage.startsWith('http')) {
      try {
        const imagePath = path.join(process.cwd(), 'public', mailRouteImage);
        if (fs.existsSync(imagePath)) {
          const ext = path.extname(imagePath).substring(1) || 'jpeg';
          routeImageAttachment = {
            filename: mailRouteImage,
            path: imagePath,
            cid: 'routemap'
          };
          routeImageCidUrl = 'cid:routemap';
        }
      } catch (e) {
        console.error('Could not load map image from public directory', e);
      }
    } else if (mailRouteImage && mailRouteImage.startsWith('http')) {
      routeImageCidUrl = mailRouteImage;
    }

    // Send emails in sequence (or could use Promise.all in batches, but sequence is safer for small/medium bulk to avoid SMTP rate limits)
    for (const user of users) {
      if (!user.email) {
        failCount++;
        continue;
      }

      try {
        const qrBuffer = await QRCode.toBuffer(user.ticketId);

        const finalMailDate = user.entryType === 'free' ? '11th July 2026' : mailDate;
        const finalMailTime = user.entryType === 'free' ? '11:00 AM - 6:00 PM' : mailTime;

        const mailOptions = {
          from: `"Balipu Run Club" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: 'Registration Confirmed & BIB Collection Details: Balipu x Nexus Run',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                @media only screen and (max-width: 600px) {
                  .container { padding: 10px !important; width: 100% !important; box-sizing: border-box !important; }
                  .content { padding: 15px !important; }
                  .qr-box { padding: 10px !important; }
                  .title { font-size: 20px !important; }
                }
              </style>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f0f0f0;">
              <div class="container" style="font-family: Arial, sans-serif; max-width: 600px; width: 100%; margin: 0 auto; color: #1B1B4D; background-color: #f9f9f9; padding: 20px; box-sizing: border-box;">
                <div style="text-align: center; padding: 20px; background-color: #1B1B4D; color: white; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; font-style: italic; color: white;">BALIPU RUN CLUB</h1>
                  <p style="margin: 5px 0 0 0; color: #F5841F; font-size: 14px;">Run for a Better Tomorrow</p>
                </div>
                
                <div class="content" style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); box-sizing: border-box;">
                  <h2 class="title" style="color: #6B2FA0; margin-top: 0; word-break: break-word;">Hi ${user.name},</h2>
                  <p style="font-size: 16px; line-height: 1.5; margin-bottom: 5px;">Your manual registration has been successfully processed!</p>
                  <p style="font-size: 16px; line-height: 1.5; font-weight: bold; color: #F5841F; margin-top: 0;">Lace up your shoes and let's run for a better tomorrow! 🏃‍♂️💨</p>
                  
                  <div style="margin: 20px 0; background-color: #f9f9f9; padding: 15px; border-radius: 6px; border: 1px solid #eee; word-break: break-word;">
                    <h3 style="color: #6B2FA0; margin-top: 0; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">Collection Details</h3>
                    <p style="font-size: 14px; color: #555; margin-top: 0;">Please collect your BIB and T-Shirt from the venue below:</p>
                    <ul style="list-style-type: none; padding: 0; margin: 0; font-size: 15px; line-height: 1.8;">
                    ${mailLocation ? `<li><strong>📍 Location:</strong> ${mailLocation} <br><a href="${mailMapsLink}" target="_blank" style="color: #25D366; text-decoration: none; font-size: 14px; display: inline-block; margin-top: 4px;">(View on Maps)</a></li>` : ''}
                    ${finalMailDate ? `<li><strong>📅 Date:</strong> ${finalMailDate}</li>` : ''}
                    ${finalMailTime ? `<li><strong>⏰ Time:</strong> ${finalMailTime}</li>` : ''}
                  </ul>
                    ${mailRouteLink || routeImageCidUrl ? `
                    <div style="margin-top: 15px; background-color: #f0f4f8; padding: 15px; border-radius: 4px; border-left: 4px solid #6B2FA0;">
                      ${mailRouteLink ? `<p style="margin: 0; font-size: 14px; margin-bottom: ${routeImageCidUrl ? '10px' : '0'}; word-break: break-word;"><strong>🏃 Marathon Route:</strong><br><a href="${mailRouteLink}" target="_blank" style="color: #6B2FA0; text-decoration: underline;">View Route Map</a></p>` : ''}
                      ${routeImageCidUrl ? `<img src="${routeImageCidUrl}" alt="Route Map" style="max-width: 100%; height: auto; border-radius: 4px; display: block; margin-top: 10px; border: 1px solid #ccc;"/>` : ''}
                    </div>
                    ` : ''}
                  </div>

                  <div style="background-color: #f0f4f8; padding: 20px; border-left: 4px solid #F5841F; margin: 20px 0; border-radius: 4px; text-align: center; box-sizing: border-box;">
                    <h3 style="margin-top: 0; color: #1B1B4D;">Your Assigned BIB: <span style="color: #F5841F; font-size: 24px;">${user.bibNumber}</span></h3>
                    
                    <div class="qr-box" style="background: white; padding: 15px; display: inline-block; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 15px; max-width: 100%; box-sizing: border-box;">
                      <img src="cid:qrcode" alt="Your QR Code Ticket" style="width: 200px; max-width: 100%; height: auto; display: block; margin: 0 auto;"/>
                      <p style="font-family: monospace; font-size: 18px; font-weight: bold; margin-top: 10px; margin-bottom: 0; letter-spacing: 1px; word-wrap: break-word;">${user.ticketId}</p>
                    </div>
                    
                    <ul style="list-style-type: none; padding: 0; margin: 0; font-size: 15px; line-height: 1.8; text-align: left; word-break: break-word;">
                      <li><strong>Name:</strong> ${user.name}</li>
                      <li><strong>Jersey:</strong> ${user.jerseySize || 'N/A'}</li>
                      <li><strong>Type:</strong> ${user.entryType === 'free' ? 'Free' : 'Paid'}</li>
                    </ul>
                  </div>
                  
                  <div style="background-color: #e6f7ea; padding: 20px; border-left: 4px solid #25D366; margin: 20px 0; border-radius: 4px; box-sizing: border-box;">
                    <h3 style="margin-top: 0; color: #1B1B4D; font-size: 18px;">Join our WhatsApp Community!</h3>
                    <p style="font-size: 15px; line-height: 1.5; margin-bottom: 15px;">
                      Stay updated with the latest event announcements and connect with fellow runners.
                    </p>
                    <a href="https://chat.whatsapp.com/Drd93iPcBwv4sXneIDuoPc" style="background-color: #25D366; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: block; text-align: center; word-break: break-word;">Join WhatsApp Group</a>
                  </div>
                  
                  <p style="font-size: 14px; line-height: 1.5; margin-top: 30px; color: #555;">
                    Please bring your BIB on the day of the event <strong>(12th July 2026)</strong>. We look forward to seeing you at the starting line!
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                  <p style="font-size: 12px; color: #888; text-align: center;">
                    If you have any questions, please contact our support team.<br>
                    &copy; 2026 Balipu Run Club
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
          attachments: [
            {
              filename: 'ticket-qr.png',
              content: qrBuffer,
              cid: 'qrcode'
            },
            ...(routeImageAttachment ? [routeImageAttachment] : [])
          ]
        };

        await transporter.sendMail(mailOptions);
        
        if (user.uid) {
          try {
            await db
              .update(registrations)
              .set({ emailSent: true, updatedAt: new Date() })
              .where(eq(registrations.id, user.uid));
          } catch (dbErr) {
            console.error(`Failed to update emailSent status for ${user.uid}:`, dbErr);
          }
        }
        
        successCount++;
        
        // Wait 1 second between emails to avoid hitting Google's rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`Failed to send email to ${user.email}:`, err);
        failCount++;
      }
    }
    
    // Close the pool when done
    transporter.close();

    return NextResponse.json({ success: true, successCount, failCount }, { status: 200 });
  } catch (error: any) {
    console.error('Bulk mail error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
