import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useAuth } from "../../actions/auth.action";
import { useBan } from "../../actions/ban.action";
import { useProfile } from "../../actions/profile.action";
import { useUser } from "../../actions/user.action";
import { useTypedSelector } from "../../hooks/useTypedSelector";
import { User } from "../../store/types/user.types";
import styles from './AdminPanel.module.scss';
import { PopupProfile } from "./PopupProfile/PopupProfile";

export const AdminPanel = () => {
    const {banUser, unbanUser} = useBan();
    const {approveResetPassword} = useAuth();
    const {getAllUsers} = useUser();
    const {getFullUser} = useProfile();
    const {user} = useTypedSelector(state => state.user);
    const {users} = useTypedSelector(state => state.admin);
    const [popup, setPopup] = useState<boolean>();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const dispatch: any = useDispatch();

    const userStatus = (checkUser: User): string => {
        return !checkUser.bans?.length || checkUser.bans[checkUser.bans.length - 1].unBannedAt ? 'Active' : 'Banned';
    }

    const handleApproveResetPassword = async (resetPasswordId: string, resetPassIdHTML: string) => {
        if(await approveResetPassword(resetPasswordId)){
            const resetPass = document.getElementById(resetPassIdHTML);
            if(resetPass)
                resetPass.remove();
        }
    }

    const handleBanClick = async (inputIdHTML: string, userId: string) => {
        const input = document.getElementById(inputIdHTML) as HTMLInputElement;
        if(!input)
            return;
        if(await banUser({banReason: input.value}, userId))
            window.location.reload();
    }

    const handleUnbanClick = async (userId: string) => {
        if(await unbanUser(userId))
            window.location.reload();
    }

    const handleProfileClick = async (userId: string) => {
        const user = await getFullUser(userId)
        if(user){
            setSelectedUser(user);
            setPopup(true);
        }
            
    }

    useEffect(() => {
        if(user.role && user.role.value === 'ADMIN')
            dispatch(getAllUsers());
    }, [dispatch, getAllUsers, user.role]);

    return (
        <>
        {user.role && user.role.value === 'ADMIN' && 
            <div className={styles.admin}>
                <div className={styles.admin_title}><h2>Admin panel</h2></div>
                {users?.map((userItem, index) => {
                    return (
                        <div key={index + Math.random()} className={styles.admin_item}>
                            <div>Email: <span className={styles.admin_popup} onClick={() => handleProfileClick(userItem.id)}>{userItem.email}</span></div>
                            <div>Registered: {new Date(userItem.createdAt).toLocaleDateString()}</div>
                            <div>Last authorization: {userItem.token && new Date(userItem.token.lastAuthorization).toLocaleDateString()}</div>
                            <div>Status: {userStatus(userItem)}</div>
                            {userItem.role && userItem.role.value !== 'ADMIN'  
                            && <>
                            <div>Subscription: {userItem.subscription?.subscriptionType.name}</div>
                            <div>Expires in: {userItem.subscription && new Date(userItem.subscription.expiresIn).toLocaleDateString()}</div>
                            </>
                            }
                            {userItem.resetPassword && !userItem.resetPassword.isApproved &&
                                <div id={`resetPass${index}`}>
                                    Reset password: <button onClick={() => handleApproveResetPassword(userItem.resetPassword ? userItem.resetPassword.id : '', `resetPass${index}`)} className={styles.admin_btn}>Approve</button>
                                </div> 
                            }
                            {userStatus(userItem) === 'Active' && userItem.id !== user.id
                            ? <div>
                                <input id={`user${index}`} className={styles.admin_input} type="text" placeholder="Ban reason" />
                                <button className={styles.admin_btn} onClick={() => handleBanClick(`user${index}`, userItem.id)}>Ban</button>
                              </div>
                            :  userItem.id !== user.id 
                            ? <div><button onClick={() => handleUnbanClick(userItem.id)} className={styles.admin_btn}>Unban</button></div>
                            : <></>
                            }
                        </div>
                    )
                })}
            </div>
        }
        {popup && selectedUser && <PopupProfile user={selectedUser} setPopUp={setPopup}/>}
        </>
    )
};