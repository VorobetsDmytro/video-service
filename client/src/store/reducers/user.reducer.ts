import { User, UserAction, UserActionTypes, UserState, VideoAcesses } from "../types/user.types";
import { Comment } from "../types/videos.types";

const defaultState: UserState = {
    user: {
        id: '',
        email: '',
        roleId: '',
        createdAt: new Date(),
        canDownloadVideo: false
    },
    isAuth: false,
    curVideo: null,
    canWatchVideo: false,
    canAddComments: false
}

export const userReducer = (state = defaultState, action: UserAction): UserState => {
    switch (action.type) {
        case UserActionTypes.SET_USER:
            return {
                ...state,
                user: action.payload,
                isAuth: true
            };
        case UserActionTypes.SET_CUR_VIDEO:
            state = {
                ...state,
                curVideo: action.payload.video,
                canWatchVideo: action.payload.canWatchVideo,
                canAddComments: action.payload.canAddComments
            };
            if(state.curVideo)
                state.curVideo.comments.reverse();
            return {...state};
        case UserActionTypes.ADD_COMMENT:
            if(state.curVideo)
                state.curVideo.comments.unshift(action.payload)
            return {...state};
        case UserActionTypes.EDIT_COMMENT:
            if(state.curVideo)
                state.curVideo.comments = state.curVideo.comments.map(comment => comment.id !== action.payload.id
                                                                        ? comment
                                                                        : {...comment, text: action.payload.text})
            return {...state};
        case UserActionTypes.REMOVE_COMMENT:
            if(state.curVideo)
                state.curVideo.comments = state.curVideo.comments.filter(comment => comment.id !== action.payload)
            return {...state};
        case UserActionTypes.LOGOUT:{
            localStorage.removeItem('token');
            return {
                ...state,
                user: {
                    id: '',
                    email: '',
                    roleId: '',
                    createdAt: new Date(),
                    canDownloadVideo: false
                },
                isAuth: false
            }
        }
        case UserActionTypes.CAN_DOWNLOAD:
            return {
                ...state,
                user: {...state.user, canDownloadVideo: action.payload}
            };
        default:
            return state;
    }
};

export const setUser = (payload: User): UserAction => ({type: UserActionTypes.SET_USER, payload});
export const setCurVideo = (payload: VideoAcesses): UserAction => ({type: UserActionTypes.SET_CUR_VIDEO, payload}); 
export const addComment = (payload: Comment): UserAction => ({type: UserActionTypes.ADD_COMMENT, payload});
export const editCommentAction = (payload: Comment): UserAction => ({type: UserActionTypes.EDIT_COMMENT, payload});
export const removeComment = (payload: string): UserAction => ({type: UserActionTypes.REMOVE_COMMENT, payload});
export const canDownload = (payload: boolean): UserAction => ({type: UserActionTypes.CAN_DOWNLOAD, payload});
export const logoutUser = (): UserAction => ({type: UserActionTypes.LOGOUT});