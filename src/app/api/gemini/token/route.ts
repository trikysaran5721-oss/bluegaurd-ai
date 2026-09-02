import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY || '';
    return NextResponse.json({
      token: apiKey,
      model: 'gemini-3.5-flash',
      live_model: 'gemini-3.1-flash-live-preview',
      status: 'active',
      provider: 'Google Gemini Live API'
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to issue Gemini ephemeral token' },
      { status: 500 }
    );
  }
}
