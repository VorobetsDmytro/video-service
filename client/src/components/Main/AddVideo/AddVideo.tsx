import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useVideo } from "../../../actions/video.action";
import styles from './AddVideo.module.scss';
import {v4} from 'uuid';

interface NextChunkDto {
    uploaded: number;
    type: string;
}

interface EndUploading {
    filePath: string;
    type: string;
}

let fileReader = new FileReader();
let file: File;

export const AddVideo = () => {
    const {addVideo} = useVideo();
    const [socket, setSocket] = useState<Socket>();
    const [videoUploaded, setVideoUploaded] = useState<boolean>(false);
    const [previewUploaded, setPreviewUploaded] = useState<boolean>(false);
    const [title, setTitle] = useState<string>('');
    const [videoPath, setVideoPath] = useState<string>('');
    const [previewPath, setPreviewPath] = useState<string>('');
    const uploadFile = () => {
        if (!socket || !file) return;
        const submitBtn = document.getElementById('submit') as HTMLButtonElement;
        if(submitBtn)
            submitBtn.disabled = true;
         const fileName = v4() + '.' + file.name.split('.').pop();
        fileReader.onload = (e) => {
            if (!e.target) return;
            socket.emit("uploadingFile", {
                fileName,
                data: e.target.result,
            });
        };
        socket.emit("startUploading", { fileName, size: file.size, type: 'video' });
    };

    const handleChangeVideoFile = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const video = e.target.files[0];
        file = video;
    };

    const handleChangeTitle = (e: ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    };

    const handleNextChunk = useCallback((payload: NextChunkDto) => {
        if (!file) return;
        const start = payload.uploaded * 1e5;
        const newFile = file.slice(
            start,
            start + Math.min(1e5, file.size - start)
        );
        fileReader.readAsBinaryString(newFile);
    }, []);

    const handleEndUploading = useCallback((payload: EndUploading) => {
        if(payload.type === 'video'){
            if(!socket || !file)
                return;
            setVideoPath(payload.filePath);
            setVideoUploaded(true);
            const inputHTML = document.getElementById('preview') as HTMLInputElement;
            if(!inputHTML || !inputHTML.files)
                return;
            file = inputHTML.files[0] as File;
            fileReader = new FileReader();
            const fileName = v4() + '.' + file.name.split('.').pop();
            fileReader.onload = (e) => {
                if (!e.target) return;
                socket.emit("uploadingFile", {
                    fileName,
                    data: e.target.result,
                });
            };
            socket.emit("startUploading", { fileName, size: file.size, type: 'photo' });
        }
        if(payload.type === 'photo'){
            setPreviewPath(payload.filePath);
            setPreviewUploaded(true);
        }
    }, [socket]);

    useEffect(() => {
        setSocket(io("http://localhost:5000/"));
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.auth = {
            token: localStorage.getItem('token')
        };
        socket.on("nextChunk", handleNextChunk);
        socket.on("endUploading", handleEndUploading);
    }, [socket, handleNextChunk, handleEndUploading]);

    useEffect(() => {
        if(videoUploaded && previewUploaded)
            addVideo({title, videoPath, previewPath});
    }, [videoUploaded, previewUploaded, addVideo, title, videoPath, previewPath]);

    return (
        <div className={styles.addVideo}>
            <div className={styles.addVideo_body}>
                <div className={styles.addVideo_item}>
                    <h3>Video</h3>
                    <input accept="video/mp4,video/x-m4v,video/*" onChange={handleChangeVideoFile} type="file" />
                </div>
                <div className={styles.addVideo_item}>
                    <h3>Preview</h3>
                    <input accept="image/*" id="preview" type="file" />
                </div>
                <div className={styles.addVideo_item}>
                    <h3>Title</h3>
                    <input width={'100%'} onChange={handleChangeTitle} type="text" />
                </div>
                <div className={styles.addVideo_upload}>
                    <button className={styles.addVideo_btn} id="submit" onClick={uploadFile}>Upload</button>
                </div>
            </div>
        </div>
    );
};
