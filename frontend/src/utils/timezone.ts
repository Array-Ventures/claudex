const padTimeUnit = (value: number): string => value.toString().padStart(2, '0');

const parseTimeParts = (time: string): { hours: number; minutes: number; seconds: number } => {
  const [hourStr, minuteStr, secondStr] = time.split(':');
  const hours = Number.parseInt(hourStr ?? '0', 10);
  const minutes = Number.parseInt(minuteStr ?? '0', 10);
  const seconds = Number.parseInt(secondStr ?? '0', 10);

  return {
    hours: Number.isFinite(hours) ? hours : 0,
    minutes: Number.isFinite(minutes) ? minutes : 0,
    seconds: Number.isFinite(seconds) ? seconds : 0,
  };
};

export const localTimeInputToUtc = (time: string): string => {
  const { hours, minutes, seconds } = parseTimeParts(time);
  const local = new Date();
  local.setHours(hours, minutes, seconds, 0);

  const utcHours = padTimeUnit(local.getUTCHours());
  const utcMinutes = padTimeUnit(local.getUTCMinutes());
  const utcSeconds = padTimeUnit(local.getUTCSeconds());

  return `${utcHours}:${utcMinutes}:${utcSeconds}`;
};

export const utcTimeToLocalInput = (time: string): string => {
  const { hours, minutes, seconds } = parseTimeParts(time);
  const now = new Date();
  const utcDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hours, minutes, seconds),
  );

  return `${padTimeUnit(utcDate.getHours())}:${padTimeUnit(utcDate.getMinutes())}`;
};

export const formatLocalTimeFromUtc = (time: string): string => {
  const { hours, minutes, seconds } = parseTimeParts(time);
  const now = new Date();
  const utcDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hours, minutes, seconds),
  );

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(utcDate);
};
