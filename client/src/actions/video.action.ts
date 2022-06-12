import { useCallback, useState } from "react";
import { CreateVideoDto } from "../components/Main/Video/dto/create-video.dto";
import { EditVideoDto } from "../components/WatchVideo/dto/edit-video.dto";
import { useHttp } from "../hooks/http.hooks";
import { canDownload, setCurVideo } from "../store/reducers/user.reducer";
import { setVideos } from "../store/reducers/videos.reducer";

export const useVideo = () => {
    const [ready, setReady] = useState(false);
    const {request} = useHttp();
    const getAllVideo = useCallback(() => {
        return async (dispatch: any) => {
            try {
                const response = await request('http://localhost:5000/videos', 'GET', null, {Authorization: `Bearer ${localStorage.getItem('token')}`});
                if(response instanceof Error)
                    throw response;
                if(response.message)
                    alert(response.message);
                dispatch(setVideos(response.videos));
                dispatch(canDownload(response.canDownloadVideo));
                return response;
            } catch (error) {
                alert(error);
            } finally {
                setReady(true);
            }
        }
    }, [request]);

    const addVideo = useCallback(async (body: CreateVideoDto) => {
        try {
            const response = await request('http://localhost:5000/videos', 'POST', body, {Authorization: `Bearer ${localStorage.getItem('token')}`});
            if(response instanceof Error)
                throw response;
            if(response.message)
                alert(response.message);
            return response;
        } catch (error) {
            alert(error);
        }
    }, [request]);

    const getVideoById = useCallback((videoId: string) => {
        return async (dispatch: any) => {
            try {
                const response = await request(`http://localhost:5000/videos/${videoId}`, 'GET', null, {Authorization: `Bearer ${localStorage.getItem('token')}`});
                if(response instanceof Error)
                    throw response;
                if(response.message)
                    alert(response.message);
                dispatch(setCurVideo({
                    video: response.video, 
                    canWatchVideo: response.canWatchVideo,
                    canAddComments: response.canAddComments
                }));
                return response;
            } catch (error) {
                alert(error);
            } finally {
                setReady(true);
            }
        }
    }, [request]);

    const getVideoBlob = async (videoId: string) => {
        try {
            const headers = {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
                Range: 'bytes=0-'
            }
            const response = await fetch(`http://localhost:5000/videos/watch/${videoId}`, {method: 'GET', headers: headers});
            const blob = await response.blob();
            if(!blob)
                return null;
            return blob;
        } catch (error) {
            alert(error);
        }
    }

    const downloadVideo = async (videoId: string, videoName: string) => {
        try {
            const headers = {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
                Range: 'bytes=0-'
            }
            const response = await fetch(`http://localhost:5000/videos/download/${videoId}`, {method: 'GET', headers: headers});
            const blob = await response.blob();
            if(!blob)
                return null;
            const downloadLink = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadLink;
            link.download = videoName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            return response;
        } catch (error) {
            alert(error);
        }
    }

    const updateVideo = useCallback(async (body: EditVideoDto, videoId: string) => {
        try {
            const response = await request(`http://localhost:5000/videos/${videoId}`, 'PATCH', body, {Authorization: `Bearer ${localStorage.getItem('token')}`});
            if(response instanceof Error)
                throw response;
            if(response.message)
                alert(response.message);
            window.location.reload();
        } catch (error) {
            alert(error);
        }
    }, [request]);

    const deleteVideo = async(videoId: string) => {
        try {
            const response = await request(`http://localhost:5000/videos/${videoId}`, 'DELETE', null, {Authorization: `Bearer ${localStorage.getItem('token')}`});
            if(response instanceof Error)
                throw response;
            if(response.message)
                alert(response.message);
            return response;
        } catch (error) {
            alert(error);
        }
    }

    return {
        ready,
        getAllVideo,
        addVideo,
        getVideoById,
        getVideoBlob,
        downloadVideo,
        updateVideo,
        deleteVideo
    }
};