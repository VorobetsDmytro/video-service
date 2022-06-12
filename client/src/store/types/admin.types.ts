import { User } from "./user.types";

export enum AdminActionTypes {
    SET_USERS = 'SET_USERS'
}

export interface SetUsersAction {
    type: AdminActionTypes.SET_USERS;
    payload: User[];
}

export type AdminAction = SetUsersAction;

export interface AdminState {
    users: User[]
}