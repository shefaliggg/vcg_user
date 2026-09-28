import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import AppText from "./AppText";
import { colors } from "../themes/colors";
import { spacing } from "../themes/spacing";

// Without this, an uncaught render error anywhere below just unmounts to a
// blank white screen with the actual error only visible in the JS console -
// invisible on a phone, easy to miss even on web. This shows it on screen.
export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Caught render error:", error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView contentContainerStyle={styles.container}>
          <AppText weight="bold" style={styles.title}>Something went wrong</AppText>
          <AppText style={styles.message}>{String(this.state.error?.message || this.state.error)}</AppText>
          {!!this.state.error?.stack && (
            <View style={styles.stackBox}>
              <AppText style={styles.stack}>{this.state.error.stack}</AppText>
            </View>
          )}
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    paddingTop: 60,
  },
  title: {
    fontSize: 18,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.base,
  },
  stackBox: {
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    padding: spacing.base,
  },
  stack: {
    color: "#f8f8f2",
    fontSize: 11,
  },
});
