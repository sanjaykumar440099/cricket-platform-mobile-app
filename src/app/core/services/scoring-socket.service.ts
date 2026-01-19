import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { CreateBallDto } from '../../shared/models/create-ball.dto';

@Injectable({ providedIn: 'root' })
export class ScoringSocketService {
    private socket!: Socket;

    connect(matchId: string, token?: string) {
        this.socket = io('http://localhost:3000', {
            transports: ['websocket'],
            query: {
                matchId,
            },
            auth: {
                token,
            },
        });
    }

    emitBall(dto: CreateBallDto) {
        if (!this.socket) {
            throw new Error('Socket not connected');
        }

        this.socket.emit('ball:create', dto);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}
