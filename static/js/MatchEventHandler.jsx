import React from "react";

let $ = require('jquery');

export default class MatchEventHandler extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            meta: null,
            dataLength: null,
            width:0,
            periods: null,
            bookings: null,
            subs: null,
            goals: null,
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.props.meta === null && this.props.dataLength !== 0){return;}
        this.state.meta = this.props.meta;
        this.state.dataLength = this.props.dataLength;
        this.state.width = $(".progress-bar").width();
    }

    placeBookings(){
        if(this.state.bookings !== null){
            return this.state.bookings
        }

        if(this.state.dataLength === null || this.state.dataLength === 0 || this.state.meta === null){return;}
        let outside = false;
        let DOM = [];
        let bookings = this.state.meta.match_events_bookings;
        for(let i = 0; i < bookings.length; i++){
            let style = {
                left: bookings[i][0]/this.state.dataLength*this.state.width
            };
            if(style.left > this.state.width-100){
                outside = true;
            }
            DOM.push(<span key={i} className={'event-marker goal-indicator'} style={style}><i className={"booking-icon "+ bookings[i][2].cart_type}></i>
                <span className={outside ? "event-details nudge" : "event-details"}>
                    <b>Booking</b> <br/>
                    {bookings[i][2].player.team_name}<br/>
                    Time: {bookings[i][2].min}:{('0' + bookings[i][2].sec).slice(-2)} <br/>
                    <p>{bookings[i][2].player.first_name} {bookings[i][2].player.last_name} ({bookings[i][2].player.shirt_number}) <br/></p>
                    Card: {bookings[i][2].card} <br/>
                    Reason: {bookings[i][2].reason}
                </span>
            </span>);
        }

        this.state.bookings = DOM;
    }

    placeGoals(){
        if(this.state.goals !== null){
            return this.state.goals
        }

        if(this.state.dataLength === null || this.state.dataLength === 0 || this.state.meta === null){return;}
        let outside = false;
        let DOM = [];
        let goals = this.state.meta.match_events_goals;
        for(let i = 0; i < goals.length; i++){
            let style = {
                left: goals[i][0]/this.state.dataLength*this.state.width
            };
            if(style.left > this.state.width-100){
                outside = true;
            }
            DOM.push(<span key={i} className={'event-marker goal-indicator'} style={style}><i className={"goal-icon"}></i>
                <span className={outside ? "event-details nudge" : "event-details"}>
                    <b>Goal</b> <br/>
                    {goals[i][2].player.team_name}<br/>
                    Time: {goals[i][2].min}:{('0' + goals[i][2].sec).slice(-2)} <br/>
                    {goals[i][2].player !== 0 ? (
                        <p>{goals[i][2].player.first_name} {goals[i][2].player.last_name} ({goals[i][2].player.shirt_number}) <br/></p>
                    ):(
                        <p>No player <br/></p>
                    )}
                    Type: {goals[i][2].type}
                </span>
            </span>);
        }
        this.state.goals = DOM;
    }

    placeSubs(){
        if(this.state.subs !== null){
            return this.state.subs
        }

        if(this.state.dataLength === null || this.state.dataLength === 0 || this.state.meta === null){return;}
        let outside = false;
        let DOM = [];
        let subs = this.state.meta.match_events_substitutions;
        for(let i = 0; i < subs.length; i++){
            let style = {
                left: subs[i][0]/this.state.dataLength*this.state.width
            };
            if(style.left > this.state.width-100){
                outside = true;
            }
            DOM.push(<span key={i} className={'event-marker substitution-indicator'} style={style}><i className={"substitution-icon"}></i>
                <span className={outside ? "event-details nudge" : "event-details"}>
                    <b>Substitution</b> <br/>
                    {subs[i][2].player_sub_off.team_name}<br/>
                    Time: {subs[i][2].min}:{('0' + subs[i][2].sec).slice(-2)} <br/>
                    <p>
                    <i className="fas fa-arrow-down"></i> {subs[i][2].player_sub_off.first_name} {subs[i][2].player_sub_off.last_name} ({subs[i][2].player_sub_off.shirt_number})<br/>
                    <i className="fas fa-arrow-up"></i> {subs[i][2].player_sub_on.first_name} {subs[i][2].player_sub_on.last_name} ({subs[i][2].player_sub_on.shirt_number})<br/>
                    </p>
                    Reason: {subs[i][2].reason}
                </span>
            </span>);
        }
        this.state.subs = DOM;
    }

    placePeriods(){
        if(this.state.periods !== null){
            return this.state.periods
        }

        if(this.state.dataLength === null || this.state.dataLength === 0 || this.state.meta === null){return;}
        let DOM = [];
        let start_frames = this.state.meta.start_periods;
        for(let i = 0; i < start_frames.length; i++){
            let style;
            if(start_frames[i] === 0){
                style = {
                    left: 0
                };
            } else {
                style = {
                    left: start_frames[i]/this.state.dataLength*this.state.width
                };
            }
            DOM.push(<span key={i} className={'event-marker period-indicator'} style={style}><i>{i+1}</i>
                <span className={"event-details"}>
                    {i+1}. period
                </span>
            </span>);
        }
        this.state.periods = DOM;
    }

    updateDimensions = () => {
        this.setState({ periods: null, subs: null, goals:null, bookings:null});
    };
    componentDidMount() {
        window.addEventListener('resize', this.updateDimensions);
    }
    componentWillUnmount() {
        window.removeEventListener('resize', this.updateDimensions);
    }

    render () {

        return(
            <div className="match-events">
                {this.placePeriods()}

                {this.placeGoals()}

                {this.placeSubs()}

                {this.placeBookings()}
            </div>
        );

    }
}
