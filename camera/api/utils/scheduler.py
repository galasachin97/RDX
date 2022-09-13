from api.utils import requesthandler
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.mongodb import MongoDBJobStore
from apscheduler.executors.pool import ThreadPoolExecutor
from pymongo.mongo_client import MongoClient
from config import Config
from api.service.helpers.logs import console_logger
from api.service.helpers.tasklogger import log_task
from apscheduler.events import EVENT_JOB_ERROR, EVENT_JOB_EXECUTED
from api.service.models import *
import os
import sys
from api.utils import servicemanager, camerahealth
from api.utils import interval_manager
from api.utils.slotmanager import slotManager


def create_scheduler():
    # Initial Setup For apschedular
    jobstores = {
        "default": MongoDBJobStore(database=Config.SCHEDULER_DB, collection=Config.SCHEDULER_COLLECTION, client=MongoClient(Config.SCHEDULER_URI))
    }
    job_defaults = {
        'coalesce': False,
        'max_instances': 2,
        'misfire_grace_time': 5*60
    }
    executors = {
        'default': ThreadPoolExecutor(2)
    }
    scheduler = BackgroundScheduler(
        jobstores=jobstores,
        job_defaults=job_defaults,
        executors=executors,
        daemon=True
    )
    scheduler.add_listener(log_task, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)
    return scheduler


# def run_slot(index):
#     try:
#         inactive_uc = inactive_ai = inactive_cams = current_uc = current_ai = current_cams = None
#         current_timeslot = index
#         console_logger.debug(
#             "current_timesot: {}".format(current_timeslot))
#         if current_timeslot == "22-24":
#             # run next slot on last time slot interval
#             schedule_slots(interval_manager.convert_timeslots_to_date(
#                 datetime.datetime.now()+datetime.timedelta(days=1)))

#         current_uc, current_ai, current_cams, camera_metadata = interval_manager.CurrentSlotManager(
#         ).get_usecases_from_current_slot(current_slot=current_timeslot)

#         console_logger.debug(
#             "active_usecases: {}, active_parents: {}".format(current_uc, current_ai))

#         inactive_uc, inactive_ai, inactive_cams = interval_manager.CurrentSlotManager(
#         ).get_usecases_from_inactive_slots(current_slot=current_timeslot)

#         inactive_services = list(inactive_ai.difference(current_ai))
#         inactive_services.extend(
#             list(inactive_uc.difference(current_uc)))
#         console_logger.debug(
#             "inactive_services List: {}, inactive_cameras: {}".format(inactive_services, inactive_cams))

#         requesthandler.delete_camera_socket_many(inactive_cams)
#         request_data = requesthandler.deactivate_services(
#             inactive_services)

#         console_logger.debug(
#             "inactive_services: {}".format(inactive_uc))
#         if current_uc or current_ai:
#             request_data = requesthandler.activate_services(
#                 list(current_uc))
#         if camera_metadata:
#             requesthandler.send_camera_modules_many(camera_metadata)
#         return
#     except Exception as e:
#         console_logger.debug(e)
#         exc_type, exc_obj, exc_tb = sys.exc_info()
#         fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
#         console_logger.debug("Error on line {}".format(
#             sys.exc_info()[-1].tb_lineno))
#         return

def run_slot(index):
    try:
        timeslots = ("0-2", "2-4", "4-6", "6-8", "8-10", "10-12",
                     "12-14", "14-16", "16-18", "18-20", "20-22", "22-24")
        inactive_uc = inactive_ai = inactive_cams = current_uc = current_ai = current_cams = None
        current_timeslot = timeslots[index]
        console_logger.debug(
            "current_timesot: {}".format(current_timeslot))
        current_uc, current_ai, current_cams, camera_metadata = interval_manager.CurrentSlotManager(
        ).get_usecases_from_current_slot(current_slot=current_timeslot)

        console_logger.debug(
            "active_usecases: {}, active_parents: {}".format(current_uc, current_ai))

        inactive_uc, inactive_ai, inactive_cams = interval_manager.CurrentSlotManager(
        ).get_usecases_from_inactive_slots(current_slot=current_timeslot)
        console_logger.debug(
            "inactive_usecases: {}, inactive_parents: {}".format(inactive_uc, inactive_ai))

        inactive_services = list(inactive_ai.difference(current_ai))
        inactive_services.extend(
            list(inactive_uc.difference(current_uc)))
        console_logger.debug(
            "inactive_services List Final: {}, inactive_cameras: {}".format(inactive_services, inactive_cams))
        console_logger.debug("inactive_cams: {}".format(inactive_cams))
        requesthandler.delete_camera_socket_many(inactive_cams)
        request_data = requesthandler.deactivate_services(
            inactive_services)

        console_logger.debug(
            "inactive_services: {}".format(inactive_uc))
        if current_uc or current_ai:
            request_data = requesthandler.activate_services(
                list(current_uc))
        if camera_metadata:
            requesthandler.send_camera_modules_many(camera_metadata)
        return
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        return


