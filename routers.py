from utils import read_data,write_data
from models import Course
from fastapi import APIRouter,Query,HTTPException,Depends,params
from database import get_db
from sqlalchemy.orm import Session 
from sqlalchemy import text
from typing import Optional

route=APIRouter()

# #jese apka route hoga vese hi request banegi and database me bhej di jaegi to fetch data acordingly

@route.get('/data')
def data(db:Session =Depends(get_db)):
    #write a sql query for fetching whole data
    result=db.execute(text("SELECT * FROM courses"))
    return result.mappings().all() #converting all the records in dict format


@route.get('/data/{id}')
def get_data_by_id(id:int,db:Session =Depends(get_db)):
    #write a sql query to fetch data by id
    result=db.execute(text("SELECT * FROM courses WHERE id = :id"),{'id':id}) #parameter binding/parameter placeholder =:id
    return result.mappings().first()


#Post method
@route.post('/new')
def create(course:Course,db:Session=Depends(get_db)):
    data=course.dict(exclude={'id','price_category'})

    #query to create new records in database
    db.execute(text("""INSERT INTO courses (title,instructor,category,price,duration_hours,is_published,discount_percent) 
                           VALUES (:title,:instructor,:category,:price,:duration_hours,:is_published,:discount_percent)"""),data)
    db.commit()
    return {'message':'New Course added successfully'}


#Put method
@route.put('/update/{id}')
def update_item(id:int,course:Course,db:Session=Depends(get_db)):
    existing=db.execute(text("SELECT * FROM courses WHERE id = :id"),{'id':id})
    if not existing:
        raise HTTPException(status_code=404,detail="no course found for this id")
    
    data=course.dict()
    data['id']=id

    #update record in database query
    db.execute(text("""UPDATE courses
                    SET title=:title,
                    instructor=:instructor,
                    category=:category,
                    price=:price,
                    duration_hours=:duration_hours,
                    is_published=:is_published,
                    discount_percent=:discount_percent 
                    WHERE id=:id"""),data)
    db.commit()
    return {'message':'Course updated successfully'}




#Delete method
@route.delete('/delete/{id}')
def delete_item(id:int,db:Session=Depends(get_db)):
    existing=db.execute(text("SELECT * FROM courses WHERE id = :id"),{'id':id})

    if not existing:
        raise HTTPException(status_code=404,detail="no course found for this id")
    
    #deleting particular id from database
    db.execute(text("DELETE FROM courses WHERE id=:id"),{'id':id})

    db.commit()

    return {'message':"Course deleted successfully"}





# #QUERY
@route.get('/filter')
def filter(
        id:Optional[int]=Query(None,description="Filter by course ID"),
        category:Optional[str]=Query(None,description="Filter by category"),
        instructor:Optional[str]=Query(None,description="Filter by instructor"),
        is_published:Optional[bool]=Query(None,description="Filter by published status"),
        min_price:Optional[float]=Query(None,description="Filter by min price"),
        max_price:Optional[float]=Query(None,description="Filter by max price"),
        min_duration:Optional[int]=Query(None,description="Filter by minimum duration(hours)"),
        db:Session=Depends(get_db)

):
    query="SELECT * FROM courses WHERE 1=1" #No-op condition
    params={}
    if id is not None:
        query += " AND id = :id"
        params['id'] = id
    if category:
        query += " AND category = :category"
        params['category'] = category #just like parameter binding
    
    if instructor:
        query += " AND instructor = :instructor"
        params['instructor'] = instructor #just like parameter binding

    if is_published is not None:
        query += " AND is_published = :is_published"
        params['is_published'] = is_published #just like parameter binding

    if min_price is not None:
        query += " AND price >= :min_price"
        params['min_price'] = min_price #just like parameter binding

    if max_price is not None:
        query += " AND price <= :max_price"
        params['max_price'] = max_price #just like parameter binding

    if min_duration is not None:
        query += " AND duration_hours >= :min_duration"
        params['min_duration'] = min_duration #just like parameter binding
    
    results=db.execute(text(query),params).mappings().all()
    return {"Data": results}

    
    


# #pagination
@route.get('/items')
def get_item(
    page:int=Query(1,ge=1),#2
    limit:int=Query(10,ge=1,le=100),#5
    db:Session=Depends(get_db)
):  
    total = db.execute(text("SELECT COUNT(*) FROM courses")).scalar()
    offset=(page-1)*limit #ex means if offset=5 toh starting ke 5 records chorke bad ke records apko milenge and kitne milenge voh limit decide karega
    data=db.execute(text("SELECT * FROM courses LIMIT :limit OFFSET :offset"),{'limit':limit,'offset':offset}).mappings().all()
    return {
        "Total items": total,
        "Current page no.": page,
        "records shown on this page": len(data),
        "Data": data
    }





