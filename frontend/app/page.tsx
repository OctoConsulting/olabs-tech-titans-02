"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart,
  BarChartProps,
  LineChart,
  LineChartProps,
  PieChart,
  PieChartProps,
} from "@/lib/mui";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useActions } from "@/utils/client";
import { EndpointsContext } from "./agent";
import { Filter, Fruits } from "./schema";
import { LocalContext } from "./shared";
import { generateFruits } from "./generate-orders";
import {
  ChartType,
  DISPLAY_FORMATS,
  //constructProductSalesBarChartProps,
  //constructOrderStatusDistributionPieChartProps,
  //constructOrderAmountOverTimeLineChartProps,
  DataDisplayTypeAndDescription,
} from "./filters";
import { useSearchParams, useRouter } from "next/navigation";
import { filterOrders } from "./filters";
import { snakeCase } from "lodash";
import { DisplayTypesDialog } from "@/components/prebuilt/display-types-dialog";
import { FilterOptionsDialog } from "@/components/prebuilt/filter-options-dialog";
import { KeyboardEvent } from 'react';


const LOCAL_STORAGE_ORDERS_KEY = "fruits4";

const getFiltersFromUrl = (
  searchParams: URLSearchParams,
  fruits: Fruits[],
): Partial<Filter> => {
  const productNames = Array.from(
    new Set<string>(fruits.map(({ name }) => name)),
  );
  // const possibleFilters = filterSchema(productNames);
  // const filterKeys = Object.keys(possibleFilters.shape);
  const filters: Record<string, any> = {};

  // filterKeys.forEach((key) => {
  //   const value = searchParams.get(snakeCase(key));
  //   if (value) {
  //     try {
  //       filters[key as any] = decodeURIComponent(value);
  //     } catch (error) {
  //       console.error(`Error parsing URL parameter for ${key}:`, error);
  //     }
  //   }
  // });

  return filters;
};

const SparklesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="black"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
    />
  </svg>
);

interface SmartFilterProps {
  onSubmit: (value: string) => Promise<void>;
  loading: boolean;
}

function SmartFilter(props: SmartFilterProps) {
  const [input, setInput] = useState("");

  
  const handleSubmit = async (inputValue: string) => {
    await props.onSubmit(inputValue);
    setInput("");
  };
  
  const handleKeyDown = (event: KeyboardEvent) => event.key === 'Enter' && handleSubmit(input);
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => handleSubmit(input);
  

  const ButtonContent = () => {
    if (props.loading) {
      return (
        <span className="flex items-center">
          <span className="mr-1">Loading</span>
          <span className="loading-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </span>
      );
    }
    return (
      <span className="flex flex-row gap-1 items-center">
        Submit <SparklesIcon />
      </span>
    );
  };
//TODO
  return (
    <form onSubmit={handleFormSubmit} className="flex flex-row gap-1">
      <textarea
        disabled={props.loading}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Magic filter"
        className="w-full h-32 p-4 text-sm resize-none border border-gray-300 rounded-lg"
        rows={4}
        onKeyDown={handleKeyDown} // Add key down handler
      />
      <Button disabled={props.loading} type="submit" variant="outline">
        <ButtonContent />
      </Button>
    </form>
  );
}

