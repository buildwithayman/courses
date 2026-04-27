from utils import read_data,write_data
from models import Product
from fastapi import APIRouter,Query,HTTPException

route=APIRouter()

@route.get('/data')
def data():
    data=read_data()
    return data

@route.get('/data/{item_id}')
def get_data_by_id(item_id:int):
    data=read_data()
    item=[i for i in data if i['id']==item_id]
    if not item:
        raise HTTPException(status_code=404,detail="id not found")
    return item


#Post method
@route.post('/new')
def create(product:Product,response_model=Product):
    data=read_data()
    new_id=max([i['id'] for i in data])+1 if data else 1
    new_product=product.dict()
    new_product['id']=new_id
    data.append(new_product)
    write_data(data)
    return {'Data added successfully'}


#Put method
@route.put('/update/{item_id}')
def update_item(item_id:int,product:Product):
    data=read_data()
    item_index=0
    for i,item in enumerate(data):
        if item['id']==item_id:
            item_index=i
    updated_product=product.dict()
    updated_product['id']=item_id
    data[item_index]=updated_product
    write_data(data)
    return {'Data updated successfully'}



#Delete method
@route.delete('/delete/{item_id}')
def delete_item(item_id:int):
    try:
        data=read_data()
        item_index=None
        for i,item in enumerate(data):
            if item['id']==item_id:
                item_index=i
                break
        data.pop(item_index)
        write_data(data)
        return {'Data deleted successfully'}
    except Exception as err:
        raise HTTPException(status_code=404,detail="id not found")
    


#QUERY
@route.get('/filter')
def filter(
        id:int=Query(None,description="filter data according to id")
):
    data=read_data()
    if id:
        data=[i for i in data if i['id']==id]
    return {'Data':data}


#pagination
@route.get('/items')
def get_item(
        page:int=Query(1,ge=1),
        limit:int=Query(10,ge=1,le=100)
):
    data=read_data()
    start=(page-1)*limit
    end=start+limit
    return {
        "Total items":len(data),
        "Current page no.":page,
        "records shown on this page":limit,
        "Data":data[start:end]
    }




    