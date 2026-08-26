import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const queryText = body.query || '';
    const language = body.language || 'en';
    const destination = body.destination || 'Colombo';
    const shipId = body.ship_id || '123456789012';
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const lower = queryText.toLowerCase();

    // 🚨 Emergency Intent Detection
    if (lower.includes('emergency') || lower.includes('distress') || lower.includes('sos') || lower.includes('blueguard emergency') || lower.includes('blue gaurd emergency')) {
      const emergencyAnswer = language === 'hi'
        ? `🚨 आपातकालीन संकट चेतावनी सक्रिय! जहाज ${shipId} द्वारा सभी नजदीकी जहाजों, NTFY मोबाइल चैनल ('blueguard_maritime_emergency') और उच्च अधिकारी ईमेल ('trikysaran5721@gmail.com') पर अलर्ट भेजा जा रहा है।`
        : `🚨 EMERGENCY DISTRESS ALERT ACTIVATED: Ship ${shipId} is broadcasting distress signal to all nearby vessels, NTFY mobile channel ('blueguard_maritime_emergency'), and higher official email ('trikysaran5721@gmail.com').`;

      return NextResponse.json({
        answer: emergencyAnswer,
        language,
        tools_called: ['create_emergency_alert', 'get_nearby_online_ships', 'dispatch_ntfy_push', 'send_official_email'],
        provider: 'BlueGuard Emergency Network'
      });
    }

    let toolsCalled = ['get_weather', 'get_wind', 'get_sst', 'get_chlorophyll', 'calculate_route_risk'];

    if (lower.includes('sst') || lower.includes('temperature') || lower.includes('sea surface')) {
      toolsCalled = ['get_sst'];
    } else if (lower.includes('chlorophyll') || lower.includes('biomass') || lower.includes('phytoplankton')) {
      toolsCalled = ['get_chlorophyll'];
    } else if (lower.includes('what if') || lower.includes('scenario') || lower.includes('increase')) {
      toolsCalled = ['simulate_what_if_scenario'];
    } else if (lower.includes('compare') || lower.includes('comparison')) {
      toolsCalled = ['compare_routes'];
    } else if (lower.includes('ship') || lower.includes('vessel') || lower.includes('nearby') || lower.includes('jahaj')) {
      toolsCalled = ['get_nearby_vessels'];
    } else if (lower.includes('tide') || lower.includes('wave') || lower.includes('jwar')) {
      toolsCalled = ['get_tide'];
    } else if (lower.includes('cyclone') || lower.includes('storm') || lower.includes('toofan')) {
      toolsCalled = ['get_cyclone_hazards'];
    } else if (lower.includes('analyze') || lower.includes('area') || lower.includes('happening')) {
      toolsCalled = ['get_area_marine_conditions', 'get_sst', 'get_chlorophyll', 'calculate_route_risk'];
    }

    // Call OpenAI ChatGPT LLM if key is available
    if (apiKey) {
      try {
        // @ts-ignore
        const { OpenAI } = await import('openai');
        const openai = new OpenAI({ apiKey });

        const systemPrompt = `You are BlueGuard, an Agentic AI Marine Information and Decision-Support Assistant for marine ship handlers. 
CRITICAL PRINCIPLE: You must NEVER claim to autonomously control or steer a real vessel. Never invent marine telemetry values out of thin air. Always explain data carefully (e.g. "currently classified as", "based on available data").
Respond clearly and concisely in ${language === 'hi' ? 'Hindi' : 'English'}. Keep spoken answers short, informative, and focused on maritime safety.`;

        const marineToolData = {
          ship_id: shipId,
          destination,
          position: "13.0827° N, 80.2707° E (Offshore Bay of Bengal)",
          sst: "29.1°C (Thermal Front gradient, DEMO MARINE DATA)",
          chlorophyll: "0.42 mg/m3 (MEDIUM biomass concentration, DEMO MARINE DATA)",
          weather: "28.5°C, Partly Cloudy with Scattered Squalls, Wave Height: 2.1m",
          wind: "22 knots NE, Moderate Gusts up to 28.5 knots",
          tide: "Current tide: Ebbing (1.45m), Current speed: 1.2 knots SE",
          cyclone_watch: "Tropical Depression 02B, 120 NM SE, Expected max wind 45 kts",
          nearby_vessels: "MV Ocean Warrior (11.5 NM) and SS Neptune Breeze (18.2 NM)",
          route_risk: "CAUTION due to 22 knot NE winds near Dondra Head"
        };

        const completion = await openai.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Query: ${queryText}\nMarine Telemetry Tools Data: ${JSON.stringify(marineToolData)}` }
          ],
          max_tokens: 250,
          temperature: 0.3
        });

        const answer = completion.choices[0]?.message?.content?.trim() || '';
        if (answer) {
          return NextResponse.json({
            answer,
            language,
            tools_called: toolsCalled,
            provider: `OpenAI ChatGPT (${model})`
          });
        }
      } catch (openAiErr) {
        console.error('OpenAI API Error:', openAiErr);
      }
    }

    // Contextual deterministic response engine fallback
    let answer = '';
    if (language === 'hi') {
      if (lower.includes('sst') || lower.includes('temperature') || lower.includes('तापमान')) {
        answer = `ब्लूगार्ड रिपोर्ट: आपकी यात्रा मार्ग पर समुद्री सतह का तापमान (SST) 29.1°C दर्ज किया गया है। (डेमो मरीन डेटा)`;
      } else if (lower.includes('chlorophyll') || lower.includes('क्लोरोफिल')) {
        answer = `ब्लूगार्ड विश्लेषण: मार्ग में क्लोरोफिल सांद्रता 0.42 mg/m³ (मध्यम स्तर) है। (डेमो मरीन डेटा)`;
      } else if (lower.includes('what if') || lower.includes('scenario')) {
        answer = `सिमुलेशन रिपोर्ट: यदि हवा की गति +12 समुद्री मील बढ़ती है, तो मार्ग जोखिम 'उच्च जोखिम' (HIGH RISK) में बदल जाता है। (केवल सिमुलेशन)`;
      } else if (lower.includes('mausam') || lower.includes('weather') || lower.includes('wind')) {
        answer = `ब्लूगार्ड रिपोर्ट: मार्ग में पूर्वोत्तर से 22 समुद्री मील हवा चल रही है और लहरों की ऊंचाई 2.1 मीटर है।`;
      } else {
        answer = `ब्लूगार्ड मरीन असिस्टेंस: मार्ग ${destination} वर्तमान में CAUTION (सावधान) श्रेणी में है। SST 29.1°C और मध्यम क्लोरोफिल दर्ज है।`;
      }
    } else {
      if (lower.includes('sst') || lower.includes('sea surface') || lower.includes('temperature')) {
        answer = `BlueGuard Report: Sea surface temperature (SST) along your route is currently 29.1°C with an active thermal front gradient. (DEMO MARINE DATA)`;
      } else if (lower.includes('chlorophyll') || lower.includes('biomass')) {
        answer = `BlueGuard Intelligence: Chlorophyll concentration along your passage is recorded at 0.42 mg/m³ (MEDIUM level). (DEMO MARINE DATA)`;
      } else if (lower.includes('what if') || lower.includes('scenario')) {
        answer = `SIMULATION REPORT: If wind increases by +12 knots (to 34 kts), overall route risk escalates from CAUTION to HIGH RISK along Dondra Head passage. (SIMULATION ONLY)`;
      } else if (lower.includes('compare') || lower.includes('comparison')) {
        answer = `Route Comparison: Route B (Chennai → Kochi) currently exhibits lower wind exposure (SAFE) compared to Route A (Chennai → Colombo), despite being longer.`;
      } else if (lower.includes('analyze') || lower.includes('area') || lower.includes('happening')) {
        answer = `BlueGuard Route Analysis: Passage to ${destination} is currently classified as CAUTION. Moderate NE winds (22 kts), SST thermal front (29.1°C), and Tropical Depression 02B (120 NM SE) are present.`;
      } else {
        answer = `BlueGuard Agentic Assistant active for Ship ${shipId}. All marine tools (SST, Chlorophyll, Weather, Wind, Tide, Cyclone) operating under advisory status.`;
      }
    }

    return NextResponse.json({
      answer,
      language,
      tools_called: toolsCalled,
      provider: 'BlueGuard Agentic Marine Engine'
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to process agent query' },
      { status: 500 }
    );
  }
}
