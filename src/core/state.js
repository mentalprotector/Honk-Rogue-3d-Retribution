import { STATE_ENUM } from '../data/config.js';

export const STATE = {
    gameState: STATE_ENUM.MENU,
    level: 1,
    score: 0,
    isPaused: false,
    
    // Juice states
    hitStopTimer: 0,
    shakeTime: 0,
    shakeIntensity: 0
};

export function setGameState(newState) {
    STATE.gameState = newState;
}

export function applyHitStop(duration = 0.05) {
    STATE.hitStopTimer = duration;
}

export function applyShake(intensity = 0.2, duration = 0.2) {
    STATE.shakeIntensity = Math.max(STATE.shakeIntensity, intensity);
    STATE.shakeTime = Math.max(STATE.shakeTime, duration);
}
