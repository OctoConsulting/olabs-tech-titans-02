import { PieChartProps, BarChartProps, LineChartProps } from "@/lib/mui";
import { Filter, Fruits } from "./schema";

export type ChartType = "bar" | "line" | "pie";

export type DataDisplayTypeAndDescription = {
  /**
   * A unique key to identify the data display type.
   */
  key: string;
  /**
   * The title of the data display type.
   */
  title: string;
  /**
   * The type of chart which this format can be displayed on.
   */
  chartType: ChartType;
  /**
   * The description of the data display type.
   */
  description: string;
  /**
   * The function to use to construct the props for the chart.
   */
  propsFn: (fruits: Fruits[]) => BarChartProps | PieChartProps | LineChartProps;
};

export const DISPLAY_FORMATS: Array<DataDisplayTypeAndDescription> = [
  {
    key: "bar_average_retail_price_by_fruit",
    title: "Average Retail Price by Fruit",
    chartType: "bar",
    description:
      "X-axis: Fruit (name)\n\nY-axis: Average Retail Price (averagePrice)\n\nThis chart would show the average retail price for each fruit.",
    propsFn: constructAverageRetailPriceByFruitBarChartProps,
  },
  {
    key: "bar_average_retail_price_by_form",
    title: "Average Retail Price by Form",
    chartType: "bar",
    description:
      "X-axis: Form (type)\n\nY-axis:Average Retail Price (averagePrice)\n\nThis chart would show the average retail price for each form.",
    propsFn: constructAverageRetailPriceByFormBarChartProps,
  },
  {
    key: "pie_fruit_form_distribution",
    title: "Fruit Form Distribution",
    chartType: "pie",
    description:
      "Display each Form  as a slice of the pie, with the size of each slice representing the number of Fruits in that form.\nThis provides a quick overview of the different froms.",
    propsFn: constructFruitFormDistributionPieChartProps,
  },
  {
    key: "fruit_pie",
    title: "Fruit Pie",
    chartType: "pie",
    description:
      "Show each unique Fruit as a slice, with the size representing the number of forms for that Fruit.\nThis helps identify the fruits that can be found in different forms.",
    propsFn: constructFruitPieChartProps,
  },
  {
    key: "retail_price_pie",
    title: "Retail Price Distrution",
    chartType: "pie",
    description:
      "Shows increaments of Retail Price as a slice, with the size representing the number of fruit for that price groups.\nThis helps identify the number fruits that can be found in different price ranges.",
    propsFn: constructRetailPriceFruitPieChartProps,
  },
];

export function filterOrders(state: {
  selectedFilters: Partial<Filter>;
  fruits: Fruits[];
}): { fruits: Fruits[] } {
  const {
    name,
    form,
    
  } = state.selectedFilters;

  // if (minDiscountPercentage !== undefined && discount === false) {
  //   throw new Error(
  //     "Can not filter by minDiscountPercentage when discount is false.",
  //   );
  // }

  let filteredOrders = state.fruits.filter((fruit) => {
    let isMatch = true;

    if (
      name &&
      !name.includes(fruit.name.toLowerCase())
    ) {
      isMatch = false;
    }
    if (
      form &&
      !form.includes(fruit.form.toLowerCase())
    ) {
      isMatch = false;
    }
    

    return isMatch;
  });
  console.log(filterOrders);
  return {
    fruits: filteredOrders,
  };
}


export function constructAverageRetailPriceByFruitBarChartProps(
  fruits: Fruits[],
): BarChartProps {
  //console.log(fruits);
  const salesByProduct = fruits.reduce(
    (acc, fruit) => {
      console.log(fruit)
      if (!acc[fruit.name]) {
        acc[fruit.name] = {price: 0, count:0};
      }
      acc[fruit.name].price += fruit.retailPrice;
      acc[fruit.name].count += 1;
      
      //console.log(acc);
      return acc;
    },
    {} as Record<string, {price: number, count: number}>,
  );

  const dataset = Object.entries(salesByProduct)
    .map(([name, {price, count}]) => ({ name, averagePrice: count > 0? price / (count): 0, }))
    .sort((a, b) => b.averagePrice - a.averagePrice);

  return {
    xAxis: [{ scaleType: "band", dataKey: "name" }],
    //yAxis: [{scaleType: "linear", max:10}],
    series: [
      {
        dataKey: "averagePrice",
        label: "Average Price",
      },
    ],
    dataset,
  };
}

