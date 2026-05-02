# #we will make all the columns of the table and we will also assign name of the table

from sqlalchemy import Column,Integer,String,Float,Boolean

class Course:
    __tablename__="courses"

    id                          =Column(Integer,primary_key=True),
    title                       =Column(String(100),nullable=False),
    instructor                  =Column(String(100),nullable=False),
    category                    =Column(String(100),nullable=False),
    price                       =Column(Float,nullable=False),
    duration_hours              =Column(Integer,nullable=False),
    is_published                =Column(Boolean,nullable=False),
    discount_percent            =Column(Float,nullable=True),
    

