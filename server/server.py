import pandas
import random
import sys
import os
import math
import re
import json
import time
from tqdm import tqdm
from xml.dom import minidom
from werkzeug.utils import secure_filename
from flask import Flask, request, render_template, jsonify, flash, redirect, url_for
import webbrowser
from threading import Timer
from dateutil.parser import parse
import datetime

UPLOAD_FOLDER = './uploads'
ALLOWED_EXTENSIONS = {'dat', 'xml'}

app = Flask(__name__, static_folder="../static/dist", template_folder="../static")
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.secret_key = 'super secret key'
app.config['SESSION_TYPE'] = 'filesystem'

progress_str = ""
progress_percentage = []

w = 1360
h = 916
buffer = 40

frames = []
current_frame = -1

data_file = ""
meta_file = ""

data = []
meta_data = []
meta_data_obj = None


def scale_coords(x, y):
    return (w / 2 + (int(x) * 0.12)), (h / 2 + (-int(y) * 0.12))


def check_possession():
    return str(current_frame.ball.possession)


def calculate_distance(x1, y1, x2, y2):
    x1, y1 = scale_coords(x1, y1)
    x2, y2 = scale_coords(x2, y2)

    dist = math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
    return dist


def get_start_frame(period_no):
    return meta_data.periods[str(period_no)]["start_frame"]


def handle_teams(team_id):
    if team_id == 1:
        return 'H'
    elif team_id == 0:
        return 'A'
    else:
        return ''


class Player:
    def __init__(self, player_data):
        player_data = player_data.split(',')
        self.team_id = int(player_data[0])
        self.tag_id = player_data[1]
        self.shirt_number = player_data[2]
        self.team = handle_teams(self.team_id)
        coords = scale_coords(player_data[3], player_data[4])
        self.x_pos = coords[0]
        self.y_pos = coords[1]
        self.orig_coords_x = player_data[3]
        self.orig_coords_y = player_data[4]


class Ball:
    def __init__(self, ball_data):
        ball = re.split('[,]', ball_data[1:])
        coords = scale_coords(ball[0], ball[1])
        self.x_pos = coords[0]
        self.y_pos = coords[1]
        self.z_pos = ball[2]
        self.speed = ball[3]
        self.possession = ball[4]
        self.status = ball[5]
        if len(ball) == 7:
            self.has_action = True
            self.action = ball[6]
        else:
            self.has_action = False
            self.action = -1


class DataStruct():
    def __init__(self, index, timestamp, ball):
        self.index = index
        self.timestamp = timestamp
        self.ball = ball
        self.players = []
        self.time = 0,
        self.period = 0

    def set_players(self, players):
        for i in range(len(players)):
            self.players.append(Player(players[i]))

    def set_ball(self):
        self.ball = Ball(self.ball)

    def set_time(self, second, period):
        self.period = period
        self.time = str(datetime.timedelta(seconds=second))

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__,sort_keys=True, indent=4)


class MetaData:
    def __init__(self, match_id, date):
        self.match_id = match_id
        self.date = date
        self.periods = {}
        self.start_periods = []

    def place_start_periods(self, timestamp, iterator):
        periods = self.get_periods()
        if int(timestamp) == int(periods[0]) or int(timestamp) == int(periods[2]) or int(timestamp) == int(periods[4]) or int(timestamp) == int(periods[6]):
            self.start_periods.append(iterator)

    def set_periods(self, periods):
        for i in range(len(periods)):
            period_frames = {"start_frame": periods[i].attributes["iStartFrame"].value, "end_frame": periods[i].attributes["iEndFrame"].value}
            self.periods[periods[i].attributes["iId"].value] = period_frames

    def get_periods(self):
        return [int(self.periods['1']['start_frame']), int(self.periods['1']['end_frame']),
               int(self.periods['2']['start_frame']), int(self.periods['2']['end_frame']),
               int(self.periods['3']['start_frame']), int(self.periods['3']['end_frame']),
               int(self.periods['4']['start_frame']), int(self.periods['4']['end_frame'])]

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__,sort_keys=True, indent=4)


def in_periods(timestamp):
    periods = meta_data_obj.get_periods()

    if (periods[0] != 0) and (periods[1] != 0) and periods[0] <= int(timestamp) <= periods[1]:
        return True, periods[0], 1
    elif (periods[2] != 0) and (periods[3] != 0) and periods[2] <= int(timestamp) <= periods[3]:
        return True, periods[2], 2
    elif (periods[4] != 0) and (periods[5] != 0) and periods[4] <= int(timestamp) <= periods[5]:
        return True, periods[4], 3
    elif (periods[6] != 0) and (periods[7] != 0) and periods[6] <= int(timestamp) <= periods[7]:
        return True, periods[6], 4

    return False, -1, -1


