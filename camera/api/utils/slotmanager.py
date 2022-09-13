from api.service.helpers.logs import console_logger
from api.service.models import TimeSlots, Global

import datetime


class SlotManager:

    def __init__(self) -> None:
        self.timeslots = ("0-2", "2-4", "4-6", "6-8", "8-10", "10-12",
                          "12-14", "14-16", "16-18", "18-20", "20-22", "22-24")
        self.new_timeslots = (0, 2, 4, 6, 8, 10,
                              12, 14, 16, 18, 20, 22)
        self.time_hrs = ("00:00", "02:00", "04:00", "06:00", "08:00",
                         "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00")
        # self.scheduler = create_scheduler().start()

    def convert_timeslots_to_date(self, dateObject):
        date_list = []
        console_logger.debug(dateObject)
        for timeslot in self.time_hrs:
            date_list.append(datetime.strptime(datetime.strftime(
                dateObject.date(), "%d/%m/%Y ")+"{}".format(timeslot), "%d/%m/%Y %H:%M"))
        return date_list

    def get_current_timeslot(self):
        job_list = self.scheduler.get_jobs(pending=True)
        pending_job_list = []
        for job in job_list:
            if job.name == "slots":
                pending_job_list.append(job.args[0])
        pending_job_list.sort()
        return self.timeslots[pending_job_list[0]-1]

    def set_timeslots_default(self):
        slot_list = []
        for slot in self.timeslots:
            g_data = Global(Cameras=[], Usecases=[],
                            Dependent=[], AI=[]).save()
            slot_list.append(TimeSlots(**{"TimeSlot": slot, "Global": g_data}))
        console_logger.debug(slot_list)
        TimeSlots.objects.insert(slot_list)
        return


slotManager = SlotManager()
