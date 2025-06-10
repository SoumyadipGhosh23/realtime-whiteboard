import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/share/[shareId] - Get shared whiteboard (public access)
export async function GET(
    request: NextRequest,
    { params }: { params: { shareId: string } }
) {
    try {
        const { shareId } = params;

        const whiteboard = await prisma.whiteboard.findUnique({
            where: {
                shareId,
                status: 'PUBLISHED', // Only published boards can be shared
            },
            include: {
                comments: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });

        if (!whiteboard) {
            return NextResponse.json({ error: 'Shared whiteboard not found' }, { status: 404 });
        }

        return NextResponse.json(whiteboard);
    } catch (error) {
        console.error('Error fetching shared whiteboard:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}