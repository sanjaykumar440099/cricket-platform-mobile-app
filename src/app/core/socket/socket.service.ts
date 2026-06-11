import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ApiConfigService } from '../api/api-config.service';
import { TokenStorage } from '../storage/token.storage';
import {
  LiveScoreEvent,
  PublicLiveMatchDetail,
} from '../../shared/models/api.models';

export type SocketConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;
  private activeMatchId: string | null = null;

  private readonly scoreUpdateSubject = new Subject<LiveScoreEvent>();
  private readonly resumeStateSubject = new Subject<PublicLiveMatchDetail>();
  private readonly spectatorCountSubject = new Subject<number>();
  private readonly connectionStateSubject =
    new Subject<SocketConnectionState>();

  readonly scoreUpdates$: Observable<LiveScoreEvent> =
    this.scoreUpdateSubject.asObservable();
  readonly resumeState$: Observable<PublicLiveMatchDetail> =
    this.resumeStateSubject.asObservable();
  readonly spectatorCount$: Observable<number> =
    this.spectatorCountSubject.asObservable();
  readonly connectionState$: Observable<SocketConnectionState> =
    this.connectionStateSubject.asObservable();

  constructor(
    private readonly apiConfig: ApiConfigService,
    private readonly zone: NgZone,
  ) {}

  async connectToMatch(
    matchId: string,
    lastEventId?: number | null,
  ): Promise<void> {
    if (this.socket && this.activeMatchId === matchId) {
      if (!this.socket.connected) {
        this.emitConnectionState('connecting');
        this.socket.io.opts.query = {
          matchId,
          ...(lastEventId ? { lastEventId: `${lastEventId}` } : {}),
        };
        this.socket.connect();
      }
      return;
    }

    this.disconnect();
    this.activeMatchId = matchId;
    this.emitConnectionState('connecting');

    const token = await TokenStorage.getAccess();
    const query: Record<string, string> = { matchId };

    if (lastEventId) {
      query['lastEventId'] = `${lastEventId}`;
    }

    this.socket = io(this.apiConfig.socketUrl, {
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
      query,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 600,
      reconnectionDelayMax: 4000,
    });

    this.bindSocket(this.socket);
  }

  disconnect() {
    if (!this.socket) {
      this.activeMatchId = null;
      return;
    }

    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this.activeMatchId = null;
    this.emitConnectionState('disconnected');
  }

  private bindSocket(socket: Socket) {
    socket.on('connect', () => {
      this.zone.run(() => this.emitConnectionState('connected'));
    });

    socket.on('disconnect', () => {
      this.zone.run(() => this.emitConnectionState('disconnected'));
    });

    socket.on('connect_error', () => {
      this.zone.run(() => this.emitConnectionState('error'));
    });

    socket.on('scoreUpdate', (payload: LiveScoreEvent) => {
      this.zone.run(() => {
        this.scoreUpdateSubject.next(this.normalizeScoreEvent(payload));
      });
    });

    socket.on('resumeState', (payload: PublicLiveMatchDetail) => {
      this.zone.run(() => {
        this.resumeStateSubject.next(payload);
      });
    });

    socket.on('resume', (payload: {
      state?: PublicLiveMatchDetail;
      lastEventId?: number | null;
    }) => {
      if (!payload?.state || (!payload.state.matchId && !this.activeMatchId)) {
        return;
      }

      this.zone.run(() => {
        this.resumeStateSubject.next({
          ...payload.state,
          matchId: payload.state?.matchId ?? this.activeMatchId ?? '',
          lastEventId:
            payload.lastEventId ?? payload.state?.lastEventId ?? null,
        });
      });
    });

    socket.on('spectatorCount', (payload: number | { spectators: number }) => {
      this.zone.run(() => {
        this.spectatorCountSubject.next(
          typeof payload === 'number'
            ? payload
            : payload?.spectators ?? 0,
        );
      });
    });
  }

  private normalizeScoreEvent(payload: LiveScoreEvent): LiveScoreEvent {
    return {
      ...payload,
      score: payload.score ?? payload.payload?.score ?? null,
      state: payload.state ?? payload.payload?.state ?? null,
      lastBall: payload.lastBall ?? payload.payload?.lastBall ?? null,
      commentary:
        payload.commentary ?? payload.payload?.commentary ?? null,
    };
  }

  private emitConnectionState(state: SocketConnectionState) {
    this.connectionStateSubject.next(state);
  }
}
