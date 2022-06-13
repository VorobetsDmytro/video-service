import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../actions/user.action';
import styles from '../authorization.module.scss';

export const ChangePass = () => {
    const {changePass} = useUser();
    const [curPass, setCurPass] = useState<string>('');
    const [newPass, setNewPass] = useState<string>('');
    const navigate = useNavigate();
    const submitHandler = async () => {
        if(await changePass({oldPass: curPass, newPass}))
            navigate('/');
    }
    return (
        <div className={styles.authorization}>
            <div className={styles.authorization__block}>
                <h1>Change password</h1>
                <input value={curPass} onChange={e => setCurPass(e.target.value)} className={styles.authorization__input} type="text" placeholder="Current password"/>
                <input value={newPass} onChange={e => setNewPass(e.target.value)} className={styles.authorization__input} type="text" placeholder="New password"/>
                <button className={styles.authorization__btn} onClick={()=>submitHandler()}>Submit</button>
            </div>
        </div>
    )
}