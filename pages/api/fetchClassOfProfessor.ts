import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {

  try{
    const profEmailMappingFilePath = path.join(process.cwd(), 'utils', 'professorEmails.json');
    const data = await fs.readFile(profEmailMappingFilePath, 'utf8');
    const profEmailMapping = JSON.parse(data);

    return res.status(200).json({ profMap: profEmailMapping });
  }
  catch(e){
    console.log('Error in class mapping', e)
  }
}
