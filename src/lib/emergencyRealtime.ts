import { EmergencyAlert } from './types';
import { notificationService } from './notificationService';

type AlertListener = (alert: EmergencyAlert) => void;
type AckListener = (alertId: string, shipId: string) => void;

class EmergencyRealtimeNetwork {
  private ws: WebSocket | null = null;
  private currentShipId: string = '123456789012';
  private alertListeners: AlertListener[] = [];
  private ackListeners: AckListener[] = [];
  private isConnected: boolean = false;
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('blueguard_emergency_network');
      this.broadcastChannel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'EMERGENCY_ALERT_RECEIVED') {
          this.notifyAlertListeners(payload);
        } else if (type === 'ALERT_ACKNOWLEDGED') {
          this.notifyAckListeners(payload.alert_id, payload.acknowledged_by);
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
        this.isConnected = true;
        console.log(`[BLUEGUARD REALTIME] Connected to Emergency Network as Ship ${shipId}`);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'EMERGENCY_ALERT_RECEIVED') {
            this.notifyAlertListeners(data.payload);
          } else if (data.type === 'ALERT_ACKNOWLEDGED') {
            this.notifyAckListeners(data.payload.alert_id, data.payload.acknowledged_by);
          }
        } catch (err) {
          console.warn('WS message parse error:', err);
        }
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        console.warn('[BLUEGUARD REALTIME] WebSocket offline. Using local BroadcastChannel cross-tab mesh.');
      };

      this.ws.onclose = () => {
        this.isConnected = false;
      };
    } catch (e) {
      this.isConnected = false;
    }
  }

  public broadcastEmergency(alert: EmergencyAlert) {
    // 1. Send instant push notification to NTFY channel & FormSubmit email to higher official (trikysaran5721@gmail.com)
    notificationService.dispatchOfficialAlerts({
      ship_id: alert.sender_ship_id,
      sender_name: alert.sender_name || 'Captain',
      latitude: alert.latitude,
      longitude: alert.longitude,
      destination: alert.destination || 'High Seas',
      message: alert.message || 'Distress signal activated by ship handler',
      timestamp: alert.timestamp || new Date().toLocaleTimeString()
    });

    // 2. Try WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'SEND_EMERGENCY',
          payload: alert
        })
      );
    }

    // 3. BroadcastChannel cross-tab fallback (Instant local browser mesh to all open ships)
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'EMERGENCY_ALERT_RECEIVED',
        payload: alert
      });
    }

    // 4. Fallback backend HTTP POST
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${apiUrl}/api/tools/emergency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert)
    }).catch(() => {});
  }

  public acknowledgeAlert(alertId: string, shipId: string) {
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

  private notifyAlertListeners(alert: EmergencyAlert) {
    // Do not trigger alarm on the sender's own UI if it came from them
    if (alert.sender_ship_id !== this.currentShipId) {
      this.alertListeners.forEach((fn) => fn(alert));
    }
  }

  private notifyAckListeners(alertId: string, shipId: string) {
    this.ackListeners.forEach((fn) => fn(alertId, shipId));
  }
}

export const emergencyRealtimeNetwork = new EmergencyRealtimeNetwork();
