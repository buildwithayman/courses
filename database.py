import os
from dotenv import load_dotenv
from sqlalchemy import create_engine,text
from sqlalchemy.orm import sessionmaker

load_dotenv() #.env se DATABASE_URL YAHA IS FILE ME LANE ME HELP KR RAHA H



#this code is use to check if db is connected with vscode successfully or not
#engine -connection stablish hoga and version check hoga
# try:
#     engine =create_engine(os.getenv("DATABASE_URL"))
#     with engine.connect() as connection:
#         result=connection.execute(text("SELECT version();"))
#         version=result.fetchone()
#         print(f"DB connected successfully! database version: {version}")
# except Exception as e:
#     print("error connecting to the database:",e)
#     exit(1)




#3 most important steps
database_url=os.getenv("DATABASE_URL")

#engine
engine =create_engine(database_url)
#or 
# engine=create_engine(os.getenv("DATABASE_URL"))

#session
Session=sessionmaker(bind=engine)

#dependency
def get_db():
    db=Session()
    try:
        yield db #generator function 
    finally:
        db.close() #always close the session or database connection after use

# yield db ensures ki request ke dauran DB session use ho aur request ke baad automatically db close ho jaye.

#padke ana
#fetchone,fetchall,yield
#yield =yield ek generator keyword hai jo function ko pause karke value return karta hai aur baad me wahi se resume hone deta hai,dubara function call ni krna padta








