#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
A simple bot to gather sensor data and send it to Amazon Web Services

"""

import urllib
import urllib2
import time
import ConfigParser
import json
import logging
import sys
import socket
import onionGpio


reload(sys)
sys.setdefaultencoding('utf-8')
socket.setdefaulttimeout(2)

logging.basicConfig(filename='/root/botti.log', level=logging.DEBUG,
                    format='%(asctime)s %(message)s')
logging.debug('Starting')

CFG = ConfigParser.RawConfigParser()
# Use absolute path to your script when using init.d
CFG.read('/root/default.ini')

DEBUG = int(CFG.get("cfg", "DEBUG"))
DEVICE_NAME = CFG.get("cfg", "device_name")
AWS_API = CFG.get("cfg", "aws_api_url")

def loop():
    """ Main loop running the bot """
    # Initialize the light sensor. Note that the Gpio library
    # returns strings...
    sensorpin = CFG.get("cfg", "light_sensor_pin")
    sensor = onionGpio.OnionGpio(int(sensorpin))
    status = int(sensor.setInputDirection())
    # Check sensor status
    if status == 0:
        print "Sensor ok"
    if status == -1:
        print "Error"
        return 1

    # Get the refresh interval from Config
    refresh_interval = float(CFG.get("cfg", "refresh_interval"))

    while status == 0:
        lights = int(sensor.getValue())
        # TODO: Implement projector current sensing
        projector = 0
        timestamp = time.time()
        data = json.dumps({'device':DEVICE_NAME, "lights":lights, 'timestamp':timestamp})
        senddata("Something", data)
        time.sleep(refresh_interval)

def senddata(datatype, data):
    """ Send collected sensor data to aws """
    url = AWS_API
    msg = urllib2.Request(url, data)
    msg.add_header("Content-type", "application/json")
    msg.add_header("Accept", "application/json")
    try:
        rawresult = urllib2.urlopen(msg)
        result = rawresult.read()
    except IOError as ex:
        print "Check your internet connection and bot API-key: ", ex
        return 1
    if "SUCCESS" in result:
        #print result
        return True
    else:
        print ("Message send failed:"), result
        return False

def getcoffee():
    """ Get coffee status """
    url = CFG.get("cfg", 'coffee_bot_url')
    try:
        result = json.load(urllib.urlopen(url))
        result = result[0]
        return result['keitto'], result['levy']
    except IOError:
        logging.debug("No result from coffee sensor")
        return "kahvisensori ei vastannut", "kahvisensori ei vastannut"

logging.debug("Starting the bot")

def main():
    """ Main function """
    try:
        loop()
    except Exception as ex:
        logging.debug(ex)
        main()

main()
logging.debug("Bot exited")
