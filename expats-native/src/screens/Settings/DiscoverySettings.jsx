import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ScreenHeader from "../../components/ScreenHeader";
import { theme } from "../../config/theme";
import DiscoveryPreferences from "./DiscoveryPreferences";

/** The same preferences as the Settings tab, reachable straight from the deck. */
export default function DiscoverySettings({ navigation }) {
  return (
    <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Discovery"
        subtitle="Who shows up in your deck"
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <DiscoveryPreferences />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
});
