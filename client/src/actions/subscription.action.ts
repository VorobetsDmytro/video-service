import { useCallback } from "react";
import { ChangeSubscriptionDto } from "../components/Profile/dto/change-subscription.dto";
import { useHttp } from "../hooks/http.hooks";
import { setSubscriprionTypes } from "../store/reducers/subscriptions.reducer";

export const useSubscription = () => {
    const {request} = useHttp();
    const getAllSubscriptionTypes = useCallback(() => {
        return async (dispatch: any) => {
            try {
                const response = await request('http://localhost:5000/subscription-types', 'GET', null, {Authorization: `Bearer ${localStorage.getItem('token')}`});
                if(response instanceof Error)
                    throw response;
                dispatch(setSubscriprionTypes(response));
                return response;
            } catch (error) {
                alert(error);
            }
        }
    }, [request]);

    const buySubscription = async (body: ChangeSubscriptionDto) => {
        try {
            const response = await request('http://localhost:5000/subscriptions', 'PATCH', body, {Authorization: `Bearer ${localStorage.getItem('token')}`});
            if(response instanceof Error)
                throw response;
            if(response.message)
                alert(response.message);
            return response;
        } catch (error) {
            alert(error);
        }
    };

    return {
        getAllSubscriptionTypes,
        buySubscription
    }
};