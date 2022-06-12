import { useCallback, useState } from "react";
import { ChangeProfileDto } from "../components/Profile/dto/change-profile.dto";
import { ChangeEmailAcceptDto } from "../components/Profile/NewEmail/dto/change-email-accept.dto";
import { useHttp } from "../hooks/http.hooks";
import { setUser } from "../store/reducers/user.reducer";

export const useProfile = () => {
    const [ready, setReady] = useState(false);
    const {request} = useHttp();
    const getProfile = useCallback(() => {
        return async (dispatch: any) => {
            try {
                const response = await request('http://localhost:5000/profiles', 'GET', null, {Authorization: `Bearer ${localStorage.getItem('token')}`});
                if(response instanceof Error)
                    throw response;
                dispatch(setUser(response));
                return response;
            } catch (error) {
                alert(error);
            } finally {
                setReady(true);
            }
        }
    }, [request]);

    const updateProfile = async (body: ChangeProfileDto) => {
        try {
            const response = await request('http://localhost:5000/profiles', 'PATCH', body, {Authorization: `Bearer ${localStorage.getItem('token')}`});
            if(response instanceof Error)
                throw response;
            if(response.message && response.message.length)
                alert(response.message);
            return response;
        } catch (error) {
            alert(error);
        }
    }

    const changeEmailAccept = async (body: ChangeEmailAcceptDto, changeEmailId: string) => {
        try {
            const response = await request(`http://localhost:5000/profiles/change-email/accept/${changeEmailId}`, 'POST', body, {Authorization: `Bearer ${localStorage.getItem('token')}`});
            if(response instanceof Error)
                throw response;
            if(response.message)
                alert(response.message);
            return response;
        } catch (error) {
            alert(error);
        }
    }

    const getFullUser = async (userId: string) => {
        try {
            const response = await request(`http://localhost:5000/profiles/${userId}`, 'GET', null, {Authorization: `Bearer ${localStorage.getItem('token')}`});
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
        getProfile,
        updateProfile,
        changeEmailAccept,
        getFullUser
    }
};