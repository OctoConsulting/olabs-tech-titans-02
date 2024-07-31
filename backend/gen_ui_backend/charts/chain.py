from typing import List, Literal, Optional, TypedDict

from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph
from langgraph.graph.graph import CompiledGraph

from gen_ui_backend.charts.schema import (
    ChartType,
    DataDisplayTypeAndDescription,
    Filter,
    Fruits,
    filter_schema,
)


class AgentExecutorState(TypedDict, total=False):
    input: HumanMessage
    """The user input"""
    display_formats: List[DataDisplayTypeAndDescription]
    """The types of display formats available for the chart."""
    fruits: List[Fruits]
    """List of orders to process."""
    selected_filters: Optional[List[Filter]]
    """The filters generated by the LLM to apply to the orders."""
    chart_type: Optional[ChartType]
    """The type of chart which this format can be displayed on."""
    display_format: Optional[str]
    """The format to display the data in."""
    props: Optional[dict]
    """The props to pass to the chart component."""


def format_data_display_types_and_descriptions(
    data_display_types_and_descriptions: List[DataDisplayTypeAndDescription],
    selected_chart_type: Optional[ChartType] = None,
) -> List[str]:
    return [
        f"Key: {item['key']}. Title: {item['title']}. Chart type: {item['chartType']}. Description: {item['description']}"
        for item in data_display_types_and_descriptions
        if selected_chart_type is None or item["chartType"] == selected_chart_type
    ]


def generate_filters(state: AgentExecutorState) -> AgentExecutorState:
    
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are a helpful assistant. Your task is to determine the proper filters to apply, give a user input.
The user input is in response to a 'magic filter' prompt. They expect their natural language description of the filters
to be converted into a structured query. Today is July 25 2024.""",
            ),
            ("human", "{input}"),
        ]
    )
    print(state["fruits"])
    unique_product_names: List[str] = list(
        
        set(fruits["name"].lower() for fruits in state["fruits"])
    )
    schema = filter_schema(unique_product_names)
    model = ChatOpenAI(model="gpt-4o-mini", temperature=0).with_structured_output(
        schema
    )
    chain = prompt | model
    result = chain.invoke(input=state["input"]["content"])
    print(state['input'])
    print(result)
    return {
        "selected_filters": result,
    }


def generate_chart_type(state: AgentExecutorState) -> AgentExecutorState:
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are an expert data analyst. Your task is to determine the best type of chart to display the data based on the filters and user input.
You are provided with three chart types: 'bar', 'line', and 'pie'. You will always display a table. 
The data which is being filtered is a set of orders from an online store.
The user has submitted an input that describes the filters they'd like to apply to the data.

Keep in mind that each chart type has set formats to display the data. You should consider the best display format when selecting your chart type. If known of the charts fit well choose table
to only display the table.

Data display types: {data_display_types_and_descriptions}

Based on their input and the filters that have been generated, select the best type of chart to display the data.""",
            ),
            (
                "human",
                """Magic filter input: {magic_filter_input}
  
Generated filters: {selected_filters}""",
            ),
        ]
    )

    class ChartTypeSchema(BaseModel):
        """Choose the best type of chart to display the data, based on the filters, user request, and ways to display the data on a given chart."""

        chart_type: Literal["bar", "line", "pie"] = Field(
            ..., description="The type of chart to display the data."
        )

    model = ChatOpenAI(model="gpt-4o-mini", temperature=0).with_structured_output(
        ChartTypeSchema
    )
    chain = prompt | model
    result = chain.invoke(
        input={
            "magic_filter_input": state["input"]["content"],
            "selected_filters": state["selected_filters"],
            "data_display_types_and_descriptions": format_data_display_types_and_descriptions(
                state["display_formats"]
            ),
        }
    )

    return {
        "chart_type": result.chart_type,
    }


def generate_data_display_format(state: AgentExecutorState) -> AgentExecutorState:
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are an expert data analyst. Your task is to determine the best format to display the data based on the filters, chart type and user input.

The type of chart which the data will be displayed on is: {chart_type}.

This chart has the following formats of which it can display the data: {data_display_types_and_descriptions}.

The user will provide you with their original input to the 'magic filter' prompt, and the filters which have been generated based on their input.
You should use these inputs as context when making a decision on the best format to display the data.

Select the best display format to show the data based on the filters, chart type and user input. You should always use the display type 'key' when selecting the format.""",
            ),
            (
                "human",
                """Magic filter input: {magic_filter_input}
  
Generated filters: {selected_filters}""",
            ),
        ]
    )

    class DataDisplayFormatSchema(BaseModel):
        """Choose the best format to display the data based on the filters and chart type."""

        display_key: str = Field(
            ...,
            description=f"The key of the format to display the data in. Must be one of {', '.join([item['key'] for item in state['display_formats'] if item['chartType'] == state['chart_type']])}",
        )

    model = ChatOpenAI(model="gpt-4o-mini", temperature=0).with_structured_output(
        DataDisplayFormatSchema
    )
    chain = prompt | model
    result = chain.invoke(
        input={
            "chart_type": state["chart_type"],
            "magic_filter_input": state["input"]["content"],
            "selected_filters": state["selected_filters"],
            "data_display_types_and_descriptions": format_data_display_types_and_descriptions(
                state["display_formats"], state["chart_type"]
            ),
        }
    )

    return {
        "display_format": result.display_key,
    }


def filter_data(state: AgentExecutorState) -> AgentExecutorState:
    selected_filters = state["selected_filters"]
    fruits = state["fruits"]

    names = selected_filters.names
    retailPrice = selected_filters.retailPrice
    form = selected_filters.form
    # before_date = selected_filters.before_date
    # after_date = selected_filters.after_date
    # min_amount = selected_filters.min_amount
    # max_amount = selected_filters.max_amount
    # order_state = selected_filters.state
    # discount = selected_filters.discount
    # min_discount_percentage = selected_filters.min_discount_percentage
    # status = selected_filters.status

    filtered_fruits = []
    for fruit in fruits:
        is_match = True

        if names and fruit.get("name", "").lower() not in names:
            is_match = False
        if form and fruit.get("form", "").lower() not in form:
            is_match = False
        if retailPrice and fruit.get("retailPrice", 0):
            is_match = True
       
        
        if is_match:
            filtered_fruits.append(fruits)

    return {"fruits": filtered_fruits}

def table_skip(state:AgentExecutorState) -> Literal["skip","display_format"]:
    if state["chart_type"] == "table":
        return "skip"
    else:
        return "display_format"

def create_graph() -> CompiledGraph:
    workflow = StateGraph(AgentExecutorState)

    # Add nodes
    workflow.add_node("generate_filters", generate_filters)
    workflow.add_node("generate_chart_type", generate_chart_type)
    workflow.add_node("generate_data_display_format", generate_data_display_format)
    workflow.add_node("filter_data", filter_data)

    # Add edges
    workflow.add_edge("generate_filters", "generate_chart_type")
    workflow.add_conditional_edges("generate_chart_type",table_skip,{"skip":"filter_data","display_format":"generate_data_display_format"})
    #workflow.add_edge("generate_chart_type", "generate_data_display_format")
    workflow.add_edge("generate_data_display_format", "filter_data")

    # Set entry and finish points
    workflow.set_entry_point("generate_filters")
    workflow.set_finish_point("filter_data")

    graph = workflow.compile()
    return graph


graph = create_graph()
