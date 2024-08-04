from typing import List, Literal, Optional, Type

from langchain_core.pydantic_v1 import BaseModel, Field

ChartType = Literal["bar", "line", "pie",]



class Fruits(BaseModel):
    """CamelCase is used here to match the schema used in the frontend."""
    name: str = Field(..., description="Name of fruit")
    form: str = Field(..., description="Form of fruit")
    retailPrice: float = Field(..., description="Retail price of fruit")



class Filter(BaseModel):
    name: Optional[List[str]] = Field(
        None, description="List of product names to filter by"
    )
    form: Optional[str] = Field(
        None, description="Filter orders by form of fruit."
    )
    retailPrice: Optional[float] = Field(
        None, description="Filter orders by retail price"
    )
    


def filter_schema(product_names: List[str]) -> Type[BaseModel]:
    # product_names_as_string = ", ".join(name.lower() for name in product_names)

    class FilterSchema(BaseModel):
        """Available filters to apply to orders."""
        name: Optional[List[str]] = Field(
        None, description="List of product names to filter by"
        )
        form: Optional[str] = Field(
            None, description="Filter orders by form of fruit."
        )
        retailPrice: Optional[float] = Field(
            None, description="Filter orders by retail price"
        )
    

    return FilterSchema


class DataDisplayTypeAndDescription(BaseModel):
    title: str = Field(..., description="The title of the data display type.")
    chartType: ChartType = Field(
        ..., description="The type of chart which this format can be displayed on."
    )
    description: str = Field(
        ..., description="The description of the data display type."
    )
    key: str = Field(..., description="The key of the data display type.")

    class Config:
        allow_population_by_field_name = True
