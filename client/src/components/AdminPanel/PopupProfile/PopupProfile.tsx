import { FC } from "react"
import { User } from "../../../store/types/user.types"
import styles from './PopupProfile.module.scss';

interface IPopupProfile {
    user: User,
    setPopUp: React.Dispatch<React.SetStateAction<boolean | undefined>>
}

export const PopupProfile: FC<IPopupProfile> = ({user, setPopUp}) => {
    const handleClosePopup = () => {
        setPopUp(false);
    }
    const userStatus = (checkUser: User): string => {
        return !checkUser.bans?.length || checkUser.bans[checkUser.bans.length - 1].unBannedAt ? 'Active' : 'Banned';
    }
    return (
        <div className={styles.popup} onMouseDown={handleClosePopup}>
            <div className={styles.popup__body} onMouseDown={e => e.stopPropagation()}>
                <div><b>Id:</b> {user.id}</div>
                <div><b>Email:</b> {user.email}</div>
                <div><b>Firstname:</b> {user.firstname}</div>
                <div><b>Lastname:</b> {user.lastname}</div>
                <div><b>Role:</b> {user.role && user.role.value}</div>
                <div><b>Registered:</b> {new Date(user.createdAt).toLocaleDateString()}</div>
                <div><b>Last authorization:</b> {user.token && new Date(user.token.lastAuthorization).toLocaleDateString()}</div>
                <div><b>Status:</b> {userStatus(user)}</div>
                {user.role && user.role.value !== 'ADMIN' && 
                <> <div><b>Subscription:</b> {user.subscription?.subscriptionType.name}</div>
                    <div><b>Expires in:</b> {user.subscription && new Date(user.subscription.expiresIn).toLocaleDateString()}</div>
                    <div><b>Credit cards:</b> 
                    {user.creditCards && user.creditCards.length
                        ? user.creditCards.map((creditCard, index) => {
                            return (
                                <div key={index + Math.random()}>
                                    {creditCard.number}
                                </div>
                            )
                        })
                        :
                        <>Empty</>
                    }</div>
                </>}
            </div>
        </div>
    )
}