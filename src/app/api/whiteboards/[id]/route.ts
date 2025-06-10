import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/whiteboards/[id] - Get specific whiteboard
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();
        const { id } = params;

        const whiteboard = await prisma.whiteboard.findUnique({
            where: { id },
            include: {
                comments: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });

        if (!whiteboard) {
            return NextResponse.json({ error: 'Whiteboard not found' }, { status: 404 });
        }

        // Check if user has access (owner or published board)
        if (whiteboard.userId !== userId && whiteboard.status !== 'PUBLISHED') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        return NextResponse.json(whiteboard);
    } catch (error) {
        console.error('Error fetching whiteboard:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/whiteboards/[id] - Update whiteboard
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const body = await request.json();
        const { name, content, status } = body;

        // Check if whiteboard exists and user owns it
        const existingWhiteboard = await prisma.whiteboard.findUnique({
            where: { id },
        });

        if (!existingWhiteboard) {
            return NextResponse.json({ error: 'Whiteboard not found' }, { status: 404 });
        }

        if (existingWhiteboard.userId !== userId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim();
        if (content !== undefined) updateData.content = content;
        if (status !== undefined) updateData.status = status;

        const whiteboard = await prisma.whiteboard.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(whiteboard);
    } catch (error) {
        console.error('Error updating whiteboard:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/whiteboards/[id] - Delete whiteboard
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        // Check if whiteboard exists and user owns it
        const existingWhiteboard = await prisma.whiteboard.findUnique({
            where: { id },
        });

        if (!existingWhiteboard) {
            return NextResponse.json({ error: 'Whiteboard not found' }, { status: 404 });
        }

        if (existingWhiteboard.userId !== userId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        await prisma.whiteboard.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Whiteboard deleted successfully' });
    } catch (error) {
        console.error('Error deleting whiteboard:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}