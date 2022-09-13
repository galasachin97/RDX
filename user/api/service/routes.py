from fastapi.responses import HTMLResponse
from fastapi import FastAPI, Request
from fastapi import APIRouter, HTTPException, Header, Response, status, Depends, Query
from fastapi.responses import JSONResponse, FileResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from api.service.serializers import *
import datetime
import json
import hashlib
from datetime import timedelta
from api.service.models import *
from passlib.context import CryptContext
import os
import sys
import re

from .helpers.helper_functions import OTPGeneration, sendEmail, check_email_attempt_limit
from config import Config
from api.utils import auth, utility, requesthandler
from functools import wraps
from api.service.helpers import utils
from .helpers.logs import console_logger

from mongoengine.errors import *

router = APIRouter()

user_activity = {
    "Username": None,
    "Action": None,
}

user_session = {
    "Username": None,
    "Type": None,
    "Refresh_token": None
}


response_data = {
    "Data": None,
    "Page_size": 0,
    "Page_number": 0,
    "Total_count": 0
}


def permission_required(access):
    def inner_function(function):
        @wraps(function)
        async def wrapper(*args, **kwargs):
            user = UserInfo.objects.get(Username=kwargs['payload']['username'])
            if user.Permission in access:
                return await function(*args, **kwargs)
            raise HTTPException(status_code=403, detail="No Permission")
        return wrapper
    return inner_function


@router.get(
    '',
    response_model=CurrentUserGetOut,
    responses={**utility.responses,
                401: {
                    "description": "Invalid Token",
                    "content": {
                        "application/json": {
                            "example": {"detail": "Invalid Token"}
                        }
                    },
                },
            }
)
async def get_current_user(payload: dict = Depends(auth.authenticate_user_token)):
    try:
        return UserInfo.objects.get(Username=payload['username']).payload()
    except DoesNotExist:
        raise HTTPException(status_code=404, detail='Not Found')
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.post(
    "/login",
    response_model=Token,
    responses={
        **utility.responses,
    }
)
async def UserLogin(response: Response, username: str = Header(...), password: str = Header(...)):
    # extract data and authenticate user

    try:
        device_status = requesthandler.get_device_info().get("Status")
        console_logger.debug(device_status)
        if device_status not in ["Blocked", "Suspended"]:
            console_logger.debug(username)
            user = UserInfo.objects.get(Username=username.lower())

            if not user.verify_password(password):
                raise HTTPException(
                    status_code=403, detail="Incorrect username or password")

            access_token = auth.generate_token(
                "access_token", {"username": user.Username, "role": user.Role})
            refresh_token = auth.generate_token(
                "refresh_token", {"username": user.Username, "role": user.Role})

            user_session['Username'] = user.Username
            user_session['Type'] = user.Role
            user_session['Refresh_token'] = refresh_token

            user_activity['Username'] = user.Username
            user_activity['Action'] = "Logged in"

            UserSessions(**user_session).save()
            UserActivity(**user_activity).save()
            _response = {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "fullname": user.FullName,
                "username": user.Username,
                "role": user.Role,
                "EmailVerified": user.Status}
            if user.Role == 'Manufacturer':
                _response['username'] = 'Manufacturer'
                _response['role'] = 'Manufacturer'
            console_logger.debug(_response)
            return _response
        return JSONResponse(status_code=404, content={"detail": "Device Is Blocked"})
    except DoesNotExist:
        return JSONResponse(status_code=403, content={"detail": "Incorrect username or password"})


