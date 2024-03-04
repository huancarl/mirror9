import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {

    try{
      const codesMappingFilePath = path.join(process.cwd(), 'utils', 'classCodesMapping.json');
      const data = await fs.readFile(codesMappingFilePath, 'utf8');
      const codeMapping = JSON.parse(data);

      res.status(200).json(codeMapping);
    }
    catch(e){
      console.log('Error in class mapping', e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }