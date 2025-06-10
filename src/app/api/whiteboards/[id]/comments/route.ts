import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/whiteboards/[id]/comments - Add comment to whiteboard
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        const { id: whiteboardId } = params;
        const body = await request.json();
        const { content, x, y } = body;

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
        }

        if (typeof x !== 'number' || typeof y !== 'number') {
            return NextResponse.json({ error: 'Valid coordinates are required' }, { status: 400 });
        }

        // Check if whiteboard exists and user has access
        const whiteboard = await prisma.whiteboard.findUnique({
            where: { id: whiteboardId },
        });

        if (!whiteboard) {
            return NextResponse.json({ error: 'Whiteboard not found' }, { status: 404 });
        }

        // Users can comment on their own boards or published boards
        if (whiteboard.userId !== userId && whiteboard.status !== 'PUBLISHED') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const comment = await prisma.comment.create({
            data: {
                content: content.trim(),
                x,
                y,
                userId,
                userName: user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.username || user.emailAddresses[0]?.emailAddress || 'Anonymous',
                userAvatar: user.imageUrl,
                whiteboardId,
            },
        });

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error('Error creating comment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/whiteboards/[id]/comments - Get comments for whiteboard
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();
        const { id: whiteboardId } = params;

        // Check if whiteboard exists and user has access
        const whiteboard = await prisma.whiteboard.findUnique({
            where: { id: whiteboardId },
        });

        if (!whiteboard) {
            return NextResponse.json({ error: 'Whiteboard not found' }, { status: 404 });
        }

        // Users can view comments on their own boards or published boards
        if (whiteboard.userId !== userId && whiteboard.status !== 'PUBLISHED') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const comments = await prisma.comment.findMany({
            where: { whiteboardId },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}