@router.get(
    "/logout",
    responses={**utility.responses,
               200: {
                   "description": "Logout Successful",
                   "content": {
                       "application/json": {
                           "example": {"detail": "Success"}
                       }
                   },
               },
               }
)
async def logout(payload: dict = Depends(auth.authenticate_access_token)):
    """
    Logout Endpoint for user Need Refresh token
    """
    try:
        # get refresh token and try to update session activity
        user = UserSessions.objects.get(Refresh_token=payload['refresh_token'])
        user.delete()

        user_activity['Username'] = user.Username
        user_activity['Action'] = "Logged Out"

        UserActivity(**user_activity).save()
        return {"detail": "Success"}
    except DoesNotExist:
        raise HTTPException(status_code=403, detail="Unauthorized")
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get(
    "/register",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "Superadmin Created",
            "content": {
                "application/json": {
                    "example": {"detail": "Superadmin Not Found"}
                }
            }
        },
    }
)
async def register_user(response: Response):
    """
    API to register superadmin after first time login
    """
    try:
        # Register Admin for first time after device activation
        if any(UserInfo.objects(Role='Superadmin')):
            response.status_code = 200
            return {"detail": "Superadmin Already Exist in db"}
            # if user provided is not exist in database then save the user
        response.status_code = 404
        return JSONResponse(status_code=404, content={"detail": "Superadmin Not Found"})
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post(
    "/register",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "Superadmin Created",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
    }
)
async def register_user(response: Response, user_data: UserRegisterPostIn):
    """
    API to register superadmin after first time login
    """
    try:
        # Register Admin for first time after device activation
        console_logger.debug("Registering Superadmin")

        user = UserInfo.objects.get(Role='Superadmin')
        if user:
            response.status_code = 409
            return {"detail": "Superadmin Already Exist in db"}
            # if user provided is not exist in database then save the user

    except DoesNotExist:

        user_info = user_data.dict()

        user_info.update({'Role': 'Superadmin', 'Permission': 'can_edit'})

        user = UserInfo(**user_info)
        user.set_password(user_info.pop('Password'))
        user.save()

        user_activity['Username'] = user_info['Username'].lower()
        user_activity['Action'] = "Superadmin Created"

        UserActivity(**user_activity).save()

        console_logger.debug("Superadmin Created Successfully")
        return {"detail": "Success"}

    except NotUniqueError:

        console_logger.warning("Not Unique Error Occured")
        raise HTTPException(status_code=409, detail="Superadmin Already Exist")

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get(
    "/refresh",
    response_model=AccessToken,
    responses={**utility.responses,
               401: {
                   "description": "Invalid Token",
                   "content": {
                       "application/json": {
                           "example": {"detail": "Invalid Token"}
                       }
                   },
               },
               }
)
async def refresh(payload: dict = Depends(auth.authenticate_access_token)):
    """
    Api to recreate access token Needs Refresh token
    """
    try:
        console_logger.debug(payload)
        device_status = requesthandler.get_device_info().get("Status")
        if device_status not in ["Blocked", "Suspended"]:
            user = UserSessions.objects.get(
                Refresh_token=payload['refresh_token'])
            user.TSmodified = datetime.datetime.utcnow()

            access_token = auth.generate_token(
                "access_token", {"username": user.Username, "role": payload['role']})

            user.save()
            return {"access_token": access_token}
        return JSONResponse(status_code=403, content={"detail": "Device Is Blocked"})
    except DoesNotExist:
        console_logger.debug("User session not found")
        raise HTTPException(status_code=403, detail="Unauthorized")

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.put(
    "/password",
    responses={
        **utility.responses,
        200: {
            "description": "Superadmin Created",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
    }
)
@permission_required('can_edit')
async def reset_user_password(response: Response, user_data: ResetUsersPasswordPostIn,
                              payload: dict = Depends(auth.authenticate_user_token)):
    """
    API to update other users password by superadmin/admin
    """
    # get user details and check user exist in the system then try to update his password
    console_logger.debug("Updating User Password")
    try:
        user = UserInfo.objects.get(Username=user_data.Username)
        user.set_password(user_data.Password)
        user.save()
        console_logger.debug("Users Password Changed Successfully")

        user_activity['Username'] = payload['username']
        user_activity['Action'] = "Password reset - {}".format(
            user.Username)

        UserActivity(**user_activity).save()
        return {"detail": "Success"}
        # if user.Role not in ['Superadmin']:
        #     if user.Role in ['Operator', 'Admin'] or payload['username'] != user.Username:
                

        # console_logger.debug("No Permision to change password")
        # response.status_code = 403
        # return {"detail": "No Permission"}

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post(
    "/create",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "User Created",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
        403: {
            "description": "No Access to resource",
            "content": {
                "application/json": {
                    "example": {"detail": "No Permission"}
                }
            },
        }
    }
)
@permission_required('can_edit')
async def create_user(response: Response, user_data: UCreateUserPostIn,
                      payload: dict = Depends(auth.authenticate_user_token)):
    """
    API to create new users for admin/superadmin
    """
    console_logger.debug(user_data.Role)
    if (user_data.Role).title() not in ['Admin', 'Operator']:
        response.status_code = 400
        return {"detail": "Not Valid User Role"}
    try:
        if UserInfo.objects.get(Username=user_data.Username.lower()):
            console_logger.debug("User Already Exist")
            response.status_code = 409
            return {"detail": "Username Already Present"}

    except DoesNotExist:
        console_logger.debug("Provided Username not exist")
        # if user provided is not exist in database then save the user
        if (user_data.Role).title() != 'Admin' or payload['role'] == 'Superadmin':

            user_info = user_data.dict()
            user_info.update(
                {
                    'Role': (user_data.Role).title(),
                    'Permission': 'can_edit' if (user_data.Role).title() == 'Admin' else 'can_view',
                }
            )
            password = user_info.pop('Password')
            verified = user_info.pop('EmailVerified')

            user = UserInfo(**user_info)
            user.set_password(password)
            user.Status = True if verified else False
            user.save()

            user_activity['Username'] = payload['username']
            user_activity['Action'] = "User created- {}".format(
                user_data.Username)

            UserActivity(**user_activity).save()
            return {"detail": "Success"}

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="internal Server Error")


