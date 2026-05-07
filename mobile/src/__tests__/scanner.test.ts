import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import type { Mock } from 'jest-mock';

import { api } from '@/src/services/api';
import {
  enqueueAttendanceScan,
  isRetryableAttendanceScanError,
  replayQueuedAttendanceScans,
} from '@/src/services/attendanceScanQueue';

type CameraViewProps = { onBarcodeScanned?: (event: { data: string }) => void };
type UseMutationOptions = { mutationFn: (value: string) => Promise<string> };
type ApiPostMock = Mock<(endpoint: string, body: { qrData: string }) => Promise<{ data: { message: string } }>>;

let cameraViewProps: CameraViewProps | null = null;

jest.mock('expo-camera', () => ({
  CameraView: jest.fn((props: CameraViewProps) => {
    cameraViewProps = props;
    return null;
  }),
  useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Error: 'error' },
}));

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: {
      View: ({ children, ...props }: { children?: React.ReactNode }) => React.createElement(View, props, children),
    },
    FadeIn: { duration: jest.fn(() => ({})) },
    FadeOut: { duration: jest.fn(() => ({})) },
  };
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn((options: UseMutationOptions) => ({
    isPending: false,
    mutateAsync: jest.fn((value: string) => options.mutationFn(value)),
  })),
}));

jest.mock('@/src/services/api', () => ({
  api: {
    post: jest.fn(),
  },
}));

jest.mock('@/src/services/attendanceScanQueue', () => ({
  enqueueAttendanceScan: jest.fn(),
  isRetryableAttendanceScanError: jest.fn(() => false),
  replayQueuedAttendanceScans: jest.fn(async () => ({ delivered: 0, pending: 0 })),
}));

const StudentScannerScreen = require('../../app/(student)/scanner').default;

describe('student QR scanner flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cameraViewProps = null;
  });

  it('parses a valid QR payload and calls the attendance API', async () => {
    const validQrPayload = JSON.stringify({
      payload: {
        subjectId: 'subject-1',
        instructorId: 'instructor-1',
        expiresAt: '2030-01-01T00:00:00.000Z',
      },
      signature: 'valid-signature',
    });
    (api.post as unknown as ApiPostMock).mockResolvedValueOnce({ data: { message: 'Marked present' } });

    render(React.createElement(StudentScannerScreen));

    await act(async () => {
      await cameraViewProps?.onBarcodeScanned?.({ data: validQrPayload });
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/attendance/scan-qr', { qrData: validQrPayload });
    });
    expect(replayQueuedAttendanceScans).toHaveBeenCalled();
  });

  it('queues retryable scan failures so they can sync later', async () => {
    const validQrPayload = JSON.stringify({
      payload: {
        subjectId: 'subject-1',
        instructorId: 'instructor-1',
        expiresAt: '2030-01-01T00:00:00.000Z',
      },
      signature: 'valid-signature',
    });
    const networkError = new Error('Network Error');
    (api.post as unknown as ApiPostMock).mockRejectedValueOnce(networkError);
    (isRetryableAttendanceScanError as jest.Mock).mockReturnValueOnce(true);
    (enqueueAttendanceScan as jest.Mock).mockResolvedValueOnce({
      id: 'queued-1',
      endpoint: '/attendance/scan-qr',
      qrData: validQrPayload,
      createdAt: '2026-05-07T00:00:00.000Z',
      attempts: 0,
    });

    const screen = render(React.createElement(StudentScannerScreen));

    await act(async () => {
      await cameraViewProps?.onBarcodeScanned?.({ data: validQrPayload });
    });

    await waitFor(() => {
      expect(enqueueAttendanceScan).toHaveBeenCalledWith('/attendance/scan-qr', validQrPayload);
    });
    await waitFor(() => {
      expect(screen.getAllByText('Saved offline. Attendance will sync when the connection returns.').length).toBeGreaterThan(0);
    });
  });

  it('shows an error for malformed QR payloads without calling the attendance API', async () => {
    const screen = render(React.createElement(StudentScannerScreen));

    await act(async () => {
      await cameraViewProps?.onBarcodeScanned?.({ data: 'not-json' });
    });

    expect(api.post).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getAllByText('Scan a TriLearn attendance QR code.').length).toBeGreaterThan(0);
    });
  });
});
