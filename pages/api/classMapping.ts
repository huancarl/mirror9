import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  const classMappingFilePath = path.join(process.cwd(), 'utils', 'chatAccessDocuments.json');
  const data = await fs.readFile(classMappingFilePath, 'utf8');
  const classMapping = JSON.parse(data);
  
  res.status(200).json(classMapping);
}
