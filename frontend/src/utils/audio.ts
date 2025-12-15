import { logger } from '@/utils/logger';

const NOTIFICATION_SOUND_PATH = '/assets/sounds/notification.mp3';

let audioElement: HTMLAudioElement | null = null;

const initAudio = (): HTMLAudioElement | null => {
  if (typeof window === 'undefined') return null;

  if (!audioElement) {
    audioElement = new Audio(NOTIFICATION_SOUND_PATH);
    audioElement.preload = 'auto';
  }
  return audioElement;
};

export const playNotificationSound = (): void => {
  const audio = initAudio();
  if (!audio) return;

  audio.currentTime = 0;
  audio.play().catch((err) => {
    logger.debug('Failed to play notification sound', 'audio', err);
  });
};
