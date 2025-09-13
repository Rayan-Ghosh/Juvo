'use server';

/**
 * @fileOverview A flow to check user's wellness based on their last activity.
 *
 * - wellnessCheckIn - A function that checks if the user has been active and sends an alert if not.
 */

import { z } from 'zod';
import { getProfile, UserProfile } from '@/services/profile';
import { sendEmail } from '@/services/email';
import { differenceInHours } from 'date-fns';
import { Timestamp } from 'firebase/firestore';


const CHECK_IN_INTERVAL_HOURS = 0.5; // 30 minutes
const ALERT_INTERVAL_HOURS = 24;

export async function wellnessCheckIn(userId: string): Promise<WellnessCheckInOutput> {
  type WellnessCheckInOutput = z.infer<typeof WellnessCheckInOutputSchema>;
  const WellnessCheckInOutputSchema = z.object({
    status: z.enum(['ok', 'check_in_needed', 'alert_sent', 'config_error', 'error', 'vacation_mode']),
    message: z.string().describe('A message to display to the user about their check-in status.'),
  });

  try {
    const profile = await getProfile(userId);

    if (!profile) {
      return { status: 'error', message: 'Could not retrieve your profile.' };
    }

    if (profile.vacationMode) {
      return { status: 'vacation_mode', message: 'Vacation mode is on. Wellness alerts are paused.' };
    }

    const { lastSeen, caretakerEmail } = profile;

    if (!lastSeen || !(lastSeen instanceof Timestamp)) {
      // First time user or lastSeen is not a valid Timestamp
      return { status: 'ok', message: 'Welcome! Thanks for checking in.' };
    }

    const lastSeenDate = lastSeen.toDate();
    const hoursSinceLastSeen = differenceInHours(new Date(), lastSeenDate);

    if (hoursSinceLastSeen < CHECK_IN_INTERVAL_HOURS) {
      return { status: 'ok', message: 'Great job staying consistent. You\'ve checked in recently!' };
    }
    
    if (hoursSinceLastSeen >= ALERT_INTERVAL_HOURS) {
      if (!caretakerEmail) {
        return {
          status: 'config_error',
          message: 'It\'s been over 24 hours. Please add a caretaker email in settings to enable wellness alerts.',
        };
      }

      try {
        await sendEmail({
          to: caretakerEmail,
          subject: 'Wellness Check-in Reminder for Your Loved One',
          html: `
            <p>This is an automated wellness check from Juvo.</p>
            <p>We noticed it's been over 24 hours since we last saw the user in the app.</p>
            <p>This is just a gentle reminder to check in with them when you have a moment.</p>
            <p>Sincerely,<br/>The Juvo Team</p>
          `,
        });
        return { status: 'alert_sent', message: `It's been a while! We've sent a friendly reminder to ${caretakerEmail} to check in.` };
      } catch (error) {
        console.error('Failed to send wellness check email:', error);
        return { status: 'error', message: 'We tried to send a check-in alert, but an error occurred.' };
      }
    }
    
    return { status: 'check_in_needed', message: 'It\'s great to see you back. Thanks for checking in!' };

  } catch (error) {
    console.error('Error in wellnessCheckIn flow:', error);
    return { status: 'error', message: 'An unexpected error occurred during the wellness check.' };
  }
}
