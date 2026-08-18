"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineupSchema = exports.WeaponDataSchema = exports.WeaponShopDataSchema = exports.WeaponSkinSchema = exports.MapDataSchema = exports.AgentSchema = exports.AgentAbilitySchema = exports.AgentRoleSchema = void 0;
const zod_1 = require("zod");
exports.AgentRoleSchema = zod_1.z.object({
    uuid: zod_1.z.string(),
    displayName: zod_1.z.enum(['Duelist', 'Initiator', 'Controller', 'Sentinel']),
    description: zod_1.z.string(),
    displayIcon: zod_1.z.string()
});
exports.AgentAbilitySchema = zod_1.z.object({
    slot: zod_1.z.string(),
    displayName: zod_1.z.string(),
    description: zod_1.z.string(),
    displayIcon: zod_1.z.string()
});
exports.AgentSchema = zod_1.z.object({
    uuid: zod_1.z.string(),
    displayName: zod_1.z.string(),
    description: zod_1.z.string(),
    developerName: zod_1.z.string(),
    characterTags: zod_1.z.array(zod_1.z.string()).nullable(),
    displayIcon: zod_1.z.string(),
    displayIconSmall: zod_1.z.string(),
    bustPortrait: zod_1.z.string(),
    fullPortrait: zod_1.z.string(),
    killfeedPortrait: zod_1.z.string(),
    background: zod_1.z.string(),
    backgroundGradientColors: zod_1.z.array(zod_1.z.string()),
    role: exports.AgentRoleSchema.nullable(),
    isBaseContent: zod_1.z.boolean().optional(),
    unlocked: zod_1.z.boolean().optional(),
    abilities: zod_1.z.array(exports.AgentAbilitySchema)
});
exports.MapDataSchema = zod_1.z.object({
    uuid: zod_1.z.string(),
    displayName: zod_1.z.string(),
    narrativeDescription: zod_1.z.string(),
    splash: zod_1.z.string(),
    displayIcon: zod_1.z.string(),
    listViewIcon: zod_1.z.string(),
    coordinates: zod_1.z.string()
});
exports.WeaponSkinSchema = zod_1.z.object({
    uuid: zod_1.z.string(),
    displayName: zod_1.z.string(),
    displayIcon: zod_1.z.string()
});
exports.WeaponShopDataSchema = zod_1.z.object({
    cost: zod_1.z.number(),
    category: zod_1.z.string(),
    categoryText: zod_1.z.string()
});
exports.WeaponDataSchema = zod_1.z.object({
    uuid: zod_1.z.string(),
    displayName: zod_1.z.string(),
    category: zod_1.z.string(),
    displayIcon: zod_1.z.string(),
    shopData: exports.WeaponShopDataSchema.nullable(),
    skins: zod_1.z.array(exports.WeaponSkinSchema)
});
exports.LineupSchema = zod_1.z.object({
    id: zod_1.z.string(),
    map: zod_1.z.string(),
    agent: zod_1.z.string(),
    ability: zod_1.z.string(),
    side: zod_1.z.enum(['Attack', 'Defense']),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    difficulty: zod_1.z.enum(['Easy', 'Medium', 'Hard']),
    source: zod_1.z.string()
});
