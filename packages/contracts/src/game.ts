import { z } from 'zod';

export const AgentRoleSchema = z.object({
  uuid: z.string(),
  displayName: z.enum(['Duelist', 'Initiator', 'Controller', 'Sentinel']),
  description: z.string(),
  displayIcon: z.string()
});

export const AgentAbilitySchema = z.object({
  slot: z.string(),
  displayName: z.string(),
  description: z.string(),
  displayIcon: z.string()
});

export const AgentSchema = z.object({
  uuid: z.string(),
  displayName: z.string(),
  description: z.string(),
  developerName: z.string(),
  characterTags: z.array(z.string()).nullable(),
  displayIcon: z.string(),
  displayIconSmall: z.string(),
  bustPortrait: z.string(),
  fullPortrait: z.string(),
  killfeedPortrait: z.string(),
  background: z.string(),
  backgroundGradientColors: z.array(z.string()),
  role: AgentRoleSchema.nullable(),
  isBaseContent: z.boolean().optional(),
  unlocked: z.boolean().optional(),
  abilities: z.array(AgentAbilitySchema)
});

export type AgentRole = z.infer<typeof AgentRoleSchema>;
export type AgentAbility = z.infer<typeof AgentAbilitySchema>;
export type Agent = z.infer<typeof AgentSchema>;

export const MapDataSchema = z.object({
  uuid: z.string(),
  displayName: z.string(),
  narrativeDescription: z.string(),
  splash: z.string(),
  displayIcon: z.string(),
  listViewIcon: z.string(),
  coordinates: z.string()
});

export type MapData = z.infer<typeof MapDataSchema>;

export const WeaponSkinSchema = z.object({
  uuid: z.string(),
  displayName: z.string(),
  displayIcon: z.string()
});

export const WeaponShopDataSchema = z.object({
  cost: z.number(),
  category: z.string(),
  categoryText: z.string()
});

export const WeaponDataSchema = z.object({
  uuid: z.string(),
  displayName: z.string(),
  category: z.string(),
  displayIcon: z.string(),
  shopData: WeaponShopDataSchema.nullable(),
  skins: z.array(WeaponSkinSchema)
});

export type WeaponSkin = z.infer<typeof WeaponSkinSchema>;
export type WeaponShopData = z.infer<typeof WeaponShopDataSchema>;
export type WeaponData = z.infer<typeof WeaponDataSchema>;

export const LineupSchema = z.object({
  id: z.string(),
  map: z.string(),
  agent: z.string(),
  ability: z.string(),
  side: z.enum(['Attack', 'Defense']),
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  source: z.string()
});

export type Lineup = z.infer<typeof LineupSchema>;
