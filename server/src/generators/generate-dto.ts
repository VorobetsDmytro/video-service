import { RoleTypes } from '../roles/roles.type';
import * as bcrypt from 'bcryptjs';

export class GeneratorDto{
    constructor(private prefix: string, 
                private index: number = 0){}
    generateUserDto() {
        ++this.index;
        return {
            email: `${this.prefix}user${this.index}@test.com`,
            password: bcrypt.hashSync('123', 5),
            firstname: "User",
            lastname: "User",
            id: `${this.prefix}user${this.index}`,
            avatar: `${this.prefix}user${this.index}`,
            roleId: null,
            createdAt: new Date(0)
        }
    }
    generateBanDto(bannedById: string, bannedId: string) {
        ++this.index;
        return {
            id: `${this.prefix}ban${this.index}`,
            banReason: 'Spam',
            bannedById: bannedById,
            userId: bannedId
        }
    }
    generateRoleDto(roleType: string){
        ++this.index;
        return {
            id: `${this.prefix}role${this.index}`,
            value: roleType
        }
    }
    generateLogDto(createdBy: string){
        ++this.index;
        return {
            id: `${this.prefix}log${this.index}`,
            operation: `${this.prefix}log${this.index}`,
            createdBy,
            createdAt: new Date(0)
        }
    }
    generateActivationLinkDto(userId: string, link: string){
        ++this.index;
        return {
            userId,
            link,
            isActivated: false
        }
    }
    generateCommentDto(userId: string, videoId: string){
        ++this.index;
        return {
            id: `${this.prefix}comment${this.index}`,
            userId,
            videoId,
            text: `${this.prefix}comment${this.index}`,
            createdAt: new Date(0)
        }
    }
    generateCreditCardDto(userId: string, number: string){
        ++this.index;
        return {
            id: `${this.prefix}creditcard${this.index}`,
            userId,
            type: `${this.prefix}creditcard${this.index}`,
            number,
            money: 100,
        }
    }
    generateChangeEmailDto(userId: string, newEmail: string){
        ++this.index;
        return {
            id: `${this.prefix}changeemail${this.index}`,
            userId,
            newEmail
        }
    }
    generateResetPasswordDto(userId: string, token: string){
        ++this.index;
        return {
            id: `${this.prefix}resetpass${this.index}`,
            userId,
            token,
            isApproved: false
        }
    }
    generateSubscriptionTypeDto(name: string){
        ++this.index;
        return {
            id: `${this.prefix}subtype${this.index}`,
            name: name,
            maxDownloads: 1,
            maxViews: 1,
            canAddComments: true,
            price: 1,
            duration: 1
        }
    }
    generateSubscriptionDto(userId: string, subscriptionTypeId: string){
        ++this.index;
        return {
            id: `${this.prefix}sub${this.index}`,
            subscriptionTypeId,
            userId,
            downloadsLeft: 1,
            viewsForTodayLeft: 1,
            lastView: null,
            lastDownload: null,
            lastViewedVideoId: null,
            expiresIn: new Date(0)
        }
    }
    generateTokenDto(userId: string, accessToken: string){
        ++this.index;
        return {
            userId,
            accessToken,
            isActive: true,
            lastAuthorization: new Date(0)
        }
    }
    generateVideoDto(previewPath: string, videoPath: string){
        ++this.index;
        return {
            id: `${this.prefix}video${this.index}`,
            title: `${this.prefix}video${this.index}`,
            previewPath,
            videoPath,
            duration: 123,
            createdAt: new Date(0)
        }
    }
};