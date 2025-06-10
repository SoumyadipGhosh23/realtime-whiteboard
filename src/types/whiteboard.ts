export interface Whiteboard {
    id: string;
    name: string;
    content: any; 
    status: 'DRAFT' | 'PUBLISHED';
    shareId: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    comments?: Comment[];
}

export interface Comment {
    id: string;
    content: string;
    x: number;
    y: number;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    userName: string;
    userAvatar?: string;
    whiteboardId: string;
}

export interface CreateWhiteboardRequest {
    name: string;
    content?: any;
    status?: 'DRAFT' | 'PUBLISHED';
}

export interface UpdateWhiteboardRequest {
    name?: string;
    content?: any;
    status?: 'DRAFT' | 'PUBLISHED';
}

export interface CreateCommentRequest {
    content: string;
    x: number;
    y: number;
  }