export function constructAverageRetailPriceByFormBarChartProps(
  fruits: Fruits[],
): BarChartProps {
  //console.log(fruits);
  const salesByProduct = fruits.reduce(
    (acc, fruit) => {
      if (!acc[fruit.form]) {
        acc[fruit.form] = {price: 0, count:0};
      }
      acc[fruit.form].price += fruit.retailPrice;
      acc[fruit.form].count += 1;
      
      //console.log(acc);
      return acc;
    },
    {} as Record<string, {price: number, count: number}>,
  );

  const dataset = Object.entries(salesByProduct)
    .map(([form, {price, count}]) => ({ form, averagePrice: count > 0? price / (count): 0, }))
    .sort((a, b) => b.averagePrice - a.averagePrice);

  return {
    xAxis: [{ scaleType: "band", dataKey: "form" }],
    //yAxis: [{scaleType: "linear", max:10}],
    series: [
      {
        dataKey: "averagePrice",
        label: "Average Price",
      },
    ],
    dataset,
  };
}




/**
 *Order Amount Over Time
X-axis: orderedAt (Date)
Y-axis: amount (Number)
This chart would show the trend of order amounts over time.
 */
export function constructOrderAmountOverTimeLineChartProps(
  orders: Order[],
): LineChartProps {
  if (orders.length === 0) {
    return { series: [], xAxis: [] };
  }

  // Sort orders by date
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(a.orderedAt).getTime() - new Date(b.orderedAt).getTime(),
  );

  // Create dataset
  const dataset = sortedOrders.map((order) => ({
    date: new Date(order.orderedAt),
    amount: order.amount,
  }));

  return {
    series: [
      {
        dataKey: "amount",
        label: "Order Amount",
        type: "line",
      },
    ],
    xAxis: [
      {
        dataKey: "date",
        scaleType: "time",
      },
    ],
    yAxis: [
      {
        label: "Amount ($)",
      },
    ],
    dataset,
  };
}

/**
 * Discount Percentage Distribution
X-axis: discount (Number, 0-100)
Y-axis: Count of orders with that discount (Number)
This chart would show the distribution of discounts across orders.
Excludes orders which do not have a discount.
 */
export function constructDiscountDistributionLineChartProps(
  orders: Order[],
): LineChartProps {
  // Filter orders with discounts
  const ordersWithDiscount = orders.filter(
    (order) => order.discount !== undefined,
  );
  const discountCounts: Record<number, number> = {};

  // Count orders for each discount percentage
  ordersWithDiscount.forEach((order) => {
    const roundedDiscount = Math.round(order.discount!);
    discountCounts[roundedDiscount] =
      (discountCounts[roundedDiscount] || 0) + 1;
  });

  // Create dataset with only the discount percentages that appear in the data
  const dataset = Object.entries(discountCounts)
    .map(([discountPercentage, count]) => ({
      discountPercentage: parseInt(discountPercentage),
      count,
    }))
    .sort((a, b) => a.discountPercentage - b.discountPercentage);

  return {
    series: [
      {
        dataKey: "count",
        label: "Number of Orders",
        type: "line",
        curve: "linear",
      },
    ],
    xAxis: [
      {
        dataKey: "discountPercentage",
        label: "Discount Percentage",
        scaleType: "linear",
      },
    ],
    yAxis: [
      {
        label: "Number of Orders",
        scaleType: "linear",
      },
    ],
    dataset,
  };
}

/**
 * Average Order Amount by Month
X-axis: Month (derived from orderedAt)
Y-axis: Average amount (Number)
This chart would show how the average order amount changes month by month.
 */
