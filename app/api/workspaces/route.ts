import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const body = createWorkspaceSchema.parse(json);

    const workspace = await db.workspace.create({
      data: {
        name: body.name,
        description: body.description,
        userId: session.user.id,
      },
    });

    return NextResponse.json(workspace);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }
    return new NextResponse(null, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const workspaces = await db.workspace.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            documents: true,
          },
        },
      },
    });

    return NextResponse.json(workspaces);
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}
