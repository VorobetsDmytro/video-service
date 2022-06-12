import { useCallback} from "react";
import { CreateCommentDto } from "../components/WatchVideo/dto/create-comment.dto";
import { useHttp } from "../hooks/http.hooks";
import { addComment, removeComment } from "../store/reducers/user.reducer";

export const useComment = () => {
    const {request} = useHttp();
    const createComment = useCallback((body: CreateCommentDto) => {
        return async (dispatch: any) => {
            try {
                const response = await request('http://localhost:5000/comments', 'POST', body, {Authorization: `Bearer ${localStorage.getItem('token')}`});
                if(response instanceof Error)
                    throw response;
                if(response.message)
                    alert(response.message);
                dispatch(addComment(response.comment));
                return response;
            } catch (error) {
                alert(error);
            }
        }
    }, [request]);

    const deleteComment = (commentId: string) => {
        return async (dispatch: any) => {
            try {
                const response = await request(`http://localhost:5000/comments/${commentId}`, 'DELETE', null, {Authorization: `Bearer ${localStorage.getItem('token')}`});
                if(response instanceof Error)
                    throw response;
                if(response.message)
                    alert(response.message);
                dispatch(removeComment(commentId));
                return response;
            } catch (error) {
                alert(error);
            }
        }
    };

    return {
        createComment,
        deleteComment
    }
};