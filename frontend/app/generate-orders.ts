import { faker } from "@faker-js/faker";
import { Fruits } from "./schema";

export function generateFruits(): Fruits[] {
  const fruits: Fruits[] = [];

  const products = Array.from({ length: 14 }).map((_) => ({
    name: faker.helpers.arrayElement([
      "apples",
      "blueberries",
      "cherries",
      "grapes",
      "mangoes",
      "blackberries",
      "grapefruit",
      "plum",
      "raspberries",
      "oranges",
      "clementines",
      "lemons",
      "watermelon",
      "peaches"
    ]),
    form: faker.helpers.arrayElement([
      "canned",
      "dried",
      "fresh",
      "frozen",
      "juice",

    ]),
    retailPrice: parseFloat(faker.commerce.price({min:1, max: 20}))
  }));

  for (let i = 0; i < 25; i++) {
    const product = faker.helpers.arrayElement(products);
    // 1 in 5 orders (ish) should have a discount
    // const shouldApplyDiscount = faker.helpers.arrayElement([
    //   ...Array.from({ length: 4 }).map((_) => "no"),
    //   "yes",
    // ]);
    const fruit: Fruits = {
      ...product
    };
    // const order: Order = {
    //   ...product,
    //   id: faker.string.uuid(),
    //   discount:
    //     shouldApplyDiscount === "yes"
    //       ? faker.number.int({ min: 10, max: 75 })
    //       : undefined,
    //   address: {
    //     street: faker.location.streetAddress(),
    //     city: faker.location.city(),
    //     state: faker.location.state(),
    //     zip: faker.location.zipCode(),
    //   },
    //   status: faker.helpers.arrayElement([
    //     "pending",
    //     "processing",
    //     "shipped",
    //     "delivered",
    //     "cancelled",
    //     "returned",
    //   ]),
    //   orderedAt: faker.date.past(),
    // };

    // orders.push(order);
    fruits.push(fruit);
    
  }

  return fruits;
}
