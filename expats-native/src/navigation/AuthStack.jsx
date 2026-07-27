import { createNativeStackNavigator } from "@react-navigation/native-stack";

import OnboardingScreen from "../screens/auth/OnboardingScreen";
import SignInScreen from "../screens/auth/SignInScreen";
import WelcomeScreen from "../screens/auth/WelcomeScreen";

const Stack = createNativeStackNavigator();

export default function AuthStack({ initialRouteName = "Welcome" }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}