@router.put(
    "/update",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "User Details Updated",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
    }
)
@permission_required('can_edit')
async def update_user(response: Response, user_data: UserUpdatePutIn,
                      payload: dict = Depends(auth.authenticate_user_token)):
    """
    Endpoint to update user details using username
    """
    console_logger.debug("Updating Users details")
    try:
        user = UserInfo.objects.get(Username=user_data.Username)
        console_logger.debug(user_data)

        verified = user_data.EmailVerified
        # if user.Role in ['Operator','Admin'] and user.Username!=payload['username'] or payload['role'] == 'Superadmin':
        if user.Role in ['Operator', 'Admin'] or payload['role'] == 'Superadmin':
            user.FullName = user_data.FullName if user_data.FullName else user.FullName
            user.Role = user_data.Role if user_data.Role and user.Role != 'Superadmin' else user.Role
            user.Email = user_data.Email if user_data.Email else user.Email
            user.Phone = user_data.Phone if user_data.Phone else user.Phone
            user.Permision = 'can_edit' if (
                user_data.Role).title == 'Admin' else 'can_view'
            user.Status = True if verified else False
            user.save()
            user_activity['Username'] = payload['username']
            user_activity['Action'] = "Updated User - {}".format(user.Username)

            UserActivity(**user_activity).save()
            console_logger.debug("Update user successful")
            return {"detail": "Success"}

        console_logger.debug("No permission to access this resource")
        response.status_code = 403
        return {"detail": "No Permission"}

    except DoesNotExist:
        raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.delete(
    "/delete",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "User Deleted Successfully",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
    }
)
@permission_required('can_edit')
async def delete_user(response: Response, Username: str,
                      payload: dict = Depends(auth.authenticate_user_token)):
    """
    Endpoint to delete user from database
    """
    console_logger.debug("Deleting User")
    try:
        user = UserInfo.objects.get(Username=Username)
        if user.Username == payload['username']:
            response.status_code = 403
            return {"detail": "No Permission"}

        if payload['role'] in ['Admin', 'Superadmin'] and user.Role not in ['Superadmin', 'Manufacturer']:
            user.delete()
            user_activity['Username'] = payload['username']
            user_activity['Action'] = "Removed User - {}".format(user.Username)

            UserActivity(**user_activity).save()
            return {"detail": "Success"}
        response.status_code = 403
        return {"detail": "No Permission"}

    except DoesNotExist:
        raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get(
    "/users",
    response_model=ListUsersGetOut,
    responses={
        **utility.responses,
    }
)
async def list_users(response: Response, Username: Optional[str] = None,
                    Page_number: Optional[int] = None, Page_size: Optional[int] = None,
                    payload: dict = Depends(auth.authenticate_user_token)):
    """
    Endpoint to get details of all users
    """
    try:
        console_logger.debug(payload)
        page_no = 1
        page_size = 10

        if Page_number:
            page_no = int(Page_number)
        if Page_size:
            page_size = int(Page_size)

        if Username:
            user = UserInfo.objects.get(Username=Username.lower())
            user_data = []
            if user.Role != 'Manufacturer':
                user_values = user.payload()
                # user_values['Role'] = user_values['Role']
                user_values['EmailVerified'] = user.Status
                user_data = [user_values]

            response_data['Page_size'] = 1
            response_data['Page_number'] = 1
            response_data['Total_count'] = 1

        else:
            start = page_size*(page_no - 1)
            end = start + page_size

            args = {}
            if payload['role'] == "Superadmin":
                args["__raw__"] = {"$or": [{"Role": "Superadmin"}, {"Role": "Admin"}, {"Role": "Operator"}]}
            elif payload['role'] == "Admin":
                args["__raw__"] = {"$or": [{"Role": "Admin"}, {"Role": "Operator"}]}
            elif payload["role"] == "Operator":
                args["Role"] = "Operator"
            elif payload["role"] == "Manufacturer":
                args["Role"] = "Manufacturer"
            

            user_list = UserInfo.objects(**args).order_by('TScreated')[start:end]

            user_data = []
            for user in user_list:
                if user.Role != 'Manufacturer':
                    user_values = user.payload()
                    # user_values['Role'] = 'Admin' if user_values['Role'] == 'Superadmin' else user_values['Role']
                    # user_values['Role'] = 'Admin'
                    user_values['EmailVerified'] = user.Status
                    console_logger.debug(user_values)
                    user_data.append(user_values)

            console_logger.debug("Got User Data")

            response_data['Page_size'] = page_size
            response_data['Page_number'] = page_no
            response_data['Total_count'] = len(user_list)
        response_data['Data'] = user_data
        return response_data

    except DoesNotExist:
        raise HTTPException(status_code=404, detail="User not found")

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/superadmin/unprotected")
async def enpoint_to_fetch_the_superadmin_details():
    try:
        userObject = UserInfo.objects.get(Role="Superadmin")
        return {"detail": userObject.payload()}
    except DoesNotExist:
        raise HTTPException(status_code=404)


