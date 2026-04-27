from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import route

app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500"], #only this frontend can call this api
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


app.include_router(route)


#headers(what is tokens)
#access tokens
#refresh tokens


#tokens has 3 parts
 #1.header=information of user (header consist of algo(named HS256) ITS BASICALLY A LOCKING METHOD )

 #2.payload=metadeta of user(data of data)
   #payload structure consist of:
    #id,email,role,exp(time of token expire),iat(issed at what time)

 #3.signature=hashed combination of header and payload=hash(header+payload+secret key(noramlly key nhi ati bus production level pe deploy ke time use krte h))


