import type { ImageStyle, TextStyle, ViewStyle } from "react-native";

export const colors = {
  background: "#F5F7F6",
  surface: "#ffffff",
  surfaceMuted: "#E8ECEA",
  surfaceElevated: "#E8ECEA",
  foreground: "#131F24",
  foregroundMuted: "#5A6B63",
  border: "#D1D9D6",
  primary: "#58CC02",
  primaryDark: "#46A302",
  primaryLight: "#89E219",
  primarySoft: "rgba(88, 204, 2, 0.1)",
  secondary: "#1CB0F6",
  secondaryDark: "#1899D6",
  blue: "#1CB0F6",
  blueSoft: "rgba(28, 176, 246, 0.1)",
  blueSoftStrong: "rgba(28, 176, 246, 0.3)",
  accent: "#FF9600",
  accentDark: "#E08600",
  warning: "#FFC800",
  warningDark: "#E0B000",
  orange: "#FF9600",
  orangeSoft: "rgba(255, 150, 0, 0.1)",
  purple: "#CE82FF",
  purpleDark: "#B870E6",
  purpleSoft: "rgba(206, 130, 255, 0.1)",
  danger: "#FF4B4B",
  dangerDark: "#E04040",
  dangerSoft: "rgba(255, 75, 75, 0.1)",
  gray: "#E5E5E5",
  grayDark: "#AFAFAF",
  white: "#FFFFFF"
};

export const fontFamilies = {
  regular: "Nunito_400Regular",
  medium: "Nunito_500Medium",
  semibold: "Nunito_600SemiBold",
  bold: "Nunito_700Bold",
  extraBold: "Nunito_800ExtraBold",
  black: "Nunito_900Black",
  regularItalic: "Nunito_400Regular_Italic",
  mediumItalic: "Nunito_500Medium_Italic",
  semiboldItalic: "Nunito_600SemiBold_Italic",
  boldItalic: "Nunito_700Bold_Italic",
  extraBoldItalic: "Nunito_800ExtraBold_Italic",
  blackItalic: "Nunito_900Black_Italic"
} as const;

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 999
};

export const layout = {
  pageMaxWidth: 768,
  pagePaddingHorizontal: spacing.md,
  pagePaddingTop: spacing.lg,
  pagePaddingBottom: spacing.xl,
  pageGap: spacing.lg
} as const;

export const typography = {
  caption: {
    fontSize: 12,
    lineHeight: 16
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0
  },
  heading: {
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.3
  },
  display: {
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.4
  }
};

export const fontWeights = {
  regular: {
    fontFamily: fontFamilies.regular
  },
  medium: {
    fontFamily: fontFamilies.medium
  },
  semibold: {
    fontFamily: fontFamilies.semibold
  },
  bold: {
    fontFamily: fontFamilies.bold
  },
  extraBold: {
    fontFamily: fontFamilies.extraBold
  },
  black: {
    fontFamily: fontFamilies.black
  }
} as const;

export const shadow = {
  soft: {
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2
  },
  topNav: {
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: -2
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6
  }
};

type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

function isTextLikeStyle(style: ViewStyle | TextStyle | ImageStyle) {
  return (
    "fontSize" in style ||
    "lineHeight" in style ||
    "letterSpacing" in style ||
    "textTransform" in style ||
    "fontWeight" in style ||
    "fontStyle" in style
  );
}

export function resolveNunitoFontFamily(style: Pick<TextStyle, "fontStyle" | "fontWeight"> = {}) {
  const isItalic = style.fontStyle === "italic";
  const rawWeight = style.fontWeight;
  const weight =
    typeof rawWeight === "number"
      ? rawWeight
      : typeof rawWeight === "string"
        ? Number.parseInt(rawWeight, 10)
        : 400;

  if (weight >= 900) {
    return isItalic ? fontFamilies.blackItalic : fontFamilies.black;
  }

  if (weight >= 800) {
    return isItalic ? fontFamilies.extraBoldItalic : fontFamilies.extraBold;
  }

  if (weight >= 700) {
    return isItalic ? fontFamilies.boldItalic : fontFamilies.bold;
  }

  if (weight >= 600) {
    return isItalic ? fontFamilies.semiboldItalic : fontFamilies.semibold;
  }

  if (weight >= 500) {
    return isItalic ? fontFamilies.mediumItalic : fontFamilies.medium;
  }

  return isItalic ? fontFamilies.regularItalic : fontFamilies.regular;
}

export function withNunitoStyles<T extends NamedStyles>(styles: T): T {
  const themedEntries = Object.entries(styles).map(([key, value]) => {
    if (!isTextLikeStyle(value)) {
      return [key, value];
    }

    return [
      key,
      {
        ...value,
        fontFamily: resolveNunitoFontFamily(value as TextStyle),
        fontWeight: undefined
      }
    ];
  });

  return Object.fromEntries(themedEntries) as T;
}
