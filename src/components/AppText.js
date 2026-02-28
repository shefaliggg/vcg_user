import React from "react";
import { Text } from "react-native";
import { fonts } from "../themes/typography";

export default function AppText({ style, weight = "regular", ...props }) {
  const fontFamily =
    weight === "bold"
      ? fonts.bold
      : weight === "semiBold"
      ? fonts.semiBold
      : fonts.regular;

  return (
    <Text
      style={[
        {
          fontFamily,
          color: "#111827",
        },
        style,
      ]}
      {...props}
    />
  );
}