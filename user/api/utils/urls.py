prod = True

if prod:
    from config import Config
else:
    from config import TESTConfig as Config


''' Base Routes '''
get_device_info     = Config.BASE+'device/unprotected'

reset_factory_base  = Config.BASE+'factoryreset'
reset_password_email = Config.BASE+'resetemail'
check_email_setting = Config.BASE+'smtp/unprotected'
verification_email = Config.BASE+'sendverificationmail'


''' Camera Routes '''
get_camera_info     = Config.CAMERA_MANAGEMENT
reset_factory_camera  = Config.CAMERA_MANAGEMENT+'factory/reset'

''' Service Routes '''
get_services        = Config.SERVICEMANAGEMENT
reset_factory_service = Config.SERVICEMANAGEMENT+'factoryreset'

''' Socket Rotes '''

''' Host Routes '''
