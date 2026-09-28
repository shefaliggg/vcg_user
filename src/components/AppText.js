import React from "react";
import { Text } from "react-native";
import { fonts, textStyles } from "../themes/typography";
import { colors } from "../themes/colors";

export default function AppText({ style, weight, variant, ...props }) {
  const variantStyle = variant ? textStyles[variant] : null;

  const fontFamily = weight
    ? weight === "bold"
      ? fonts.bold
      : weight === "semiBold"
      ? fonts.semiBold
      : fonts.regular
    : variantStyle?.fontFamily ?? fonts.regular;

  return (
    <Text
      style={[
        {
          fontFamily,
          fontSize: variantStyle?.fontSize,
          color: colors.text,
        },
        style,
      ]}
      {...props}
    />
  );
}