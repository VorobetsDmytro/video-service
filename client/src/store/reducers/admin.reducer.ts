import { AdminAction, AdminActionTypes, AdminState } from "../types/admin.types";
import { User } from "../types/user.types";

const defaultState: AdminState = {
    users: []
}

export const adminReducer = (state = defaultState, action: AdminAction): AdminState => {
    switch (action.type) {
        case AdminActionTypes.SET_USERS:
            return {
                ...state,
                users: action.payload
            };
        default:
            return state;
    }
};

export const setUsers = (payload: User[]): AdminAction => ({type: AdminActionTypes.SET_USERS, payload});