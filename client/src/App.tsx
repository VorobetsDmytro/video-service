import {Routes, Route, Navigate} from 'react-router-dom';
import { Registration } from './components/Authorization/Registration/Registration';
import styles from './App.module.scss';
import { ActivationLink } from './components/Authorization/ActivationLink/ActivationLink';
import { Login } from './components/Authorization/Login/Login';
import { useAuth } from './actions/auth.action';
import { useDispatch } from "react-redux";
import { useTypedSelector } from './hooks/useTypedSelector';
import { useEffect } from "react";
import { Main } from './components/Main/Main';
import { Navbar } from './components/Navbar/Navbar';
import { AddVideo } from './components/Main/AddVideo/AddVideo';
import { WatchVideo } from './components/WatchVideo/WatchVideo';
import { Profile } from './components/Profile/Profile';
import { NewEmail } from './components/Profile/NewEmail/NewEmail';
import { ForgotPassword } from './components/Authorization/ForgotPassword/ForgotPassword';
import { ResetPassword } from './components/Authorization/ResetPassword/ResetPassword';
import { AdminPanel } from './components/AdminPanel/AdminPanel';

export const App = () => {
  const {auth, ready} = useAuth();
  const dispatch: any = useDispatch();
  const {isAuth, user} = useTypedSelector(state => state.user);

  useEffect(() => {
    dispatch(auth());
  },[dispatch, auth]);
  return (
    <div className={styles.app}>
      <Navbar ready={ready}/>
      {user.role && user.role.value === 'ADMIN' && <AdminPanel />}
      {isAuth && ready ? 
      <Routes>
        <Route path={'/main'} element={<Main />}/>
        <Route path={'/profile'} element={<Profile />}/>
        {user.role && user.role.value === 'ADMIN' && <Route path={'/addVideo'} element={<AddVideo />}/>}
        <Route path={'/video/:videoId'} element={<WatchVideo />}/>
        <Route path={'/profile/change-email/accept/:changeEmailId'} element={<NewEmail />}/>
        <Route
			  	path="*"
			  	element={<Navigate to="/main" replace />}
			  />
      </Routes>
    : ready ?
      <Routes>
        <Route path={'/registration'} element={<Registration />}/>
        <Route path={'/login'} element={<Login />}/>
        <Route path={'/forgot-pass'} element={<ForgotPassword />}/>
        <Route path={'/forgot-pass/accept/:userId/:token'} element={<ResetPassword />}/>
        <Route path={'/registration/accept/:userId/:link'} element={<ActivationLink />}/>
        <Route
			  	path="*"
			  	element={<Navigate to="/login" replace />}
			  />
      </Routes>
    :
      <div></div>
    }
    </div>
  );
};
