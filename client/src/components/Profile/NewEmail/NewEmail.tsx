import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProfile } from '../../../actions/profile.action';
import styles from './NewProfile.module.scss';

export const NewEmail = () => {
    const {changeEmailAccept} = useProfile();
    const navigate = useNavigate();
    const {changeEmailId} = useParams();
    const [password, setPassword] = useState('');
    const submitHandler = async () => {
        if(!changeEmailId)
            return;
        if(await changeEmailAccept({password}, changeEmailId))
        navigate('/profile');
    }
    return (
        <div className={styles.authorization}>
            <div className={styles.authorization__block}>
                <h1>New email approvement</h1>
                <input value={password} onChange={e => setPassword(e.target.value)} className={styles.authorization__input} type="password" placeholder="Password"/>
                <button className={styles.authorization__btn} onClick={()=>submitHandler()}>Submit</button>
            </div>
        </div>
    );
}