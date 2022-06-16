declare namespace NodeJS {
    export interface ProcessEnv {
        PORT: number;
        BASE_URL: string;
        POSTGRESQL_URL: string;
        MONGO_URL: string;
        JWT_SECRET: string;
        EMAIL_HOST: string;
        EMAIL_PORT: number;
        EMAIL_USER: string;
        EMAIL_PASS: string;
        STATIC_PATH: string;
        VIDEO_PATH: string;
        TEMP_PATH: string;
    }
}

declare global {
    namespace Express {
        interface Request {
            user?: User | undefined;
        }
    }
}

declare namespace Express {
    export interface User {
        id: string;
        email: string;
        role: string;
    }
}