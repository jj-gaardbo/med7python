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
import xml.etree.ElementTree as ET
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

fseven_file = ""
data_file = ""
meta_file = ""
video_files = []

data = []
meta_data = []
meta_data_obj = None
team_data_array = []
team_data_obj = []
latest_goal = 0

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


class ScoreBoard:
    def __init__(self):
        self.home_team = ""
        self.away_team = ""
        self.home_score = 0
        self.away_score = 0


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
        self.booking = ""
        self.booking_player = ""
        self.goal = ""
        self.goal_player = ""
        self.sub = []
        self.score_board = ScoreBoard()

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

    def handle_match_events(self, iter):
        global team_data_obj, latest_goal, meta_data_obj
        if len(team_data_obj) > 0:
            for i in range(len(team_data_obj)):
                team = team_data_obj[i]
                if team.side == "Home":
                    self.score_board.home_team = team.name
                elif team.side == "Away":
                    self.score_board.away_team = team.name
                team_events = team.get_events()
                bookings = team_events.get_team_bookings()
                for b in range(len(bookings)):
                    booking_time = str(datetime.timedelta(minutes=int(bookings[b].min), seconds=int(bookings[b].sec)))
                    if self.time == booking_time:
                        bookings[b].timestamp = self.timestamp
                        self.booking = bookings[b]
                        meta_data_obj.add_booking([iter, self.timestamp, bookings[b]])

                goals = team_events.get_team_goals()
                for g in range(len(goals)):
                    goal_time = str(datetime.timedelta(minutes=int(goals[g].min), seconds=int(goals[g].sec)))
                    if self.time == goal_time:
                        goals[g].timestamp = self.timestamp
                        self.goal = goals[g]
                        if team.side == "Home" and not latest_goal == goal_time:
                            self.score_board.home_score = self.score_board.home_score+1
                        elif team.side == "Away" and not latest_goal == goal_time:
                            self.score_board.away_score = self.score_board.away_score+1
                        latest_goal = goal_time
                        meta_data_obj.add_goal([iter, self.timestamp, goals[g]])

                substitutions = team_events.get_team_substitutions()
                for s in range(len(substitutions)):
                    sub_time = str(datetime.timedelta(minutes=int(substitutions[s].min), seconds=int(substitutions[s].sec)))
                    if self.time == sub_time:
                        substitutions[s].timestamp = self.timestamp
                        self.sub.append(substitutions[s])
                        meta_data_obj.add_substitution([iter, self.timestamp, substitutions[s]])

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__,sort_keys=True, indent=4)


class MetaData:
    def __init__(self, match_id, date):
        self.match_id = match_id
        self.date = date
        self.periods = {}
        self.start_periods = []
        self.video_details = []
        self.match_events_bookings = []
        self.match_events_goals = []
        self.match_events_substitutions = []

    def add_booking(self, booking):
        for i in range(len(self.match_events_bookings)):
            if booking[2] in self.match_events_bookings[i]:
                return
        self.match_events_bookings.append(booking)

    def add_goal(self, goal):
        for i in range(len(self.match_events_goals)):
            if goal[2] in self.match_events_goals[i]:
                return
        self.match_events_goals.append(goal)

    def add_substitution(self, substitution):
        for i in range(len(self.match_events_substitutions)):
            if substitution[2] in self.match_events_substitutions[i]:
                return
        self.match_events_substitutions.append(substitution)

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

    def assign_videos(self):
        if len(video_files) == 0:
            return
        self.video_details = video_files

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
    global current_frame, meta_data_obj, progress_str, meta_data, progress_percentage, match_id, team_data_array
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
        meta_data_obj.assign_videos()
        frame.handle_match_events(iter)
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


@app.route("/teams")
def teams():
    if len(team_data_array) == 0:
        return "-1"
    return jsonify(team_data_array)


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

        if "f7.xml" in filename:
            handle_event_data(filepath, filename)
        elif filetype == "xml":
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


