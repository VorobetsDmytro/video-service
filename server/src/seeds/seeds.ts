import { PrismaClient as PrismaClientPostgreSQL, Prisma as PrismaPostgreSQL } from '../../prisma/PostgreSQL/generated/client'
import { PrismaClient as PrismaClientMongoDB } from '../../prisma/MongoDB/generated/client';
import {v4} from 'uuid';
import * as bcryptjs from 'bcryptjs';
import * as jwt from 'jsonwebtoken'
import { RoleTypes } from '../roles/roles.type';
import { SubscriptionType_Types } from '../subscription-types/subscription-types.type';

const prismaPostgreSQL = new PrismaClientPostgreSQL()
const prismaMongoDB = new PrismaClientMongoDB();

const adminRoleId = v4();

const rolesData: PrismaPostgreSQL.RoleCreateInput[] = [
    {
        id: v4(),
        value: RoleTypes.SUBSCRIBER
    },
    {
        id: adminRoleId,
        value: RoleTypes.ADMIN
    }
]

const adminId = v4();

const userData: PrismaPostgreSQL.UserUncheckedCreateInput[] = [
    {
        id: adminId,
        email: 'admin@gmail.com',
        firstname: 'Admin',
        lastname: 'Admin',
        password: bcryptjs.hashSync('admin', 5),
        roleId: adminRoleId
    }
]

const subscriptionTypeData: PrismaPostgreSQL.SubscriptionTypeUncheckedCreateInput[] = [
    {
        id: v4(),
        name: SubscriptionType_Types.STANDART,
        maxDownloads: 3,
        maxViews: 0,
        canAddComments: false,
        duration: 999999,
        price: 0
    },
    {
        id: v4(),
        name: SubscriptionType_Types.SILVER,
        maxDownloads: 999,
        maxViews: 3,
        canAddComments: true,
        duration: 30,
        price: 5
    },
    {
        id: v4(),
        name: SubscriptionType_Types.GOLD,
        maxDownloads: 999,
        maxViews: 999,
        canAddComments: true,
        duration: 30,
        price: 10
    },
]

const adminActivationLink: PrismaPostgreSQL.ActivationlinkUncheckedCreateInput = {
    userId: adminId,
    link: jwt.sign({
        id: adminId,
        email:'admin@gmail.com',
        role: RoleTypes.ADMIN
    }, process.env.JWT_SECRET,
    {
        expiresIn: '1d'
    }),
    isActivated: true
}

const cleanAllDB = async () => {
    await prismaPostgreSQL.activationlink.deleteMany();
    await prismaPostgreSQL.ban.deleteMany();
    await prismaPostgreSQL.changeEmail.deleteMany();
    await prismaPostgreSQL.comment.deleteMany();
    await prismaPostgreSQL.creditCard.deleteMany();
    await prismaPostgreSQL.resetPassword.deleteMany();
    await prismaPostgreSQL.role.deleteMany();
    await prismaPostgreSQL.subscription.deleteMany();
    await prismaPostgreSQL.subscriptionType.deleteMany();
    await prismaPostgreSQL.token.deleteMany();
    await prismaPostgreSQL.user.deleteMany();
    await prismaPostgreSQL.video.deleteMany();
    await prismaMongoDB.log.deleteMany();
}

const start = async () => {
    console.log(`Seeding start...`);
    await cleanAllDB();
    for(const data of rolesData)
        await prismaPostgreSQL.role.create({data});
    for(const data of subscriptionTypeData)
        await prismaPostgreSQL.subscriptionType.create({data});
    for(const data of userData)
        await prismaPostgreSQL.user.create({data});
    await prismaPostgreSQL.activationlink.create({data: adminActivationLink});
};

start();