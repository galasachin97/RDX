from api.service.helpers.logs import console_logger
from api.service.models import *
import base64
import datetime
from config import TestConfig as config
from logging import exception
import xlsxwriter
import json
import os
import sys
import time

class AnprOperations:
    
    def __init__(self):
        self.data = {
                "labels":[],
                "dataset":[
                    {
                        "label":"IN",
                        "data":[]
                    },
                    {
                        "label":"OUT",
                        "data":[]
                    }
                    ]
                }
    
    def ImageConversion(self, string):
        image_as_bytes = str.encode(string)  # convert string to bytes
        img_recovered = base64.b64decode(image_as_bytes)  # decode base64string
        return img_recovered
    
    def GetAnprDetails(self, **kwargs):
        try:
            for strname, strimage in [['vehicle', kwargs['vehicle_image']], ['numplate',kwargs['number_plate']]]:
                base64_image = self.ImageConversion(strimage)
                self.WriteBase64Images(kwargs['path'], strname, kwargs["vehicle_number"], base64_image)
                
            kwargs['vehicle_image'] = f"/static_server/anpr/vehicle_{kwargs['vehicle_number']}.png"
            kwargs['number_plate'] = f"/static_server/anpr/numplate_{kwargs['vehicle_number']}.png"
            
            del kwargs['path']
            
            AnprDetails(**kwargs).save()
            console_logger.debug(kwargs["vehicle_number"])
            
        except Exception as e:
            console_logger.debug(e)
            return False
    
    def WriteBase64Images(self, path, image_tag, image_name, base64_string):
        with open(os.path.join(path,f'{image_tag}_{image_name}.png'), "wb") as f:
            f.write(base64_string)
            f.close()
    
    def GetCountAvg(self):
        query = {
            "visited_datetime__gte": datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        }
        data_count = AnprDetails.objects(**query).count()
        data_avg = 0
        if data_count != 0:
            if data_count < 24:
                data_avg = int(data_count / data_count)
            else:
                data_avg = int(data_count / 24)
        else:
            data_avg = 0
        detail = {"vehicle_count":data_count,"per_hr_avg":data_avg}
        console_logger.debug(detail)
        return detail

    def ClearDataFromInitData(self):
        self.data['labels'] = []
        self.data['dataset'][0]["data"] = []
        self.data['dataset'][1]["data"] = []
        
    def GetHoursWiseData(self):
        try:
            self.ClearDataFromInitData()
            query = {}
            for hr in range(0,24,2):
                if hr == 22:
                    from_hr = hr
                    to_hr = 0
                else:
                    from_hr = hr
                    to_hr = hr + 2
                    
                query = {
                    "direction": "IN",
                    "visited_datetime__gte": datetime.datetime.utcnow().replace(hour=from_hr, minute=0, second=0, microsecond=0),
                    "visited_datetime__lte": datetime.datetime.utcnow().replace(hour=to_hr, minute=0, second=0, microsecond=0)
                }
                
                data_count = AnprDetails.objects(**query).count()
                
                self.data['labels'].append('{}-{}'.format(from_hr, to_hr))
                self.data['dataset'][0]["data"].append(data_count)
            return self.data
        except Exception as e:
            console_logger.debug(e)
            return False
    
    def GetWeekWiseData(self):
        try:
            self.ClearDataFromInitData()
            yesterday = datetime.date.today() - datetime.timedelta(days = 1)
            for day in range(0,7):
                date = yesterday - datetime.timedelta(days = day)
                datetime_date = datetime.datetime.combine(date, datetime.datetime.min.time())
                
                query = {
                    "direction": "IN",
                    "visited_datetime__gte": datetime_date,
                    "visited_datetime__lte": datetime_date.replace(hour=23, minute=59, second=59, microsecond=0)
                }
                
                data_count = AnprDetails.objects(**query).count()
                
                self.data['labels'].append(datetime.datetime.strftime(datetime_date, '%d-%b'))
                self.data['dataset'][0]["data"].append(data_count)
            return self.data
        except Exception as e:
            console_logger.debug(e)
            return False
    
    def GetMothWiseDate(self):
        try:
            self.ClearDataFromInitData()
            current_year = datetime.datetime.today().year
            for month in range(1, 13):
                datetime_month_start_date = datetime.datetime.strptime('{}-{}-01'.format(current_year, month), '%Y-%m-%d')
                next_month_date = datetime.date(current_year, month, 1).replace(day=28) + datetime.timedelta(days=4)
                month_last_date = next_month_date - datetime.timedelta(days=next_month_date.day)
                datetime_month_last_date = datetime.datetime.combine(month_last_date, datetime.datetime.min.time())
                
                query = {
                    "direction": "IN",
                    "visited_datetime__gte": datetime_month_start_date,
                    "visited_datetime__lte": datetime_month_last_date.replace(hour=23, minute=59, second=59, microsecond=0)
                }
                data_count = AnprDetails.objects(**query).count()
                
                self.data['labels'].append(datetime.datetime.strftime(datetime_month_start_date, '%b'))
                self.data['dataset'][0]["data"].append(data_count)
            return self.data
        except Exception as e:
            console_logger.debug(e)
            return False

    def alerts_count(self):
        query = {
            "visited_datetime__gte": datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        }
        alert_objects = AnprDetails.objects(**query).count()
        console_logger.debug(alert_objects)
        return alert_objects
    
class ExcelOperations:
    
    def __init__(self):
        pass
    
    def generate_excelsheet(self,entries):
        try:
            console_logger.debug("saving reports to excel")
            filename = "{}/report.xlsx".format(config.STATICFILE_DIR)

            workbook = xlsxwriter.Workbook(filename)
            cell_format2 = workbook.add_format()
            cell_format2.set_bold()
            cell_format2.set_font_size(12)
            cell_format2.set_align('center')
            cell_format2.set_align('vjustify')

            worksheet = workbook.add_worksheet()

            worksheet.set_column('A:AZ', 50)
            worksheet.set_default_row(120)

            cell_format = workbook.add_format()
            cell_format.set_font_size(11)
            cell_format.set_align('center')
            cell_format.set_align('vcenter')

            imagesize = {'x_offset': 10, 'y_offset': 10,'x_scale': 0.3, 'y_scale': 0.3, 'positioning': 1}
            
            headers = []
            for data in entries:
                for key,value in data.items():
                    headers.append(key.replace("_", ' '))
                break
            for index, header in enumerate(headers):
                worksheet.write(0, index, header, cell_format2)

            row = 1
            for data in entries:
                col = 0
                for key, value in data.items():
                    if '.jpg' in value or '.png' in value or '.jpeg' in value:
                        image = os.path.join(os.getcwd(), value)
                        if os.path.exists(image):
                            worksheet.insert_image(row, col, image, imagesize)
                        else:
                            worksheet.insert_image(row, col, os.path.join(os.getcwd(), 'static_server', config.STATIC_IMAGE), imagesize)
                    else:
                        worksheet.write(row, col, value, cell_format)
                    col += 1
                row += 1

            workbook.close()

            fileurl = "/static_server/report.xlsx"
            time.sleep(1)
            return fileurl
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
            return None