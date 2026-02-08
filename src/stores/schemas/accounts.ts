import { z } from 'zod';
import type { Address } from 'viem';

/**
 * Zod схема для валидации Ethereum адреса
 */
const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/) as z.ZodType<Address>;

/**
 * Схема валидации для данных аккаунта (account)
 * Поля могут быть опциональными, так как структура может варьироваться
 */
export const accountDataSchema = z.object({
    owners: z.array(addressSchema),
    threshold: z.number(),
    fallbackHandler: addressSchema.optional(),
    to: addressSchema.optional(),
    data: z.string().regex(/^0x[a-fA-F0-9]*$/).optional(),
    paymentToken: addressSchema.optional(),
    payment: z.union([z.number(), z.string()]).optional(),
    paymentReceiver: addressSchema.optional(),
}).passthrough(); // Разрешаем дополнительные поля

/**
 * Схема валидации для данных развертывания (deploy)
 */
export const deployDataSchema = z.object({
    saltNonce: z.union([z.string(), z.number()]).optional(),
    safeVersion: z.string().optional(),
    deploymentType: z.string().optional(),
}).passthrough(); // Разрешаем дополнительные поля

/**
 * Схема валидации для одного аккаунта
 */
export const accountSchema = z.object({
    account: accountDataSchema,
    deploy: deployDataSchema,
});

/**
 * Схема валидации для объекта аккаунтов
 * Ключи - адреса Ethereum (Address из viem)
 * Значения - объекты с account и deploy
 */
export const accountsSchema = z.record(
    addressSchema,
    accountSchema
);

/**
 * TypeScript типы, выведенные из схем
 */
export type AccountData = z.infer<typeof accountDataSchema>;
export type DeployData = z.infer<typeof deployDataSchema>;
export type Account = z.infer<typeof accountSchema>;
export type Accounts = z.infer<typeof accountsSchema>;
