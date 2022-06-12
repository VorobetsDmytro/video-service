import { SetMetadata } from "@nestjs/common";
import { RoleType } from "../roles/roles.type";

export const ROLES_KEY = 'ROLES_KEY';

export const Roles = (roles: RoleType[]) => SetMetadata(ROLES_KEY, roles);