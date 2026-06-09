import FetchLists from './FetchLists';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function Sharks() {
  return (
    <SafeAreaProvider>
      <FetchLists group="REQUINS" />
    </SafeAreaProvider>
  );
}