# def schedule_slots(schedule, slots):
#     try:
#         console_logger.debug("adding slots")
#         for index, slot in enumerate(slots):
#             # console_logger.debug("index: {}, slot: {}".format(index, slot))
#             id = "slots: {}".format(index)
#             schedule.add_job(run_slot, 'date', name="slots", id=id,
#                              max_instances=1, run_date=slot, replace_existing=True, args=[index])
#         return
#     except Exception as e:
#         console_logger.debug(e)
#         exc_type, exc_obj, exc_tb = sys.exc_info()
#         fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
#         console_logger.debug("Error on line {}".format(
#             sys.exc_info()[-1].tb_lineno))


def schedule_slots(schedule):
    try:
        slots = (0, 2, 4, 6, 8, 10,
                 12, 14, 16, 18, 20, 22)
        for index, slot in enumerate(slots):
            id = "slots: {}".format(index)
            schedule.add_job(run_slot, 'cron', name="slots", id=id,
                             max_instances=1, hour=slot, replace_existing=True, args=[index])
        if any(CameraHealthCheck.objects()):
            if CameraHealthCheck.objects().first().HealthCheck:
                console_logger.debug("Camera Healthcheck Modified")
                schedule.add_job(camerahealth.check_cameras, 'interval', id='camera_health_check',
                                 seconds=CameraHealthCheck.objects().first().HealthCheckInterval,
                                 max_instances=1, replace_existing=True)
        return
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))


def set_schedular_flag(status):
    try:
        # set schedule flag in db accordingly activate and deactivate the services
        global schedular_object
        if any(ScheduleFlag.objects()):
            flag = ScheduleFlag.objects().first()
            flag.Status = status
            flag.save()
            console_logger.debug("Changed Status of Working Hours Flag")
            servicemanager.SocketsManager().ChangeOfScheduleHours()
            servicemanager.SocketsManager().change_of_working_hours()
            # activate deactivate services based on working hours
        else:
            ScheduleFlag(Status=status).save()
            console_logger.debug("Added Status of Working Hours Flag")
        Taskmeta(Status="success", Task_name="ChangeOfSchedularStatus",
                 Traceback=status).save()
        return None
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        Taskmeta(Status="failed", Task_name="ChangeOfSchedularStatus",
                 Traceback=str(e)).save()


def setcurrenthours(opentime, closetime):
    # current hours logic based on opentime and closetime
    today = datetime.datetime.utcnow().replace(
        minute=0, hour=0, second=0, microsecond=0)
    schedule = ScheduleRunTime.objects().first()
    if today in schedule.HolidayList:
        set_schedular_flag('UnScheduledHours')
        return
    console_logger.debug("scheduling current hours")
    time_diff = int(closetime.split(":")[0]) - int(opentime.split(":")[0])
    console_logger.debug(time_diff)
    if time_diff >= 0:
        d = datetime.datetime.strftime(
            datetime.datetime.now().date(), "%d-%m-%Y") + " "+opentime
        open = datetime.datetime.strptime(d, "%d-%m-%Y %H:%M")
        e = datetime.datetime.strftime(
            datetime.datetime.now().date(), "%d-%m-%Y") + " "+closetime
        close = datetime.datetime.strptime(e, "%d-%m-%Y %H:%M")
    else:
        d = datetime.datetime.strftime(
            datetime.datetime.now().date(), "%d-%m-%Y") + " "+opentime
        open = datetime.datetime.strptime(d, "%d-%m-%Y %H:%M")
        e = datetime.datetime.strftime(datetime.datetime.now().date(
        ) + datetime.timedelta(days=+1), "%d-%m-%Y") + " "+closetime
        close = datetime.datetime.strptime(e, "%d-%m-%Y %H:%M")
    console_logger.debug("opentime: {} , closetime: {}".format(open, close))
    console_logger.debug(close > datetime.datetime.now())
    console_logger.debug(open < datetime.datetime.now())
    if open < datetime.datetime.now() and close > datetime.datetime.now():
        set_schedular_flag('ScheduledHours')
    else:
        set_schedular_flag('UnScheduledHours')


