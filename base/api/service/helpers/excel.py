from logging import exception
import xlsxwriter
import datetime
import json
import os
import sys
import time
from api.service.helpers.logs import console_logger
from config import TestConfig as config


def generate_excelsheet(entries):
    try:
        console_logger.debug("saving reports to excel")
        filename = "{}/alerts.xlsx".format(config.STATICFILE_DIR)

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

        imagesize = {'x_offset': 10, 'y_offset': 10,
                     'x_scale': 0.3, 'y_scale': 0.3, 'positioning': 1}

        headers = ["Ticket No.", "Service Id", "Location",
                   "Alert", "Date", "Time", "Camera Name", "Image"]
        for index, header in enumerate(headers):
            worksheet.write(0, index, header, cell_format2)

        row = 1
        for data in entries:
            worksheet.write(row, 0, data["Ticket_number"], cell_format)
            worksheet.write(row, 1, data["Service_id"], cell_format)
            worksheet.write(row, 2, data["Location"], cell_format)
            worksheet.write(row, 3, data["Alert"], cell_format)
            worksheet.write(row, 4, str(data["Date"]), cell_format)
            worksheet.write(row, 5, str(data["Time"]), cell_format)
            worksheet.write(row, 6, data["Camera_name"], cell_format)
            col = 7
            for img in data.get('Image_path'):
                if os.path.exists(img):
                    worksheet.insert_image(row, col, img, imagesize)
                else:
                    worksheet.insert_image(row, col, os.path.join(
                        os.getcwd(), 'static_server', config.STATIC_IMAGE), imagesize)
                col += 1
            row += 1

        workbook.close()

        data = json.loads(open("./mounts/env.json", 'r').read())
        # fileurl = "http://{}:{}/static_server/alerts.xlsx".format(
        #     data["HOST"], data["PORT"])
        fileurl = "/static_server/alerts.xlsx"
        time.sleep(1)
        return fileurl, "alert"
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        return None


def get_report_headers(data):
    headers = ["Report_number", "Camera_name", "Location", "Date", "Time"]
    headers[-2:-2] = data[0].payload().get("Report_data")
    out = map(lambda x: x.title().replace("_", ""), headers)
    console_logger.debug(headers)
    return headers, list(out)


def preprocess_data(headers, data):
    t_data = []
    for d in data:
        f = dict()
        for key, value in d.payload(local=True).items():
            if key in headers:
                f[key] = value
            else:
                if key == 'Report_data':
                    for n in d[key]:
                        console_logger.debug(n)
                        f[n] = d[key][n]
                        # f[n['Metric']] = n['Total']
                        # if n['Metric'] in headers:
                        #     f[n['Metric']] = n['Total']
        t_data.append(f)
    return t_data


def generate_excelsheet_report(entries):
    try:
        filename = "{}/report.xlsx".format(config.STATICFILE_DIR)

        workbook = xlsxwriter.Workbook(filename)
        cell_format2 = workbook.add_format()
        cell_format2.set_bold()
        cell_format2.set_font_size(12)
        cell_format2.set_align('center')
        cell_format2.set_align('vjustify')

        worksheet = workbook.add_worksheet()

        worksheet.set_column('A:AD', 50)
        worksheet.set_default_row(120)
        imagesize = {'x_offset': 10, 'y_offset': 10,
                     'x_scale': 0.3, 'y_scale': 0.3, 'positioning': 1}

        cell_format = workbook.add_format()
        cell_format.set_font_size(11)
        cell_format.set_align('center')
        cell_format.set_align('vcenter')

        headers, bheaders = get_report_headers(entries)
        entries = preprocess_data(headers, entries)
        # final_headers =
        for index, header in enumerate(bheaders):
            worksheet.write(0, index, header, cell_format2)

        row = 1
        for entry in entries:
            col = 0
            for key, value in entry.items():
                if str(entry[headers[col]]).split(".")[-1] in ["jpg", "png"]:
                    console_logger.debug(
                        "image_found: {}".format(entry[headers[col]]))
                    if not os.path.exists(entry[headers[col]]):
                        worksheet.insert_image(row, col, os.path.join(
                            os.getcwd(), 'static_server', config.STATIC_IMAGE), imagesize)
                    else:
                        worksheet.insert_image(
                            row, col, entry[headers[col]], imagesize)
                else:
                    worksheet.write(row, col, str(
                        entry[headers[col]]), cell_format)
                col += 1
            row += 1

        workbook.close()

        data = json.loads(open("./mounts/env.json", 'r').read())
        fileurl = "http://{}:{}/static_server/report.xlsx".format(
            data["HOST"], data["PORT"])
        console_logger.debug(fileurl)
        return fileurl, "report"
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        return None
