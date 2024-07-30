import { RemoteRunnable } from "@langchain/core/runnables/remote";
import { exposeEndpoints, streamRunnableUI } from "@/utils/server";
import "server-only";
import { StreamEvent } from "@langchain/core/tracers/log_stream";
import { EventHandlerFields } from "@/utils/server";
import { Github, GithubLoading } from "@/components/prebuilt/github";
import { InvoiceLoading, Invoice } from "@/components/prebuilt/invoice";
import {
  CurrentWeatherLoading,
  CurrentWeather,
} from "@/components/prebuilt/weather";
import { createStreamableUI, createStreamableValue } from "ai/rsc";
import { AIMessage } from "@/ai/message";
import { Filter, Order } from "./charts/schema";
import {
  ChartType,
  DISPLAY_FORMATS,
  DataDisplayTypeAndDescription,
} from "./charts/filters";
import {
  LoadingBarChart,
  LoadingPieChart,
  LoadingLineChart,
} from "@/components/prebuilt/loading-charts";
import { RunnableLambda } from "@langchain/core/runnables";
import { LAMBDA_STREAM_WRAPPER_NAME } from "@/utils/server";
import { FilterButton } from "@/components/prebuilt/filter";
import { format } from "date-fns";
import {
  BarChart,
  BarChartProps,
  LineChart,
  LineChartProps,
  PieChart,
  PieChartProps,
} from "@/lib/mui";
import OrderTable from "./charts/data-table";
type CreateStreamableUIReturnType = ReturnType<typeof createStreamableUI>;

const API_URL = "http://localhost:8000/charts";

type ToolComponent = {
  loading: (props?: any) => JSX.Element;
  final: (props?: any) => JSX.Element;
};

type ToolComponentMap = {
  [tool: string]: ToolComponent;
};

type FilterGraphInput = {
  input: string;
  orders: Order[];
  display_formats: Omit<DataDisplayTypeAndDescription, "propsFn">[];
  chat_history: [role: string, content: string][];
};

type FilterGraphRunnableInput = Omit<FilterGraphInput, "input"> & {
  input: { content: string };
};

/*const TOOL_COMPONENT_MAP: ToolComponentMap = {
  "github-repo": {
    loading: (props?: any) => <GithubLoading {...props} />,
    final: (props?: any) => <Github {...props} />,
  },
  "invoice-parser": {
    loading: (props?: any) => <InvoiceLoading {...props} />,
    final: (props?: any) => <Invoice {...props} />,
  },
  "weather-data": {
    loading: (props?: any) => <CurrentWeatherLoading {...props} />,
    final: (props?: any) => <CurrentWeather {...props} />,
  },
};*/

function handleSelectedFilters(
  selectedFilters: Partial<Filter>,
  ui: CreateStreamableUIReturnType,
) {
  const filtersWithValues: Partial<Filter> = Object.fromEntries(
    Object.entries(selectedFilters).filter(([key, value]) => {
      return value !== undefined && value !== null && key in selectedFilters;
    }),
  );
  const filterButtons = Object.entries(filtersWithValues).flatMap(
    ([key, value]) => {
      if (["string", "number"].includes(typeof value)) {
        return (
          <FilterButton
            key={key}
            filterKey={key}
            filterValue={value as string | number}
          />
        );
      } else if (Array.isArray(value)) {
        const values = value.join(", ");
        return <FilterButton key={key} filterKey={key} filterValue={values} />;
      } else if (typeof value === "object") {
        const formattedDate = format(new Date(value), "yyyy-MM-dd");
        return (
          <FilterButton key={key} filterKey={key} filterValue={formattedDate} />
        );
      } else if (typeof value === "boolean") {
        return (
          <FilterButton
            key={key}
            filterKey={key}
            filterValue={value ? "true" : "false"}
          />
        );
      }
      return [];
    },
  );
  const buttonsDiv = (
    <div className="flex flex-wrap gap-2 px-6">{filterButtons}</div>
  );
  ui.update(buttonsDiv);
}

