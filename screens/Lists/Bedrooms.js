import { SafeAreaProvider } from 'react-native-safe-area-context';

import FetchLists from "./FetchLists";





export default function Animator(props) {
    return (

        <SafeAreaProvider>
            <FetchLists group="bedrooms" />
        </SafeAreaProvider>
    );
}
