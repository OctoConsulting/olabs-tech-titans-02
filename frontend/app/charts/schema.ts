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

export const filterSchema = (productNames: string[]) => {
  const productNamesAsString = productNames
    .map((p) => p.toLowerCase())
    .join(", ");
  return z
    .object({
      productNames: z
        .array(
          z.enum([
            productNames[0],
            ...productNames.slice(1, productNames.length),
          ]),
        )
        .optional()
        .describe(
          `Filter orders by the product name. Lowercase only. MUST only be a list of the following products: ${productNamesAsString}`,
        ),
      beforeDate: z
        .string()
        .transform((str) => new Date(str))
        .optional()
        .describe(
          "Filter orders placed before this date. Must be a valid date in the format 'YYYY-MM-DD'",
        ),
      afterDate: z
        .string()
        .transform((str) => new Date(str))
        .optional()
        .describe(
          "Filter orders placed after this date. Must be a valid date in the format 'YYYY-MM-DD'",
        ),
      minAmount: z
        .number()
        .optional()
        .describe("The minimum amount of the order to filter by."),
      maxAmount: z
        .number()
        .optional()
        .describe("The maximum amount of the order to filter by."),
      state: z
        .string()
        .optional()
        .describe(
          "Filter orders by the state the order was placed in. Example: 'California'",
        ),
      discount: z
        .boolean()
        .optional()
        .describe("Filter orders by whether or not it had a discount applied."),
      minDiscountPercentage: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .describe(
          "Filter orders which had at least this amount discounted (in percentage)",
        ),
      status: z
        .enum([
          "pending",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
          "returned",
        ])
        .optional()
        .describe("The current status of the order."),
    })
    .describe("Available filters to apply to orders.");
};

export interface Filter {
  name?: string;
  form?: string;
  retailPrice?: string;
  
}
