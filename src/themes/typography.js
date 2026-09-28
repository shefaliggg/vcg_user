export const fonts = {
  regular: "Inter_400Regular",
  semiBold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
};

// Centralized type scale — screens should pull from here via AppText's
// `variant` prop instead of hand-picking fontSize/fontFamily per screen.
export const textStyles = {
  screenTitle: { fontFamily: fonts.bold, fontSize: 24 },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: 18 },
  cardTitle: { fontFamily: fonts.semiBold, fontSize: 16 },
  body: { fontFamily: fonts.regular, fontSize: 15 },
  label: { fontFamily: fonts.semiBold, fontSize: 12 },
  caption: { fontFamily: fonts.regular, fontSize: 12 },
  largeNumber: { fontFamily: fonts.bold, fontSize: 30 },
  largePrice: { fontFamily: fonts.bold, fontSize: 26 },
  button: { fontFamily: fonts.semiBold, fontSize: 16 },
};
