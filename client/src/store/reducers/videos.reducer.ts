import { Video, VideoAction, VideoActionTypes, VideoState } from "../types/videos.types";

const defaultState: VideoState = {
    videos: []
}

export const videosReducer = (state = defaultState, action: VideoAction): VideoState => {
    switch (action.type) {
        case VideoActionTypes.SET_VIDEOS:
            return {
                ...state,
                videos: action.payload
            };
        default:
            return state;
    }
};

export const setVideos= (payload: Video[]): VideoAction => ({type: VideoActionTypes.SET_VIDEOS, payload});