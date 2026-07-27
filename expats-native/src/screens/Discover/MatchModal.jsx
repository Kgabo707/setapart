import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import Avatar from "../../components/Avatar";
import GradientButton from "../../components/GradientButton";
import { theme } from "../../config/theme";
import { displayNameOf, mainPhoto } from "../../utils/profiles";

export default function MatchModal({ visible, matchedProfile, myProfile, onKeepSwiping, onChat }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onKeepSwiping}>
      <View style={styles.backdrop}>
        <LinearGradient
          colors={theme.colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sheet}
        >
          <Text style={styles.title}>It&apos;s a match! 🎉</Text>
          <Text style={styles.subtitle}>
            You and {displayNameOf(matchedProfile)} both swiped right.
          </Text>

          <View style={styles.avatars}>
            <Avatar
              uri={mainPhoto(myProfile)}
              name={displayNameOf(myProfile)}
              size={104}
              style={styles.avatar}
            />
            <Avatar
              uri={mainPhoto(matchedProfile)}
              name={displayNameOf(matchedProfile)}
              size={104}
              style={styles.avatar}
            />
          </View>

          <View style={styles.actions}>
            <GradientButton variant="solid" label="Start chatting" onPress={onChat} />
            <Pressable accessibilityRole="button" onPress={onKeepSwiping} style={styles.keepSwiping}>
              <Text style={styles.keepSwipingText}>Keep swiping</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(26,26,46,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: theme.radius.lg * 1.6,
    borderTopRightRadius: theme.radius.lg * 1.6,
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xl * 1.5,
    gap: theme.spacing.md,
    alignItems: "center",
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 32,
    color: theme.colors.white,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  avatars: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginVertical: theme.spacing.md,
  },
  avatar: { borderWidth: 3, borderColor: theme.colors.white },
  actions: { alignSelf: "stretch", gap: theme.spacing.sm },
  keepSwiping: { paddingVertical: theme.spacing.sm, alignItems: "center" },
  keepSwipingText: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 15,
    color: theme.colors.white,
  },
});
