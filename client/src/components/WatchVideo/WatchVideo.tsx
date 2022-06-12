import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { useComment } from "../../actions/comment.action";
import { useVideo } from "../../actions/video.action";
import { useTypedSelector } from "../../hooks/useTypedSelector";
import styles from './WatchVideo.module.scss';
import {v4} from 'uuid';
import { setCurVideo } from "../../store/reducers/user.reducer";
import { Loader } from "../Loader/Loader";

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

export const WatchVideo = () => {
	const { 
		getVideoById, 
		getVideoBlob, 
		updateVideo,
		deleteVideo 
	} = useVideo();
	const {createComment, deleteComment} = useComment();

	const {curVideo: video, user, canWatchVideo, canAddComments} = useTypedSelector(state => state.user);
	const [commentText, setCommentText] = useState<string>('');
	const [showAddComment, setShowAddComment] = useState<boolean>(false);
	const [showVideo, setShowVideo] = useState<boolean>(false);
	const [preview, setPreview] = useState<string>();
	const [videoUrl, setVideoUrl] = useState<string>();
	const [videoHTML, setVideoHTML] = useState<HTMLVideoElement>();
	const [socket, setSocket] = useState<Socket>();
	const [title, setTitle] = useState<string>();
	const [previewPath, setPreviewPath] = useState<string>();

	const { videoId } = useParams();
	const dispatch: any = useDispatch();
	const navigate = useNavigate();

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
        setPreviewPath(payload.filePath);
    }, [setPreviewPath]);
    

    const uploadFile = () => {
        const fileHTML = document.getElementById('changePreview') as HTMLInputElement;
        if(!fileHTML || !fileHTML.files)
			return;
        file = fileHTML.files[0];
        if (!socket || !file){
			if(title && videoId)
				updateVideo({title}, videoId);
			return;
		}
		const btn = document.getElementById('updateBtn') as HTMLButtonElement;
		if(btn)
			btn.disabled = true;
        const fileName = v4() + '.' + file.name.split('.').pop();
        fileReader.onload = (e) => {
            if (!e.target) return;
            socket.emit("uploadingFile", {
                fileName,
                data: e.target.result,
            });
        };
        socket.emit("startUploading", { fileName, size: file.size, type: 'photo' });
    };

	const handleAddCommentClick = () => {
		setShowAddComment(!showAddComment);
	};

	const handleSubmitClick = () => {
		if(videoId && commentText)
			dispatch(createComment({text: commentText, videoId, userId: user.id}));
	};

	const handleDeleteCommentClick = (commentId: string) => {
		dispatch(deleteComment(commentId));
	};

	const getDuration = (dur: number): string => {
        const hours = Math.floor(dur / 3600);
        const tempMinutes = dur % 3600;
        const minutes = Math.floor(tempMinutes / 60);
        const seconds = tempMinutes % 60;
        let hoursStr = hours.toString();
        hoursStr = hoursStr.length === 1 ? '0' + hoursStr : hoursStr;
        let minutesStr = minutes.toString();
        minutesStr = minutesStr.length === 1 ? '0' + minutesStr: minutesStr;
        let secondsStr = seconds.toString();
        secondsStr = secondsStr.length === 1 ? '0' + secondsStr : secondsStr;
        return `${hoursStr}:${minutesStr}:${secondsStr}`;
    }

	const handlePlayVideo = async () => {
		if(!videoId)
			return;
		const blob = await getVideoBlob(videoId);
		if(!blob)
			return;
		setVideoUrl(URL.createObjectURL(blob));
		setShowVideo(true);
	};

	const handleDeleteVideoClick = async () => {
		if(!videoId)
			return;
		if(await deleteVideo(videoId))
			navigate('/');
	}

	useEffect(() => {
		dispatch(setCurVideo({canAddComments: false, canWatchVideo: false, video: null}))
        setSocket(io("http://localhost:5000/"));
    }, [dispatch]);

    useEffect(() => {
        if (!socket) return;
        socket.auth = {
            token: localStorage.getItem('token')
        };
        socket.on("nextChunk", handleNextChunk);
        socket.on("endUploading", handleEndUploading);
    }, [socket, handleNextChunk, handleEndUploading]);

	useEffect(() => {
        if(!previewPath || !videoId)
            return;
		updateVideo({previewPath, title}, videoId);
    }, [previewPath, updateVideo, videoId, title]);

	useEffect(() => {
		if(videoHTML){
			videoHTML.volume = 0.1
			videoHTML.play();
		}
	}, [videoHTML]);

	useEffect(() => {
		if(videoUrl)
			setVideoHTML(document.getElementById("video") as HTMLVideoElement);
	}, [videoUrl]);

	useEffect(() => {
		if(!video)
			return;
		if(video.previewPath.lastIndexOf('/') !== -1)
			return setPreview(video.previewPath.split('/').pop());
		setPreview(video.previewPath.split('\\').pop());
    }, [video]);

	useEffect(() => {
		if (videoId)
			dispatch(getVideoById(videoId));
	}, [dispatch, getVideoById, videoId]);

	if (!video || !preview)
		return <Loader />

	return (
		<div className={styles.watchVideo}>
			<div className={styles.watchVideo_body}>
				{!showVideo && preview && !videoUrl
				? <img width={'100%'} height={'326px'} src={`http://localhost:5000/previews/${preview}`} alt="Prev"></img>
				: <video src={videoUrl} id="video" preload="auto" controls controlsList="nodownload" className={styles.watchVideo_video} />
				}
				<div>
					<div style={{display: 'flex', alignItems: 'center'}}>
						<h3 className={styles.watchVideo_title}>{video.title}</h3>
						{ canWatchVideo && !showVideo && preview && !videoUrl && <button onClick={handlePlayVideo} className={styles.watchVideo_btn}>Play</button>}
					</div>
					<h4>Duration: {getDuration(video.duration)}</h4>
					<h4>{new Date(video.createdAt).toLocaleDateString()}</h4>
					{user.role && user.role.value === 'ADMIN' &&
						<div className={styles.watchVideo_updateMenu}>
							<h3>Edit menu:</h3>
							<div className={styles.watchVideo_title}>
								Title: <input value={title} onChange={e => setTitle(e.target.value)} className={styles.watchVideo_input} type="text" />
							</div>
							<div  className={styles.watchVideo_title}>
								Preview: <input type="file" id="changePreview" accept="image/*"/>
							</div>
							<div className={styles.watchVideo_title}>
								<button id='updateBtn' onClick={uploadFile} className={styles.watchVideo_btn} style={{marginLeft: 0}}>Update</button>
							</div>
							<div className={styles.watchVideo_title}>
								<button onClick={handleDeleteVideoClick} className={styles.watchVideo_btn} style={{marginLeft: 0}}>Delete video</button>
							</div>
						</div>
					}
				</div>
				<div className={styles.watchVideo_comments}>
					<div style={{display: 'flex', alignItems: 'center'}}>
						<h3>Comments: </h3>
						{canAddComments && <button onClick={handleAddCommentClick} className={styles.watchVideo_btn}>Add comment</button>}
					</div>
					{showAddComment && 
						<div className={styles.watchVideo_addComment}>
							<input className={styles.watchVideo_input} value={commentText} onChange={e => setCommentText(e.target.value)} type="text" />
							<button className={styles.watchVideo_btn} onClick={handleSubmitClick}>Submit</button>
						</div>
					}
					{video.comments?.map((comment, index) => {
						return (
							<div key={index + Math.random()} className={styles.watchVideo_comment}>
								{comment.user.avatar 
								? <img className={styles.watchVideo_avatar} alt="Avatar" src={'http://localhost:5000/avatars/' + comment.user.avatar.split('\\').pop()}/> 
								: <div className={styles.watchVideo_avatar}/>
								}
								<div className={styles.watchVideo_comment_body}>
									<div className={styles.watchVideo_comment_delete}>
										<div className={styles.watchVideo_comment_author}>
											<h3>{comment.user?.firstname + ' ' + comment.user?.lastname}</h3>
											<h5>{new Date(comment.createdAt).toLocaleDateString()}</h5>
										</div>
										{(comment.userId === user.id || (user.role && user.role.value === 'ADMIN')) && 
											<div className={styles.watchVideo_comment_delete_btn}>
												<h5 onClick={() => handleDeleteCommentClick(comment.id)}>Delete</h5>
											</div>
										}
									</div>
									<div>
										<h4>{comment.text}</h4>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};
