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

UPLOAD_FOLDER = './uploads'
ALLOWED_EXTENSIONS = {'dat', 'xml'}

app = Flask(__name__, static_folder="../static/dist", template_folder="../static")
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.secret_key = 'super secret key'
app.config['SESSION_TYPE'] = 'filesystem'

w = 1360
h = 916
buffer = 40

frames = []
current_frame = -1

h_team = []
a_team = []

data_file = ""
meta_file = ""

data = []
meta_data = []


def scale_coords(x, y):
    return (w / 2 + (int(x) * 0.12)), (h / 2 + (-int(y) * 0.12))


def add_to_team(identifyer, tag_id):
    if identifyer == "H":
        h_team.append(int(tag_id))
        return "H"
    else:
        a_team.append(int(tag_id))
        return "A"


def check_possession():
    return str(current_frame.ball.possession)


def calculate_distance(x1, y1, x2, y2):
    x1, y1 = scale_coords(x1, y1)
    x2, y2 = scale_coords(x2, y2)

    dist = math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
    return dist


def get_start_frame(period_no):
    return meta_data.periods[str(period_no)]["start_frame"];


def handle_teams(tag_id, x, y):
    if int(tag_id) in h_team:
        return 'H'
    elif int(tag_id) in a_team:
        return 'A'
    elif int(tag_id) not in h_team or tag_id not in a_team:
        dist = calculate_distance(x, y, current_frame.ball.x_pos, current_frame.ball.y_pos)
        if dist < buffer:
            return add_to_team(check_possession(), tag_id)
        elif abs(x) < buffer and abs(y) < buffer:
            return add_to_team(check_possession(), tag_id)
        elif x < 0:
            return add_to_team("H", tag_id)
        else:
            return add_to_team("A", tag_id)
    else:
        return ''


class Player:
    def __init__(self, player_data):
        player_data = player_data.split(',')
        self.tag_id = player_data[1]
        self.team = handle_teams(self.tag_id, int(player_data[3]), int(player_data[4]))
        coords = scale_coords(player_data[3], player_data[4])
        self.x_pos = coords[0]
        self.y_pos = coords[1]


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
            self.has_action = False
            self.action = ball[6]
        else:
            self.has_action = False
            self.action = -1


class DataStruct():
    def __init__(self, timestamp, ball):
        self.timestamp = timestamp
        self.ball = ball
        self.players = []

    def set_players(self, players):
        for i in range(len(players)):
            self.players.append(Player(players[i]))

    def set_ball(self):
        self.ball = Ball(self.ball)

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__,sort_keys=True, indent=4)


class MetaData:
    def __init__(self, match_id, date):
        self.match_id = match_id
        self.date = date
        self.periods = {}

    def set_periods(self, periods):
        for i in range(len(periods)):
            period_frames = {"start_frame": periods[i].attributes["iStartFrame"].value, "end_frame": periods[i].attributes["iEndFrame"].value}
            self.periods[periods[i].attributes["iId"].value] = period_frames

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__,sort_keys=True, indent=4)


def clean_data(data, callback=None):
    global current_frame
    for i in range(len(data)):
        temp = re.split('[:]', data[i][0])
        del data[i][0]
        data[i].insert(0, temp[0])
        data[i].insert(1, temp[1])
        del data[i][len(data[i]) - 1]
        frame = DataStruct(data[i][0], data[i][len(data[i])-1])
        del data[i][0]
        del data[i][len(data[i]) - 1]
        frame.set_ball()
        current_frame = frame
        frame.set_players(data[i])
        frames.append(frame.toJSON())

        print('\r', "Processing: "+str(i)+" / "+str(len(data))+" - "+str(round(i/len(data)*100))+"%", end='')
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
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        if check_file_type(filename) == "xml":
            handle_meta_data(filename)
        else:
            process_data(filename)
        return redirect(url_for('uploaded_file', filename=filename))


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return check_file_type(filename)


@app.route("/")
def index():
    return render_template("index.html")


def run_app():
    app.run()


def handle_meta_data(filename):
    global meta_data
    meta_doc = minidom.parse(filename)
    match = meta_doc.getElementsByTagName("match")
    meta = MetaData(match[0].attributes["iId"].value, match[0].attributes["dtDate"].value)
    meta.set_periods(meta_doc.getElementsByTagName("period"))
    meta_data = meta.toJSON()


def process_data(filename):
    data = [i.strip().split(';') for i in open(filename).readlines()]

    #data = []
    #f = open(filename)
    #lines = f.readlines()
    #for line in tqdm(lines):
    #   data.append(line.strip().split(';'))

    clean_data(data)


if __name__ == "__main__":

    #handle_meta_data()
    #process_data()

    run_app()

    #data = [i.strip().split(';') for i in open("./first_frame.dat").readlines()]
    #data = [i.strip().split(';') for i in open("./test2.dat").readlines()]
    #data = [i.strip().split(';') for i in open("./1059264.min.dat").readlines()]
    #handle_meta_data()