def clean_data(data, filepath, filename, callback=None):
    global current_frame, meta_data_obj, progress_str, meta_data, progress_percentage
    iter = 0
    seconds = 0
    # 2700 second = 45 minutes
    for i in range(len(data)):
        temp = re.split('[:]', data[i][0])
        in_period, period_start_no, period_no = in_periods(temp[0])
        if not (None is meta_data_obj) and not in_period:
            continue
        del data[i][0]
        data[i].insert(0, temp[0])
        data[i].insert(1, temp[1])
        del data[i][len(data[i]) - 1]
        frame = DataStruct(iter, data[i][0], data[i][len(data[i])-1])
        if period_no == 2 and int(period_start_no) == int(temp[0]):
            seconds = 2700
        elif period_no == 3 and int(period_start_no) == int(temp[0]):
            seconds = 5400
        elif period_no == 4 and int(period_start_no) == int(temp[0]):
            seconds = 6300
        if iter % 25 == 0:
            seconds = seconds+1
        frame.set_time(seconds, period_no)
        del data[i][0]
        del data[i][len(data[i]) - 1]
        frame.set_ball()
        current_frame = frame
        frame.set_players(data[i])
        meta_data_obj.place_start_periods(int(current_frame.timestamp), iter)
        frames.append(frame.toJSON())
        iter = iter+1
        #progress_str = "Processing: "+str(i)+" / "+str(len(data))+" - "+str(round(i/len(data)*100))+"%"
        progress_percentage = [i, len(data), int(round(i/len(data)*100))]
        #print('\r', progress_str, end='')

    #filepath = os.path.join(app.config['UPLOAD_FOLDER'], str(filename.split(".")[0])+".processed.json")
    #with open(filepath, 'w') as json_file:
    #    json.dump(frames, json_file, separators=(',', ':'))

    if callback:
        callback()


def get_data(n):
    if n > len(frames)-1:
        return frames[len(frames)-1]
    return jsonify(frames[n])


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def check_file_type(filename):
    global data_file, meta_file
    if filename.rsplit('.', 1)[1].lower() == "xml":
        meta_file = UPLOAD_FOLDER+"/"+filename
        return "xml"
    elif filename.rsplit('.', 1)[1].lower() == "dat":
        data_file = UPLOAD_FOLDER+"/"+filename
        return "dat"


@app.route("/data_length")
def data_length():
    return str(len(frames))


@app.route("/data")
def data():
    frame = request.args.get('frame')
    return get_data(int(frame))


@app.route("/meta")
def meta():
    return jsonify(meta_data)


@app.route("/progress")
def progress():
    return jsonify(progress_percentage)


@app.route("/upload_file", methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        flash('No file part')
        return redirect(request.url)
    file = request.files['file']
    # if user does not select file, browser also
    # submit an empty part without filename
    if file.filename == '':
        flash('No selected file')
        return redirect(request.url)
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        if not os.path.isfile(filepath):
            file.save(filepath)

        if check_file_type(filename) == "xml":
            handle_meta_data(filepath)
        else:
            process_data(filepath, filename)
        return redirect(url_for('uploaded_file', filename=filename))


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return check_file_type(filename)


@app.route("/")
def index():
    return render_template("index.html")


def open_browser():
    webbrowser.open_new('http://127.0.0.1:5000/')


def run_app():
    Timer(1, open_browser).start()
    app.run()


def update_meta():
    global meta_data, meta_data_obj
    meta_data = meta_data_obj.toJSON()


def handle_meta_data(filename):
    global meta_data, meta_data_obj
    meta_doc = minidom.parse(filename)
    match = meta_doc.getElementsByTagName("match")
    meta = MetaData(match[0].attributes["iId"].value, match[0].attributes["dtDate"].value)
    meta.set_periods(meta_doc.getElementsByTagName("period"))
    meta_data_obj = meta
    meta_data = meta.toJSON()


def process_data(filepath, filename):
    data = [i.strip().split(';') for i in open(filepath).readlines()]
    clean_data(data, filepath, filename, update_meta)


if __name__ == "__main__":
    run_app()
