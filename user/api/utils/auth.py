from fastapi.exceptions import HTTPException
from fastapi.param_functions import Depends
from fastapi.security.http import HTTPBase
from starlette import status
from mongoengine import *
from api.service.models import UserInfo
from jose import JWTError, jwt
import datetime, json

from config import Config

_schema = {
    "access_token":{
        "iat": None,
        "sub": None,
        "exp": None
    },
    "refresh_token":{
        "iat": None,
        "sub": None,
        "exp": None
    }
}

def authenticate_user_token(token: str = Depends(HTTPBase(scheme='Bearer'))):    
    payload = decode_access_token(token.credentials)
    user_data = json.loads(payload["sub"].replace("'", '"'))
    user_data['refresh_token'] = token.credentials
    return user_data

def authenticate_access_token(token: str = Depends(HTTPBase(scheme='Bearer'))):    
    payload = decode_refresh_token(token.credentials)
    user_data = json.loads(payload["sub"].replace("'", '"'))
    user_data['refresh_token'] = token.credentials
    return user_data

def generate_token(token_type, payload):    
    
    exp_time =  Config.REFRESH_TOKEN_EXPIRES_IN
    sec_key = Config.ACCESS_SECRET_KEY

    if token_type == 'access_token':
        exp_time =  Config.ACCESS_TOKEN_EXPIRES_IN
        sec_key = Config.SECRET_KEY
    
        

    _schema[token_type]["iat"] = datetime.datetime.utcnow()
    _schema[token_type]["exp"] = _schema[token_type]["iat"] + datetime.timedelta(seconds= exp_time)
    _schema[token_type]["sub"] = str(payload)

    token = jwt.encode(
        _schema[token_type], 
        sec_key, 
        algorithm=Config.ALGORITHM)
    return token


def decode_access_token(token):
    try:
        return jwt.decode(
            token, 
            Config.SECRET_KEY, 
            algorithms=Config.ALGORITHM)
    except (jwt.JWTError, jwt.ExpiredSignatureError) as e:        
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid Token')

def decode_refresh_token(token):
    try:
        return jwt.decode(
            token, 
            Config.ACCESS_SECRET_KEY, 
            algorithms=Config.ALGORITHM)
    except (jwt.JWTError, jwt.ExpiredSignatureError) as e:        
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid Token')


# user authentication function to check user is authorized or not
def authenticate_user_password(username: str, password: str):    
    try:
        user = UserInfo.objects.get(Username=username)
        if not user.verify_password(password):
            return False
        return user
    except DoesNotExist:         
        return False 