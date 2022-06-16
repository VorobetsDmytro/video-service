import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVideo } from "../../../actions/video.action";
import { useTypedSelector } from "../../../hooks/useTypedSelector";
import { Video as IVideo } from "../../../store/types/videos.types";
import styles from './Video.module.scss';

interface VideoArgs {
    video: IVideo;
}

export const Video: FC<VideoArgs> = ({video}) => {
    const { downloadVideo} = useVideo();
    const {user} = useTypedSelector(state => state.user);
    const navigate = useNavigate();
    const [preview, setPreview] = useState<string>();
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
    const handleClick = () => {
        navigate(`/video/${video.id}`);
    };
    const handleDownloadClick = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.stopPropagation();
		if(!video)
			return;
		if(await downloadVideo(video.id, video.title))
			window.location.reload();
	};
    useEffect(() => {
        if(video.previewPath.lastIndexOf('/') !== -1)
			return setPreview(video.previewPath.split('/').pop());
		setPreview(video.previewPath.split('\\').pop());
    }, [video.previewPath]);
    if(!preview)
        return <div></div>
        
    return (
        <div className={styles.video} onClick={handleClick}>
            <div className={styles.video_body}>
                <img height={326} width={580}  src={`http://localhost:5000/previews/${preview}`} alt="Prev" />
                <div><h3>{video.title}</h3></div>
                <div>Duration: {getDuration(video.duration)}</div>
                { user.canDownloadVideo && <button onClick={handleDownloadClick} className={styles.video_btn}>Download</button>}
            </div>
        </div>
    )
}