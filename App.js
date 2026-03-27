import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { AppProvider } from './src/context/AppContext';
import DashboardScreen from './src/screens/DashboardScreen';
import SobraScreen from './src/screens/SobraScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import GeminiScreen from './src/screens/GeminiScreen';
import IncomeAllocationScreen from './src/screens/IncomeAllocationScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const icon = (emoji) => ({ focused }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
);

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1e1e2e',
          borderTopColor: '#2d2d3f',
          paddingBottom: 8,
          height: 60,
        },
        tabBarActiveTintColor: '#a78bfa',
        tabBarInactiveTintColor: '#4b5563',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: icon('💰'), tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="Sobra"
        component={SobraScreen}
        options={{ tabBarIcon: icon('🐷'), tabBarLabel: 'Savings' }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarIcon: icon('📋'), tabBarLabel: 'History' }}
      />
      <Tab.Screen
        name="Gemini"
        component={GeminiScreen}
        options={{ tabBarIcon: icon('🤖'), tabBarLabel: 'Ask Gemini' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen
            name="IncomeAllocation"
            component={IncomeAllocationScreen}
            options={{
              headerShown: true,
              title: 'Log Income',
              headerStyle: { backgroundColor: '#0f0f1a' },
              headerTintColor: '#a78bfa',
              headerTitleStyle: { fontWeight: '700' },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