function handleDisplayFormat(
  displayFormat: string,
  selectedChart: ChartType,
  ui: CreateStreamableUIReturnType,
) {
  const displayDataObj = DISPLAY_FORMATS.find((d) => d.key === displayFormat);
  console.log(displayFormat)
  if (!displayDataObj) {
    throw new Error(
      `Display format ${displayFormat} not found in DISPLAY_FORMATS`,
    );
  }
  let loadingChart;
  if (selectedChart === "bar") {
    loadingChart = <LoadingBarChart />;
  } else if (selectedChart === "pie") {
    loadingChart = <LoadingPieChart />;
  } else if (selectedChart === "line") {
    loadingChart = <LoadingLineChart />;
  } else {
    throw new Error("Invalid chart type");
  }
  ui.update(
    <>
      <div className="mt-4 mb-6 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {displayDataObj.title}
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-sm leading-relaxed">
          {displayDataObj.description}
        </p>
      </div>
      {loadingChart}
    </>,
  );
}

function handleChartType(
  chartType: ChartType,
  ui: CreateStreamableUIReturnType,
) {
  if (chartType === "bar") {
    ui.append(<LoadingBarChart />);
  } else if (chartType === "pie") {
    ui.append(<LoadingPieChart />);
  } else if (chartType === "line") {
    ui.append(<LoadingLineChart />);
  }
  else if (chartType == 'table'){
    ui.append("No Chart")
  }
}

function handleConstructingCharts(
  input: {
    orders: Order[];
    chartType: ChartType;
    displayFormat: string;
  },
  ui: CreateStreamableUIReturnType,
) {
  const chartType = input.chartType
  if (chartType != 'table'){
    const displayDataObj = DISPLAY_FORMATS.find(
      (d) => d.key === input.displayFormat,
    );
    if (!displayDataObj) {
      throw new Error(
        `Display format ${input.displayFormat} not found in DISPLAY_FORMATS`,
      );
    }
    let barChart;
    const props = displayDataObj.propsFn(input.orders);
    if (input.chartType === "bar") {
      barChart = <BarChart {...(props as BarChartProps)} />;
    } else if (input.chartType === "pie") {
      barChart = <PieChart {...(props as PieChartProps)} />;
    } else if (input.chartType === "line") {
      barChart = <LineChart {...(props as LineChartProps)} />;
    } else
      barChart = "Final No Chart"; 
    ui.update(
      <>
        <div className="mt-4 mb-6 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {displayDataObj.title}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm leading-relaxed">
            {displayDataObj.description}
          </p>
        </div>,
        <div className="flex flex-col w-full gap-4">
          <div className="w-full h-[500px] overflow-auto">
            {barChart}
          </div>
          {/*<div className="w-full overflow-auto">
            <OrderTable orders={input.orders} />
          </div>*/}
        </div>,
      </>,
    );
  }
  /*else{
    ui.update(
      <>
        <div className="flex flex-col w-full gap-4">
          <div className="w-full overflow-auto">
            <OrderTable orders={input.orders} />
          </div>
        </div>,
      </>,
    );
  }*/
}

