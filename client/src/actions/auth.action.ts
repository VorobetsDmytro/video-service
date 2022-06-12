import { useCallback, useState } from "react";
import { ActivationDto } from "../components/Authorization/ActivationLink/dto/activation.dto";
import { ForgotPassDto } from "../components/Authorization/ForgotPassword/dto/forgot-pass.dto";
import { LoginDto } from "../components/Authorization/Login/dto/login.dto";
import { RegisterUserDto } from "../components/Authorization/Registration/dto/register-user.dto";
import { ResetPassDto } from "../components/Authorization/ResetPassword/dto/reset-pass.dto";
import { useHttp } from "../hooks/http.hooks";
import { setUser } from "../store/reducers/user.reducer";

export const useAuth = () => {
    const [ready, setReady] = useState(false);
    const {request} = useHttp();
    const registration = async (body: RegisterUserDto) => {
        try {
            const response = await request('http://localhost:5000/auth/registration', 'POST', body);
            if(response instanceof Error)
                throw response;
            if(response.message)
                alert(response.message);
            return response;
        } catch (error) {
            alert(error);
        }
    }

    const login = (body: LoginDto) => {
        return async (dispatch: any) => {
            try {
                const response = await request('http://localhost:5000/auth/login', 'POST', body);
                if(response instanceof Error)
                    throw response;
                if(response.message)
                    alert(response.message);
                dispatch(setUser(response.user));
                localStorage.setItem('token', response.token);
                return response;
            } catch (error) {
                alert(error);
            }
        }
    }

    const activation = async (body: ActivationDto, userId: string, link: string) => {
        try {
            const response = await request(`http://localhost:5000/activation-links/activation/${userId}/${link}`, 'POST', body);
            if(response instanceof Error)
                throw response;
            if(response.message)
                alert(response.message);
            return response;
        } catch (error) {
            alert(error);
        }
    };

    const auth = useCallback(() => {
        return async (dispatch: any) => {
            try {
                const response = await request('http://localhost:5000/auth', 'GET', null, {Authorization: `Bearer ${localStorage.getItem('token')}`});
                if(response instanceof Error)
                    throw response;
                dispatch(setUser(response.user));
                localStorage.setItem('token', response.token);
            } catch (error) {
                localStorage.removeItem('token');
            } finally {
                setReady(true);
            }
        }
    }, [request]);

    const forgotPass = async (body: ForgotPassDto) => {
        try {
            const response = await request('http://localhost:5000/auth/forgot-pass', 'POST', body);
            if(response instanceof Error)
                throw response;
            if(response.message)
                alert(response.message);
            return response;
        } catch (error) {
            alert(error);
        }
    }

    const resetPass = async (body: ResetPassDto, userId: string, token: string) => {
        try {
            const response = await request(`http://localhost:5000/auth/reset-pass/${userId}/${token}`, 'POST', body);
            if(response instanceof Error)
                throw response;
            if(response.message)
                alert(response.message);
            return response;
        } catch (error) {
            alert(error);
        }
    }

    const approveResetPassword = async (resetPasswordId: string) => {
        try {
            const response = await request(`http://localhost:5000/auth/reset-pass/accept/${resetPasswordId}`, 'GET', null, {Authorization: `Bearer ${localStorage.getItem('token')}`});
            if(response instanceof Error)
                throw response;
            return response;
        } catch (error) {
            alert(error);
        }
    }

    return {
        ready,
        registration,
        activation,
        login,
        auth,
        forgotPass,
        resetPass,
        approveResetPassword
    }
};