export function constructAverageOrderAmountByMonthLineChartProps(
  orders: Order[],
): LineChartProps {
  if (orders.length === 0) {
    return { series: [], xAxis: [] };
  }

  // Preprocess orders and sort by date
  const processedOrders = orders
    .map((order) => ({
      ...order,
      orderedAt: new Date(order.orderedAt),
    }))
    .sort((a, b) => a.orderedAt.getTime() - b.orderedAt.getTime());

  // Group orders by month and calculate average amount
  const monthlyAverages: { [key: string]: { total: number; count: number } } =
    {};

  processedOrders.forEach((order) => {
    const monthKey = `${order.orderedAt.getFullYear()}-${String(order.orderedAt.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyAverages[monthKey]) {
      monthlyAverages[monthKey] = { total: 0, count: 0 };
    }
    monthlyAverages[monthKey].total += order.amount;
    monthlyAverages[monthKey].count += 1;
  });

  // Create dataset
  const dataset = Object.entries(monthlyAverages)
    .map(([month, { total, count }]) => ({
      month: new Date(`${month}-01`),
      averageAmount: total / count,
    }))
    .sort((a, b) => a.month.getTime() - b.month.getTime());

  return {
    series: [
      {
        dataKey: "averageAmount",
        label: "Average Order Amount",
        type: "line",
        curve: "linear",
      },
    ],
    xAxis: [
      {
        dataKey: "month",
        scaleType: "time",
      },
    ],
    width: 800,
    height: 400,
    dataset,
  };
}


export function constructFruitFormDistributionPieChartProps(
  fruits: Fruits[],
): PieChartProps {
  const statusCounts = fruits.reduce(
    (acc, fruit) => {
      acc[fruit.form] = (acc[fruit.form] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const data = Object.entries(statusCounts).map(([form, count], index) => ({
    id: index,
    value: count,
    label: form.charAt(0).toUpperCase() + form.slice(1), // Capitalize first letter
  }));

  return {
    series: [
      {
        data,
        highlightScope: { faded: "global", highlighted: "item" },
        faded: { innerRadius: 30, additionalRadius: -30 },
      },
    ],
    margin: { top: 10, bottom: 10, left: 10, right: 10 },
    legend: { hidden: false },
  };
}


export function constructFruitPieChartProps(
  fruits: Fruits[],
): PieChartProps {
  const productCounts = fruits.reduce(
    (acc, fruit) => {
      acc[fruit.name] = (acc[fruit.name] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const data = Object.entries(productCounts)
    .map(([name, count], index) => ({
      id: index,
      value: count,
      label: name,
    }))
    .sort((a, b) => b.value - a.value); // Sort by count in descending order

  return {
    series: [
      {
        data,
        highlightScope: { faded: "global", highlighted: "item" },
        faded: { innerRadius: 30, additionalRadius: -30 },
      },
    ],
    margin: { top: 10, bottom: 10, left: 10, right: 10 },
    legend: { hidden: false },
    slotProps: {
      legend: {
        direction: "column",
        position: { vertical: "middle", horizontal: "right" },
        padding: 0,
      },
    },
  };
}


export function constructRetailPriceFruitPieChartProps(
  fruits: Fruits[],
): PieChartProps {
  // Group fruits by retail price
  const priceGroups = fruits.reduce(
    (acc, fruit) => {
      const priceGroup = (Math.round(fruit.retailPrice)).toString();
      acc[priceGroup] = (acc[priceGroup] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Create data for the pie chart
  const data = Object.entries(priceGroups)
    .map(([priceGroup, count], index) => ({
      id: index,
      value: count,
      label: priceGroup,
    }))
    .sort((a, b) => b.value - a.value); // Sort by count in descending order

  return {
    series: [
      {
        data,
        highlightScope: { faded: "global", highlighted: "item" },
        faded: { innerRadius: 30, additionalRadius: -30 },
      },
    ],
    margin: { top: 10, bottom: 10, left: 10, right: 10 },
    legend: { hidden: false },
    slotProps: {
      legend: {
        direction: "column",
        position: { vertical: "middle", horizontal: "right" },
        padding: 0,
      },
    },
  };
}





