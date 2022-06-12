import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../../actions/auth.action';
import styles from '../authorization.module.scss';

export const Login = () => {
    const {login} = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const dispatch: any = useDispatch();
    const submitHandler = async () => {
        dispatch(login({email, password}));
    }
    return (
        <div className={styles.authorization}>
            <div className={styles.authorization__block}>
                <h1>Login</h1>
                <input value={email} onChange={e => setEmail(e.target.value)} className={styles.authorization__input} type="text" placeholder="Email" />
                <input value={password} onChange={e => setPassword(e.target.value)} className={styles.authorization__input} type="password" placeholder="Password"/>
                <button className={styles.authorization__btn} onClick={()=>submitHandler()}>Submit</button>
            </div>
        </div>
    );
}