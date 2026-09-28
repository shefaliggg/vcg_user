import React, { useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import AppText from "./AppText";
import { colors } from "../themes/colors";
import { spacing } from "../themes/spacing";
import { radius } from "../themes/radius";

/**
 * Shared form field: label + bordered input box + inline error message.
 *
 * Drop-in replacement for the ad-hoc `TextInput` + local `styles.input` /
 * `styles.inputContainer` / `styles.label` blocks that used to be duplicated
 * per screen.
 *
 * - `error` (string): when truthy, the input border turns red (colors.error)
 *   and the message renders directly below the field. Falsy clears it.
 * - `required`: purely visual — renders a red "*" next to the label.
 * - `rightElement`: optional node docked inside the input box (e.g. the
 *   show/hide password eye icon), for screens that need it.
 * - `leftElement`: optional node docked inside the input box before the
 *   text (e.g. a static country-code prefix).
 * - All other props (placeholder, keyboardType, secureTextEntry, onFocus,
 *   onBlur, editable, maxLength, etc.) pass straight through to TextInput.
 */
export default function FormInput({
  label,
  value,
  onChangeText,
  error,
  required,
  containerStyle,
  inputStyle,
  labelStyle,
  rightElement,
  leftElement,
  editable = true,
  onFocus,
  onBlur,
  ...rest
}) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : focused
    ? colors.primary
    : colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <AppText variant="label" style={[styles.label, labelStyle]}>
          {label}
          {required ? <AppText style={styles.required}> *</AppText> : null}
        </AppText>
      ) : null}

      <View
        style={[
          styles.inputWrapper,
          { borderColor },
          rightElement && styles.inputWrapperWithRightElement,
          leftElement && styles.inputWrapperWithLeftElement,
          !editable && styles.inputWrapperDisabled,
        ]}
      >
        {leftElement}
        <TextInput
          style={[styles.input, inputStyle, !editable && styles.inputDisabled]}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          placeholderTextColor="#94A3B8"
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {rightElement}
      </View>

      {error ? <AppText style={styles.errorText}>{error}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.sm,
    color: colors.text,
  },
  required: {
    color: colors.error,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radius.input,
    borderWidth: 1,
  },
  inputWrapperDisabled: {
    opacity: 0.7,
  },
  inputWrapperWithRightElement: {
    paddingRight: spacing.base,
  },
  inputWrapperWithLeftElement: {
    paddingLeft: spacing.base,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    fontSize: 15,
    color: colors.text,
  },
  inputDisabled: {
    color: colors.textMuted,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
