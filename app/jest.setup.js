jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Icon fonts can't load in Jest (no asset registry), so render a plain View instead
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = ({ name }) => React.createElement(View, { testID: `icon-${name}` });
  Icon.glyphMap = {};
  return { __esModule: true, default: Icon };
});
