import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../actions/auth.action';
import styles from '../authorization.module.scss';

export const ForgotPassword = () => {
    const {forgotPass} = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const submitHandler = async () => {
        if(await forgotPass({email}))
            navigate('/login');
    }
    return (
        <div className={styles.authorization}>
            <div className={styles.authorization__block}>
                <h1>Forgot password</h1>
                <input value={email} onChange={e => setEmail(e.target.value)} className={styles.authorization__input} type="text" placeholder="Email"/>
                <button className={styles.authorization__btn} onClick={()=>submitHandler()}>Submit</button>
            </div>
        </div>
    );
}