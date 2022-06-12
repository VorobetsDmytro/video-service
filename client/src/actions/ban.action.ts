import { CreateBanDto } from "../components/AdminPanel/dto/create-ban.dto";
import { useHttp } from "../hooks/http.hooks";

export const useBan = () => {
    const {request} = useHttp();
    const banUser = async (body: CreateBanDto, userId: string) => {
        try {
            const response = await request(`http://localhost:5000/bans/ban/${userId}`, 'POST', body, {Authorization: `Bearer ${localStorage.getItem('token')}`});
            if(response instanceof Error)
                throw response;
            if(response.message)
                alert(response.message);
            return response;
        } catch (error) {
            alert(error);
        }
    }

    const unbanUser = async (userId: string) => {
        try {
            const response = await request(`http://localhost:5000/bans/unban/${userId}`, 'GET', null, {Authorization: `Bearer ${localStorage.getItem('token')}`});
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
        banUser,
        unbanUser
    }
};