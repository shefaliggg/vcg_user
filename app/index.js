import { StatusBar } from "react-native";
import AppNavigator from "../src/navigation/AppNavigator";

export default function Page() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      <AppNavigator />
    </>
  );
}