@router.get(
    "/defaultemail/limit",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "Email attempts remaining",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
        429: {
            "description": "Default Email Limit Reached",
            "content": {
                "application/json": {
                    "example": {"detail": "Email Sending Limit Exeeded"}
                }
            }
        },
    }
)
async def checkLimit(response: Response):
    """
    Endpoint to send email in case user forgot his password
    """

    try:
        if check_email_attempt_limit():
            response.status_code = 451
            return {"detail": "Exeeded the limit of email sending / Try again after 24 hours"}
        return {"detail": "Success"}

    except DoesNotExist:
        console_logger.debug("User not found in db - {}".format(Username))
        raise HTTPException(status_code=404, detail="User not found")

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post(
    "/forgot-password",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "OTP Sent Successful",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
        503: {
            "description": "OTP Sending Failed",
            "content": {
                "application/json": {
                    "example": {"detail": "Failed"}
                }
            }
        },
    }
)
async def forgotpassword(response: Response, Username: Optional[str] = Query(...)):
    """
    Endpoint to send email in case user forgot his password
    """
    try:
        user = UserInfo.objects.get(Username=Username.lower())
        if user.Role == 'Manufacturer':
            return JSONResponse(status_code=404, content={"detail": "email for this user not available"})

        OTP_Field = OtpAttempts.objects().first()

        if not check_email_attempt_limit():
            emailStatus = sendEmail(
                user_data=user.payload(), type="forgotpass")
            console_logger.debug(emailStatus)

            if emailStatus:
                console_logger.debug("Email Sent Successfully ")
                user_activity['Username'] = user.Username
                user_activity['Action'] = "Forgot password Email Sent Successful"

                ''' Increament OTP Limit Attempts every Time '''
                OTP_Field.update(Attempts=int(OTP_Field.Attempts)+1,
                                 TSmodified=datetime.datetime.utcnow())

                ''' Set OTP Limit Flag '''

                if int(OTP_Field.Attempts) == int(Config.OTPATTEMPTSLIMIT) and not OTP_Field.HasOwnSettings:
                    OTP_Field.update(LimitReached=True)

                UserActivity(**user_activity).save()
                return JSONResponse(content={"id": emailStatus})

            else:
                user_activity['Username'] = user.Username
                user_activity['Action'] = "Forgot password Email Sent Failed"
                user_activity['Activity_result'] = 'Failed'

                response.status_code = 502
                UserActivity(**user_activity).save()
                return {"detail": "Service Unavailable"}

        if not OtpAttempts.objects().first().HasOwnSettings:
            OTP_Field.update(LimitReached=True)
        response.status_code = 451

        return {"detail": "Exeeded the limit of email sending / Try again after 24 hours"}

    except DoesNotExist:
        console_logger.debug("User not found in db - {}".format(Username))
        raise HTTPException(status_code=404, detail="User not found")

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post(
    "/validate",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "OTP Valid",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
    }
)
async def validate_otp_received(response: Response, code_received: ValidateOTPPostIn):
    """
    Endpoint to validate otp received via email
    """
    try:
        console_logger.debug(code_received)
        # frontend sends two codes one is OTP and other is ID which is stored in database
        otp_object = OtpCounter.objects.get(Count=code_received.ID)
        # console_logger.debug(otp_object.delete())
        otp = OTPGeneration()
        # console_logger.debug(code_received)
        otp_state = otp.validate_otp(code_received.OTP, code_received.ID)
        console_logger.debug(otp_state)

        if otp_state:
            # delete the stored id if otp is valid
            otp_object.delete()
            user_activity['Username'] = code_received.Username
            user_activity['Action'] = "Validate OTP"

            UserActivity(**user_activity).save()
            return {"detail": "Success"}

        # console_logger.debug("Invalid OTP")
        response.status_code = 403

        user_activity['Username'] = code_received.Username
        user_activity['Action'] = "Validate OTP"
        user_activity['Activity_result'] = 'Failed'
        UserActivity(**user_activity).save()

        return {"detail": "Invalid One Time Password"}
    except DoesNotExist:
        console_logger.debug("OTP Expired")
        response.status_code = 404
        return {"detail": "OTP Expired"}
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post(
    "/set-password",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "Password Updated Successfully",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
    }
)
async def set_currentuser_password(response: Response, user_data: UpdateUsersPassword_post_in,
                                   payload: dict = Depends(auth.authenticate_user_token)):
    """
    Reset's logged in user password
    """
    try:
        userinfo = UserInfo.objects.get(Username=payload['Username'])
        user = auth.authenticate_user_password(
            userinfo.Username, user_data.Old_password)
        if user:
            userinfo.set_password(user_data.New_password)
            userinfo.save()
            user_activity['Username'] = payload['Username']
            user_activity['Action'] = "Password reset self"

            UserActivity(**user_activity).save()
            return {"detail": "Success"}

        response.status_code = 403
        return {"detail": "Incorrect Password"}

    except DoesNotExist:
        console_logger.debug(
            "User not found in db - {}".format(userinfo.Username))
        raise HTTPException(status_code=404, detail="User not found")

    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post(
    "/update-password",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "User Password reset Successfully",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
    }
)
async def reset_currentuser_password(response: Response, user_data: ForgotPassword_post_in):
    """
    Reset's user password in case forgot using Email
    """
    try:
        userinfo = UserInfo.objects.get(Username=user_data.Username)
        if userinfo:
            userinfo.set_password(user_data.New_password)
            userinfo.save()

            user_activity['Username'] = userinfo.Username
            user_activity['Action'] = "Password reset done using email"

            UserActivity(**user_activity).save()
            return {"detail": "Success"}

    except DoesNotExist:
        console_logger.debug(
            "User not found in db - {}".format(user_data.Username))
        raise HTTPException(status_code=404, detail="User not found")

    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post(
    "/verify-email",
    responses={
        **utility.responses,
        200: {
            "description": "OTP Sent Successfully",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
    }
)
async def verify_email(response: Response, user_data: VerifyEmailPostIn):
    try:
        user = {'Username': user_data.Username, 'Email': user_data.Email}
        emailStatus = sendEmail(user_data=user, type="verification")

        if emailStatus:
            console_logger.debug("Email Sent Successfully ")
            user_activity['Username'] = user_data.Username
            user_activity['Action'] = "Activate User Email Sent Successful"

            UserActivity(**user_activity).save()
            return {"id": emailStatus}

        else:
            user_activity['Username'] = user_data.Username
            user_activity['Action'] = "Activate User Email Sent Failed"
            user_activity['Activity_result'] = 'Failed'

            response.status_code = 502
            UserActivity(**user_activity).save()
            return {"detail": "Service Unavailable"}

    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post(
    "/verify-password",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "Password Updated Successfully",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
    }
)
async def verify_password(response: Response, user_data: VerifyPasswordPostIn,
                          payload: dict = Depends(auth.authenticate_user_token)):
    """
    verify logged in user's password
    """
    try:
        console_logger.debug(payload)
        userinfo = UserInfo.objects.get(Username=payload['username'].lower())

        user = auth.authenticate_user_password(
            userinfo.Username, user_data.Password)
        if user:
            user_activity['Username'] = payload['username'].lower()
            user_activity['Action'] = "Password Verified Successfully"

            UserActivity(**user_activity).save()
            return {"detail": "Success"}

        response.status_code = 403
        return {"detail": "Incorrect Password"}

    except DoesNotExist:
        console_logger.debug(
            "User not found in db - {}".format(userinfo.Username))
        raise HTTPException(status_code=404, detail="User not found")

    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get(
    "/log/activity",
    response_model=LogActivityGetOut,
    responses={
        **utility.responses,
        200: {
            "description": "Activity Log Saved Successfully",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
    }
)
@permission_required('can_edit')
async def get_log_activity(response: Response, Username: str, Start_date: Optional[str] = None, End_date: Optional[str] = None,
                           payload: dict = Depends(auth.authenticate_user_token)):
    """
    Log user's Activity
    """
    try:
        endDate = datetime.datetime.utcnow()
        startDate = datetime.datetime.utcnow() - datetime.timedelta(days=30)
        if Start_date:
            startDate = datetime.datetime.strptime(Start_date, "%Y-%m-%d")
        endDate = datetime.datetime.utcnow()+datetime.timedelta(days=1)
        if End_date:
            endDate = datetime.datetime.strptime(
                End_date, "%Y-%m-%d")+datetime.timedelta(days=1)

        console_logger.debug("Fetching Activity Log")

        userinfo = UserInfo.objects.get(Username=Username)

        # current_date = datetime.datetime.utcnow()
        # previous_date = datetime.datetime.utcnow() - datetime.timedelta(days=30)
        query = {"Username": Username,
                 "TScreated__gte": startDate, "TScreated__lte": endDate}
        activity = UserActivity.objects(**query)
        console_logger.debug(activity)

        activity_list = []
        for act in activity:
            activity_list.append(act.payload())

        response_data['Data'] = activity_list
        # response_data['Page_size'] = page_size
        # response_data['Page_number'] = page_no
        response_data['Total_count'] = len(UserActivity.objects(**query))
        return response_data

    except DoesNotExist:
        console_logger.debug("User not found")
        raise HTTPException(status_code=404, detail="User not found")

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post(
    "/log/activity",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "Activity Log Saved Successfully",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
    }
)
async def log_activity(response: Response, user_data: LogActivityPostIn,
                       payload: dict = Depends(auth.authenticate_user_token)):
    """
    Log user's Activity
    """
    try:
        console_logger.debug("Logging Activity")
        userinfo = UserInfo.objects.get(Username=payload['username'].lower())
        user_activity['Username'] = payload['username']
        user_activity['Action'] = user_data.Action
        user_activity['Activity_result'] = user_data.Result

        UserActivity(**user_activity).save()
        return {"detail": "Success"}

    except DoesNotExist:
        console_logger.debug("User not found")
        raise HTTPException(status_code=404, detail="User not found")

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post(
    "/register/manufacturer",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "Manufacturer Registered Successfully",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
    }
)
async def registerManufacturer(response: Response, user_data: ManufactureRegisterPostIn):
    """
    Log user's Activity
    """
    try:
        # Register endpoint of manufaturer
        if any(UserInfo.objects(Role='Manufacturer')):
            response.status_code = 409
            return {"detail": "Manufacturer Already Registerd"}
        console_logger.debug('Registering manufacturer')
        userinfo = UserInfo(Username=user_data.ID,
                            Role='Manufacturer', FullName='Manufacturer')
        userinfo.set_password(user_data.Password)
        userinfo.save()
        return {"detail": "Success"}

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post(
    "/reset/factory",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "device reset successful",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
    }
)
@permission_required('can_edit')
async def Factory_Reset(response: Response, input_data: FactoryResetPostIn,
                        payload: dict = Depends(auth.authenticate_user_token)):
    """
    Reset Device Setting
    """
    try:
        # device reset to factory complete reset or only accesskey reset
        console_logger.debug(payload.get('refresh_token'))
        user = UserInfo.objects.get(Username=payload['username'])
        if user.Role == 'Superadmin':
            requesthandler.reset_factory_camera(
                input_data.WithAccessKey)  # call camera management url
            requesthandler.reset_factory_base(
                input_data.WithAccessKey)  # call base service
            requesthandler.reset_factory_service(
                input_data.WithAccessKey)  # call service management
            # user data is deleted in case of factory reset only manufacturer user does not get's deleted
            if input_data.WithAccessKey:
                console_logger.debug("Got Me")
                for user in UserInfo.objects():
                    if user.Role != 'Manufacturer':
                        user.delete()
                UserSessions.drop_collection()
                UserActivity.drop_collection()
            else:
                # if there is no selected then superadmin/manufacturer remains in database
                for user in UserInfo.objects():
                    if user.Role not in ['Manufacturer', 'Superadmin']:
                        user.delete()
                UserSessions.drop_collection()
                UserActivity.drop_collection()
            console_logger.debug("device resetted to factory")
        return {"detail": "Success"}
    except DoesNotExist:
        raise HTTPException(status_code=404, detail="Unauthorized")

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post('/duplicate',
             response_model=DefaultResponseModel,
             responses={
                 **utility.responses,
                 200: {
                     "description": "successful",
                     "content": {
                         "application/json": {
                             "example": {"detail": "Success"}
                         }
                     }
                 },
             })
