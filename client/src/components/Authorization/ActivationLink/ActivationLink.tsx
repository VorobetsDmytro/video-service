import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../actions/auth.action';
import styles from '../authorization.module.scss';

export const ActivationLink = () => {
    const {activation} = useAuth();
    const navigate = useNavigate();
    const {userId, link} = useParams();
    const [password, setPassword] = useState('');
    const submitHandler = async () => {
        if(!userId || !link)
            return;
        if(await activation({password}, userId, link))
        navigate('/login');
    }
    return (
        <div className={styles.authorization}>
            <div className={styles.authorization__block}>
                <h1>Account activation</h1>
                <input value={password} onChange={e => setPassword(e.target.value)} className={styles.authorization__input} type="password" placeholder="Password"/>
                <button className={styles.authorization__btn} onClick={()=>submitHandler()}>Submit</button>
            </div>
        </div>
    );
}