async function agent(inputs: FilterGraphInput) {
  "use server";
  const remoteRunnable = new RemoteRunnable({
    url: API_URL,
  });

  const streamEventsRunnable = RunnableLambda.from(async function* (
    input: FilterGraphRunnableInput,
  ) {
    const streamResponse = remoteRunnable.streamEvents(input,{version:'v2'
    });
    for await (const event of streamResponse) {
      //console.log(event)
      yield event;
    }
  }).withConfig({ runName: LAMBDA_STREAM_WRAPPER_NAME });

  let displayFormat = "";
  let chartType: ChartType;
  const eventHandlerOne = (
    streamEvent: StreamEvent,
    fields: EventHandlerFields,
  ) => {
    const langGraphEvent: StreamEvent = streamEvent.data.chunk;
    if (!langGraphEvent) {
      return;
    }
    const { event, name, data } = langGraphEvent;
    if (event !== "on_chain_end") {
      return;
    }
    console.log(name)
    if (name === "generate_filters") {
      const { selected_filters }: { selected_filters: Partial<Filter> } =
        data.output;
      return handleSelectedFilters(selected_filters, fields.ui);
    } else if (name === "generate_chart_type") {
      chartType = data.output.chart_type;
      return handleChartType(chartType, fields.ui);
    } else if (name === "generate_data_display_format") {
      displayFormat = data.output.display_format;
      return handleDisplayFormat(displayFormat, chartType, fields.ui);
    } else if (name === "filter_data") {
      const { orders } = data.output;
      if ((chartType != 'table' && !displayFormat) || !chartType) {
        throw new Error(
          "Chart type and display format must be set before filtering data",
        );
      }
      return handleConstructingCharts(
        {
          orders,
          chartType,
          displayFormat,
        },
        fields.ui,
      );
    }
  };
  const processedInputs = {
    ...inputs,
    input: {
      content: inputs.input,
    },
  };

  return streamRunnableUI(streamEventsRunnable, processedInputs, {
    eventHandlers: [eventHandlerOne],
  });
}

  //let selectedToolComponent: ToolComponent | null = null;
  //let selectedToolUI: ReturnType<typeof createStreamableUI> | null = null;

  /**
   * Handles the 'invoke_model' event by checking for tool calls in the output.
   * If a tool call is found and no tool component is selected yet, it sets the
   * selected tool component based on the tool type and appends its loading state to the UI.
   *
   * @param output - The output object from the 'invoke_model' event
   */
  /*const handleInvokeModelEvent = (
    event: StreamEvent,
    fields: EventHandlerFields,
  ) => {
    const [type] = event.event.split("_").slice(2);
    if (
      type !== "end" ||
      !event.data.output ||
      typeof event.data.output !== "object" ||
      event.name !== "invoke_model"
    ) {
      return;
    }

    if (
      "tool_calls" in event.data.output &&
      event.data.output.tool_calls.length > 0
    ) {
      const toolCall = event.data.output.tool_calls[0];
      if (!selectedToolComponent && !selectedToolUI) {
        selectedToolComponent = TOOL_COMPONENT_MAP[toolCall.type];
        selectedToolUI = createStreamableUI(selectedToolComponent.loading());
        fields.ui.append(selectedToolUI?.value);
      }
    }
  };*/

  /**
   * Handles the 'invoke_tools' event by updating the selected tool's UI
   * with the final state and tool result data.
   *
   * @param output - The output object from the 'invoke_tools' event
   */
  /*const handleInvokeToolsEvent = (event: StreamEvent) => {
    const [type] = event.event.split("_").slice(2);
    if (
      type !== "end" ||
      !event.data.output ||
      typeof event.data.output !== "object" ||
      event.name !== "invoke_tools"
    ) {
      return;
    }

    if (selectedToolUI && selectedToolComponent) {
      const toolData = event.data.output.tool_result;
      selectedToolUI.done(selectedToolComponent.final(toolData));
    }
  }

  /**
   * Handles the 'on_chat_model_stream' event by creating a new text stream
   * for the AI message if one doesn't exist for the current run ID.
   * It then appends the chunk content to the corresponding text stream.
   *
   * @param streamEvent - The stream event object
   * @param chunk - The chunk object containing the content
   */
  /*const handleChatModelStreamEvent = (
    event: StreamEvent,
    fields: EventHandlerFields,
  ) => {
    if (
      event.event !== "on_chat_model_stream" ||
      !event.data.chunk ||
      typeof event.data.chunk !== "object"
    )
      return;
    if (!fields.callbacks[event.run_id]) {
      const textStream = createStreamableValue();
      fields.ui.append(<AIMessage value={textStream.value} />);
      fields.callbacks[event.run_id] = textStream;
    }

    if (fields.callbacks[event.run_id]) {
      fields.callbacks[event.run_id].append(event.data.chunk.content);
    }
  };

  const processedInputs = {
    ...inputs,
    input: {
      content: inputs.input,
    },
  };

  return streamRunnableUI(
    remoteRunnable,
    processedInputs,
    {
      eventHandlers: [
        handleInvokeModelEvent,
        handleInvokeToolsEvent,
        handleChatModelStreamEvent,
      ],
    },
  );
}*/

export const EndpointsContext = exposeEndpoints({ agent });
