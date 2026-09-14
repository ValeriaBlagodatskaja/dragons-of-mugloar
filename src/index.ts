import { GameRunner } from './gameRunner.js';

try {
  const finalState = await new GameRunner().run();
  process.exitCode = finalState.score >= 1000 ? 0 : 1;
} catch (error) {
  console.error('Game failed:', error);
  process.exitCode = 1;
}
