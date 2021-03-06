import {AmeboEvent} from '../events/AmeboEvent';
/**
 * Created by barthclem on 11/27/17.
 */
export class QuixEvents {

    private _startStageEvent:  AmeboEvent<number>;
    private _endStageEvent:  AmeboEvent<number>;
    private _startAllStagesEvent:  AmeboEvent<number>;
    private _endOfAllStagesEvent:  AmeboEvent<number>;
    private _startStageRounds:  AmeboEvent<number>;
    private _endOfStageRounds:  AmeboEvent<number>;
    private _endOfAllStageRounds:  AmeboEvent<number>;
    private _startRoundEvent:  AmeboEvent<number>;
    private _endOfRoundEvent:  AmeboEvent<number>;
    private _startTeamSession:  AmeboEvent<number>;
    private _endOfTeamSession:  AmeboEvent<number>;
    private _startTeamBonusSession:  AmeboEvent<number>;
    private _endOfTeamBonusSession:  AmeboEvent<number>;
    private _endOfTimeEvent: AmeboEvent<boolean>;


    constructor() {
        this._startStageEvent = new AmeboEvent<number>();
        this._endStageEvent = new AmeboEvent<number>();
        this._startAllStagesEvent = new AmeboEvent<number>();
        this._endOfAllStagesEvent = new AmeboEvent<number>();
        this._startStageRounds = new AmeboEvent<number>();
        this._endOfStageRounds = new AmeboEvent<number>();
        this._endOfAllStageRounds = new AmeboEvent<number>();
        this._startRoundEvent = new AmeboEvent<number>();
        this._endOfRoundEvent = new AmeboEvent<number>();
        this._startTeamSession = new AmeboEvent<number>();
        this._endOfTeamSession = new AmeboEvent<number>();
        this._startTeamBonusSession = new AmeboEvent<number>();
        this._endOfTeamBonusSession = new AmeboEvent<number>();
        this._endOfTimeEvent = new AmeboEvent<boolean>();
    }

    endOfTeamBonusSessionEvent(): AmeboEvent<number> {
        return this._endOfTeamBonusSession;
    }

    fireEndOfTeamBonusSessionEvent(value: number) {
        this._endOfTeamBonusSession.value = value;
    }
    startTeamBonusSessionEvent(): AmeboEvent<number> {
        return this._startTeamBonusSession;
    }

    fireTeamBonusSessionEvent(value: number) {
        this._startTeamBonusSession.value = value;
    }

    endOfTeamSessionEvent(): AmeboEvent<number> {
        return this._endOfTeamSession;
    }

    fireEndOfTeamSessionEvent(value: number) {
        this._endOfTeamSession.value = value;
    }

    startTeamSessionEvent(): AmeboEvent<number> {
        return this._startTeamSession;
    }

    fireNewTeamSessionEvent(value: number) {
        this._startTeamSession.value = value;
    }

    endOfRoundEvent(): AmeboEvent<number> {
        return this._endOfRoundEvent;
    }

    fireEndOfRoundEvent(value: number) {
        this._endOfRoundEvent.value = value;
    }

    startRoundEvent(): AmeboEvent<number> {
        return this._startRoundEvent;
    }

    firstNewRoundEvent(value: number) {
        this._startRoundEvent.value = value;
    }

    endOfAllStageRoundsEvent(): AmeboEvent<number> {
        return this._endOfAllStageRounds;
    }

    fireEndOfAllStageRoundsEvent(value: number) {
        this._endOfAllStageRounds.value = value;
    }
    endOfStageRoundsEvent(): AmeboEvent<number> {
        return this._endOfStageRounds;
    }

    fireEndOfStageRoundsEvent(value: number) {
        this._endOfStageRounds.value = value;
    }
    startStageRoundsEvent(): AmeboEvent<number> {
        return this._startStageRounds;
    }

    firstNewStageRoundsEvent(value: number) {
        this._startStageRounds.value = value;
    }

    startAllStagesEvent(): AmeboEvent<number> {
        return this._startAllStagesEvent;
    }

    firstStartAllStagesEvent(value: number) {
        this._startAllStagesEvent.value = value;
    }

    endOfAllStagesEvent(): AmeboEvent<number> {
        return this._endOfAllStagesEvent;
    }

    fireEndOfAllStagesEvent(value: number) {
        this._endOfAllStagesEvent.value = value;
    }
    endStageEvent(): AmeboEvent<number> {
        return this._endStageEvent;
    }

    fireEndStageEvent(value: number) {
        this._endStageEvent.value = value;
    }
    startStageEvent(): AmeboEvent<number> {
        return this._startStageEvent;
    }

    firstNewStageEvent(value: number) {
        this._startStageEvent.value = value;
    }

    fireEndOfTimeEvent(value: boolean) {
        this._endOfTimeEvent.value = value;
    }
    startEndOfTimeEvent() {
        return this._endOfTimeEvent;
    }
}