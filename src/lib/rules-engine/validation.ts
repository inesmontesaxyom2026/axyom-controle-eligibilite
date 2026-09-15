import { z } from "zod";

const operateurSchema = z.enum([
  "egal",
  "different",
  "superieur",
  "superieur_egal",
  "inferieur",
  "inferieur_egal",
  "contient",
  "ne_contient_pas",
  "present",
  "absent",
]);

const conditionSimpleSchema = z.object({
  champ: z.string().min(1),
  operateur: operateurSchema,
  valeur: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

// z.lazy nécessaire : la structure est récursive (ET/OU/NON imbriqués).
const conditionNodeSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    conditionSimpleSchema,
    z.object({ et: z.array(conditionNodeSchema).min(1) }),
    z.object({ ou: z.array(conditionNodeSchema).min(1) }),
    z.object({ non: conditionNodeSchema }),
  ]),
);

export const typeAnomalieRegleSchema = z.enum([
  "LEGAL",
  "CONTRACTUEL",
  "PROCEDURE",
  "FORMATAGE",
  "INFO_MANQUANTE_ESSENTIELLE",
  "INFO_MANQUANTE",
  "INFO_INCOHERENTE",
  "PIECE_MANQUANTE",
]);

export const regleConditionsSchema = z.object({
  si: conditionNodeSchema,
  alors: z.object({
    typeAnomalie: typeAnomalieRegleSchema,
    message: z.string().min(1),
  }),
});

export type RegleConditionsInput = z.infer<typeof regleConditionsSchema>;
