import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  DeviceEventEmitter,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { showAlert } from "../utils/alert";
import chatService from "../services/chat.service";
import { socket } from "../services/socket";
import AppText from "../components/AppText";
import { colors } from "../themes/colors";
import { spacing } from "../themes/spacing";
import { radius } from "../themes/radius";
import { fonts } from "../themes/typography";

const formatTime = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
};

export default function ChatScreen({ route, navigation }) {
  const { tripId, recipientName } = route.params;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await chatService.getMessages(tripId);
      setMessages(data);
      DeviceEventEmitter.emit("refreshMessages");
    } catch (err) {
      showAlert("Error", "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    socket.emit("join-trip", tripId);
    const onMessage = (message) => {
      if (String(message.tripId) !== String(tripId)) return;
      setMessages((prev) => (prev.some((m) => m._id === message._id) ? prev : [...prev, message]));
    };
    socket.on("chat-message", onMessage);
    return () => {
      socket.off("chat-message", onMessage);
    };
  }, [tripId]);

  const handleSend = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setText("");
    try {
      const message = await chatService.sendMessage(tripId, value);
      setMessages((prev) => (prev.some((m) => m._id === message._id) ? prev : [...prev, message]));
    } catch (err) {
      showAlert("Error", err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.primary }} />
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color={colors.white} />
        </TouchableOpacity>
        <AppText variant="sectionTitle" style={styles.headerTitle}>
          {recipientName || "Driver"}
        </AppText>
        <View style={{ width: 30 }} />
      </View>

      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ padding: spacing.base }}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
              ListEmptyComponent={
                <View style={styles.centered}>
                  <Feather name="message-circle" size={40} color={colors.border} />
                  <AppText style={{ color: colors.textMuted, marginTop: spacing.sm }}>
                    No messages yet. Say hello!
                  </AppText>
                </View>
              }
              renderItem={({ item }) => {
                const isMine = item.senderRole === "user";
                return (
                  <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
                    <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                      <AppText style={isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs}>
                        {item.text}
                      </AppText>
                    </View>
                    <AppText style={styles.bubbleTime}>{formatTime(item.createdAt)}</AppText>
                  </View>
                );
              }}
            />
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Type a message..."
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, (!text.trim() || sending) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!text.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Feather name="send" size={18} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: spacing.xxl,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: colors.white,
  },
  bubbleRow: {
    marginBottom: spacing.md,
    maxWidth: "80%",
  },
  bubbleRowMine: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  bubbleRowTheirs: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  bubble: {
    borderRadius: radius.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleTextMine: {
    color: colors.white,
  },
  bubbleTextTheirs: {
    color: colors.text,
  },
  bubbleTime: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    marginRight: spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
