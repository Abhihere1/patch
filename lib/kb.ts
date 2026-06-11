import { promises as fs } from 'fs';
import path from 'path';

const KB_WORKFLOWS_DIR = path.join(process.cwd(), 'knowledge_base', 'workflows');
const KB_IMAGES_DIR = path.join(process.cwd(), 'knowledge_base', 'images');

export async function kbFileExists(filename: string): Promise<boolean> {
  try {
    await fs.access(path.join(KB_WORKFLOWS_DIR, filename));
    return true;
  } catch {
    return false;
  }
}

export async function readKbFile(filename: string): Promise<string | null> {
  try {
    const content = await fs.readFile(path.join(KB_WORKFLOWS_DIR, filename), 'utf-8');
    return content;
  } catch {
    return null;
  }
}

export async function readAllKbFiles(): Promise<{ category: string; filename: string; content: string }[]> {
  try {
    const files = await fs.readdir(KB_WORKFLOWS_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    const results = await Promise.all(
      mdFiles.map(async filename => {
        const content = await fs.readFile(path.join(KB_WORKFLOWS_DIR, filename), 'utf-8');
        const category = filename.replace('.md', '').toUpperCase();
        return { category, filename, content };
      })
    );
    return results;
  } catch {
    return [];
  }
}

export function formatKbContext(files: { category: string; filename: string; content: string }[]): string {
  if (files.length === 0) return 'No knowledge base content available.';
  if (files.length === 1) return files[0].content;
  return files.map(f => `[CATEGORY: ${f.category} | FILE: ${f.filename}]\n${f.content}`).join('\n\n');
}

export async function getKbContextForCategory(category: string | null): Promise<{ context: string; files: string[] }> {
  if (category) {
    const filename = `${category.toLowerCase()}.md`;
    const content = await readKbFile(filename);
    if (content) {
      return { context: content, files: [filename] };
    }
  }
  const allFiles = await readAllKbFiles();
  return {
    context: formatKbContext(allFiles),
    files: allFiles.map(f => f.filename),
  };
}

export async function getImagePath(filename: string): Promise<string | null> {
  try {
    const imagePath = path.join(KB_IMAGES_DIR, filename);
    await fs.access(imagePath);
    return imagePath;
  } catch {
    return null;
  }
}

export async function readImageFile(filename: string): Promise<Buffer | null> {
  try {
    const imagePath = path.join(KB_IMAGES_DIR, filename);
    return await fs.readFile(imagePath);
  } catch {
    return null;
  }
}
