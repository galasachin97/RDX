import os, xlrd
from api.service.helpers.logs import console_logger

def get_dates(file_name) -> list:
    # get holiday dates from reading uploaded excel
    wb = xlrd.open_workbook(file_name)
    sh = wb.sheet_by_index(0)
    date_list = []
    for rownumb in range(0,sh.nrows):       
        console_logger.debug(xlrd.xldate.xldate_as_datetime(sh.row(rownumb)[0].value, wb.datemode))
        date_list.append(xlrd.xldate.xldate_as_datetime(sh.row(rownumb)[0].value, wb.datemode))
    console_logger.debug(date_list)
    return date_list