import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { useCreditCard } from '../../actions/credit-card.action';
import { useProfile } from '../../actions/profile.action';
import { useSubscription } from '../../actions/subscription.action';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import ChangeAvatar from './assets/ChangeAvatar.png'
import styles from './Profile.module.scss';
import {v4} from 'uuid';
import { Loader } from '../Loader/Loader';

interface NextChunkDto {
    uploaded: number;
    type: string;
}

interface EndUploading {
    filePath: string;
    type: string;
}

let fileReader = new FileReader();
let file: File;

export const Profile = () => {
    const {addCreditCard, topUpBalance, removeTheCard} = useCreditCard();
    const {getAllSubscriptionTypes, buySubscription} = useSubscription();
    const {getProfile, ready, updateProfile} = useProfile();
    const [socket, setSocket] = useState<Socket>();
    const [firstname, setFirstname] = useState<string>('');
    const [lastname, setLastname] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [avatar, setAvatar] = useState<string>('');
    const [topUpSum, setTopUpSum] = useState<string>('');
    const [creditCardIdForBuy, setCreditCardIdForBuy] = useState<string>('');
    const [creditCardNumber, setCreditCardNumber] = useState<string>('');
    const [creditCardType, setCreditCardType] = useState<string>('');
    const {subscriptionTypes} = useTypedSelector(state => state.subscription)
    const {user} = useTypedSelector(state => state.user);
    const dispatch: any = useDispatch();

    const handleFirstnameUpdate = async () => {
        if(await updateProfile({firstname}))
            window.location.reload();
    }

    const handleLastnameUpdate = async () => {
        if(await updateProfile({lastname}))
            window.location.reload();
    }

    const handleEmailUpdate = async () => {
        await updateProfile({email});
    }

    const handleAddCard = async () => {
        if(await addCreditCard({type: creditCardType, number: creditCardNumber}))
            window.location.reload();
    };

    const handleBuySubscription = async (subscriptionTypeName: string) => {
        if(creditCardIdForBuy)
            if(await buySubscription({subscriptionTypeName, creditCardId: creditCardIdForBuy}))
                window.location.reload();
    };

    const handleTopUpBalanceClick = async () => {
        if(!creditCardIdForBuy)
            return;
        if(await topUpBalance({money: +topUpSum}, creditCardIdForBuy))
            window.location.reload();
    }

    const handleRemoveTheCard = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, creditCardId: string) => {
        e.stopPropagation();
        if(await removeTheCard(creditCardId))
            window.location.reload();
    }

    const handleNextChunk = useCallback((payload: NextChunkDto) => {
        if (!file) return;
        const start = payload.uploaded * 1e5;
        const newFile = file.slice(
            start,
            start + Math.min(1e5, file.size - start)
        );
        fileReader.readAsBinaryString(newFile);
    }, []);

    const handleEndUploading = useCallback((payload: EndUploading) => {
        setAvatar(payload.filePath);
    }, [setAvatar]);
    

    const uploadFile = () => {
        const fileHTML = document.getElementById('changeAvatar') as HTMLInputElement;
        if(!fileHTML || !fileHTML.files)
            return;
        file = fileHTML.files[0];
        if (!socket || !file) return;
        const fileName = v4() + '.' + file.name.split('.').pop();
        fileReader.onload = (e) => {
            if (!e.target) return;
            socket.emit("uploadingFile", {
                fileName,
                data: e.target.result,
            });
        };
        socket.emit("startUploading", { fileName, size: file.size, type: 'avatar' });
    };

    const updateAvatar = useCallback( async () => {
        if(await updateProfile({avatar}))
            window.location.reload();
    }, [updateProfile, avatar])

    const getAvatarPath = (serverPath: string) => {
        if(serverPath.lastIndexOf('/') !== -1)
            return serverPath.split('/').pop();
        return serverPath.split('\\').pop();
    }

    useEffect(() => {
        if(!avatar)
            return;
        updateAvatar();
    }, [avatar, updateAvatar]);

    useEffect(() => {
        dispatch(getAllSubscriptionTypes());
    }, [dispatch, getAllSubscriptionTypes]);

    useEffect(() => {
        dispatch(getProfile());
    }, [dispatch, getProfile]);

    useEffect(() => {
        setSocket(io("http://localhost:5000/"));
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.auth = {
            token: localStorage.getItem('token')
        };
        socket.on("nextChunk", handleNextChunk);
        socket.on("endUploading", handleEndUploading);
    }, [socket, handleNextChunk, handleEndUploading]);

    if(!ready)
        return <Loader />

    return (
        <div className={styles.profile}>
            <div className={styles.profile__top}>
                <div className={styles.profile__avatar} onClick={() => document.getElementById('changeAvatar')?.click()}>
                    {user.avatar 
						? <img className={styles.profile__avatar_main} alt="Avatar" src={'http://localhost:5000/avatars/' + getAvatarPath(user.avatar)}/> 
						: <div className={styles.watchVideo_avatar}/>
					}
                    <img width={100} height={100} src={ChangeAvatar} className={styles.profile__avatar_changeImg} alt="ChangeAvatar" />
                    <input onChange={() => {uploadFile()}} type="file" id="changeAvatar" accept="image/*" />
                </div>
                <div className={styles.profile__info}>
                    <div className={styles.profile__info__item}>
                        <h2><span>Firstname:</span> {user.firstname}</h2>
                        <div className={styles.profile__btn}>
                            <input onChange={e => setFirstname(e.target.value)} className={styles.profile_input} type="text" />
                            <button onClick={handleFirstnameUpdate}>Change firstname</button>
                        </div>
                    </div>
                    <div className={styles.profile__info__item}>
                        <h2><span>Lastname:</span> {user.lastname}</h2>
                        <div className={styles.profile__btn}>
                            <input onChange={e => setLastname(e.target.value)} className={styles.profile_input} type="text" />
                            <button onClick={handleLastnameUpdate}>Change lastname</button>
                        </div>
                    </div>
                    <div className={styles.profile__info__item}>
                        <h2><span>Email:</span> {user.email}</h2>
                        <div className={styles.profile__btn}>
                            <input onChange={e => setEmail(e.target.value)} className={styles.profile_input} type="text" />
                            <button onClick={handleEmailUpdate}>Change email</button>
                        </div>
                    </div>
                </div>
            </div>
            {user.role && user.role.value !== 'ADMIN' 
            ?
            <>
            <div className={styles.profile__item}>
                <h3><span>Downloads left:</span> {user.subscription && String(user.subscription.downloadsLeft) === '999' ? 'Infinitely' : user.subscription?.downloadsLeft}</h3>
            </div>
            <div className={styles.profile__item}>
                <h3><span>Views left for today:</span> {user.subscription && String(user.subscription.viewsForTodayLeft) === '999' ? 'Infinitely' : user.subscription?.viewsForTodayLeft}</h3>
            </div>
            <div className={styles.profile__item}>
                <h3><span>Subscription expires in:</span> {user.subscription && new Date(user.subscription.expiresIn).toLocaleDateString()}</h3>
            </div>
            <div className={styles.profile__item}>
                <h3><span>Credit cards:</span></h3>
                <div>
                    {user.creditCards?.map((creditCard, index) => {
                        return (
                            <div onClick={() => setCreditCardIdForBuy(creditCard.id)} className={styles.profile_creditCard} key={index + Math.random()}>
                                <h3 style={{color: creditCard.id === creditCardIdForBuy ? '#0066ff' : '#000'}}>Number: {creditCard.number}</h3>
                                <h3 style={{color: creditCard.id === creditCardIdForBuy ? '#0066ff' : '#000'}}>Bill: {creditCard.money}</h3>
                                <div className={styles.profile__btn} style={{marginLeft: '10px', marginBottom: '10px'}}>
                                    <button onClick={e => handleRemoveTheCard(e, creditCard.id)}>Remove</button>
                                </div>
                            </div>
                        )
                    })}
                    <div className={styles.profile__btn}>
                        <input value={creditCardType} onChange={e => setCreditCardType(e.target.value)} className={styles.profile_input} type="text"  placeholder='Type'/>
                        <input value={creditCardNumber} onChange={e => setCreditCardNumber(e.target.value)} className={styles.profile_input} type="text"  placeholder='Number'/>
                        <button onClick={handleAddCard}>Add the card</button>
                    </div>
                    <h3 className={styles.profile__btn} style={{marginTop: '10px'}}>
                        Top up balance: <input value={topUpSum} onChange={e => setTopUpSum(e.target.value)} className={styles.profile_input} type="number" placeholder='Sum'/>
                        <button onClick={handleTopUpBalanceClick}>Submit</button>
                    </h3>
                </div>
            </div>
            <div>
                <h3><span>Subscriptions:</span></h3>
                <div>
                    {
                        subscriptionTypes?.map((subscription, index) => {
                            return (
                                <div className={user.subscription?.subscriptionType.id === subscription.id ? styles.profile_sub_cur : styles.profile_sub} key={index + Math.random()}>
                                    <h3>Name: <span>{subscription.name}</span></h3>
                                    <h3>Max downloads: <span>{subscription.maxDownloads === 999 ? 'Infinitely' : subscription.maxDownloads}</span></h3>
                                    <h3>Max views per day: <span>{subscription.maxViews === 999 ? 'Infinitely' : subscription.maxViews}</span></h3>
                                    <h3>Can add comments: <span>{subscription.canAddComments ? 'Yes' : 'No'}</span></h3>
                                    <h3>Price: <span>{subscription.price + '$'}</span></h3>
                                    {user.subscription?.subscriptionType.id === subscription.id
                                    ? <h4>Current subscription</h4>
                                    : <div className={styles.profile__btn}>
                                        <button onClick={() => handleBuySubscription(subscription.name)}>Buy</button>
                                    </div>
                                    }
                                </div>
                            )
                        })
                    }
                </div>
            </div>
            </>
            :
            <div></div>
            }
        </div>
    );
};