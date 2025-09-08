#!/bin/bash

# Navigate to project folder
cd /outs_above_average

# Run python script
python fetch_oaa.py

# Don't forget to make this file executable with: chmod +x update_oaa.sh
# And set up a cron job to run it periodically, e.g.:
# crontab -e
# Add the following line to run it daily at 2am:
# 0 2 * * * /outs_above_average/update_oaa.sh >> /