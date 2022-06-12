import { Comment, Video } from "./videos.types";

export enum UserActionTypes {
    SET_USER = 'SET_USER',
    SET_CUR_VIDEO = 'SET_CUR_VIDEO',
    ADD_COMMENT = 'ADD_COMMENT',
    REMOVE_COMMENT = 'REMOVE_COMMENT',
    CAN_DOWNLOAD = 'CAN_DOWNLOAD',
    LOGOUT = 'LOGOUT'
}

export interface SetUserAction {
    type: UserActionTypes.SET_USER;
    payload: User;
}

export interface VideoAcesses {
    video: Video | null,
    canWatchVideo: boolean,
    canAddComments: boolean
}

export interface SetCurVideoAcrion {
    type: UserActionTypes.SET_CUR_VIDEO;
    payload: VideoAcesses;
}

export interface AddCommentAction {
    type: UserActionTypes.ADD_COMMENT;
    payload: Comment;
}

export interface RemoveCommentAction {
    type: UserActionTypes.REMOVE_COMMENT,
    payload: string;
}

export interface LogoutAction {
    type: UserActionTypes.LOGOUT
}

export interface CanDownloadAction {
    type: UserActionTypes.CAN_DOWNLOAD,
    payload: boolean
}

export type UserAction = SetUserAction 
                       | SetCurVideoAcrion 
                       | AddCommentAction
                       | LogoutAction
                       | RemoveCommentAction
                       | CanDownloadAction;

export interface Token {
    lastAuthorization: Date
}

export interface Ban {
    banReason: string;
    bannedAt: Date;
    unBannedAt: Date | null;
}

export interface ResetPassword {
    id: string;
    userId: string;
    isApproved: boolean;
}

export interface User {
    id: string;
    email: string;
    role?: {value: string}
    roleId: string;
    createdAt: Date;
    firstname?: string;
    lastname?: string;
    avatar?: string;
    subscription?: Subscription;
    creditCards?: CreditCard[];
    token?: Token;
    bans?: Ban[];
    resetPassword?: ResetPassword;
    canDownloadVideo: boolean;
}

export interface SubscriptionType {
    id: string;
    name: string;
    maxDownloads: number;
    maxViews: number;
    canAddComments: boolean;
    price: number;
}

export interface Subscription {
    id: string;
    subscriptionType: SubscriptionType;
    subscriptionTypeId: string;
    downloadsLeft: string;
    viewsForTodayLeft: string;
    expiresIn: Date;
}

export interface CreditCard {
    id: string;
    type: string;
    number: string;
    money: number;
}

export interface UserState {
    user: User;
    isAuth: boolean;
    curVideo: Video | null;
    canWatchVideo: boolean;
    canAddComments: boolean;
}