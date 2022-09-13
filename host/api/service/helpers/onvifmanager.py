# from valkka.discovery import runWSDiscovery
# from onvif import ONVIFCamera, exceptions
# from collections import Counter
# import os

# from api.service.helpers.logs import console_logger


# class OnvifPython:
#     def __init__(self) -> None:
#         self.wsdlPath = os.path.join(os.getcwd(), "api", "service", "helpers", "wsdl")
#         self.cameraNames = []

#     def discovery(self):
#         return runWSDiscovery()

#     # def saveSnapshot(self, username, password, url):


#     def getOnvifDetail(self, ip, port, username, password):
#         try:
#             cam = ONVIFCamera(ip, port, username, password, self.wsdlPath)
#             hostname = (cam.devicemgmt.GetHostname()).Name
#             mediaService = cam.create_media_service()
#             profiles = mediaService.GetProfiles()
#             camUri = mediaService.create_type('GetStreamUri')
#             camSnapshot = mediaService.create_type('GetSnapshotUri')
#             token = profiles[0].token
#             camUri.ProfileToken = token
#             camSnapshot.ProfileToken = token
#             camUri.StreamSetup = {'Stream': 'RTP-Unicast', 'Transport': {'Protocol': 'RTSP'}}
#             camSnapshot = mediaService.GetSnapshotUri(camSnapshot).Uri
#             camUri = mediaService.GetStreamUri(camUri).Uri
            
#             self.cameraNames.append(hostname)
#             counter = Counter(self.cameraNames)
#             count = counter[hostname]
#             if count > 1:
#                 hostname = "{}_{}".format(hostname, count-1)

#             return {
#                 "camera_name": hostname,
#                 "snapshot": camSnapshot,
#                 "link": camUri
#             }
#         except exceptions.ONVIFError:
#             return {}
    
#     def getCameraDetails(self, username, password, port=80):
#         localCameras = self.discovery()

#         for cameraIp in localCameras:
#             cameraDetails = self.getOnvifDetail(cameraIp, port, username, password)


# #     def stream(self, width, height, bitRate, frameRate):

# #         # uname = input("Enter username: ")
# #         # passw = input("Enter password: ")
# #         uname = 'admin'
# #         passw = 'admin@123'

# #         ips = self.discovery()

# #         cam = ONVIFCamera(ips[0], 80, uname, passw, '/home/diycam/Projects/python-onvif-zeep/wsdl/')
# #         # resp = cam.devicemgmt.GetHostname()
# #         # print(resp)

# #         media_service = cam.create_media_service()
# #         profiles = media_service.GetProfiles()

# #         display = cam

# #         # sources = media_service.GetVideoSources()   # this gives the list of video sources and its 
# #         #                                             # max, min resolution and max frame rate on which our
# #         #                                             # device can operate on
# #         # print(sources)
# #         # print(profiles)

# #         for ip in ips:
            
# #             obj = media_service.create_type('GetStreamUri')
# #             obj = media_service.create_type('GetSnapshotUri')    #Turn me on to get a snapshot
# #             token = profiles[0].token
# #             obj.ProfileToken = token
# #             # snapshot.ProfileToken = profiles[0].token
# #             output_snap_uri = media_service.GetSnapshotUri(obj)    #Turn me on to get a snapshot
# #             obj.StreamSetup = {'Stream': 'RTP-Unicast', 'Transport': {'Protocol': 'RTSP'}}
# #             url = media_service.GetStreamUri(obj).Uri
# #             # print(uri)

# #             uriRTSPEnd = url[7:]
# #             uri = url[:6] + '/' + uname + ':' + passw + '@' + uriRTSPEnd
# #             rtsplinks.append(uri)

# #             uriSnapshot = output_snap_uri.Uri                      #Turn me on to get a snapshot                               
# #             uriSnapshotEnd = uriSnapshot[7:]                       #Turn me on to get a snapshot
# #             uriSnapshot = uriSnapshot[:6] + '/' + uname + ':' + passw + '@' + uriSnapshotEnd      #Turn me on to get a snapshot

# #             # Get all video encoder configurations
# #             configurations_list = media_service.GetVideoEncoderConfigurations()

# #             # Use the first profile and Profiles have at least one
# #             video_encoder_configuration = configurations_list[0]

# #             # Get video encoder configuration options
# #             options = media_service.GetVideoEncoderConfigurationOptions({'ProfileToken':token})

# #             # Setup stream configuration
# #             video_encoder_configuration.Encoding = 'H264'

# #             # Setup Resolution
# #             video_encoder_configuration.Resolution.Width = \
# #                             options.H264.ResolutionsAvailable[0].Width=1280    #options.H264.ResolutionsAvailable[0].Width = <width
# #             video_encoder_configuration.Resolution.Height = \
# #                             options.H264.ResolutionsAvailable[0].Height=720    #options.H264.ResolutionsAvailable[0].Height = <height

# #             # Setup FramRate
# #             video_encoder_configuration.RateControl.FrameRateLimit = \
# #                                             options.H264.FrameRateRange.Min=25  #options.H264.FrameRateRange.Min = <int>

# #             # Setup Bitrate
# #             # video_encoder_configuration.RateControl.BitrateLimit = \
# #             #                         options.Extension.H264[0].BitrateRange[0].Min[0]
# #             video_encoder_configuration.RateControl.BitrateLimit = 3000

# #             # Create request type instance
# #             request = media_service.create_type('SetVideoEncoderConfiguration')
# #             request.Configuration = video_encoder_configuration
# #             # ForcePersistence is obsolete and should always be assumed to be True
# #             request.ForcePersistence = True

# #             # Set the video encoder configuration
# #             media_service.SetVideoEncoderConfiguration(request)

# #             profiles = media_service.GetProfiles()

# #         # print(profiles[0]['VideoSourceConfiguration'])
# #         # print(profiles[0]['VideoEncoderConfiguration'])
# #         # print("URI for snapshot: {}".format(output_snap_uri.Uri))
# #         # print(rtsplinks)

# #         # # print ('My camera`s hostname: ' + str(resp.Name))
# #         vcap = cv2.VideoCapture(rtsplinks[0])
# #         while(True):
# #             ret, frame = vcap.read()
# #             cv2.imshow('VIDEO', frame)
# #             cv2.waitKey(1)

# #             if cv2.waitKey(1) == 27:
# #                 break

# # def main():
# #     width = 1280
# #     height = 720
# #     bitRate = 768
# #     frameRate = 25

# #     op = OnvifPython()

# #     op.stream(width, height, bitRate, frameRate)

# # rtsplinks = []

# # if __name__ == "__main__":
# #     main()
