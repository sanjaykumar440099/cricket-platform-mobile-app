import { BallEvent } from '../models/ball-event.model';
import { ScoringState } from '../models/scoring-state.model';

export function applyBallEvent(
  state: ScoringState,
  event: BallEvent
): ScoringState {
  const next = structuredClone(state);

  // Runs
  next.runs += event.runsOffBat + event.extras;

  // Extras accounting
  if (event.extraType === 'wide') next.extras.wides++;
  if (event.extraType === 'no-ball') next.extras.noBalls++;
  if (event.extraType === 'bye') next.extras.byes++;
  if (event.extraType === 'leg-bye') next.extras.byes++;

  // Wicket
  if (event.isWicket) next.wickets++;

  // Ball progression
  const countsBall =
    event.extraType !== 'wide' &&
    event.extraType !== 'no-ball';

  if (countsBall) {
    next.balls++;
    if (next.balls === 6) {
      next.overs++;
      next.balls = 0;
    }
  }

  return next;
}
