import { useCallback } from "react";
import { useHttp } from "../hooks/http.hooks";
import { setUsers } from "../store/reducers/admin.reducer";

export const useUser = () => {
    const {request} = useHttp();
    const getAllUsers = useCallback(() => {
        return async (dispatch: any) => {
            try {
                const response = await request('http://localhost:5000/users', 'GET', null, {Authorization: `Bearer ${localStorage.getItem('token')}`});
                if(response instanceof Error)
                    throw response;
                dispatch(setUsers(response));
                return response;
            } catch (error) {
                alert(error);
            }
        }
    }, [request]);

    return {
        getAllUsers
    }
};