import FetchLists from './FetchLists';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function Crabs() {
  return (
    <SafeAreaProvider>
      <FetchLists group="CRABES" />
    </SafeAreaProvider>
  );
}
