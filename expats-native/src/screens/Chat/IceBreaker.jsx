import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import GradientButton from "../../components/GradientButton";
import { ICE_BREAKERS } from "../../config/appConfig";
import { theme } from "../../config/theme";

function randomPrompt(game, exclude) {
  const options = game.prompts.filter((p) => p !== exclude);
  const pool = options.length ? options : game.prompts;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function IceBreaker({ visible, onClose, onSend }) {
  const [game, setGame] = useState(null);
  const [prompt, setPrompt] = useState(null);

  function selectGame(next) {
    setGame(next);
    setPrompt(randomPrompt(next, null));
  }

  function close() {
    setGame(null);
    setPrompt(null);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close ice breakers" />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <Text style={styles.title}>Break the ice</Text>
        <Text style={styles.subtitle}>Pick a game, we&apos;ll write the opener.</Text>

        <View style={styles.grid}>
          {ICE_BREAKERS.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected: game?.id === item.id }}
              onPress={() => selectGame(item)}
              style={[styles.gameButton, game?.id === item.id && styles.gameButtonSelected]}
            >
              <Text style={styles.gameEmoji}>{item.emoji}</Text>
              <Text
                style={[styles.gameLabel, game?.id === item.id && styles.gameLabelSelected]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {prompt ? (
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Preview</Text>
            <Text style={styles.previewText}>{prompt}</Text>
            <View style={styles.previewActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setPrompt(randomPrompt(game, prompt))}
                style={styles.rerollButton}
              >
                <Text style={styles.rerollText}>Re-roll</Text>
              </Pressable>
              <GradientButton
                label="Send"
                style={styles.sendButton}
                onPress={() => {
                  onSend(prompt);
                  close();
                }}
              />
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(26,26,46,0.45)" },
  sheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: "center",
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 22,
    color: theme.colors.ink,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.muted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  gameButton: {
    flexGrow: 1,
    flexBasis: "45%",
    alignItems: "center",
    gap: 6,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  gameButtonSelected: {
    borderColor: theme.colors.secondary,
    backgroundColor: "#F1EEFE",
  },
  gameEmoji: { fontSize: 26 },
  gameLabel: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    color: theme.colors.ink,
  },
  gameLabelSelected: { color: theme.colors.secondary },
  previewCard: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  previewLabel: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: theme.colors.muted,
  },
  previewText: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.ink,
  },
  previewActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  rerollButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  rerollText: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 14,
    color: theme.colors.ink,
  },
  sendButton: { flex: 1 },
});
