import '@testing-library/jest-native/extend-expect';

// Common RN test mocks
jest.mock('react-native-reanimated', () => {
  return {
    __esModule: true,
    default: {
      createAnimatedComponent: (Component: any) => Component,
    },
    createAnimatedComponent: (Component: any) => Component,
    useSharedValue: (value: any) => ({ value }),
    useAnimatedStyle: (updater: any) => updater(),
    withTiming: (value: any) => value,
  };
});

jest.mock('@rn-primitives/slot', () => {
  const React = require('react');
  return {
    // Avoid importing `react-native` here (NativeWind/CSS interop can confuse Jest hoisting).
    Text: React.forwardRef(({ children, ...props }: any, ref: any) =>
      React.createElement('Text', { ...props, ref }, children)
    ),
  };
});

jest.mock('@react-native-community/netinfo', () => {
  return {
    __esModule: true,
    default: {
      fetch: jest.fn(async () => ({
        isConnected: true,
        isInternetReachable: true,
      })),
    },
  };
});