def clear_files():
    filelist = [f for f in os.listdir(UPLOAD_FOLDER) if f.endswith(".xml") or f.endswith(".dat")]
    for f in filelist:
        os.remove(os.path.join(UPLOAD_FOLDER, f))
    videolist = [f for f in os.listdir(STATIC_FOLDER) if f.endswith(".mp4")]
    for f in videolist:
        os.remove(os.path.join(STATIC_FOLDER, f))


@app.route('/terminate', methods=['POST'])
def terminate():
    clear_files()
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
    video_files.append([filename.rsplit('.', 1)[0].lower(), filename, filepath])


def process_data(filepath, filename):
    data = [i.strip().split(';') for i in open(filepath).readlines()]
    clean_data(data, filepath, filename, update_meta)


class TeamData:
    def __init__(self, formation, score, side, reference):
        self.formation = formation
        self.score = score
        self.side = side
        self.reference = reference
        self.bookings = []
        self.goals = []
        self.match_players = []
        self.substitutions = []

    def get_team_score(self):
        return self.score

    def get_team_bookings(self):
        return self.bookings

    def get_team_goals(self):
        return self.goals

    def get_team_substitutions(self):
        return self.substitutions

    def set_bookings(self, bookings_array):
        self.bookings = bookings_array

    def set_goals(self, goals_array):
        self.goals = goals_array

    def set_match_players(self, match_player_array):
        self.match_players = match_player_array

    def set_substitutions(self, substitution_array):
        self.substitutions = substitution_array

    def get_match_player(self, ref):
        if not len(self.match_players) > 0:
            return

        for i in range(len(self.match_players)):
            if ref == self.match_players[i].player_ref:
                return self.match_players[i]


class Goal:
    def __init__(self, min, sec, type, player_ref):
        self.min = min
        self.sec = sec
        self.type = type
        self.player_ref = player_ref
        self.player = 0
        self.timestamp = 0


class Lineup:
    def __init__(self, formation_place, player_ref, position, shirt_number, status, sub_position):
        self.formation_place = formation_place
        self.player_ref = player_ref
        self.position = position
        self.shirt_number = shirt_number
        self.status = status
        self.sub_position = ""
        if not sub_position == None:
            self.sub_position = sub_position


class Substitution:
    def __init__(self, min, period, reason, sec, sub_off, sub_on, substitute_position):
        self.min = min
        self.period = period
        self.reason = reason
        self.sec = sec
        self.sub_off = sub_off
        self.sub_on = sub_on
        self.player_sub_off = 0
        self.player_sub_on = 0
        self.substitute_position = substitute_position
        self.timestamp = 0


class Booking:
    def __init__(self, card, cart_type, min, sec, player_ref, reason):
        self.card = card
        self.cart_type = cart_type
        self.min = min
        self.sec = sec
        self.player_ref = player_ref
        self.player = 0
        self.reason = reason
        self.timestamp = 0


class Team:
    def __init__(self, reference, side):
        self.reference = reference
        self.side = side
        self.team_letter = ""
        self.events = 0
        self.players = []
        self.color_primary = ""
        self.color_secondary = ""
        self.name = ""
        self.country = ""

    def set_name(self, name):
        self.name = name

    def set_country(self, country):
        self.country = country

    def set_colors(self, color_1, color_2):
        self.color_primary = color_1
        self.color_secondary = color_2

    def set_events(self, events):
        self.events = events

    def set_team(self, side):
        if side == "Home":
            self.team_letter = "H"
        elif side == "Away":
            self.team_letter = "A"

    def get_events(self):
        return self.events

    def add_player(self, player):
        self.players.append(player)

    def get_player_obj(self, ref):
        for i in range(len(self.players)):
            if self.players[i].player_reference == ref:
                return self.players[i]
        return None

    def assign_players(self):
        for b in range(len(self.events.bookings)):
            player_booking = self.get_player_obj(self.events.bookings[b].player_ref)
            if player_booking is not None:
                self.events.bookings[b].player = player_booking

        for g in range(len(self.events.goals)):
            player_goal = self.get_player_obj(self.events.goals[g].player_ref)
            if player_goal is not None:
                self.events.goals[g].player = player_goal

        for s in range(len(self.events.substitutions)):
            player_sub_off = self.get_player_obj(self.events.substitutions[s].sub_off)
            player_sub_on = self.get_player_obj(self.events.substitutions[s].sub_on)
            if player_sub_on is not None:
                self.events.substitutions[s].player_sub_on = player_sub_on
            if player_sub_off is not None:
                self.events.substitutions[s].player_sub_off = player_sub_off

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__,sort_keys=True, indent=4)


