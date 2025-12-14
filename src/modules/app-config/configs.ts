export type AppConfigKey = (typeof AppConfigs)[keyof typeof AppConfigs];

export const CONFIG_ENABLED_KEY = 'config_enabled_key';

export const AppConfigs = {
  SemanticSearchEnabled: 'semantic_search_enabled',
  MessageEmbeddingEnabled: 'message_embedding_enabled',
} as const;
