import React from "react";
import {
  Box,
  Button,
  Card,
  Dialog,
  HStack,
  IconButton,
  Portal,
  Progress,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuArrowLeft, LuArrowRight, LuCheck, LuX } from "react-icons/lu";
import type { OnboardingTour } from "@/hooks/useOnboarding";
import { useI18n } from "@/hooks/useI18n";

interface OnboardingTourComponentProps {
  tour: OnboardingTour;
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

export function OnboardingTourComponent({
  tour,
  currentStep,
  onNext,
  onPrev,
  onSkip,
  onComplete,
}: OnboardingTourComponentProps) {
  const { t } = useI18n();
  const step = tour.steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tour.steps.length - 1;
  const progress = ((currentStep + 1) / tour.steps.length) * 100;

  const [targetElement, setTargetElement] = React.useState<HTMLElement | null>(
    null,
  );
  const [position, setPosition] = React.useState({ top: 0, left: 0 });

  // Find target element and calculate position
  React.useEffect(() => {
    if (!step.target) {
      setTargetElement(null);
      return;
    }

    const element = document.querySelector(step.target) as HTMLElement;
    setTargetElement(element);

    if (element) {
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset ||
        document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset ||
        document.documentElement.scrollLeft;

      // Calculate position based on placement
      let top = 0;
      let left = 0;

      switch (step.placement) {
        case "top":
          top = rect.top + scrollTop - 10;
          left = rect.left + scrollLeft + rect.width / 2;
          break;
        case "bottom":
          top = rect.bottom + scrollTop + 10;
          left = rect.left + scrollLeft + rect.width / 2;
          break;
        case "left":
          top = rect.top + scrollTop + rect.height / 2;
          left = rect.left + scrollLeft - 10;
          break;
        case "right":
          top = rect.top + scrollTop + rect.height / 2;
          left = rect.right + scrollLeft + 10;
          break;
        default:
          // Center of viewport if no placement specified
          top = window.innerHeight / 2 + scrollTop;
          left = window.innerWidth / 2 + scrollLeft;
      }

      setPosition({ top, left });

      // Scroll element into view
      element.scrollIntoView({ behavior: "smooth", block: "center" });

      // Add highlight class
      element.classList.add("onboarding-highlight");
      return () => {
        element.classList.remove("onboarding-highlight");
      };
    }
  }, [step.target, step.placement]);

  // Execute step action
  React.useEffect(() => {
    if (step.action) {
      step.action();
    }
  }, [step]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      onNext();
    }
  };

  // Show as centered dialog if no target element
  if (!step.target || !targetElement) {
    return (
      <Dialog.Root open={true} size={{ base: "full", md: "md" }}>
        <Dialog.Backdrop bg="blackAlpha.700" />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <HStack justify="space-between" w="full">
                <Text fontWeight="medium" fontSize="lg">
                  {tour.name}
                </Text>
                <IconButton
                  aria-label={t("onboarding.skipTour")}
                  variant="ghost"
                  size="sm"
                  onClick={onSkip}
                >
                  <LuX />
                </IconButton>
              </HStack>
            </Dialog.Header>

            <Dialog.Body>
              <VStack align="stretch" gap={4}>
                {/* Progress */}
                <Box>
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="xs" color="fg.muted">
                      {t("onboarding.step", { current: currentStep + 1, total: tour.steps.length })}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {Math.round(progress)}%
                    </Text>
                  </HStack>
                  <Progress.Root value={progress} size="sm">
                    <Progress.Track>
                      <Progress.Range colorPalette="blue" />
                    </Progress.Track>
                  </Progress.Root>
                </Box>

                {/* Step Content */}
                <VStack align="stretch" gap={2}>
                  <Text fontWeight="semibold" fontSize="md">
                    {step.title}
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    {step.description}
                  </Text>
                </VStack>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <HStack justify="space-between" w="full">
                <Button
                  variant="ghost"
                  onClick={onPrev}
                  disabled={isFirstStep}
                  size="sm"
                >
                  <LuArrowLeft />
                  {t("onboarding.back")}
                </Button>
                <Button
                  colorPalette="floorp"
                  onClick={handleNext}
                  size="sm"
                >
                  {isLastStep
                    ? (
                      <>
                        <LuCheck />
                        {t("onboarding.complete")}
                      </>
                    )
                    : (
                      <>
                        {t("onboarding.next")}
                        <LuArrowRight />
                      </>
                    )}
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    );
  }

  // Show as positioned tooltip
  return (
    <Portal>
      {/* Backdrop */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.700"
        zIndex={1000}
        onClick={onSkip}
      />

      {/* Spotlight effect */}
      {targetElement && (
        <Box
          position="absolute"
          top={targetElement.getBoundingClientRect().top + window.pageYOffset -
            8}
          left={targetElement.getBoundingClientRect().left +
            window.pageXOffset - 8}
          width={targetElement.offsetWidth + 16}
          height={targetElement.offsetHeight + 16}
          border="3px solid"
          borderColor="blue.500"
          rounded="md"
          boxShadow="0 0 0 9999px rgba(0, 0, 0, 0.7)"
          zIndex={1001}
          pointerEvents="none"
          animation="pulse 2s ease-in-out infinite"
          css={{
            "@keyframes pulse": {
              "0%, 100%": { opacity: 1 },
              "50%": { opacity: 0.7 },
            },
          }}
        />
      )}

      {/* Tooltip */}
      <Card.Root
        position="absolute"
        top={position.top}
        left={position.left}
        transform="translate(-50%, 0)"
        maxW="400px"
        zIndex={1002}
        onClick={(e) => e.stopPropagation()}
        shadow="2xl"
      >
        <Card.Body p={4}>
          <VStack align="stretch" gap={4}>
            {/* Header */}
            <HStack justify="space-between">
              <Text fontSize="xs" color="fg.muted">
                {tour.name} - {t("onboarding.step", { current: currentStep + 1, total: tour.steps.length })}
              </Text>
              <IconButton
                aria-label={t("onboarding.skipTour")}
                variant="ghost"
                size="xs"
                onClick={onSkip}
              >
                <LuX />
              </IconButton>
            </HStack>

            {/* Progress */}
            <Progress.Root value={progress} size="sm">
              <Progress.Track>
                <Progress.Range colorPalette="blue" />
              </Progress.Track>
            </Progress.Root>

            {/* Content */}
            <VStack align="stretch" gap={2}>
              <Text fontWeight="semibold" fontSize="sm">
                {step.title}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {step.description}
              </Text>
            </VStack>

            {/* Actions */}
            <HStack justify="space-between" gap={2}>
              <Button
                variant="ghost"
                onClick={onPrev}
                disabled={isFirstStep}
                size="xs"
              >
                <LuArrowLeft size={12} />
                {t("onboarding.back")}
              </Button>
              <Button
                colorPalette="floorp"
                onClick={handleNext}
                size="xs"
              >
                {isLastStep
                  ? (
                    <>
                      <LuCheck size={12} />
                      {t("onboarding.complete")}
                    </>
                  )
                  : (
                    <>
                      {t("onboarding.next")}
                      <LuArrowRight size={12} />
                    </>
                  )}
              </Button>
            </HStack>
          </VStack>
        </Card.Body>
      </Card.Root>
    </Portal>
  );
}