class Player_Detail:
    def __init__(self, first_name, last_name, known_name, shirt_number, player_reference, position, sub_position, formation_place, status, team_name, team_side):
        self.first_name = first_name
        self.last_name = last_name
        self.known_name = known_name
        self.shirt_number = shirt_number
        self.player_reference = player_reference
        self.position = position
        self.sub_position = sub_position
        self.formation_place = formation_place
        self.status = status
        self.team_name = team_name
        self.team_side = team_side


def handle_event_data(filepath, filename):
    global team_data_array, team_data_obj

    string = open(filepath).readlines()

    player_document = ET.parse(filepath).getroot()

    for team_event in player_document.iter('TeamData'):
        side = team_event.get('Side')
        reference = team_event.get('TeamRef')
        team = Team(reference, side)
        team.set_team(side)

        temp = TeamData(team_event.get('Formation'), team_event.get('Score'), side, reference)

        booking_array = []
        goals_array = []
        lineup_array = []
        substitution_array = []
        for booking in team_event.iter("Booking"):
            booking_array.append(Booking(booking.get("Card"), booking.get("CardType"), booking.get("Min"), booking.get("Sec"), booking.get("PlayerRef"), booking.get("Reason")))

        temp.set_bookings(booking_array)
        for goal in team_event.iter("Goal"):
            goals_array.append(Goal(goal.get("Min"), goal.get("Sec"), goal.get("Type"), goal.get("PlayerRef")))

        temp.set_goals(goals_array)
        for match_player in team_event.iter("MatchPlayer"):
            lineup_array.append(Lineup(match_player.get("Formation_Place"), match_player.get("PlayerRef"), match_player.get("Position"), match_player.get("ShirtNumber"), match_player.get("Status"), match_player.get("SubPosition")))

        temp.set_match_players(lineup_array)
        for substitution in team_event.iter("Substitution"):
            substitution_array.append(Substitution(substitution.get("Min"), substitution.get("Period"), substitution.get("Reason"), substitution.get("Sec"), substitution.get("SubOff"), substitution.get("SubOn"), substitution.get("SubstitutePosition")))

        temp.set_substitutions(substitution_array)

        team.set_events(temp)

        for team_elem in player_document.iter("Team"):
            if not str(team_elem.get('uID')) == str(reference):
                continue

            kit = team_elem.find('Kit')
            team.set_colors(kit.get("colour1"), kit.get("colour2"))

            team.set_country(team_elem.find("Country").text)

            team.set_name(team_elem.find('Name').text)

            for player in team_elem.findall("Player"):
                first_name = ""
                last_name = ""
                known_name = ""
                for names in player.find("PersonName"):
                    if names.tag == "First":
                        first_name = names.text
                    elif names.tag == "Last":
                        last_name = names.text
                    elif names.tag == 'Known':
                        known_name = names.text

                line_up_player = temp.get_match_player(player.get('uID'))
                player_detail_obj = Player_Detail(first_name, last_name, known_name, line_up_player.shirt_number, player.get('uID'), player.get('Position'), line_up_player.sub_position, line_up_player.formation_place, line_up_player.status, team.name, team.side)
                team.add_player(player_detail_obj)

        team.assign_players()
        team_data_array.append(team.toJSON())
        team_data_obj.append(team)


if __name__ == "__main__":
    clear_files()
    run_app()
