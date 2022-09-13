from fastapi.exceptions import HTTPException
from mongoengine import *

from api.service.models import UserActivity, UserInfo
import datetime


# utility function to save user activity details
def SaveUserActivity(username,action,result='Successful'):
    UserActivity(
                Username=username,
                Action=action,
                Activity_result=result,
                TScreated=datetime.datetime.utcnow()).save()
    return None


def get_user(username: str):    
    try:        
        user_obj = UserInfo.objects.get(Username=username)        
        return user_obj
    except DoesNotExist:        
        raise HTTPException(status_code=404, detail='Not Found')    
   


responses={    
            403: {
                "description":"Invalid Credentials",
                "content": {
                "application/json": {
                    "example": {"detail":"Bad Credentials"}
                        }
                    },
                },
            404: {
                "description":"Resource Not Found",
                "content": {
                "application/json": {
                    "example": {"detail":"Not Found"}
                        }
                    },
                },
            409: {
                "description":"Resource Already Exist",
                "content": {
                "application/json": {
                    "example": {"detail":"Already Exist in The System"}
                        }
                    },
                },
            500: {
                "description":"Something went wrong",
                "content": {
                "application/json": {
                    "example": {"detail":"Internal Server Error"}
                        }
                    },
                }
            }
