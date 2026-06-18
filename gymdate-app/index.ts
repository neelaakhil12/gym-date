import { registerRootComponent } from 'expo';
import { Alert } from 'react-native';

// Set up global error boundary catch before anything else loads
if (typeof ErrorUtils !== 'undefined') {
  const defaultHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
    try {
      Alert.alert(
        "GymDate Startup Crash",
        `Fatal: ${isFatal ? 'Yes' : 'No'}\n\n${error?.message || error}\n\nStack:\n${error?.stack || 'No stack trace'}`,
        [{ text: "Dismiss" }]
      );
    } catch (e) {
      console.error("Failed to show startup crash alert:", e);
    }
    if (defaultHandler) {
      defaultHandler(error, isFatal);
    }
  });
}

// Dynamically load the App so that any evaluation errors inside App.tsx or AppMain.tsx
// are captured by the global error handler
const App = require('./App').default;

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

