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
from flask import Flask, request, render_template, jsonify, flash, redirect, url_for, stream_with_context, Response
import webbrowser
from threading import Timer
from dateutil.parser import parse
import datetime

UPLOAD_FOLDER = './uploads'
STATIC_FOLDER = '../static/dist/static'
ALLOWED_EXTENSIONS = {'dat', 'xml', 'mp4'}

app = Flask(__name__, static_folder="../static/dist", template_folder="../static")
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['STATIC_FOLDER'] = STATIC_FOLDER
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
video_files = []

data = []
meta_data = []
meta_data_obj = None

half_lengths = []

period_1_length = 0
period_2_length = 0
period_3_length = 0
period_4_length = 0


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
        self.x_pos = player_data[3]
        self.y_pos = player_data[4]


class Ball:
    def __init__(self, ball_data):
        ball = re.split('[,]', ball_data[1:])
        self.x_pos = ball[0]
        self.y_pos = ball[1]
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
        self.seconds = 0
        self.period_seconds = 0
        self.period_frame = 0
        self.frame = 0
        self.fps = 0

    def set_players(self, players):
        for i in range(len(players)):
            self.players.append(Player(players[i]))

    def set_ball(self):
        self.ball = Ball(self.ball)

    def set_time(self, second, period, period_seconds, period_frame, frame, fps):
        self.period = period
        self.time = str(datetime.timedelta(seconds=second))
        self.seconds = second+(fps*0.04)
        self.period_seconds = period_seconds+(fps*0.04)
        self.frame = frame
        self.period_frame = period_frame
        self.fps = fps

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


def increment_period_frame(period_no):
    global period_1_length, period_2_length, period_3_length, period_4_length
    if period_no == 1:
        period_1_length = period_1_length + 1
    elif period_no == 2:
        period_2_length = period_2_length + 1
    elif period_no == 3:
        period_3_length = period_3_length + 1
    elif period_no == 4:
        period_4_length = period_4_length + 1


def clean_data(data, filepath, filename, callback=None):
    global current_frame, meta_data_obj, progress_str, meta_data, progress_percentage
    iter = 0
    period_iter = 0
    seconds = 0
    period_seconds = 0
    fps = 0

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
            period_seconds = 0
            period_iter = 0
            seconds = 2700
        elif period_no == 3 and int(period_start_no) == int(temp[0]):
            period_seconds = 0
            period_iter = 0
            seconds = 5400
        elif period_no == 4 and int(period_start_no) == int(temp[0]):
            period_seconds = 0
            period_iter = 0
            seconds = 6300

        if iter % 25 == 0:
            seconds = seconds+1
            period_seconds = period_seconds + 1
            fps = 0

        frame.set_time(seconds, period_no, period_seconds, period_iter, iter, fps)
        del data[i][0]
        del data[i][len(data[i]) - 1]
        frame.set_ball()
        current_frame = frame
        frame.set_players(data[i])
        meta_data_obj.place_start_periods(int(current_frame.timestamp), iter)
        frames.append(frame.toJSON())
        iter = iter+1
        period_iter = iter+1
        fps = fps+1
        increment_period_frame(period_no)
        progress_percentage = [i, len(data), int(round(i/len(data)*100))]

    if callback:
        callback()


def get_data(n):
    if n > len(frames)-1:
        return frames[len(frames)-1]
    return jsonify(frames[n])


def get_past_data(n, size):
    if n > len(frames)-1:
        return frames[len(frames)-1]
    elif not frames[n-size]:
        return frames[0]

    trail = []
    for i in range(size):
        trail.append(frames[n-i])
    return jsonify(trail)


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
    elif filename.rsplit('.', 1)[1].lower() == "mp4":
        return "mp4"


@app.route("/data_length")
def data_length():
    return str(len(frames))


@app.route("/period_length")
def period_length():
    return jsonify([period_1_length, period_2_length, period_3_length, period_4_length])


@app.route("/video_details")
def video_details():
    return jsonify(video_files)


@app.route("/data")
def data():
    frame = request.args.get('frame')
    return get_data(int(frame))


@app.route("/trail_data")
def trail_data():
    frame = request.args.get('frame')
    size = request.args.get('size')
    return get_past_data(int(frame), int(size))


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

        filetype = check_file_type(filename)

        if filetype == 'mp4':
            filepath = os.path.join(app.config['STATIC_FOLDER'], filename)

        if not os.path.isfile(filepath):
            file.save(filepath)

        if filetype == "xml":
            handle_meta_data(filepath)
        elif filetype == "dat":
            process_data(filepath, filename)
        elif filetype == "mp4":
            handle_video_file(filepath, filename)

        return redirect(url_for('uploaded_file', filename=filename))


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return check_file_type(filename)


@app.route("/has_data")
def has_data():
    if len(frames) > 0 and len(meta_data) > 0:
        return "1"
    return "0"


def shutdown_server():
    func = request.environ.get('werkzeug.server.shutdown')
    if func is None:
        raise RuntimeError('Not running with the Werkzeug Server')
    func()


@app.route('/terminate', methods=['POST'])
def terminate():
    shutdown_server()
    return 'Server shutting down...'


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


def handle_video_file(filepath, filename):
    video_files.append([filename, filepath])


def process_data(filepath, filename):
    data = [i.strip().split(';') for i in open(filepath).readlines()]
    clean_data(data, filepath, filename, update_meta)


if __name__ == "__main__":
    run_app()
