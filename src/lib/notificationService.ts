/**
 * BLUEGUARD NOTIFICATION SERVICE
 * Real-time Dispatch for NTFY Push Notifications & FormSubmit / Server-side Emails
 */

export interface EmergencyNotificationPayload {
  ship_id: string;
  sender_name: string;
  latitude: number;
  longitude: number;
  destination: string;
  message: string;
  timestamp: string;
}

export const OFFICIAL_EMAILS = [
  'trikysaran5721@gmail.com',
  'cliffrichards1404@gmail.com',
  'yogeshramu67@gmail.com'
];
export const OFFICIAL_EMAIL = OFFICIAL_EMAILS[0];
export const NTFY_TOPIC = 'blueguard_maritime_emergency';
export const NTFY_URL = `https://ntfy.sh/${NTFY_TOPIC}`;

export const notificationService = {
  /**
   * Send instant push notification to NTFY mobile app channel
   */
  sendNtfyNotification: async (payload: EmergencyNotificationPayload) => {
    try {
      const messageText = `🚨 MARITIME DISTRESS ALERT!
Ship ID: ${payload.ship_id}
Captain/Handler: ${payload.sender_name}
GPS Position: ${payload.latitude.toFixed(4)}° N, ${payload.longitude.toFixed(4)}° E
Destination: ${payload.destination}
Distress Message: ${payload.message}
Time: ${payload.timestamp}
Google Maps: https://www.google.com/maps?q=${payload.latitude},${payload.longitude}`;

      // HTTP headers must be ASCII only (no emojis in header fields)
      await fetch(NTFY_URL, {
        method: 'POST',
        headers: {
          'Title': `EMERGENCY DISTRESS - Ship ${payload.ship_id}`,
          'Priority': 'max',
          'Tags': 'warning,rotating_light,sos,ship'
        },
        body: messageText
      });
      console.log('[NTFY] Emergency push notification dispatched successfully to topic:', NTFY_TOPIC);
    } catch (err) {
      console.error('[NTFY ERROR] Failed to send push notification:', err);
    }
  },

  /**
   * Send official distress emails to higher officials via FormSubmit & server API endpoint
   */
  sendFormSubmitEmail: async (payload: EmergencyNotificationPayload) => {
    // 1. Server-side Multi-Recipient API Endpoint Dispatch
    try {
      await fetch('/api/emergency-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log('[SERVER EMAIL API] Emergency email dispatch triggered for all recipients');
    } catch (err) {
      console.warn('[SERVER EMAIL API ERROR]', err);
    }

    // 2. Client-side FormSubmit AJAX Fallback for each email
    const emailPromises = OFFICIAL_EMAILS.map(async (email) => {
      try {
        const formSubmitUrl = `https://formsubmit.co/ajax/${email}`;
        const emailBody = {
          _subject: `MARITIME EMERGENCY DISTRESS ALERT - Ship ${payload.ship_id}`,
          _template: 'table',
          _captcha: 'false',
          Ship_ID: payload.ship_id,
          Handler_Name: payload.sender_name,
          GPS_Latitude: payload.latitude.toFixed(4),
          GPS_Longitude: payload.longitude.toFixed(4),
          Destination: payload.destination,
          Distress_Reason: payload.message,
          Timestamp: payload.timestamp,
          Live_Location_Map: `https://www.google.com/maps?q=${payload.latitude},${payload.longitude}`,
          System_Notice: 'This is an automated high-seas distress alert broadcasted by BlueGuard Marine Assistant.'
        };

        await fetch(formSubmitUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(emailBody)
        });
        console.log('[FORMSUBMIT] Emergency email sent to higher official:', email);
      } catch (err) {
        console.error('[FORMSUBMIT ERROR] Failed to send email to ' + email + ':', err);
      }
    });

    await Promise.allSettled(emailPromises);
  },

  /**
   * Dispatch to both NTFY push channel and FormSubmit email simultaneously
   */
  dispatchOfficialAlerts: async (payload: EmergencyNotificationPayload) => {
    await Promise.allSettled([
      notificationService.sendNtfyNotification(payload),
      notificationService.sendFormSubmitEmail(payload)
    ]);
  }
};
