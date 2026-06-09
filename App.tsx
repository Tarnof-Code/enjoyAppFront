import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

import BottomTabNavigator from './Navigators/BottomTabNavigator';
import { store } from './store';

export default function App() {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <BottomTabNavigator />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}