function ChartContent() {
  const actions = useActions<typeof EndpointsContext>();
  const searchParams = useSearchParams();
  const { push } = useRouter();

  const [loading, setLoading] = useState(false);
  const [elements, setElements] = useState<JSX.Element[]>([]);
  const [fruits, setFruits] = useState<Fruits[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Partial<Filter>>();
  const [selectedChartType, setSelectedChartType] = useState<ChartType>("bar");
  const [currentFilter, setCurrentFilter] = useState("");
  const [currentDisplayFormat, setCurrentDisplayFormat] =
    useState<DataDisplayTypeAndDescription>();
  const [filteredOrders, setFilteredOrders] = useState<Fruits[]>([]);


  // Load the orders from local storage or generate them if they don't exist.
  useEffect(() => {
    if (fruits.length > 0) {
      return;
    }
    const localStorageFruits = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    let ordersV: Fruits[] = [];
    if (!localStorageFruits || JSON.parse(localStorageFruits).length === 0) {
      const fakeFruits = generateFruits();
      ordersV = fakeFruits;
      setFruits(fakeFruits);
      localStorage.setItem(
        LOCAL_STORAGE_ORDERS_KEY,
        JSON.stringify(fakeFruits),
      );
    } else {
      ordersV = JSON.parse(localStorageFruits);
      setFruits(ordersV);
    }

    // Set the chart on fresh load. Use either the chartType from the URL or the default.
    // Also extract any filters to apply to the chart.
    const selectedChart = searchParams.get("chartType") || selectedChartType;
    const filters = getFiltersFromUrl(searchParams, ordersV);
    const { fruits: filteredOrders } = filterOrders({
      fruits: ordersV,
      selectedFilters: filters,
  });
  setFilteredOrders(filteredOrders ?? ordersV); 
    setElements([
      <div className="mt-4 mb-6 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {"Use the Magic Filter to Generate a Chart"}
        </h2>
      </div>
    ]);
    /*switch (selectedChart) {
      case "bar":
        const displayFormatKeyBar = "bar_order_amount_by_product";
        const displayFormatBar = DISPLAY_FORMATS.find(
          (d) => d.key === displayFormatKeyBar,
        );
        if (!displayFormatBar) {
          throw new Error("Something went wrong.");
        }
        //console.log(filterOrders);
        return setElements([
         
          <div className="mt-4 mb-6 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {displayFormatBar.title}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm leading-relaxed">
              {displayFormatBar.description}
            </p>
          </div>,
          <div className="flex flex-col w-full gap-4">
            <div className="w-full h-[500px] overflow-auto">
            <BarChart
              {...(displayFormatBar.propsFn(
                filteredOrders ?? ordersV,
              ) as BarChartProps)}
              key="start-bar"
            />
            </div>
          </div>
        ]);
      case "pie":
        const displayFormatKeyPie = "pie_order_status_distribution";
        const displayFormatPie = DISPLAY_FORMATS.find(
          (d) => d.key === displayFormatKeyPie,
        );
        if (!displayFormatPie) {
          throw new Error("Something went wrong.");
        }
        return setElements([
          <div className="mt-4 mb-6 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {displayFormatPie.title}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm leading-relaxed">
              {displayFormatPie.description}
            </p>
          </div>,
          <PieChart
            {...(displayFormatPie.propsFn(
              filteredOrders ?? ordersV,
            ) as PieChartProps)}
            key="start-pie"
          />,
        ]);
      case "line":
        const displayFormatKeyLine = "line_order_amount_over_time";
        const displayFormatLine = DISPLAY_FORMATS.find(
          (d) => d.key === displayFormatKeyLine,
        );
        if (!displayFormatLine) {
          throw new Error("Something went wrong.");
        }
        return setElements([
          <div className="mt-4 mb-6 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {displayFormatLine.title}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm leading-relaxed">
              {displayFormatLine.description}
            </p>
          </div>,
          <LineChart
            {...(displayFormatLine.propsFn(
              filteredOrders ?? ordersV,
            ) as LineChartProps)}
            key="start-line"
          />,
        ]);
    }*/
  }, [fruits.length, searchParams, selectedChartType]);

  // Update the URL with the selected filters and chart type.
  useEffect(() => {
    if (!selectedFilters) return;

    const params = Object.fromEntries(searchParams.entries());
    let paramsToAdd: { [key: string]: string } = {};

    Object.entries({
      ...selectedFilters,
      chartType: searchParams.get("chartType") ?? selectedChartType,
    }).forEach(([key, value]) => {
      const searchValue = params[key];
      let encodedValue: string | undefined = undefined;
      if (Array.isArray(value)) {
        encodedValue = encodeURIComponent(JSON.stringify(value));
      } else if (typeof value === "object") {
        if (Object.keys(value).length > 0) {
          encodedValue = encodeURIComponent(value);
        }
      } else if (["string", "number", "boolean"].includes(typeof value)) {
        encodedValue = encodeURIComponent(value as string | number | boolean);
      } else {
        throw new Error(`Invalid value type ${JSON.stringify(value)}`);
      }
      if (
        (encodedValue !== undefined && !searchValue) ||
        searchValue !== encodedValue
      ) {
        paramsToAdd[key] = encodedValue as string;
      }
    });

    if (Object.keys(paramsToAdd).length === 0) return;
    push(`/charts?${new URLSearchParams({ ...paramsToAdd })}`);
  }, [selectedFilters, searchParams, selectedChartType, push]);


  const handleSubmitSmartFilter = async (input: string) => {
    setLoading(true);
    setCurrentFilter(input);
    const element = await actions.filterGraph({
      input,
      fruits,
      display_formats: DISPLAY_FORMATS.map((d) => ({
        title: d.title,
        description: d.description,
        chartType: d.chartType,
        key: d.key,
      })),
    });

    const newElements = [
      <div key={`${input}`} className="w-full h-full flex flex-col p-6 mx-auto">
        {element.ui}
      </div>,
    ];

    // consume the value stream so we can be sure the graph has finished.
    (async () => {
      const lastEvent = await element.lastEvent;
      if (typeof lastEvent === "string") {
        throw new Error("lastEvent is a string. Something has gone wrong.");
      } else if (Array.isArray(lastEvent)) {
        throw new Error("lastEvent is an array. Something has gone wrong.");
      }

      const { selected_filters, chart_type, display_format } = lastEvent;
      if (selected_filters) {
        setSelectedFilters(
          Object.fromEntries(
            Object.entries(selected_filters).filter(([key, value]) => {
              return (
                value !== undefined && value !== null && key in selected_filters
              );
            }),
          ),
        );
      }
      const displayFormat = DISPLAY_FORMATS.find(
        (d) => d.key === display_format,
      );
      if (displayFormat) {
        setCurrentDisplayFormat(displayFormat);
      }
      setSelectedChartType(chart_type);
      setLoading(false);
    })();

    setElements(newElements);
  };

  return (
    <div className="w-full p-12">
      <LocalContext.Provider value={handleSubmitSmartFilter}>
        <div className="flex flex-row w-full gap-4">
          {/* Left column for filter options */}
          <div className="flex flex-col gap-4 min-w-[300px]">
            <div className="flex flex-row gap-1">
              <FilterOptionsDialog />
              <DisplayTypesDialog displayTypes={DISPLAY_FORMATS} />
            </div>
            <SmartFilter loading={loading} onSubmit={handleSubmitSmartFilter} />
          </div>
          
          {/* Main content */}
          <div className="flex flex-col flex-1 gap-4">
            <div className="flex items-center justify-center">
              <h2 className="text-2xl font-bold">{currentFilter}</h2>
            </div>
            <div className="flex flex-col w-full gap-4">
              {/* Chart container */}
              <div className="w-full h-[700px] overflow-auto">
                {elements}
              </div>
              
              {/* Table container 
              <div className="w-full overflow-auto">
                <OrderTable orders={filteredOrders} />
              </div>
              */}
            </div>
          </div>
        </div>
      </LocalContext.Provider>
    </div>
  );  
  
  
}

export default function DynamicCharts() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChartContent />
    </Suspense>
  );
}