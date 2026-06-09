import { SafeAreaProvider } from 'react-native-safe-area-context';

import FetchLists from './FetchLists';

export default function Animators() {
  return (
    <SafeAreaProvider>
      <FetchLists group="animators" />
    </SafeAreaProvider>
  );
}
