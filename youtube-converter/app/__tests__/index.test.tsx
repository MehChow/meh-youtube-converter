import { render, screen } from '@testing-library/react-native';
import * as React from 'react';

import HomeScreen from '../index';

jest.mock('@/src/features/convert/useConvertAndDownload', () => {
  return {
    useConvertAndDownload: () => ({
      url: '',
      setUrl: jest.fn(),
      resetAll: jest.fn(),
      clearPreview: jest.fn(),
      message: '預覽失敗：找不到影片或暫時無法讀取。請確認連結後再試。',
      lastFilename: '',
      previewStatus: 'error',
      previewData: null,
      canConvert: true,
      convertAndDownload: jest.fn(),
      requestPreview: jest.fn(),
      openAndroidDownloads: jest.fn(),
      isConverting: false,
    }),
  };
});

describe('HomeScreen error UI', () => {
  test('renders friendly error text (no raw JSON)', () => {
    render(<HomeScreen />);
    expect(screen.getByText(/預覽失敗/)).toBeTruthy();
    expect(screen.queryByText(/statusCode/)).toBeNull();
  });
});

