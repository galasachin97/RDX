from apscheduler.schedulers.background import BlockingScheduler
from expiringdict import ExpiringDict
import uuid
import copy

from helpers.logs import console_logger

class Acknowledgement:
    def __init__(self) -> None:
        self.cache = ExpiringDict(max_len=100, max_age_seconds=60)
        self.socketio = None
        self.sched = BlockingScheduler(misfire_grace_time=20)
        self.interval = 10
    
    def generate_id(self):
        return uuid.uuid1().hex

    def add(self, id, dictionary):
        self.cache[id] = copy.deepcopy(dictionary)
    
    def remove(self, id):
        self.cache.pop(id)

    def process(self):
        try:
            for key in self.cache.keys():
                console_logger.debug(key)
                console_logger.debug(self.cache[key]['channel'])
                console_logger.debug(self.cache[key]['room'])
                self.socketio.emit(
                    self.cache[key]['channel'],
                    self.cache[key]['message'] if 'message' in self.cache[key] else None,
                    room=self.cache[key]['room']
                )
        except KeyError:
            pass
        except RuntimeError:
            pass

    def run(self, socketio):
        
        self.socketio = socketio
        self.sched.add_job(self.process, 'interval', seconds=self.interval)
        self.sched.start()

acknowledge = Acknowledgement()

