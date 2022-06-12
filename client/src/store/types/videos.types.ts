import { User } from "./user.types";

export enum VideoActionTypes {
    SET_VIDEOS = 'SET_VIDEOS'
}

export interface SetVideosAction {
    type: VideoActionTypes.SET_VIDEOS;
    payload: Video[];
}

export type VideoAction = SetVideosAction;

export interface Video {
    id: string;
    title: string;
    previewPath: string;
    videoPath: string;
    duration: number
    createdAt: Date;
    comments: Comment[]
}

export interface Comment {
    id: string;
    user: User;
    userId: string;
    videoId: string;
    text: string;
    createdAt: Date;
}

export interface VideoState {
    videos: Video[]
}