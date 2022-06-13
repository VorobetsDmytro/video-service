import { FC, useState } from "react";
import { useDispatch } from "react-redux";
import { useComment } from "../../../actions/comment.action";
import { useTypedSelector } from "../../../hooks/useTypedSelector";
import { Comment as CommentClass } from "../../../store/types/videos.types"
import styles from './Comment.module.scss';

interface IComment {
    comment: CommentClass;
    handleDeleteCommentClick: (commentId: string) => void;
}

export const Comment: FC<IComment> = ({comment, handleDeleteCommentClick}) => {
    const {editComment} = useComment();
    const {user} = useTypedSelector(state => state.user);
    const [editDisplay, setEditDisplay] = useState<boolean>();
    const [editText, setEditText] = useState<string>(comment.text);
    const dispath: any = useDispatch();
    const handleEditClick = () => {
        dispath(editComment(comment.id, editText));
    }
	const getAvatarPath = (serverPath: string) => {
        if(serverPath.lastIndexOf('/') !== -1)
            return serverPath.split('/').pop();
        return serverPath.split('\\').pop();
    }
    return (
        <div className={styles.watchVideo_comment}>
			{comment.user.avatar 
			? <img className={styles.watchVideo_avatar} alt="Avatar" src={'http://localhost:5000/avatars/' + getAvatarPath(comment.user.avatar)}/> 
			: <div className={styles.watchVideo_avatar}/>
			}
			<div className={styles.watchVideo_comment_body}>
				<div className={styles.watchVideo_comment_delete}>
					<div className={styles.watchVideo_comment_author}>
						<h3>{comment.user?.firstname + ' ' + comment.user?.lastname}</h3>
						<h5>{new Date(comment.createdAt).toLocaleDateString()}</h5>
						{comment.userId === user.id && <button className={styles.watchVideo_btn} onClick={() => setEditDisplay(!editDisplay)}>Edit</button>}
					</div>
					{(comment.userId === user.id || (user.role && user.role.value === 'ADMIN')) && 
						<div className={styles.watchVideo_comment_delete_btn}>
							<h5 onClick={() => handleDeleteCommentClick(comment.id)}>Delete</h5>
						</div>
					}
				</div>
				<div>
					{!editDisplay 
                    ? <h4>{comment.text}</h4>
                    :
                    <div>
                        <input className={styles.watchVideo_input} value={editText} onChange={e => setEditText(e.target.value)} type="text" />
                        <button className={styles.watchVideo_btn} onClick={handleEditClick}>Submit</button>
                    </div>
                    }
				</div>
			</div>
		</div>
    )
}