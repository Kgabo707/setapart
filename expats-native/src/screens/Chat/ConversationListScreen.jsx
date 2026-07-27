import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Avatar from "../../components/Avatar";
import EmptyState from "../../components/EmptyState";
import LoadingScreen from "../../components/LoadingScreen";
import ScreenHeader from "../../components/ScreenHeader";
import { theme } from "../../config/theme";
import { useAuth } from "../../hooks/useAuth";
import { useConversations } from "../../hooks/useConversations";
import { fetchProfile } from "../../hooks/useProfiles";
import { relativeTime } from "../../utils/format";
import { displayNameOf, mainPhoto } from "../../utils/profiles";

export default function ConversationListScreen({ navigation }) {
  const { user } = useAuth();
  const { conversations, loading } = useConversations(user?.uid);
  const [partners, setPartners] = useState({});

  // Conversation docs only store uids, so the counterpart profile is resolved
  // once per uid and cached for the list.
  useEffect(() => {
    let cancelled = false;
    const missing = conversations
      .map((c) => otherUidOf(c, user?.uid))
      .filter((uid) => uid && !partners[uid]);
    if (!missing.length) return undefined;

    Promise.all(missing.map((uid) => fetchProfile(uid).catch(() => null))).then((results) => {
      if (cancelled) return;
      setPartners((prev) => {
        const next = { ...prev };
        missing.forEach((uid, i) => {
          if (results[i]) next[uid] = results[i];
        });
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [conversations, user?.uid, partners]);

  if (loading) return <LoadingScreen message="Loading your chats…" />;

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <ScreenHeader title="Chats" />
      {conversations.length === 0 ? (
        <EmptyState
          emoji="💬"
          title="No matches yet — keep swiping!"
          message="When you and someone else both swipe right, your conversation lands here."
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const otherUid = otherUidOf(item, user?.uid);
            const partner = partners[otherUid];
            const unread = (item.unreadCount || 0) > 0;
            return (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  navigation.navigate("Chat", {
                    matchId: item.id,
                    otherUid,
                    otherProfile: partner,
                  })
                }
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <Avatar uri={mainPhoto(partner)} name={displayNameOf(partner)} size={56} />
                <View style={styles.rowBody}>
                  <View style={styles.rowTop}>
                    <Text style={styles.name} numberOfLines={1}>
                      {displayNameOf(partner)}
                    </Text>
                    <Text style={styles.time}>{relativeTime(item.lastMessageAt)}</Text>
                  </View>
                  <View style={styles.rowBottom}>
                    <Text
                      style={[styles.preview, unread && styles.previewUnread]}
                      numberOfLines={1}
                    >
                      {item.lastMessage || "Say hello 👋"}
                    </Text>
                    {unread ? <View style={styles.unreadDot} /> : null}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

function otherUidOf(conversation, myUid) {
  if (conversation.seedUid && conversation.seedUid !== myUid) return conversation.seedUid;
  return (conversation.users || []).find((uid) => uid !== myUid) || null;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.white },
  list: { paddingBottom: theme.spacing.lg },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.md + 56 + theme.spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  rowPressed: { backgroundColor: theme.colors.background },
  rowBody: { flex: 1, gap: 4 },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowBottom: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
  name: {
    flex: 1,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
    color: theme.colors.ink,
  },
  time: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.muted,
  },
  preview: {
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.muted,
  },
  previewUnread: {
    fontFamily: theme.fonts.bodyMed,
    color: theme.colors.ink,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
});
