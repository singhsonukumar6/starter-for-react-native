import { Stack } from "expo-router";
import { Platform, View } from "react-native";
import { Poppins_300Light, useFonts } from "@expo-google-fonts/poppins";
import { Inter_400Regular, Inter_300Light } from "@expo-google-fonts/inter";
import Head from "expo-router/head";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ConvexProvider } from "convex/react";
import { ClerkProvider, useAuth, tokenCache, CLERK_PUBLISHABLE_KEY } from "../src/lib/clerk";
import { convex } from "../src/lib/convex";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import "react-native-url-polyfill/auto";

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Poppins_300Light,
    Inter_400Regular,
    Inter_300Light,
  });

  if (!loaded) {
    return null;
  }

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
            {Platform.OS === "web" && (
              <Head>
                <title>LemoLearn - Learn. Grow. Succeed.</title>
              </Head>
            )}
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F9FAFB' } }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen 
                name="leaderboard" 
                options={{ 
                  headerShown: true, 
                  title: "",
                  headerBackTitleVisible: false,
                  headerTransparent: true,
                  headerTintColor: "#fff",
                }} 
              />
              <Stack.Screen 
                name="progress" 
                options={{ 
                  headerShown: true, 
                  title: "",
                  headerBackTitleVisible: false,
                  headerTransparent: true,
                  headerTintColor: "#fff",
                }} 
              />
            </Stack>
          </View>
        </GestureHandlerRootView>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