def check_duplicates(response: Response, input_data: CheckDuplicatesPostIn,
                     payload: dict = Depends(auth.authenticate_user_token)):
    # api to check duplicate details of user data like email phone and username
    try:
        if input_data.Username:
            if any(UserInfo.objects(Username=input_data.Username)):
                return JSONResponse(status_code=409, content={"detail": "duplicate username exists"})
        if input_data.Email:
            if any(UserInfo.objects(Email=input_data.Email)):
                return JSONResponse(status_code=409, content={"detail": "duplicate email exists"})
        if input_data.Phone:
            if any(UserInfo.objects(Phone=input_data.Phone)):
                return JSONResponse(status_code=409, content={"detail": "duplicate phone exists"})
        return JSONResponse(status_code=200, content={"detail": "Success"})

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get('/service/health')
def user_service_health():
    # this api is called by host server at startup to check this service is started without issues
    return JSONResponse(status_code=200, content={"detail": "Success"})


@router.get("/render/html",
            response_class=HTMLResponse)
def user_template(request: Request):
    # dummy api to check html rendering in frontend
    from fastapi.templating import Jinja2Templates
    templates = Jinja2Templates(directory=os.getcwd())
    return templates.TemplateResponse("template.html", {"request": request})


@router.get("/check")
async def endpoint_to_check_user_present(user_type: str):
    userInfo = UserInfo.objects(Role=user_type).first()
    if userInfo is None:
        raise HTTPException(status_code=404)
    else:
        return {"detail": "success"}


