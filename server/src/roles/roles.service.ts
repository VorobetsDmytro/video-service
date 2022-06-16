import { HttpException, Injectable } from '@nestjs/common';
import { Prisma, User } from '../../prisma/PostgreSQL/generated/client';
import { Role } from 'prisma/PostgreSQL/generated/client';
import { PostgreSQLPrismaService } from '../db/postgreSQL.prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { v4 } from "uuid";
import { LogsService } from '../logs/logs.service';
import { UsersService } from '../users/users.service';
import { SelectSecuredUser } from '../users/users.type';
import { Request } from 'express';

@Injectable()
export class RolesService {
    constructor(private postgreSQLPrismaService: PostgreSQLPrismaService,
                private logsService: LogsService,
                private usersService: UsersService){}

    async create(dto: CreateRoleDto, req: Request){
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 400);
        const checkRole = await this.getRoleByValue(dto.value);
        if(checkRole)
            throw new HttpException('This role already exists.', 400);
        const roleId = await this.generateRoleId();
        const role = await this.createRole({...dto, id: roleId});
        await this.logsService.create({operation: `Create role. Role id: < ${role.id} >`, createdBy: user.id});
        return role;
    }

    async delete(value: string, req: Request){
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 400);
        const roleValue = await this.deleteRoleByValue(value);
        if(!roleValue)
            throw new HttpException('This role was not found.', 400);
        await this.logsService.create({operation: `Delete role. Role value: < ${roleValue} >`, createdBy: user.id});
        return {roleValue};
    }

    async createRole(dto: Prisma.RoleUncheckedCreateInput): Promise<Role> {
        return this.postgreSQLPrismaService.role.create({data: dto});
    }

    async getAll(req: Request): Promise<Role[]> {
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 400);
        await this.logsService.create({operation: `Get all the roles`, createdBy: user.id});
        return this.postgreSQLPrismaService.role.findMany();
    }

    async getRoleByValue(value: string): Promise<Role | null> {
        return this.postgreSQLPrismaService.role.findFirst({where: {value}});
    }

    async getRoleById(id: string): Promise<Role | null> {
        return this.postgreSQLPrismaService.role.findFirst({where: {id}});
    }

    async deleteRoleByValue(value: string): Promise<string | null> {
        const role = await this.postgreSQLPrismaService.role.findFirst({where: {value}});
        if(!role)
            return null;
        await this.postgreSQLPrismaService.role.delete({where: {id: role.id}});
        return value;
    }

    async setRoleToUser(role: Role, user: User): Promise<User> {
        return this.postgreSQLPrismaService.user.update({data: {roleId: role.id}, where: {id: user.id}});;
    }

    async generateRoleId(): Promise<string>{
        let role: Role | null, id: string;
        do {
            id = v4();
            role = await this.postgreSQLPrismaService.role.findUnique({where: {id}});
        } while (role);
        return id;
    }
}
