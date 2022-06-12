import { SubscribeMessage, WebSocketGateway, OnGatewayInit } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { StartUploadingDto } from './dto/start-uploading.dto';
import * as path from "path";
import * as fs from 'fs';
import { UploadingFileDto } from './dto/uploading-file.dto';
import { JwtService } from '@nestjs/jwt';
import { PostgreSQLPrismaService } from '../db/postgreSQL.prisma.service';
import { BansService } from '../bans/bans.service';
import { UsersService } from '../users/users.service';
import { SelectSecuredUser } from '../users/users.type';

interface FileUpload {
    data: string;
    size: number;
    uploaded: number;
    handler?: number;
    type: string;
}

@WebSocketGateway({cors: true})
export class SocketsGateway implements OnGatewayInit {
    files: Array<FileUpload>;
    videoPath: string;
    previewPath: string;
    avatarPath: string;
    tempPath: string;
    constructor(private jwtService: JwtService,
                private postgreSQLService: PostgreSQLPrismaService,
                private bansService: BansService,
                private userService: UsersService){
        this.files = new Array<FileUpload>();
        this.videoPath = path.resolve(__dirname, process.env.VIDEO_PATH);
        this.previewPath = path.resolve(__dirname, process.env.STATIC_PATH, 'previews');
        this.avatarPath = path.resolve(__dirname, process.env.STATIC_PATH, 'avatars');
        this.tempPath = path.resolve(__dirname, process.env.TEMP_PATH);
        if(!fs.existsSync(this.videoPath))
            fs.mkdirSync(this.videoPath, {recursive: true});
        if(!fs.existsSync(this.previewPath))
            fs.mkdirSync(this.previewPath, {recursive: true});
        if(!fs.existsSync(this.avatarPath))
            fs.mkdirSync(this.avatarPath, {recursive: true});
        if(!fs.existsSync(this.tempPath))
            fs.mkdirSync(this.tempPath, {recursive: true});
    }

    async checkUser(token: string) {
        if(!token)
            return null;
        const reqUser = this.jwtService.verify<Express.User>(token);
        if(!reqUser)
            return null;
        const user = await this.userService.getOneById(reqUser.id, SelectSecuredUser);
        if(!user)
            return null;
        const lastBan = await this.bansService.isBanned(user);
        if(lastBan)
            return null;
        const tokenDB = await this.postgreSQLService.token.findFirst({where: {userId: user.id}});
        if(!tokenDB || !tokenDB.isActive)
            return null;
        return token;
    }

    @SubscribeMessage('startUploading')
    async handleStartUploading(client: Socket, payload: StartUploadingDto) {
        const isAuth = await this.checkUser(client.handshake.auth.token); 
        if(!isAuth)
            return;
        const addFile: FileUpload = {
            data: '',
            size: payload.size,
            uploaded: 0,
            type: payload.type
        } 
        this.files[payload.fileName] = addFile;
        let uploaded = 0;
        const filePath = path.resolve(this.tempPath, payload.fileName);
        fs.open(filePath, 'a', 0o755, (err, fd) => {
            if(err)
                return console.log(err);
            this.files[payload.fileName].handler = fd;
            client.emit('nextChunk', { uploaded, type: payload.type });
        });
    }

    getFilePathByType(type: string, fileName) {
        switch (type) {
            case 'video':
                return path.resolve(this.videoPath, fileName);
            case 'photo':
                return path.resolve(this.previewPath, fileName);
            case 'avatar':
                return path.resolve(this.avatarPath, fileName);
            default:
                return path.resolve(this.videoPath, fileName);
        }
    }

    fileUploadedCompletely(client: Socket, payload: UploadingFileDto) {
        fs.write(this.files[payload.fileName].handler, this.files[payload.fileName].data, null, 'binary', () => {
            const tempFilePath = path.resolve(this.tempPath, payload.fileName);
            const filePath = this.getFilePathByType(this.files[payload.fileName].type, payload.fileName);
            const readStream = fs.createReadStream(tempFilePath);
            const writeStream = fs.createWriteStream(filePath);
            readStream.pipe(writeStream);
            readStream.on('end', () => {
                fs.close(this.files[payload.fileName].handler);
                fs.unlink(tempFilePath, () => {
                    const type = this.files[payload.fileName].type;
                    this.files = this.files.filter(item => item !== this.files[payload.fileName]);
                    client.emit('endUploading', {filePath, type });
                });
            })
        });
    }

    resetingBufferAndUploading(client: Socket, payload: UploadingFileDto){
        fs.write(this.files[payload.fileName].handler, this.files[payload.fileName].data, null, 'binary', () => {
            this.files[payload.fileName].data = '';
            const uploaded = this.files[payload.fileName].uploaded / 1e5;
            client.emit('nextChunk', { uploaded, type: this.files[payload.fileName].type });
        });
    }

    @SubscribeMessage('uploadingFile')
    async handleUploadingFile(client: Socket, payload: UploadingFileDto){
        const isAuth = await this.checkUser(client.handshake.auth.token); 
        if(!isAuth)
            return;
        this.files[payload.fileName].uploaded += payload.data.length;
        this.files[payload.fileName].data += payload.data;
        if(this.files[payload.fileName].uploaded === this.files[payload.fileName].size)
            return this.fileUploadedCompletely(client, payload);
        if(this.files[payload.fileName].data.length > 1e7)
            return this.resetingBufferAndUploading(client, payload);
        const uploaded = this.files[payload.fileName].uploaded / 1e5;
        client.emit('nextChunk', { uploaded, type: this.files[payload.fileName].type });
    }

    afterInit(server: Server) {
        console.log('The sockets initialization is successful!');
    }
}