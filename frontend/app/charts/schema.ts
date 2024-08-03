import { z } from "zod";

export interface Fruits{
  /**
   * A UUID for the order.
   */
  name: string;
  /**
   * The name of the product purchased.
   */
  form: string;
  /**
   * The amount of the order.
   */
  retailPrice: number;
  
}

export const filterSchema = (names: string[]) => {
  return z
    .object({
      names: z
        .array(
          z.enum([
            names[0],
            ...names.slice(1, names.length),
          ]),
        )
        .optional()
        .describe(
          `Filter orders by the first name. Lowercase only. MUST only be a list of the following products: ${productNamesAsString}`,
        ),
      retailPrice: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .describe(
          "Retail Price of the Fruit",
        ),
      form: z
        .enum([
          "canned",
          "dried",
          "fresh",
          "frozen",
          "juice",
        ])
        .optional()
        .describe("The form of the fuirt."),
    })
    .describe("Available filters to apply to orders.");
};

export interface Filter {
  name?: string;
  form?: string;
  retailPrice?: string;
  
}
