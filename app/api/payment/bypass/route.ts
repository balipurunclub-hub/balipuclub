import { NextRequest } from 'next/server';
import nodemailer from 'nodemailer';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();
  
  // 1. Verify Firebase ID token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const idToken = authHeader.slice(7);
  let uid: string;

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return Response.json({ error: 'Invalid token' }, { status: 401 });
  }

  // 2. Mark as paid in Firestore
  try {
    await adminDb.collection('registrations').doc(uid).update({
      paymentStatus: 'paid',
      paymentId: 'bypassed_' + Math.random().toString(36).substring(7),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 3. Send confirmation email
    try {
      const userDoc = await adminDb.collection('registrations').doc(uid).get();
      const userData = userDoc.data();
      
      if (userData && userData.email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: `"Balipu Run Club" <${process.env.EMAIL_USER}>`,
          to: userData.email,
          subject: 'Registration Confirmed: Balipu x Nexus Run',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1B1B4D; background-color: #f9f9f9; padding: 20px;">
              <div style="text-align: center; padding: 20px; background-color: #1B1B4D; color: white; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-style: italic; color: white;">BALIPU</h1>
                <p style="margin: 5px 0 0 0; color: #F5841F;">Run for a Better Tomorrow</p>
              </div>
              
              <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <h2 style="color: #6B2FA0;">Hi ${userData.name},</h2>
                <p style="font-size: 16px; line-height: 1.5; margin-bottom: 5px;">Thanks for registration!</p>
                <p style="font-size: 16px; line-height: 1.5; font-weight: bold; color: #F5841F; margin-top: 0;">Lace up your shoes and let's run for a better tomorrow! 🏃‍♂️💨</p>
                
                <div style="margin: 20px 0; background-color: #f9f9f9; padding: 15px; border-radius: 6px; border: 1px solid #eee;">
                  <h3 style="color: #6B2FA0; margin-top: 0; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">Event Details</h3>
                  <ul style="list-style-type: none; padding: 0; margin: 0; font-size: 16px; line-height: 1.8;">
                    <li><strong>📍 Venue:</strong> Fiza by Nexus Mall, Pandeshwar</li>
                    <li><strong>📅 Date:</strong> 12th July 2026</li>
                    <li><strong>⏰ Time:</strong> 6:30 AM</li>
                  </ul>
                </div>

                <div style="background-color: #f0f4f8; padding: 20px; border-left: 4px solid #F5841F; margin: 20px 0; border-radius: 4px;">
                  <h3 style="margin-top: 0; color: #1B1B4D;">Your Ticket Details</h3>
                  <ul style="list-style-type: none; padding: 0; margin: 0; font-size: 15px; line-height: 1.8;">
                    <li><strong>Name:</strong> ${userData.name}</li>
                    <li><strong>Jersey Size:</strong> ${userData.jerseySize || 'N/A'}</li>
                    <li><strong>Payment ID:</strong> Bypassed (Test)</li>
                  </ul>
                </div>
                
                <p style="font-size: 15px; line-height: 1.5; margin-top: 30px;">
                  Please bring a valid ID proof and this confirmation on the day of the event. We look forward to seeing you at the starting line!
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 13px; color: #888; text-align: center;">
                  If you have any questions, please contact our support team.<br>
                  &copy; 2026 Balipu Run Club
                </p>
              </div>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
      }
    } catch (emailErr) {
      console.error('[Payment bypass] Email sending failed:', emailErr);
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('[Payment bypass] Firestore update failed:', err);
    return Response.json({ error: 'Payment bypass failed.' }, { status: 500 });
  }
}
