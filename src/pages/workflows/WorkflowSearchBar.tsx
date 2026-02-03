import { HStack, Input } from "@chakra-ui/react";
import { LuSearch } from "react-icons/lu";

interface WorkflowSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function WorkflowSearchBar({
  value,
  onChange,
  placeholder,
}: WorkflowSearchBarProps) {
  return (
    <HStack gap={2} mb={3}>
      <HStack
        borderWidth="1px"
        borderRadius="xl"
        px={3}
        py={2}
        gap={2}
        flex={1}
        bg="bg"
        _focusWithin={{
          borderColor: "floorp.500",
          boxShadow: "0 0 0 1px var(--chakra-colors-floorp-500)",
        }}
      >
        <LuSearch size={16} color="var(--chakra-colors-fg-muted)" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          size="sm"
          flex="1"
          border="none"
          outline="none"
          bg="transparent"
          _focus={{ outline: "none", boxShadow: "none" }}
        />
      </HStack>
    </HStack>
  );
}
