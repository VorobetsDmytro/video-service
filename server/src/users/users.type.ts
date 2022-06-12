export interface ISelectUser {
    id: boolean;
    email: boolean;
    firstname: boolean;
    lastname: boolean;
    avatar: boolean;
    roleId: boolean;
    role: any;
    password: boolean;
    activationLink: boolean;
    token: boolean;
    changeEmail: boolean;
    subscription: any;
    creditCards: boolean;
    bans: boolean;
    createdAt: boolean;
    resetPassword: boolean;
}

export const StandartUser: ISelectUser = {
    id: true,
    email: true,
    firstname: true,
    lastname: true,
    avatar: true,
    roleId: true,
    role: {
        select: {
            id: false,
            value: true
        }
    },
    bans: true,
    subscription: false,
    creditCards: false,
    password: false,
    activationLink: false,
    token: false,
    changeEmail: false,
    createdAt: false,
    resetPassword: false
}

export const SelectSecuredUser: ISelectUser = {
    id: true,
    email: true,
    firstname: true,
    lastname: true,
    avatar: true,
    roleId: true,
    role: {
        select: {
            id: false,
            value: true
        }
    },
    bans: true,
    subscription: {
        include: {
            subscriptionType: true
        }
    },
    creditCards: true,
    password: false,
    activationLink: false,
    token: false,
    changeEmail: false,
    createdAt: false,
    resetPassword: false
}

export const SelectFullUser: ISelectUser = {
    id: true,
    email: true,
    firstname: true,
    lastname: true,
    avatar: true,
    roleId: true,
    role: {
        select: {
            id: false,
            value: true
        }
    },
    bans: true,
    subscription: {
        include: {
            subscriptionType: true
        }
    },
    creditCards: true,
    password: false,
    activationLink: true,
    token: true,
    changeEmail: true,
    createdAt: true,
    resetPassword: true
}

export class SecuredUser {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    avatar?: string | null;
    roleId?: string | null;
}