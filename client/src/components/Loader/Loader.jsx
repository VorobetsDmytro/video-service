import styles from './loader.module.scss';

export const Loader = () => {
    return (
        <div className={styles.wrap}>
            <div className={styles.ldsRoller}><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
        </div>
    );
}