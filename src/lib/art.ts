// 3D art (Microsoft Fluent Emoji, MIT: see src/assets/3d/LICENSE)
import seedling from '@/assets/3d/seedling.png';
import globe from '@/assets/3d/globe-showing-americas.png';
import prohibited from '@/assets/3d/prohibited.png';
import chartDecreasing from '@/assets/3d/chart-decreasing.png';
import graduationCap from '@/assets/3d/graduation-cap.png';
import bullseye from '@/assets/3d/bullseye.png';
import sparkles from '@/assets/3d/sparkles.png';
import partyPopper from '@/assets/3d/party-popper.png';
import ribbon from '@/assets/3d/reminder-ribbon.png';
import heart from '@/assets/3d/red-heart.png';
import sun from '@/assets/3d/sun.png';
import shield from '@/assets/3d/shield.png';

// One piece of art per onboarding screen
export const STEP_ART = {
  hook: seedling,
  intro: sparkles,
  causes: globe,
  dealbreakers: prohibited,
  risk: chartDecreasing,
  experience: graduationCap,
  goal: bullseye,
  reveal: partyPopper,
} as const;

// Each cause's icon, in 3D (falls back to the cause's emoji where there's no art)
export const CAUSE_ART: Record<string, string> = {
  beat_cancer: ribbon,
  live_healthier: heart,
  clean_energy: sun,
  keeping_safe: shield,
};
