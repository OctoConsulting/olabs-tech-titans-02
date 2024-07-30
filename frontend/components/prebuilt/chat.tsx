"use client";

import * as React from 'react';
import { Input } from "../ui/input";
import { Button } from "../ui/button";
//import { EndpointsContext as EndpointsContextCharts} from "@/app/@charts/agent";
import { EndpointsContext } from "@/app/agent";
import { useActions } from "@/utils/client";
import { LocalContext } from "@/app/shared";
import { RemoteRunnable } from "@langchain/core/runnables/remote";
import { Github, GithubLoading } from "./github";
import { Invoice, InvoiceLoading } from "./invoice";
import { CurrentWeather, CurrentWeatherLoading } from "./weather";
import { createStreamableUI, createStreamableValue } from "ai/rsc";
import { StreamEvent } from "@langchain/core/tracers/log_stream";
import { AIMessage } from "@/ai/message";
import { HumanMessageText } from "./message";
import ChartContent from "./charts";
import { Filter, Order, filterSchema } from "@/app/charts/schema";
import { filterOrders } from "@/app/charts/filters";
import { snakeCase } from "lodash";
import {Tab, Tabs, Box} from "@mui/material";
export interface ChatProps {}
import {
  BarChart,
  BarChartProps,
  LineChart,
  LineChartProps,
  PieChart,
  PieChartProps,
} from "@/lib/mui";

const LOCAL_STORAGE_ORDERS_KEY = "orders";
import { generateOrders } from "@/app/charts/generate-orders";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChartType,
  DISPLAY_FORMATS,
  constructProductSalesBarChartProps,
  constructOrderStatusDistributionPieChartProps,
  constructOrderAmountOverTimeLineChartProps,
  DataDisplayTypeAndDescription,
} from "@/app/charts/filters";
import OrderTable from "@/app/charts/data-table";

