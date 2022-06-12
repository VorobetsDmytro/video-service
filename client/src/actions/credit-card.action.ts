import { CreateCreditCardDto } from "../components/Profile/dto/create-credit-card.dto";
import { TopUpMyBalanceDto } from "../components/Profile/dto/top-up-my-balance.dto";
import { useHttp } from "../hooks/http.hooks";

export const useCreditCard = () => {
    const {request} = useHttp();
    const addCreditCard = async (body: CreateCreditCardDto) => {
        try {
            const response = await request('http://localhost:5000/credit-cards', 'POST', body, {Authorization: `Bearer ${localStorage.getItem('token')}`});
            if(response instanceof Error)
                throw response;
            if(response.message)
                alert(response.message);
            return response;
        } catch (error) {
            alert(error);
        }
    }

    const topUpBalance = async (body: TopUpMyBalanceDto, creditCardId: string) => {
        try {
            const response = await request(`http://localhost:5000/credit-cards/${creditCardId}`, 'PATCH', body, {Authorization: `Bearer ${localStorage.getItem('token')}`});
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
        addCreditCard,
        topUpBalance
    }
};