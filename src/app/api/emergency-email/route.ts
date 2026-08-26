import { NextResponse } from 'next/server';

const OFFICIAL_EMAILS = [
  'trikysaran5721@gmail.com',
  'cliffrichards1404@gmail.com',
  'yogeshramu67@gmail.com'
];

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const results: Record<string, string> = {};

    const emailPromises = OFFICIAL_EMAILS.map(async (email) => {
      // 1. Dispatch via FormSubmit AJAX Endpoint
      try {
        const formSubmitUrl = `https://formsubmit.co/ajax/${email}`;
        await fetch(formSubmitUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Referer': 'http://localhost:3000',
            'Origin': 'http://localhost:3000'
          },
          body: JSON.stringify({
            _subject: `🚨 MARITIME EMERGENCY DISTRESS ALERT - Ship ${payload.ship_id || 'UNKNOWN'}`,
            _template: 'table',
            _captcha: 'false',
            Ship_ID: payload.ship_id,
            Handler_Name: payload.sender_name || 'Captain',
            GPS_Latitude: payload.latitude ? payload.latitude.toFixed(4) : 'N/A',
            GPS_Longitude: payload.longitude ? payload.longitude.toFixed(4) : 'N/A',
            Destination: payload.destination || 'High Seas',
            Distress_Reason: payload.message || 'Distress signal activated',
            Timestamp: payload.timestamp || new Date().toLocaleTimeString(),
            Live_Location_Map: `https://www.google.com/maps?q=${payload.latitude},${payload.longitude}`,
            System_Notice: 'Automated distress alert broadcasted by BlueGuard Agentic AI Marine Assistant.'
          })
        });
        results[email] = 'Dispatched via FormSubmit';
      } catch (err: any) {
        results[email] = `FormSubmit Error: ${err.message}`;
      }
    });

    await Promise.allSettled(emailPromises);

    return NextResponse.json({
      success: true,
      recipients: OFFICIAL_EMAILS,
      dispatched_status: results,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
