import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: '파일이 없습니다.' },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    // uploads 폴더가 없으면 생성
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const urls: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // 고유한 파일명 생성
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.name)}`;
      const filePath = path.join(uploadDir, uniqueName);

      await writeFile(filePath, buffer);
      urls.push(`/uploads/${uniqueName}`);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    return NextResponse.json(
      { error: '파일 업로드에 실패했습니다.' },
      { status: 500 }
    );
  }
}
