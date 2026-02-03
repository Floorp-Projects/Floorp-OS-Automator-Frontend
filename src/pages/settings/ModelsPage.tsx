import React from "react";
import {
  Box,
  Button,
  Card,
  createListCollection,
  Flex,
  HStack,
  IconButton,
  Input,
  Portal,
  SelectContent,
  SelectItem,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  Stack,
  Table,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  LuCheck,
  LuDatabase,
  LuPencil,
  LuPlus,
  LuTrash2,
  LuX,
} from "react-icons/lu";
import { clients } from "@/lib/grpc-clients";
import { create } from "@bufbuild/protobuf";
import {
  CreateModelRequestSchema,
  DeleteModelRequestSchema,
  ListModelsRequestSchema,
  UpdateModelRequestSchema,
} from "@/gen/sapphillon/ai/v1/model_service_pb";
import { SearchModelRequestSchema } from "@/gen/sapphillon/ai/v1/search_model_service_pb";
import { ModelsSchema } from "@/gen/sapphillon/ai/v1/model_pb";
import type { Models } from "@/gen/sapphillon/ai/v1/model_pb";
import type { Provider } from "@/gen/sapphillon/ai/v1/provider_pb";
import { ListProvidersRequestSchema } from "@/gen/sapphillon/ai/v1/provider_service_pb";
import { Field } from "@/components/ui/field";
import { toaster } from "@/components/ui/toaster-instance";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/hooks/useI18n";

type ModelFormData = {
  displayName: string;
  description?: string;
  providerName: string;
};

