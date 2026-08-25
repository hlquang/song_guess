import { useGameContext } from '../context/GameContext';
import { STEP_THRESHOLDS } from '../utils/audioTiming';

export default function GuessDisplay() {
  const ctx = useGameContext();
  const { currentStep } = ctx;

  const currentThreshold = STEP_THRESHOLDS[currentStep];

  return (
    <div className="text-center text-sm text-pink-600">
      Đã mở <span className="text-pink-700 font-bold">{currentThreshold < 1 ? `${currentThreshold.toFixed(1)}s` : `${currentThreshold}s`}</span> / {STEP_THRESHOLDS[STEP_THRESHOLDS.length - 1]}s
    </div>
  );
}