@router.post("/otp", tags=["new flow"])
async def endpoint_to_perform_otp_authentication(payload: OtpDeviceIn, forgotPassword: bool = False, userVerify: bool = False):
    console_logger.debug(payload.dict())
    otpHandler = OTPGeneration()
    otpAttempts = OtpAttempts.objects.first()

    try:
        if userVerify:
            console_logger.debug("userVerify")
            if otpAttempts and otpAttempts.Attempts != 0:
                response = await otpHandler.send_otp_mail(payload.dict())

                if response["details"] == "Success":
                    otpAttempts.Attempts -= 1
                    otpAttempts.save()
            elif otpAttempts and otpAttempts.Attempts == 0:
                raise HTTPException(status_code=403, detail="Unauthorized")
            else:
                response = await otpHandler.send_otp_mail(payload.dict())
                if response["details"] == "Success":
                    OtpAttempts(
                        Attempts=Config.OTPATTEMPTSLIMIT - 1,
                        TScreated=(datetime.datetime.utcnow()+datetime.timedelta(days=1)).replace(
                            hour=0, minute=0, microsecond=0, second=0)
                    ).save()

            return JSONResponse(content={"detail": response})

        if not forgotPassword:
            userInfo = UserInfo.objects.get(Username=payload.username)
            apiCallObject = utils.ApiCall()
            code, data = apiCallObject.fetchAccessKey()
            console_logger.debug(code)

            if code == 200:
                dictionary = payload.dict()
                dictionary["destination"] = userInfo.Email
                dictionary["accessKey"] = data
            else:
                raise HTTPException(status_code=code)
            console_logger.debug("inside")
            if otpAttempts and otpAttempts.Attempts != 0:
                response = await otpHandler.send_otp_mail(dictionary)

                if response["details"] == "Success":
                    otpAttempts.Attempts -= 1
                    otpAttempts.save()
            elif otpAttempts and otpAttempts.Attempts == 0:
                raise HTTPException(status_code=403, detail="Unauthorized")
            else:
                response = await otpHandler.send_otp_mail(dictionary)
                if response["details"] == "Success":
                    OtpAttempts(
                        Attempts=Config.OTPATTEMPTSLIMIT - 1,
                        TScreated=(datetime.datetime.utcnow()+datetime.timedelta(days=1)).replace(
                            hour=0, minute=0, microsecond=0, second=0)
                    ).save()

            return JSONResponse(content={"detail": response})

        elif forgotPassword:
            userInfo = UserInfo.objects.get(Username=payload.username)
            apiCallObject = utils.ApiCall()
            code, data = apiCallObject.fetchAccessKey()
            console_logger.debug(code)

            if code == 200:
                dictionary = payload.dict()
                dictionary["destination"] = userInfo.Email
                dictionary["accessKey"] = data
            else:
                raise HTTPException(status_code=code)

            if otpAttempts and otpAttempts.Attempts != 0:
                console_logger.debug("expired")
                response = await otpHandler.send_otp_mail(dictionary)

                if response["details"] == "Success":
                    otpAttempts.Attempts -= 1
                    otpAttempts.save()
            elif otpAttempts and otpAttempts.Attempts == 0:
                raise HTTPException(status_code=403, detail="Unauthorized")
            else:
                response = await otpHandler.send_otp_mail(dictionary)
                if response["details"] == "Success":
                    OtpAttempts(
                        Attempts=Config.OTPATTEMPTSLIMIT - 1,
                        TScreated=(datetime.datetime.utcnow()+datetime.timedelta(days=1)).replace(
                            hour=0, minute=0, microsecond=0, second=0)
                    ).save()
            response.update({"username": userInfo.Username})
            console_logger.debug(response)
            return JSONResponse(content={"detail": response})

        else:
            raise HTTPException(status_code=400, detail="Bad Request")

    except DoesNotExist:
        raise HTTPException(status_code=404, detail="Not Found")


