/**
 * Created by barthclem on 10/15/17.
 */
'use strict';
import {TeamRoom} from './TeamRoom';
import {JoinData} from './JoinData';
import {ClientMessage} from './ClientMessage';
import {ClientTypingMessage} from './ClientTypingMessage';
import {QuizEventRegistry, TimeEventRegistry} from '../helper/EventRegistry';
import {TimerManager} from '../eventMonitor/TimerManager';
import {RoundsManager} from '../quixMaster/RoundsManager';
import {QuizParams} from '../quixMaster/QuixParams';
import {StageManager} from '../quixMaster/StagesManager';
import {Team} from '../helper/Team';
import {TeamImpl} from '../helper/TeamImpl';

export class SocketRoutes {

    private io: any;
    private username: string;
    private team: string;
    private chatRooms: TeamImpl [];
    private timerMonitor: TimerManager;
    private _quizParameter: QuizParams;

    private quizRunner: StageManager;
    static setSocketParams (socket: any, username: string, room: string) {
        socket.username = username;
        socket.userTeam = room;
    }

    constructor( socketServer: any) {
        this.io = socketServer;
        this.username = '';
        this.team = '';
        this.timerMonitor = new TimerManager(1 * 60);
        this._quizParameter = new QuizParams();
    }

    configSocketConnection (rooms: TeamImpl[], quizRunner: StageManager) {
        this.chatRooms = rooms;
        this.quizRunner = quizRunner;
        this.quizRunner.quizParams = this.quizParameter;
        this.io.on('connection', (socket: any) => {
            this.addUserToSocket(socket);
            this.whenUserDisconnects(socket);
            this.whenUserIsTyping(socket);
            this.whenUserSendsMessage(socket);
            this.whenUserTimerIsStarted(socket);
            this.whenUserTimerIsStopped(socket);

            this.whenATeamPicksQuestion(socket);
            this.whenATeamSelectsAnAnswer(socket);
            this.whenAUserAttemptsABonus(socket);
        });

    }

    addUserToSocket (socket: any ) {
        socket.on('join', (receivedData: JoinData ) => {
            const data = receivedData.user;
            const team = this.chatRooms.find(room => room.getTeamName() === data.team );
            this.team = data.team;
            this.username = data.username;
            if (team) {
                socket.join(this.team);
                team.addMember(this.username);
                data.teamMembers = team.getMemberList();
                SocketRoutes.setSocketParams(socket, this.username, this.team);
                console.log(`${this.username} has joined ${JSON.stringify(this.team)} team.`);
                this.io.to(socket.id).emit('response', {
                    type: 'join-response',
                    error: false,
                    message: 'user added successfully',
                    data: data,
                    timerStarted: this.timerMonitor.timerStarted()
                });
                this.io.in(this.team).emit('response', {type: 'connection-event', data: data});
            } else {
                this.io.to(socket.id).emit('response', {
                    type: 'join-response',
                    error: true,
                    message: 'room does not exist'
                });
            }
        });
    }

   whenUserDisconnects (socket: any) {
        socket.on('disconnect', () => {
            const team = this.chatRooms.find(room => room.getTeamName() === socket.userTeam );
            if (team) {
                team.removeMember(socket.username);
                const data = {username : socket.username,
                    teamMembers : team.getMemberList()};
                this.io.in(socket.userTeam).emit('response', {type: 'disconnection-event', data: data});
                console.log(`${socket.username} from room ${socket.userTeam} is disconnected`);
            }
        });
    }

    whenUserIsTyping (socket: any) {
        socket.on('typing', (msgData: ClientTypingMessage) => {
            const msg = msgData.data;
            console.log(`${socket.username} is typing a message in room ${socket.userTeam}`);
            this.io.in(msg.room).emit('response', {type: 'typing-event', data: msg});
        });
    }

    whenUserSendsMessage (socket: any) {
        socket.on('message', (msgData: ClientMessage) => {
            const msg = msgData.data;
            console.log(`${socket.username} has sent message to room ${socket.userTeam}`);
            console.log(` The Message room is => ${msg.room}   MSG: ${JSON.stringify(msg)}`);
            this.io.in(msg.room).emit('response', {type: 'new-message', data: msg});
        });
    }

    whenUserTimerIsStarted (socket: any) {
        socket.on(TimeEventRegistry.ENTRY_PAGE_TIMER_STARTED_EVENT, () => {
            console.log(`${socket.username}  is started`);
            this.timerMonitor.startTimer(this.broadcastOnlineTime(socket));
        });
    }

    broadcastOnlineTime (socket: any) {
        console.log(`Sending... time update broadcast message to everybody`);
        const thes = this;
        return function (currentTime: number) {
            console.log(`Time update : ${currentTime}`);
            thes.io.emit('response', {
                type: TimeEventRegistry.ONLINE_TIME_RESPONSE,
                error: false,
                data: {currentTime :  currentTime},
                timerStarted: thes.timerMonitor.timerStarted()
            });
        };
    }

    whenUserTimerIsStopped (socket: any) {
        socket.on(TimeEventRegistry.ENTRY_PAGE_TIMER_STOPPED_EVENT, () => {
            this.timerMonitor.stopTimer();
            console.log(`let the show begin`);
            this.quizRunner.runStages();
            this.io.emit('response', {
                type: TimeEventRegistry.ENTRY_PAGE_TIMER_STOPPED_EVENT,
                error: false,
                data: {
                    timerActive: this.timerMonitor.timerActive(),
                    timeStoppedRemotely: this.timerMonitor.timerStoppedRemotely
                },
                timerStarted: this.timerMonitor.timerStarted()
            });
        });
    }

    whenATeamPicksQuestion (socket: any) {
        socket.on(QuizEventRegistry.QUESTION_SELECTED_EVENT, (choice: any) => {
            console.log(`Question Selected by a team : choice ${JSON.stringify(choice)}`);
            this.quizParameter.fireQuestionPickedEvent(choice.questionNumber);
        });
    }

    whenATeamSelectsAnAnswer (socket: any) {
        socket.on(QuizEventRegistry.QUESTION_ANSWERED_EVENT, (selectBody: any) => {
            console.log(`Attempt to answer the question is by a team`);
            this.quizParameter.fireQuestionAttemptedEvent(
                {selectedOption:selectBody.selectedOption,
                    timeToAnswer: selectBody.timeToAnswer});
        });
    }

    whenAUserAttemptsABonus (socket: any) {
        socket.on(QuizEventRegistry.BONUS_ATTEMPTED_EVENT, (selectBody: any) => {
            console.log(`Bonus is attempted`);
            this.quizParameter.fireBonusAttemptedEvent(selectBody.selectedOption);
        });
    }

    get quizParameter(): QuizParams {
        return this._quizParameter;
    }

    set quizParameter(value: QuizParams) {
        this._quizParameter = value;
    }
}