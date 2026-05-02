from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import route

app=FastAPI()


#connecting our frontend with backend
app.add_middleware( 
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500"], #only this frontend can call the api/backend sirf yehi frontend ki url accept/allow karega api use krne ke liye
    allow_credentials=True, #backend the sari cheze frontend url use krskta h
    allow_methods=["*"],
    allow_headers=["*"] #frontend request ke sath-sath kon se extra infomation backed ko bhejna h voh headers store karata h
)


app.include_router(route)


#(what is tokens)
#access tokens
#refresh tokens


#tokens has 3 parts
 #1.header=information of user (header consist of algo(named HS256) ITS BASICALLY A LOCKING METHOD )

 #2.payload=metadeta of user(data of data)
   #payload structure consist of:
    #id,email,role(admin or user),exp(time of token expire),iat(issed at what time)

 #3.signature=hashed combination of header and payload=hash(header+payload+secret key(noramlly key nhi ati bus production level pe deploy ke time use krte h))





#connecting to database
#create_engine=vscode and database(postgressql) ko connect krta h 
#vscode/client ne 1 req bheji sql/db me gayi ,sql se response aya vscode me =this is called one session 