@router.get("/filter", tags=["new flow"])
async def endpoint_to_get_user_based_on_filter(
    payload: dict = Depends(auth.authenticate_user_token),
    all: bool = True,
    role: str = None,
    text: str = None,
):
    try:
        args = {}
        response = []

        if role:
            args["Role"] = role
        if text:
            args["FullName__icontains"] = text
            if payload['role'] == "Superadmin":
                args["__raw__"] = {"$or": [{"Role": "Superadmin"}, {"Role": "Admin"}, {"Role": "Operator"}]}
            elif payload['role'] == "Admin":
                args["__raw__"] = {"$or": [{"Role": "Admin"}, {"Role": "Operator"}]}
            elif payload["role"] == "Operator":
                args["Role"] = "Operator"
            elif payload["role"] == "Manufacturer":
                args["Role"] = "Manufacturer"
        if all:
            if payload['role'] == "Superadmin":
                args["__raw__"] = {"$or": [{"Role": "Superadmin"}, {"Role": "Admin"}, {"Role": "Operator"}]}
            elif payload['role'] == "Admin":
                args["__raw__"] = {"$or": [{"Role": "Admin"}, {"Role": "Operator"}]}
            elif payload["role"] == "Operator":
                args["Role"] = "Operator"
            elif payload["role"] == "Manufacturer":
                args["Role"] = "Manufacturer"

        # args["Role__ne"] = "Manufacturer"

        console_logger.debug(args)
        userObjects = UserInfo.objects(**args).order_by('-TScreated')
        for user in userObjects:
            response.append(user.payload())

        return {"detail": response}
    except DoesNotExist:
        raise HTTPException(status_code=404, detail='Not Found')
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.get("/manufacturer/unprotected")
async def endpoint_to_fetch_mfg_details():
    try:
        mfgObject = UserInfo.objects.get(Role="Manufacturer")
        return {"detail": mfgObject.payload()}
    except DoesNotExist:
        return HTTPException(status_code=404)