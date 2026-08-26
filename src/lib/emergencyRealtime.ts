import { EmergencyAlert, V2VVoiceMessage } from './types';
import { notificationService } from './notificationService';
import { supabase } from './supabase';

type AlertListener = (alert: EmergencyAlert) => void;
type AckListener = (alertId: string, shipId: string) => void;
type VoiceListener = (voiceMsg: V2VVoiceMessage) => void;

class EmergencyRealtimeNetwork {
  private ws: WebSocket | null = null;
  private currentShipId: string = '123456789012';
  private alertListeners: AlertListener[] = [];
  private ackListeners: AckListener[] = [];
  private voiceListeners: VoiceListener[] = [];
  private broadcastChannel: BroadcastChannel | null = null;
  private supabaseChannel: any = null;

  constructor() {
    // 1. Initialize Supabase Cloud Realtime Channel for Global Cross-Laptop Broadcasts
    try {
      this.supabaseChannel = supabase.channel('blueguard_global_maritime_network', {
        config: { broadcast: { self: true } }
      });

      this.supabaseChannel
        .on('broadcast', { event: 'EMERGENCY_ALERT' }, (payload: any) => {
          console.log('[SUPABASE REALTIME] Emergency alert received from remote ship:', payload.payload);
          if (payload?.payload) {
            this.notifyAlertListeners(payload.payload);
          }
        })
        .on('broadcast', { event: 'ALERT_ACKNOWLEDGED' }, (payload: any) => {
          if (payload?.payload) {
            this.notifyAckListeners(payload.payload.alert_id, payload.payload.acknowledged_by);
          }
        })
        .on('broadcast', { event: 'V2V_VOICE_DISPATCH' }, (payload: any) => {
          console.log('[SUPABASE REALTIME] V2V Voice dispatch received:', payload.payload);
          if (payload?.payload) {
            this.notifyVoiceListeners(payload.payload);
          }
        })
        .subscribe((status: string) => {
          console.log('[SUPABASE REALTIME CHANNEL STATUS]', status);
        });
    } catch (err) {
      console.warn('[SUPABASE REALTIME INIT WARN]', err);
    }

    // 2. Initialize local Browser BroadcastChannel as fast local tab fallback
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('blueguard_emergency_network');
      this.broadcastChannel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'EMERGENCY_ALERT_RECEIVED') {
          this.notifyAlertListeners(payload);
        } else if (type === 'ALERT_ACKNOWLEDGED') {
          this.notifyAckListeners(payload.alert_id, payload.acknowledged_by);
        } else if (type === 'V2V_VOICE_DISPATCH') {
          this.notifyVoiceListeners(payload);
        }
      };
    }
  }

  public connect(shipId: string) {
    this.currentShipId = shipId;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

    try {
      this.ws = new WebSocket(`${wsUrl}/ws/emergency/${shipId}`);
      this.ws.onopen = () => {
        console.log(`[BLUEGUARD REALTIME] Connected to Emergency Network as Ship ${shipId}`);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'EMERGENCY_ALERT_RECEIVED') {
            this.notifyAlertListeners(data.payload);
          } else if (data.type === 'ALERT_ACKNOWLEDGED') {
            this.notifyAckListeners(data.payload.alert_id, data.payload.acknowledged_by);
          } else if (data.type === 'V2V_VOICE_DISPATCH') {
            this.notifyVoiceListeners(data.payload);
          }
        } catch (err) {
          console.warn('WS message parse error:', err);
        }
      };
    } catch (e) {}
  }

  public broadcastEmergency(alert: EmergencyAlert) {
    // 1. Dispatch push notification to NTFY mobile channel & official email (trikysaran5721@gmail.com)
    notificationService.dispatchOfficialAlerts({
      ship_id: alert.sender_ship_id,
      sender_name: alert.sender_name || 'Captain',
      latitude: alert.latitude,
      longitude: alert.longitude,
      destination: alert.destination || 'High Seas',
      message: alert.message || 'Distress signal activated by ship handler',
      timestamp: alert.timestamp || new Date().toLocaleTimeString()
    });

    // 2. Broadcast across Supabase Realtime to ALL connected laptops globally
    if (this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'EMERGENCY_ALERT',
        payload: alert
      }).catch((err: any) => console.warn('Supabase broadcast send err:', err));
    }

    // 3. Broadcast to local BroadcastChannel mesh
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'EMERGENCY_ALERT_RECEIVED',
        payload: alert
      });
    }

    // 4. Send via WebSocket if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'SEND_EMERGENCY',
          payload: alert
        })
      );
    }

    // 5. Fallback backend HTTP POST
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${apiUrl}/api/tools/emergency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert)
    }).catch(() => {});
  }

  public broadcastV2VVoiceMessage(voiceMsg: V2VVoiceMessage) {
    // 1. Broadcast via Supabase Realtime to all laptops
    if (this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'V2V_VOICE_DISPATCH',
        payload: voiceMsg
      }).catch(() => {});
    }

    // 2. Local tab mesh fallback
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'V2V_VOICE_DISPATCH',
        payload: voiceMsg
      });
    }

    // 3. WS Fallback
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'V2V_VOICE_DISPATCH',
          payload: voiceMsg
        })
      );
    }
  }

  public acknowledgeAlert(alertId: string, shipId: string) {
    if (this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'ALERT_ACKNOWLEDGED',
        payload: { alert_id: alertId, acknowledged_by: shipId }
      }).catch(() => {});
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'ACKNOWLEDGE_ALERT',
          payload: { alert_id: alertId, acknowledged_by: shipId }
        })
      );
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'ALERT_ACKNOWLEDGED',
        payload: { alert_id: alertId, acknowledged_by: shipId }
      });
    }
  }

  public onAlertReceived(listener: AlertListener) {
    this.alertListeners.push(listener);
  }

  public onAlertAcknowledged(listener: AckListener) {
    this.ackListeners.push(listener);
  }

  public onV2VVoiceReceived(listener: VoiceListener) {
    this.voiceListeners.push(listener);
  }

  private notifyAlertListeners(alert: EmergencyAlert) {
    // Trigger alarm on all ships (even if same ship ID for testing or different ship IDs)
    this.alertListeners.forEach((fn) => fn(alert));
  }

  private notifyAckListeners(alertId: string, shipId: string) {
    this.ackListeners.forEach((fn) => fn(alertId, shipId));
  }

  private notifyVoiceListeners(voiceMsg: V2VVoiceMessage) {
    this.voiceListeners.forEach((fn) => fn(voiceMsg));
  }
}

export const emergencyRealtimeNetwork = new EmergencyRealtimeNetwork();