/*function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(",")[1]); // Remove the data URL prefix
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}

function FileUploadMessage({ file }: { file: File }) {
  return (
    <div className="flex w-full max-w-fit ml-auto">
      <p>File uploaded: {file.name}</p>
    </div>
  );
}*/
const getFiltersFromUrl = (
  searchParams: URLSearchParams,
  orders: Order[],
): Partial<Filter> => {
  const productNames = Array.from(
    new Set<string>(orders.map(({ productName }) => productName)),
  );
  const possibleFilters = filterSchema(productNames);
  const filterKeys = Object.keys(possibleFilters.shape);
  const filters: Record<string, any> = {};

  filterKeys.forEach((key) => {
    const value = searchParams.get(snakeCase(key));
    if (value) {
      try {
        filters[key as any] = decodeURIComponent(value);
      } catch (error) {
        console.error(`Error parsing URL parameter for ${key}:`, error);
      }
    }
  });

  return filters;
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function Chat() {
  const actions = useActions<typeof EndpointsContext>();
  const [tableElements, setTableElements] = useState<JSX.Element[]>([]);
  const [chatElements, setChatElements] = useState<JSX.Element[]>([]);
  const [toolElements, setToolElements] = useState<JSX.Element[]>([]);
  const [history, setHistory] = useState<[role: string, content: string][]>([]);
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File>();
  const [orders, setOrders] = useState<Order[]>([]);
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Partial<Filter>>();
  const [selectedChartType, setSelectedChartType] = useState<ChartType>("bar");
  const [currentFilter, setCurrentFilter] = useState("");
  const [currentDisplayFormat, setCurrentDisplayFormat] =
    useState<DataDisplayTypeAndDescription>();
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [elements, setElements] = useState<JSX.Element[]>([]);
  // Load the orders from local storage or generate them if they don't exist.
  useEffect(() => {
    if (orders.length > 0) {
      return;
    }
    const localStorageOrders = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    let ordersV: Order[] = [];
    if (!localStorageOrders || JSON.parse(localStorageOrders).length === 0) {
      const fakeOrders = generateOrders();
      ordersV = fakeOrders;
      setOrders(fakeOrders);
      localStorage.setItem(
        LOCAL_STORAGE_ORDERS_KEY,
        JSON.stringify(fakeOrders),
      );
    } else {
      ordersV = JSON.parse(localStorageOrders);
      setOrders(ordersV);
    }

    // Set the chart on fresh load. Use either the chartType from the URL or the default.
    // Also extract any filters to apply to the chart.
    const selectedChart = searchParams.get("chartType") || selectedChartType;
  const filters = getFiltersFromUrl(searchParams, ordersV);
  const { orders: filteredOrders } = filterOrders({
    orders: ordersV,
    selectedFilters: filters,
  });
  setFilteredOrders(filteredOrders ?? ordersV); 
    setTableElements([
      <div className="w-full overflow-auto">
              <OrderTable orders={filteredOrders} />
    </div>
    ]);
    switch (selectedChart) {
      case "bar":
        const displayFormatKeyBar = "bar_order_amount_by_product";
        const displayFormatBar = DISPLAY_FORMATS.find(
          (d) => d.key === displayFormatKeyBar,
        );
        if (!displayFormatBar) {
          throw new Error("Something went wrong.");
        }
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
    }
  }, [orders.length, searchParams, selectedChartType]);


  // async function onSubmitOld(input: string) {
  //   const newChatElements = [...chatElements];
  //   //const newToolElements = [...toolElements];
  //   /*let base64File: string | undefined = undefined;
  //   let fileExtension = selectedFile?.type.split("/")[1];
  //   if (selectedFile) {
  //     base64File = await convertFileToBase64(selectedFile);
  //   }*/
  //   // 
  //   await actions.agent({
  //     input,
  //     orders,
  //     chat_history: history,
  //     display_formats: DISPLAY_FORMATS.map((d) => ({
  //       title: d.title,
  //       description: d.description,
  //       chartType: d.chartType,
  //       key: d.key,
  //     })),
  //   });
  //   newChatElements.push(
  //     <div className="flex flex-col w-full gap-1 mt-auto" key={history.length}>
  //       {/*{selectedFile && <FileUploadMessage file={selectedFile} />}*/}
  //       <HumanMessageText content={input} />
  //     </div>,
  //   );

  
  
  //   // consume the value stream to obtain the final string value
  //   // after which we can append to our chat history state
  //   (async () => {
  //     let lastEvent = await element.lastEvent;
  //     if (Array.isArray(lastEvent)) {
  //       if (lastEvent[0].invoke_model && lastEvent[0].invoke_model.result) {
  //         setHistory((prev) => [
  //           ...prev,
  //           ["human", input],
  //           ["ai", lastEvent[0].invoke_model.result],
            
  //         ]);
          
  //       } else if (lastEvent[1].invoke_tools) {
  //         setHistory((prev) => [
  //           ...prev,
  //           ["human", input],
  //           [
  //             "ai",
  //             `Tool result: ${JSON.stringify(lastEvent[1].invoke_tools.tool_result, null)}`,
  //           ],
            
  //         ]);
  //         setToolElements([
  //             <div className="flex flex-col gap-1 w-full max-w-fit mr-auto">
  //               {element.ui}
  //             </div>,
  //       ]);
  //       } else {
  //         setHistory((prev) => [...prev, ["human", input]]);
  //         newChatElements.push(
  //           <div className="flex flex-col w-full gap-1 mt-auto" key={history.length}>
  //             {/*{selectedFile && <FileUploadMessage file={selectedFile} />}*/}
  //             <HumanMessageText content={input} />
  //           </div>,
  //         );
  //       }
  //     } else if (lastEvent.invoke_model && lastEvent.invoke_model.result) {
  //       setHistory((prev) => [
  //         ...prev,
  //         ["human", input],
  //         ["ai", lastEvent.invoke_model.result],
  //       ]);
  //       newChatElements.push(
    
  //           <div className="flex flex-col gap-1 w-full max-w-fit mr-auto">
  //             {element.ui}
  //           </div>,
  //       );
  //     }
  //   })();

  //   setChatElements(newChatElements);
  //   //newToolElements;
  //   setInput("");
  //   setSelectedFile(undefined);
  // }
  const onSubmit = async (input: string) => {
    setLoading(true);
    setCurrentFilter(input);
    const element = await actions.agent({
      input,
      orders,
      chat_history: history,
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
    const newChatElements = [...chatElements];
    newChatElements.push(
           <div className="flex flex-col w-full gap-1 mt-auto" key={history.length}>
            {/*{selectedFile && <FileUploadMessage file={selectedFile} />}*/}
             <HumanMessageText content={input} />
           </div>,
         );

    // consume the value stream so we can be sure the graph has finished.
    (async () => {
      const lastEvent = await element.lastEvent;
      if (typeof lastEvent === "string") {
        throw new Error("lastEvent is a string. Something has gone wrong.");
      } else if (Array.isArray(lastEvent)) {
        throw new Error("lastEvent is an array. Something has gone wrong.");
      }
      setChatElements(newChatElements);

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
    setInput("")
  };
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
     
   
  
  return (
    <div className="flex flex-col">
    <div className="flex flex-row p-4 md:p-12 gap-12 justify-between px-5">
      <div className="w-[25vw] overflow-y-scroll h-[60vh] flex flex-col gap-4 mx-auto border-[1px] border-gray-200 rounded-lg p-3 shadow-sm bg-gray-50/25">
        <LocalContext.Provider value={onSubmit}>
          <div className="flex flex-col w-full gap-1 mt-auto"> 
            {chatElements}
          </div>
        </LocalContext.Provider>
        <form
          onSubmit={async (e) => {
            e.stopPropagation();
            e.preventDefault();
            await onSubmit(input);
          }}
          className="w-full flex flex-row gap-2"
        >
          <Input
            placeholder="Magic Filter"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          {/* <div className="w-[100px]">
            <Input
              placeholder="Upload"
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />
          </div> */}
          <Button type="submit" style={{ padding: '5px 10px', fontSize: '12px' }}>Submit</Button>
        </form>
        </div>
        
        <div className="w-[60vw]  h-[60vh]">
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="Chart" {...a11yProps(0)} />
          <Tab label="Table" {...a11yProps(1)} />
          
        </Tabs>
        <CustomTabPanel value={value} index={0}>
        <LocalContext.Provider value={onSubmit}>
          {elements}
        </LocalContext.Provider>
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
          {tableElements}
        </CustomTabPanel>
        
        </Box>
       
        </div>
        
    </div>
    
    </div>
  );
}
