import { FC } from "react";
import { useDispatch } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";
import { useTypedSelector } from "../../hooks/useTypedSelector";
import { logoutUser } from "../../store/reducers/user.reducer";
import styles from './Navbar.module.scss';

interface INavbar {
    ready: boolean;
}

export const Navbar: FC<INavbar> = ({ready}) => {
    const {isAuth, user} = useTypedSelector(state => state.user);
    const navigate = useNavigate();
    const dispatch: any = useDispatch();
    const titleClickHandle = () => {
        navigate('/');
    };
    const handleLogoutClick = () => {
        dispatch(logoutUser());
    };
    return (
        <div className={styles.navbar}>
            <div className={styles.navbar_wrap}>
                <h1 onClick={titleClickHandle}>VIDEO SERVICE</h1>
                {ready && <div className={styles.navbar_items}>
                    {!isAuth && <NavLink to="/login">Sign in</NavLink>}
                    {!isAuth && <NavLink to="/registration">Sign up</NavLink>}
                    {!isAuth && <NavLink to="/forgot-pass">Forgot password</NavLink>}
                    {isAuth && <NavLink to="/">Main</NavLink>}
                    {isAuth && <NavLink to="/profile">Profile</NavLink>}
                    {isAuth && user.role && user.role.value === 'ADMIN' && <NavLink to="/addVideo">Add video</NavLink>}
                    {isAuth && <NavLink to="/change-pass">Change password</NavLink>}
                    {isAuth && <NavLink onClick={handleLogoutClick} to="/">Logout</NavLink>}
                </div>}
            </div>
        </div>
    );
}