# def schedule_hours(args):
#     # set flag for schedule hours and check if it's not holiday
#     console_logger.debug("Triggered Job Schedule")
#     if args == 'daily':
#         today = datetime.datetime.utcnow().replace(
#             minute=0, hour=0, second=0, microsecond=0)
#         schedule = ScheduleRunTime.objects().first()
#         if today not in schedule.HolidayList:
#             set_schedular_flag('ScheduledHours')
#     if args == 'holidays':
#         set_schedular_flag('ScheduledHours')
#     return None


# def unschedule_hours(args):
#     # set flag for unschedule hours
#     console_logger.debug("Triggered Job UnSchedule")

#     if args == 'daily':
#         today = datetime.datetime.utcnow().replace(
#             minute=0, hour=0, second=0, microsecond=0)
#         schedule = ScheduleRunTime.objects().first()
#         if today not in schedule.HolidayList:
#             set_schedular_flag('UnScheduledHours')

#     if args == 'holidays':
#         set_schedular_flag('UnScheduledHours')
#     return None


# def UpdateHolidaySchedule(sched):
#     ''' if holidays list changed by user in any time '''
#     console_logger.debug("Updating Holidays Crone")
#     for job in sched.get_jobs():
#         if job.name == 'holidays':
#             sched.remove_job(job.id)
#     for dates in ScheduleRunTime.objects().first().HolidayList:
#         sched.add_job(schedule_hours, 'date', name='holidays', max_instances=1,
#                       run_date=dates, replace_existing=True, args=['holidays'])
#     return None


def SyncTrigger():
    requesthandler.trigger_cloud_sync()
    return None


# def schedule_days(sched):
#     try:
#         # sets the cron for automatic scheduling and holiday logic and also camera health
#         global schedular_object
#         schedular_object = sched
#         console_logger.debug("Scheduling Job")
#         sched.add_job(camerahealth.check_cameras, 'interval', id='camera_health_check', seconds=Config.CAMERAHEALTHCHECK,
#                       max_instances=1, replace_existing=True)
#         sched.add_job(SyncTrigger, 'interval', id='alert sync trigger', seconds=Config.ALERT_REPORT_SYNC_INTERVAL,
#                       max_instances=1, replace_existing=True)
#         sched.add_job(requesthandler.delete_acknowlegment, 'interval', id='delete_socket_ack', seconds=Config.SOCKET_DELETE_ACK,
#                       max_instances=1, replace_existing=True)
#         # schedule of camerahealth job interval
#         if any(CameraHealthCheck.objects()):
#             if CameraHealthCheck.objects().first().HealthCheck:
#                 console_logger.debug("Camera Healthcheck Modified")
#                 # adding job in apschedulea
#                 # +r
#                 sched.add_job(camerahealth.check_cameras, 'interval', id='camera_health_check',
#                               seconds=CameraHealthCheck.objects().first().HealthCheckInterval,
#                               max_instances=1, replace_existing=True)
#             else:
#                 console_logger.debug("Healthcheck removed")
#                 sched.pause_job('camera_health_check')
#         # schedule of device runtime hours
#         if any(ScheduleRunTime.objects()):
#             if ScheduleRunTime.objects().first().OpenTime:
#                 scheduletime = ScheduleRunTime.objects().first().OpenTime.split(':')
#                 unscheduletime = ScheduleRunTime.objects().first().CloseTime.split(':')
#                 # adding job in apschedular
#                 sched.add_job(unschedule_hours, 'cron', id='unschedule_hours_cron', hour=unscheduletime[0],
#                               minute=unscheduletime[1], max_instances=1, replace_existing=True, args=['daily'])

#                 sched.add_job(schedule_hours, 'cron', id='schedule_hours_cron', hour=scheduletime[0],
#                               minute=scheduletime[1], max_instances=1, replace_existing=True, args=['daily'])
#             # schedule of holiday list
#             for dates in ScheduleRunTime.objects().first().HolidayList:
#                 sched.add_job(unschedule_hours, 'date', name='holidays', max_instances=1,
#                               run_date=dates, replace_existing=True, args=['holidays'])
#         return None
#     except Exception as e:
#         console_logger.debug(e)
#         exc_type, exc_obj, exc_tb = sys.exc_info()
#         fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
#         console_logger.debug("Error on line {}".format(
#             sys.exc_info()[-1].tb_lineno))
