import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
  })

// GET /api/whiteboards - Get user's whiteboards
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const whiteboards = await prisma.whiteboard.findMany({
            where: {
                userId,
                ...(status && { status: status as 'DRAFT' | 'PUBLISHED' }),
            },
            orderBy: {
                updatedAt: 'desc',
            },
            select: {
                id: true,
                name: true,
                status: true,
                shareId: true,
                createdAt: true,
                updatedAt: true,
                userId: true,
                _count: {
                    select: {
                        comments: true,
                    },
                },
            },
        });

        return NextResponse.json(whiteboards);
    } catch (error) {
        console.error('Error fetching whiteboards:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/whiteboards - Create new whiteboard
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, content, status = 'DRAFT' } = body;

        if (!name || name.trim().length === 0) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const whiteboard = await prisma.whiteboard.create({
            data: {
                name: name.trim(),
                content,
                status,
                userId,
            },
        });

        return NextResponse.json(whiteboard, { status: 201 });
    } catch (error) {
        console.error('Error creating whiteboard:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}