export function ModelsPage() {
  const { t } = useI18n();
  const [models, setModels] = React.useState<Models[]>([]);
  const [providers, setProviders] = React.useState<Provider[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [providerFilter, setProviderFilter] = React.useState<string>("");

  // バリデーションスキーマ
  const modelFormSchema = React.useMemo(() =>
    z.object({
      displayName: z.string().min(1, t("models.displayNameRequired")),
      description: z.string().optional(),
      providerName: z.string().min(1, t("models.providerRequired")),
    }), [t]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ModelFormData>({
    resolver: zodResolver(modelFormSchema),
  });

  // 編集用のフォーム（テーブル内編集用）
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    control: controlEdit,
    formState: { isSubmitting: isSubmittingEdit },
  } = useForm<ModelFormData>({
    resolver: zodResolver(modelFormSchema),
  });

  // プロバイダ一覧の取得
  const fetchProviders = React.useCallback(async () => {
    try {
      const request = create(ListProvidersRequestSchema, {
        pageSize: 100,
      });
      const response = await clients.provider.listProviders(request);
      setProviders(response.providers);
    } catch (error) {
      console.error("Failed to fetch providers:", error);
      toaster.create({
        title: t("models.fetchError"),
        type: "error",
      });
    }
  }, [t]);

  // モデル一覧の取得
  const fetchModels = React.useCallback(async () => {
    try {
      setLoading(true);

      // 検索クエリがある場合はSearchModelServiceを使用
      if (searchQuery || providerFilter) {
        const request = create(SearchModelRequestSchema, {
          modelNameQuery: searchQuery || undefined,
          providerNameQuery: providerFilter || undefined,
          pageSize: 100,
          pageToken: "",
        });
        const response = await clients.searchModel.searchModel(request);
        setModels(response.models);
      } else {
        // 検索クエリがない場合はListModelsを使用
        const request = create(ListModelsRequestSchema, {
          pageSize: 100,
        });
        const response = await clients.model.listModels(request);
        setModels(response.models);
      }
    } catch (error) {
      console.error("Failed to fetch models:", error);
      toaster.create({
        title: t("models.fetchModelError"),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, providerFilter, t]);

  React.useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  React.useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // モデルの作成
  const onCreateModel = async (data: ModelFormData) => {
    try {
      // プロバイダオブジェクトを取得
      const selectedProvider = providers.find((p) =>
        p.name === data.providerName
      );
      if (!selectedProvider) {
        toaster.create({
          title: "プロバイダが見つかりません",
          type: "error",
        });
        return;
      }

      const model = create(ModelsSchema, {
        displayName: data.displayName,
        description: data.description,
        providerName: selectedProvider.name,
      });

      const request = create(CreateModelRequestSchema, {
        model,
      });

      await clients.model.createModel(request);
      toaster.create({
        title: t("models.createSuccess"),
        type: "success",
      });
      reset();
      setIsCreating(false);
      fetchModels();
    } catch (error) {
      console.error("Failed to create model:", error);
      toaster.create({
        title: t("models.createError"),
        type: "error",
      });
    }
  };

  // モデルの更新
  const onUpdateModel = async (modelId: string, data: ModelFormData) => {
    try {
      // プロバイダオブジェクトを取得
      const selectedProvider = providers.find((p) =>
        p.name === data.providerName
      );
      if (!selectedProvider) {
        toaster.create({
          title: t("models.providerNotFound"),
          type: "error",
        });
        return;
      }

      const model = create(ModelsSchema, {
        name: modelId,
        displayName: data.displayName,
        description: data.description,
        providerName: selectedProvider.name,
      });

      const request = create(UpdateModelRequestSchema, {
        model,
      });

      await clients.model.updateModel(request);
      toaster.create({
        title: t("models.updateSuccess"),
        type: "success",
      });
      reset();
      setEditingId(null);
      fetchModels();
    } catch (error) {
      console.error("Failed to update model:", error);
      toaster.create({
        title: t("models.updateError"),
        type: "error",
      });
    }
  };

  // モデルの削除
  const onDeleteModel = async (modelId: string) => {
    if (!confirm(t("models.deleteConfirm"))) {
      return;
    }

    try {
      const request = create(DeleteModelRequestSchema, {
        name: modelId,
      });

      await clients.model.deleteModel(request);
      toaster.create({
        title: t("models.deleteSuccess"),
        type: "success",
      });
      fetchModels();
    } catch (error) {
      console.error("Failed to delete model:", error);
      toaster.create({
        title: t("models.deleteError"),
        type: "error",
      });
    }
  };

  // 編集開始
  const startEdit = (model: Models) => {
    setEditingId(model.name);
    resetEdit({
      displayName: model.displayName,
      description: model.description,
      providerName: model.providerName || "",
    });
  };

  // 作成フォームの表示
  const startCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    reset({
      displayName: "",
      description: "",
      providerName: "",
    });
  };

  const providerCollection = createListCollection({
    items: providers.map((p) => ({
      label: p.displayName,
      value: p.name,
    })),
  });

  return (
    <Box p={4}>
      <VStack align="stretch" gap={4}>
        {!isCreating && (
          <Flex justify="flex-end">
            <Button
              colorPalette="floorp"
              size="sm"
              onClick={startCreate}
            >
              <LuPlus />
              {t("models.new")}
            </Button>
          </Flex>
        )}

        {/* 検索フィルター */}
        {!isCreating && (
          <Card.Root>
            <Card.Body>
              <HStack gap={4} wrap="wrap">
                <Box flex="1" minW="200px">
                  <Field label={t("models.searchByName")}>
                    <Input
                      placeholder={t("models.searchPlaceholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </Field>
                </Box>
                <Box flex="1" minW="200px">
                  <Field label={t("models.filterByProvider")}>
                    <SelectRoot
                      collection={providerCollection}
                      value={providerFilter ? [providerFilter] : []}
                      onValueChange={(details) => {
                        setProviderFilter(details.value[0] || "");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValueText
                          placeholder={t("models.allProviders")}
                        />
                      </SelectTrigger>
                      <Portal>
                        <SelectPositioner>
                          <SelectContent>
                            <SelectItem item="">
                              {t("models.allProviders")}
                            </SelectItem>
                            {providers.map((provider) => (
                              <SelectItem
                                key={provider.name}
                                item={provider.name}
                              >
                                {provider.displayName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </SelectPositioner>
                      </Portal>
                    </SelectRoot>
                  </Field>
                </Box>
                <Box alignSelf="flex-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setProviderFilter("");
                    }}
                  >
                    {t("models.clear")}
                  </Button>
                </Box>
              </HStack>
            </Card.Body>
          </Card.Root>
        )}

        {/* 作成フォーム */}
        {isCreating && (
          <Card.Root borderRadius="xl">
            <Card.Header py={3} px={4}>
              <Flex justify="space-between" align="center">
                <Text fontWeight="semibold" fontSize="sm">
                  {t("models.createNew")}
                </Text>
                <IconButton
                  aria-label={t("models.cancel")}
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    setIsCreating(false);
                    reset();
                  }}
                >
                  <LuX />
                </IconButton>
              </Flex>
            </Card.Header>
            <Card.Body pt={0}>
              <form onSubmit={handleSubmit(onCreateModel)}>
                <Stack gap={4}>
                  <Field
                    label={t("models.displayName")}
                    invalid={!!errors.displayName}
                    errorText={errors.displayName?.message}
                  >
                    <Input {...register("displayName")} />
                  </Field>

                  <Field
                    label={t("models.description")}
                    invalid={!!errors.description}
                    errorText={errors.description?.message}
                  >
                    <Textarea {...register("description")} rows={3} />
                  </Field>

                  <Field
                    label={t("models.provider")}
                    invalid={!!errors.providerName}
                    errorText={errors.providerName?.message}
                  >
                    <Controller
                      name="providerName"
                      control={control}
                      render={({ field }) => (
                        <SelectRoot
                          collection={providerCollection}
                          value={field.value ? [field.value] : []}
                          onValueChange={(details) => {
                            field.onChange(details.value[0]);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValueText
                              placeholder={t("models.providerSelect")}
                            />
                          </SelectTrigger>
                          <Portal>
                            <SelectPositioner>
                              <SelectContent>
                                {providers.map((provider) => (
                                  <SelectItem
                                    key={provider.name}
                                    item={provider.name}
                                  >
                                    {provider.displayName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </SelectPositioner>
                          </Portal>
                        </SelectRoot>
                      )}
                    />
                  </Field>

                  <HStack justify="flex-end">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsCreating(false);
                        reset();
                      }}
                    >
                      {t("models.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      colorPalette="floorp"
                      loading={isSubmitting}
                    >
                      {t("models.create")}
                    </Button>
                  </HStack>
                </Stack>
              </form>
            </Card.Body>
          </Card.Root>
        )}

        {/* モデル一覧 */}
        <Card.Root borderRadius="xl">
          <Card.Header py={3} px={4}>
            <Text fontWeight="semibold" fontSize="sm">{t("models.list")}</Text>
          </Card.Header>
          <Card.Body p={0}>
            {loading
              ? <TableSkeleton rows={5} />
              : models.length === 0
              ? (
                <EmptyState
                  icon={<LuDatabase />}
                  title={t("models.emptyTitle")}
                  description={t("models.emptyDescription")}
                  action={{
                    label: t("models.emptyAction"),
                    onClick: startCreate,
                    icon: <LuPlus />,
                  }}
                />
              )
              : (
                <Table.Root size="sm" variant="line">
                  <Table.Header>
                    <Table.Row bg="bg.subtle">
                      <Table.ColumnHeader fontSize="xs" color="fg.muted">
                        {t("models.displayName")}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader fontSize="xs" color="fg.muted">
                        {t("models.description")}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader fontSize="xs" color="fg.muted">
                        {t("models.provider")}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader fontSize="xs" color="fg.muted">
                        {t("models.resourceName")}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader
                        fontSize="xs"
                        color="fg.muted"
                        textAlign="right"
                      >
                        {t("models.operations")}
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {models.map((model) => (
                      <Table.Row key={model.name}>
                        <Table.Cell>
                          {editingId === model.name
                            ? (
                              <Input
                                size="sm"
                                {...registerEdit("displayName")}
                              />
                            )
                            : (
                              model.displayName
                            )}
                        </Table.Cell>
                        <Table.Cell>
                          {editingId === model.name
                            ? (
                              <Textarea
                                size="sm"
                                {...registerEdit("description")}
                                rows={2}
                              />
                            )
                            : (
                              <Text fontSize="sm" color="fg.muted">
                                {model.description || "-"}
                              </Text>
                            )}
                        </Table.Cell>
                        <Table.Cell>
                          {editingId === model.name
                            ? (
                              <Controller
                                name="providerName"
                                control={controlEdit}
                                render={({ field }) => (
                                  <SelectRoot
                                    collection={providerCollection}
                                    value={field.value ? [field.value] : []}
                                    onValueChange={(details) => {
                                      field.onChange(details.value[0]);
                                    }}
                                    size="sm"
                                  >
                                    <SelectTrigger>
                                      <SelectValueText
                                        placeholder={t("models.providerSelect")}
                                      />
                                    </SelectTrigger>
                                    <SelectPositioner>
                                      <SelectContent>
                                        {providers.map((provider) => (
                                          <SelectItem
                                            key={provider.name}
                                            item={provider.name}
                                          >
                                            {provider.displayName}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </SelectPositioner>
                                  </SelectRoot>
                                )}
                              />
                            )
                            : (
                              <Text fontSize="sm">
                                {providers.find((p) =>
                                  p.name === model.providerName
                                )?.displayName ||
                                  model.providerName || "-"}
                              </Text>
                            )}
                        </Table.Cell>
                        <Table.Cell>
                          <Text fontSize="sm" color="fg.muted">
                            {model.name}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <HStack justify="flex-end" gap={2}>
                            {editingId === model.name
                              ? (
                                <>
                                  <IconButton
                                    aria-label={t("models.save")}
                                    size="sm"
                                    colorPalette="green"
                                    onClick={handleSubmitEdit((data) =>
                                      onUpdateModel(model.name, data)
                                    )}
                                    loading={isSubmittingEdit}
                                  >
                                    <LuCheck />
                                  </IconButton>
                                  <IconButton
                                    aria-label={t("models.cancel")}
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingId(null);
                                      resetEdit();
                                    }}
                                  >
                                    <LuX />
                                  </IconButton>
                                </>
                              )
                              : (
                                <>
                                  <IconButton
                                    aria-label={t("models.edit")}
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEdit(model)}
                                  >
                                    <LuPencil />
                                  </IconButton>
                                  <IconButton
                                    aria-label={t("models.delete")}
                                    size="sm"
                                    variant="ghost"
                                    colorPalette="red"
                                    onClick={() => onDeleteModel(model.name)}
                                  >
                                    <LuTrash2 />
                                  </IconButton>
                                </>
                              )}
                          </HStack>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              )}
          </Card.Body>
        </Card.Root>
      </VStack>
    </Box>
  );
}
