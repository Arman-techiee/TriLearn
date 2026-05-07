import { isAxiosError } from 'axios';
import * as FileSystem from 'expo-file-system/legacy';

import { api } from '@/src/services/api';

export type AttendanceScanEndpoint = '/attendance/scan-daily-qr' | '/attendance/scan-qr';

export type QueuedAttendanceScan = {
  id: string;
  endpoint: AttendanceScanEndpoint;
  qrData: string;
  createdAt: string;
  attempts: number;
};

const QUEUE_FILE = `${FileSystem.documentDirectory ?? ''}attendance-scan-queue.json`;
const MAX_QUEUE_ITEMS = 50;

const canPersistQueue = (): boolean => Boolean(FileSystem.documentDirectory);

const readQueue = async (): Promise<QueuedAttendanceScan[]> => {
  if (!canPersistQueue()) {
    return [];
  }

  try {
    const info = await FileSystem.getInfoAsync(QUEUE_FILE);
    if (!info.exists) {
      return [];
    }

    const raw = await FileSystem.readAsStringAsync(QUEUE_FILE);
    const parsed = JSON.parse(raw) as QueuedAttendanceScan[];

    return Array.isArray(parsed)
      ? parsed.filter((item) => item?.id && item?.endpoint && item?.qrData)
      : [];
  } catch {
    return [];
  }
};

const writeQueue = async (queue: QueuedAttendanceScan[]): Promise<void> => {
  if (!canPersistQueue()) {
    return;
  }

  await FileSystem.writeAsStringAsync(QUEUE_FILE, JSON.stringify(queue.slice(-MAX_QUEUE_ITEMS)));
};

export const isRetryableAttendanceScanError = (error: unknown): boolean => {
  if (!isAxiosError(error)) {
    return false;
  }

  if (!error.response) {
    return true;
  }

  return error.response.status >= 500;
};

export const enqueueAttendanceScan = async (
  endpoint: AttendanceScanEndpoint,
  qrData: string,
): Promise<QueuedAttendanceScan | null> => {
  if (!canPersistQueue()) {
    return null;
  }

  const queue = await readQueue();
  const existing = queue.find((item) => item.endpoint === endpoint && item.qrData === qrData);
  if (existing) {
    return existing;
  }

  const queuedScan: QueuedAttendanceScan = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    endpoint,
    qrData,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  await writeQueue([...queue, queuedScan]);
  return queuedScan;
};

export const getQueuedAttendanceScanCount = async (): Promise<number> => {
  const queue = await readQueue();
  return queue.length;
};

export const replayQueuedAttendanceScans = async (): Promise<{ delivered: number; pending: number }> => {
  const queue = await readQueue();
  if (!queue.length) {
    return { delivered: 0, pending: 0 };
  }

  const pending: QueuedAttendanceScan[] = [];
  let delivered = 0;

  for (const item of queue) {
    try {
      await api.post(item.endpoint, { qrData: item.qrData });
      delivered += 1;
    } catch (error) {
      if (isRetryableAttendanceScanError(error)) {
        pending.push({ ...item, attempts: item.attempts + 1 });
      }
    }
  }

  await writeQueue(pending);
  return { delivered, pending: pending.length };
};
