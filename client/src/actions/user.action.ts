import { useCallback } from "react";
import { ChangePassDto } from "../components/Authorization/ChangePass/dto/change-pass.dto";
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

    const changePass = async (body: ChangePassDto) => {
        try {
            const response = await request('http://localhost:5000/users/change-pass', 'PATCH', body, {Authorization: `Bearer ${localStorage.getItem('token')}`});
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
        getAllUsers,
        changePass
    }
};