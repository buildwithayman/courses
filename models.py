from pydantic import BaseModel,Field,field_validator,model_validator,computed_field
from typing import Optional

class Course(BaseModel):
    id:Optional[int]=None
    title:str=Field(min_length=2,max_length=100,description="title of the course")
    instructor:str=Field(min_length=2,max_length=100,description="instructor of the course")
    category:str=Field(min_length=2,max_length=100,description="category of the course")
    price:float = Field(ge=0.01, le=100000.0, description="price of the course")
    duration_hours:int=Field(gt=0,le=1000,description="duration of the course")
    is_published:bool=Field(default=True)
    discount_percent:Optional[float]=Field(ge=0.0,le=100000.0,description="discount of the course",default=None)

    @field_validator('instructor')
    @classmethod
    def inst_check(cls,value:str)->str:
        return value.title()
    
    @field_validator('category')
    @classmethod
    def category_check(cls,value:str)->str:
        return value.lower()
    
    @model_validator(mode='after')
    def check_published_and_discount(course):
        if not course.is_published and course.discount_percent>0.0:
            raise ValueError("not possible")
        return course
    
    @computed_field
    @property
    def price_category(course)->str:
        if course.price<1000:
            return "Budget-friendly"
        elif course.price<10000:
            return "Mid-range"
        else:
            return "Premium"

    