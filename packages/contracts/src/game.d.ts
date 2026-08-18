import { z } from 'zod';
export declare const AgentRoleSchema: z.ZodObject<{
    uuid: z.ZodString;
    displayName: z.ZodEnum<["Duelist", "Initiator", "Controller", "Sentinel"]>;
    description: z.ZodString;
    displayIcon: z.ZodString;
}, "strip", z.ZodTypeAny, {
    uuid: string;
    displayName: "Duelist" | "Initiator" | "Controller" | "Sentinel";
    description: string;
    displayIcon: string;
}, {
    uuid: string;
    displayName: "Duelist" | "Initiator" | "Controller" | "Sentinel";
    description: string;
    displayIcon: string;
}>;
export declare const AgentAbilitySchema: z.ZodObject<{
    slot: z.ZodString;
    displayName: z.ZodString;
    description: z.ZodString;
    displayIcon: z.ZodString;
}, "strip", z.ZodTypeAny, {
    displayName: string;
    description: string;
    displayIcon: string;
    slot: string;
}, {
    displayName: string;
    description: string;
    displayIcon: string;
    slot: string;
}>;
export declare const AgentSchema: z.ZodObject<{
    uuid: z.ZodString;
    displayName: z.ZodString;
    description: z.ZodString;
    developerName: z.ZodString;
    characterTags: z.ZodNullable<z.ZodArray<z.ZodString, "many">>;
    displayIcon: z.ZodString;
    displayIconSmall: z.ZodString;
    bustPortrait: z.ZodString;
    fullPortrait: z.ZodString;
    killfeedPortrait: z.ZodString;
    background: z.ZodString;
    backgroundGradientColors: z.ZodArray<z.ZodString, "many">;
    role: z.ZodNullable<z.ZodObject<{
        uuid: z.ZodString;
        displayName: z.ZodEnum<["Duelist", "Initiator", "Controller", "Sentinel"]>;
        description: z.ZodString;
        displayIcon: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        uuid: string;
        displayName: "Duelist" | "Initiator" | "Controller" | "Sentinel";
        description: string;
        displayIcon: string;
    }, {
        uuid: string;
        displayName: "Duelist" | "Initiator" | "Controller" | "Sentinel";
        description: string;
        displayIcon: string;
    }>>;
    isBaseContent: z.ZodOptional<z.ZodBoolean>;
    unlocked: z.ZodOptional<z.ZodBoolean>;
    abilities: z.ZodArray<z.ZodObject<{
        slot: z.ZodString;
        displayName: z.ZodString;
        description: z.ZodString;
        displayIcon: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        displayName: string;
        description: string;
        displayIcon: string;
        slot: string;
    }, {
        displayName: string;
        description: string;
        displayIcon: string;
        slot: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    role: {
        uuid: string;
        displayName: "Duelist" | "Initiator" | "Controller" | "Sentinel";
        description: string;
        displayIcon: string;
    } | null;
    uuid: string;
    displayName: string;
    description: string;
    displayIcon: string;
    developerName: string;
    characterTags: string[] | null;
    displayIconSmall: string;
    bustPortrait: string;
    fullPortrait: string;
    killfeedPortrait: string;
    background: string;
    backgroundGradientColors: string[];
    abilities: {
        displayName: string;
        description: string;
        displayIcon: string;
        slot: string;
    }[];
    isBaseContent?: boolean | undefined;
    unlocked?: boolean | undefined;
}, {
    role: {
        uuid: string;
        displayName: "Duelist" | "Initiator" | "Controller" | "Sentinel";
        description: string;
        displayIcon: string;
    } | null;
    uuid: string;
    displayName: string;
    description: string;
    displayIcon: string;
    developerName: string;
    characterTags: string[] | null;
    displayIconSmall: string;
    bustPortrait: string;
    fullPortrait: string;
    killfeedPortrait: string;
    background: string;
    backgroundGradientColors: string[];
    abilities: {
        displayName: string;
        description: string;
        displayIcon: string;
        slot: string;
    }[];
    isBaseContent?: boolean | undefined;
    unlocked?: boolean | undefined;
}>;
export type AgentRole = z.infer<typeof AgentRoleSchema>;
export type AgentAbility = z.infer<typeof AgentAbilitySchema>;
export type Agent = z.infer<typeof AgentSchema>;
export declare const MapDataSchema: z.ZodObject<{
    uuid: z.ZodString;
    displayName: z.ZodString;
    narrativeDescription: z.ZodString;
    splash: z.ZodString;
    displayIcon: z.ZodString;
    listViewIcon: z.ZodString;
    coordinates: z.ZodString;
}, "strip", z.ZodTypeAny, {
    uuid: string;
    displayName: string;
    displayIcon: string;
    narrativeDescription: string;
    splash: string;
    listViewIcon: string;
    coordinates: string;
}, {
    uuid: string;
    displayName: string;
    displayIcon: string;
    narrativeDescription: string;
    splash: string;
    listViewIcon: string;
    coordinates: string;
}>;
export type MapData = z.infer<typeof MapDataSchema>;
export declare const WeaponSkinSchema: z.ZodObject<{
    uuid: z.ZodString;
    displayName: z.ZodString;
    displayIcon: z.ZodString;
}, "strip", z.ZodTypeAny, {
    uuid: string;
    displayName: string;
    displayIcon: string;
}, {
    uuid: string;
    displayName: string;
    displayIcon: string;
}>;
export declare const WeaponShopDataSchema: z.ZodObject<{
    cost: z.ZodNumber;
    category: z.ZodString;
    categoryText: z.ZodString;
}, "strip", z.ZodTypeAny, {
    category: string;
    cost: number;
    categoryText: string;
}, {
    category: string;
    cost: number;
    categoryText: string;
}>;
export declare const WeaponDataSchema: z.ZodObject<{
    uuid: z.ZodString;
    displayName: z.ZodString;
    category: z.ZodString;
    displayIcon: z.ZodString;
    shopData: z.ZodNullable<z.ZodObject<{
        cost: z.ZodNumber;
        category: z.ZodString;
        categoryText: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        category: string;
        cost: number;
        categoryText: string;
    }, {
        category: string;
        cost: number;
        categoryText: string;
    }>>;
    skins: z.ZodArray<z.ZodObject<{
        uuid: z.ZodString;
        displayName: z.ZodString;
        displayIcon: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        uuid: string;
        displayName: string;
        displayIcon: string;
    }, {
        uuid: string;
        displayName: string;
        displayIcon: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    category: string;
    uuid: string;
    displayName: string;
    displayIcon: string;
    shopData: {
        category: string;
        cost: number;
        categoryText: string;
    } | null;
    skins: {
        uuid: string;
        displayName: string;
        displayIcon: string;
    }[];
}, {
    category: string;
    uuid: string;
    displayName: string;
    displayIcon: string;
    shopData: {
        category: string;
        cost: number;
        categoryText: string;
    } | null;
    skins: {
        uuid: string;
        displayName: string;
        displayIcon: string;
    }[];
}>;
export type WeaponSkin = z.infer<typeof WeaponSkinSchema>;
export type WeaponShopData = z.infer<typeof WeaponShopDataSchema>;
export type WeaponData = z.infer<typeof WeaponDataSchema>;
export declare const LineupSchema: z.ZodObject<{
    id: z.ZodString;
    map: z.ZodString;
    agent: z.ZodString;
    ability: z.ZodString;
    side: z.ZodEnum<["Attack", "Defense"]>;
    title: z.ZodString;
    description: z.ZodString;
    difficulty: z.ZodEnum<["Easy", "Medium", "Hard"]>;
    source: z.ZodString;
}, "strip", z.ZodTypeAny, {
    map: string;
    description: string;
    id: string;
    agent: string;
    ability: string;
    side: "Attack" | "Defense";
    title: string;
    difficulty: "Easy" | "Medium" | "Hard";
    source: string;
}, {
    map: string;
    description: string;
    id: string;
    agent: string;
    ability: string;
    side: "Attack" | "Defense";
    title: string;
    difficulty: "Easy" | "Medium" | "Hard";
    source: string;
}>;
export type Lineup = z.infer<typeof LineupSchema>;
