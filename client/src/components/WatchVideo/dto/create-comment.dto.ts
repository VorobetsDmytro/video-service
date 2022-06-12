export interface CreateCommentDto {
    id?: string;
    userId?: string;
    videoId: string;
    text: string;
}