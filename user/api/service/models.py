from mongoengine import *
from mongoengine.fields import BooleanField, DateTimeField
from passlib.context import CryptContext
import datetime
from config import Config


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserInfo(Document):
    FullName = StringField()
    Username = StringField(unique=True, required=True)
    Password = StringField(required=True)
    Role = StringField(required=True, choices=[
                       'Admin', 'Operator', 'Superadmin', 'Manufacturer'])
    Email = EmailField()
    Phone = StringField()
    Permission = StringField(default='can_view', choices=[
                             'can_view', 'can_edit'])
    TScreated = DateTimeField(default=datetime.datetime.utcnow())
    TSmodified = DateTimeField()
    Status = BooleanField(default=False)

    def payload(self):
        return {
            'FullName': self.FullName,
            'Username': self.Username,
            'Role': self.Role,
            'Email': self.Email,
            'Phone': self.Phone,
            'Permission': self.Permission,
            'Status': self.Status
        }

    def verify_password(self, plain_password):
        return pwd_context.verify(plain_password, self.Password)

    def set_password(self, password):
        self.Password = pwd_context.hash(password)


class UserSessions(Document):
    Username = StringField()
    Type = StringField()
    Login_time = DateTimeField(default=datetime.datetime.utcnow)
    Refresh_token = StringField()
    Status = StringField(default='Active')
    TScreated = DateTimeField(default=datetime.datetime.utcnow())
    TSmodified = DateTimeField()
    meta = {
        'indexes': [
            {
                'fields': ['Login_time'],
                'expireAfterSeconds': Config.REFRESH_TOKEN_EXPIRES_IN
            }
        ]
    }

    def payload(self):
        return {
            "Username": self.Username,
            "Type": self.Type,
            "Login_time": self.Login_time,
            "Refresh_token": self.Refresh_token,
            "Status": self.Status,
            "Created": str(self.TScreated),
            "Last Modified": str(self.TSmodified)
        }


class OtpAttempts(Document):
    Attempts = IntField()
    TScreated = DateTimeField()
    TSmodified = DateTimeField()
    LimitReached = BooleanField(default=False)
    HasOwnSettings = BooleanField(default=False)
    meta = {
        'indexes': [
            {
                'fields': ['TScreated'],
                'expireAfterSeconds': 0
            }
        ]
    }


class UserActivity(Document):
    Username = StringField()
    Action = StringField()
    Activity_result = StringField(default="Success")
    TScreated = DateTimeField(default=datetime.datetime.utcnow())
    TSmodified = DateTimeField()

    def payload(self):
        return {
            "Username": self.Username,
            "Action": self.Action,
            "Activity_result": self.Activity_result,
            "Date": str(self.TScreated.date()),
            "Time": datetime.datetime.strftime(self.TScreated, "%H:%M:%S"),
            "LastModified": str(self.TSmodified)
        }


class OtpCounter(Document):
    Count = IntField()
    TScreated = DateTimeField(default=datetime.datetime.utcnow)
    meta = {
        'indexes': [
            {
                'fields': ['TScreated'],
                'expireAfterSeconds': Config.OTP_INTERVAL
            }
        ]
    }
