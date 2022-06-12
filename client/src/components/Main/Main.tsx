import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useVideo } from "../../actions/video.action";
import { useTypedSelector } from "../../hooks/useTypedSelector"
import { Video } from "./Video/Video";
import styles from './Main.module.scss';
import { Loader } from "../Loader/Loader";

export const Main = () => {
    const {getAllVideo, ready} = useVideo();
    const {videos} = useTypedSelector(state => state.video);
    const dispatch: any = useDispatch();
    useEffect(() => {
        dispatch(getAllVideo());
    },[dispatch, getAllVideo]);

    if(!ready)
        return <Loader />

    return (
        <div>
            {!videos.length 
            ? <div className={styles.main_noVideo}><h1>Empty</h1></div> 
            : videos.map((video, index) => {
                return <Video key={index + Math.random()} video={video}/>
            })}
        </div>
    )
}