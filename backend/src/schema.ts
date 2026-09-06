import { z } from "zod";
import { uniquePositions } from "../../shared/graph";
import type { MapDocument } from "../../shared/types";

const DirectionSchema = z.enum(["North", "South", "East", "West"]);

const NodeSchema = z
  .object({
    x: z.number().int(),
    y: z.number().int(),
    code: z.number().int(),
    directions: z.array(DirectionSchema).optional(),
    charger: z.object({ direction: DirectionSchema }).optional(),
    chute: z.object({ direction: DirectionSchema }).optional(),
    name: z.string().min(1).optional(),
  })
  .strict();

export const MapDocumentSchema = z
  .object({
    map: z
      .object({
        maxNeighborDistance: z.number().positive(),
        nodes: z.array(NodeSchema),
      })
      .strict(),
  })
  .strict()
  .superRefine((doc, ctx) => {
    if (!uniquePositions(doc.map.nodes)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each node must have a unique (x, y) position",
        path: ["map", "nodes"],
      });
    }
  });

export function parseMapDocument(input: unknown): MapDocument {
  return MapDocumentSchema.parse(input);
}
