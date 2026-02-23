import {
  Box,
  HStack,
  IconButton,
  Image,
  Kbd,
  Spacer,
  Text,
} from "@chakra-ui/react";
import { ColorModeButton } from "@/components/ui/color-mode";
import { useColorMode } from "@/components/ui/use-color-mode";
import { LuMenu } from "react-icons/lu";
import { useI18n } from "@/hooks/useI18n";

export interface TopNavProps {
  onOpenOmni?: () => void;
  onOpenMenu?: () => void;
  showMenuButton?: boolean;
}

export function TopNav(
  { onOpenOmni, onOpenMenu, showMenuButton = false }: TopNavProps,
) {
  const { t } = useI18n();
  const lightLogoUrl = new URL(
    "../../assets/Floorp_Logo_OS_C_Light.png",
    import.meta.url,
  ).toString();
  const darkLogoUrl = new URL(
    "../../assets/Floorp_Logo_OS_D_Dark.png",
    import.meta.url,
  ).toString();
  const { colorMode } = useColorMode();
  const logoUrl = colorMode === "dark" ? darkLogoUrl : lightLogoUrl;
  return (
    <HStack
      as="header"
      px={{ base: 2, md: 2 }}
      py={{ base: 1.5, md: 2 }}
      align="center"
      gap={{ base: 1, md: 1.5 }}
      position="relative"
      borderBottomWidth="1px"
      borderBottomColor="border"
      bg="bg.panel"
      h="auto"
      minH={{ base: "11", md: "12" }}
      css={{
        "@media (max-height: 600px) and (orientation: landscape)": {
          paddingTop: "0.25rem",
          paddingBottom: "0.25rem",
          minHeight: "2rem",
        },
      }}
    >
      <HStack gap={{ base: 1, md: 1.5 }} flexShrink={0}>
        {showMenuButton && (
          <IconButton
            aria-label={t("nav.openMenu")}
            size="sm"
            variant="ghost"
            color="fg"
            onClick={onOpenMenu}
            display={{ base: "flex", lg: "none" }}
          >
            <LuMenu />
          </IconButton>
        )}
        <Image
          src={logoUrl}
          alt="Floorp OS"
          height={{ base: "4", md: "6" }}
          width="auto"
          display={{ base: "none", md: "block" }}
          css={{ objectFit: "contain" }}
        />
      </HStack>
      {/* Centered Omni Bar trigger (absolute centering) */}
      <Box
        display={"flex"}
        alignItems="center"
        position="absolute"
        left="50%"
        top="0"
        bottom="0"
        transform="translateX(-50%)"
        w="full"
        maxW={{ base: "calc(100% - 6rem)", sm: "20rem", md: "24rem" }}
        px={{ base: 2, md: 0 }}
        py={{ base: "5px", md: "8px" }}
      >
        <Box
          role="button"
          tabIndex={0}
          aria-label={t("nav.openOmniBar")}
          onClick={() => onOpenOmni?.()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onOpenOmni?.();
          }}
          w="full"
          h="full"
          px={{ base: 2, md: 2 }}
          rounded="md"
          borderWidth="1px"
          borderColor="border"
          bg="bg"
          cursor="text"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          transitionProperty="colors, shadow"
          transitionDuration="normal"
          _hover={{ bg: "bg.subtle" }}
          _focusVisible={{
            outline: "2px solid",
            outlineColor: "accent.focusRing",
          }}
        >
          <Text fontSize="sm" color="fg.muted" whiteSpace="nowrap">
            {t("nav.searchOrRun")}
          </Text>
          <HStack gap={0.5} color="fg.muted">
            <Kbd fontSize="2xs" p={0.5}>⌘</Kbd>
            <Kbd fontSize="2xs" p={0.5}>K</Kbd>
          </HStack>
        </Box>
      </Box>
      <Spacer />
      <HStack gap={0.5} flexShrink={0} display={{ base: "none", sm: "flex" }}>
        <ColorModeButton />
      </HStack>
    </HStack>
  );
}
