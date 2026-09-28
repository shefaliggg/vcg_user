import { Alert, Platform } from "react-native";

// react-native-web's Alert.alert() is a no-op stub, so use this wherever a
// message or confirm dialog must actually show on web too.
export const showAlert = (title, message, buttons) => {
  if (Platform.OS === "web") {
    if (buttons && buttons.length > 1) {
      const cancelButton = buttons.find((b) => b.style === "cancel");
      const confirmButton = buttons.find((b) => b !== cancelButton) || buttons[buttons.length - 1];
      const confirmed = window.confirm(message ? `${title}\n\n${message}` : title);
      if (confirmed) confirmButton?.onPress?.();
      else cancelButton?.onPress?.();
    } else {
      window.alert(message ? `${title}\n\n${message}` : title);
      buttons?.[0]?.onPress?.();
    }
    return;
  }
  Alert.alert(title, message, buttons);
};
