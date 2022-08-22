import FetchLists from "./FetchLists";
import { SafeAreaProvider } from 'react-native-safe-area-context';




export default function Octopuses(props) {
    return (

        <SafeAreaProvider>
            <FetchLists group="POULPES" />
        </SafeAreaProvider>
    );
}