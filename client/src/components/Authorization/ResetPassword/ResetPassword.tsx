import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../actions/auth.action';
import styles from '../authorization.module.scss';

export const ResetPassword = () => {
    const {resetPass} = useAuth();
    const navigate = useNavigate();
    const {userId, token} = useParams();
    const [password, setPassword] = useState('');
    const submitHandler = async () => {
        if(!userId || !token)
            return;
        if(await resetPass({password}, userId, token))
        navigate('/login');
    }
    return (
        <div className={styles.authorization}>
            <div className={styles.authorization__block}>
                <h1>Reset password</h1>
                <input value={password} onChange={e => setPassword(e.target.value)} className={styles.authorization__input} type="password" placeholder="Password"/>
                <button className={styles.authorization__btn} onClick={()=>submitHandler()}>Submit</button>
            </div>
        </div>
    );
}