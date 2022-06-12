import { useState } from 'react';
import { useAuth } from '../../../actions/auth.action';
import styles from '../authorization.module.scss';

export const Registration = () => {
    const {registration} = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const submitHandler = () => {
        registration({email, password, firstname, lastname});
    }
    return (
        <div className={styles.authorization}>
            <div className={styles.authorization__block}>
                <h1>Registration</h1>
                <input value={email} onChange={e => setEmail(e.target.value)} className={styles.authorization__input} type="text" placeholder="Email" />
                <input value={password} onChange={e => setPassword(e.target.value)} className={styles.authorization__input} type="password" placeholder="Password"/>
                <input value={firstname} onChange={e => setFirstname(e.target.value)} className={styles.authorization__input} type="text" placeholder="Firstname"/>
                <input value={lastname} onChange={e => setLastname(e.target.value)} className={styles.authorization__input} type="text" placeholder="Lastname"/>
                <button className={styles.authorization__btn} onClick={()=>submitHandler()}>Submit</button>
            </div>
        </div>
    );
}