import * as React from 'react';
import { Text, View, Button } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Foundation } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';

const Tab = createMaterialTopTabNavigator();

import General from "../screens/Lists/General";
import Crabs from "../screens/Lists/Crabs";
import Sharks from "../screens/Lists/Sharks";
import Octopuses from "../screens/Lists/Octopuses";
import Animators from "../screens/Lists/Animators";
import Bedrooms from "../screens/Lists/Bedrooms";


function TopTab() {

    return (
        <Tab.Navigator
            initialRouteName='General'
            tabBarOptions={{
                activeTintColor: '#000000',
            }}
        >
            <Tab.Screen
                name="General"
                component={General}
                options={{
                    title: ({ focused }) => (
                        <Foundation
                            size={30}
                            name="torsos-all"
                            color={focused ? '#000000' : '#b2bec3'}
                        />
                    )
                }}
            />

            <Tab.Screen
                name="Crabs"
                component={Crabs}
                options={{
                    title: ({ focused }) => (
                        <FontAwesome5
                            size={25}
                            name="pastafarianism"
                            color={focused ? '#000000' : '#b2bec3'}
                        />
                    )
                }}
            />

            <Tab.Screen
                name="Sharks"
                component={Sharks}
                options={{
                    title: ({ focused }) => (
                        <MaterialCommunityIcons
                            size={38}
                            name="shark"
                            color={focused ? '#000000' : '#b2bec3'}
                        />
                    )
                }}
            />

            <Tab.Screen
                name="Octopuses"
                component={Octopuses}
                options={{
                    title: ({ focused }) => (
                        <FontAwesome5
                            size={25}
                            name="octopus-deploy"
                            color={focused ? '#000000' : '#b2bec3'}
                        />
                    )
                }}
            />

            <Tab.Screen
                name="Animators"
                component={Animators}
                options={{
                    title: ({ focused }) => (
                        <MaterialCommunityIcons
                            size={25}
                            name="face-man-shimmer-outline"
                            color={focused ? '#000000' : '#b2bec3'}
                        />
                    )
                }}
            />

            <Tab.Screen
                name="Bedrooms"
                component={Bedrooms}
                options={{
                    title: ({ focused }) => (
                        <FontAwesome
                            size={25}
                            name="bed"
                            color={focused ? '#000000' : '#b2bec3'}
                        />
                    )
                }}
            />



        </Tab.Navigator>
    )
}

export default function TopTabPlannings() {
    return (
        <SafeAreaProvider>
            <View style={{ height: 110, backgroundColor: "#ffffff" }}></View>
            <TopTab />
        </SafeAreaProvider>



    )


}