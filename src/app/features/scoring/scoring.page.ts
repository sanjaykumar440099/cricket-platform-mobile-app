import { Component, inject } from '@angular/core';
import { BallEvent } from '../../shared/models/ball-event.model';
import { applyBallEvent } from '../../shared/engines/scoring.engine';
import { ScoringState } from '../../shared/models/scoring-state.model';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ScoringSocketService } from '../../core/services/scoring-socket.service';
import { CreateBallDto } from '../../shared/models/create-ball.dto';

@Component({
  standalone: true,
  selector: 'app-scoring',
  imports: [IonicModule, CommonModule],
  templateUrl: './scoring.page.html',
})
export class ScoringPage {
  state: ScoringState = {
    runs: 0,
    wickets: 0,
    overs: 0,
    balls: 0,
    extras: { wides: 0, noBalls: 0, byes: 0, overthrows: 0 },
  };

  private scoringSocket = inject(ScoringSocketService);

  private createInitialState(): ScoringState {
    return {
      runs: 0,
      wickets: 0,
      overs: 0,
      balls: 0,
      extras: {
        wides: 0,
        noBalls: 0,
        byes: 0,
        overthrows: 0,
      },
    };
  }

  events: BallEvent[] = [];

  private createBaseEvent(): BallEvent {
    return {
      over: this.state.overs,
      ball: this.state.balls,
      runsOffBat: 0,
      extras: 0,
      extraType: null,
      isWicket: false,
      timestamp: Date.now(),
    };
  }

  ngOnInit() {
    // TEMP hardcoded values for Step 7
    this.scoringSocket.connect('MATCH_ID_1', undefined);
  }


  addRun(runs: number) {
    const dto: CreateBallDto = {
      matchId: 'MATCH_ID_1',
      inningsId: 'INNINGS_ID_1',
      runsOffBat: runs,
      extras: 0,
      extraType: null,
      isWicket: false,
    };

    this.scoringSocket.emitBall(dto);
  }

  noBall(batRuns: number) {
    const e = this.createBaseEvent();
    e.extraType = 'no-ball';
    e.extras = 1;
    e.runsOffBat = batRuns;
    this.commit(e);
  }

  wide(extraRuns: number) {
    const e = this.createBaseEvent();
    e.extraType = 'wide';
    e.extras = 1 + extraRuns;
    this.commit(e);
  }

  wicket() {
    const e = this.createBaseEvent();
    e.isWicket = true;
    this.commit(e);
  }

  private commit(event: BallEvent) {
    this.events.push(event);
    this.state = applyBallEvent(this.state, event);
  }

  undoLastBall() {
    if (this.events.length === 0) {
      return;
    }

    // Remove last delivery event
    this.events.pop();

    // Rebuild state from scratch (authoritative)
    let rebuiltState = this.createInitialState();

    for (const event of this.events) {
      rebuiltState = applyBallEvent(rebuiltState, event);
    }

    this.state = rebuiltState;
  }


}
