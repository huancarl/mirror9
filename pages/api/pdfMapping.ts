import fs from 'fs/promises';
import path from 'path';

function invertMapping(pdfToNamespace) {
    const namespaceToPdf = {};
  
    for (const pdf in pdfToNamespace) {
      const namespace = pdfToNamespace[pdf];
  
      if (!namespaceToPdf[namespace]) {
        namespaceToPdf[namespace] = [];
      }
  
      namespaceToPdf[namespace].push(pdf);
    }
  
    return namespaceToPdf;
  }


export default async function handler(req, res) {

  try{
    const pdfMappingFilePath = path.join(process.cwd(), 'utils', 'pdfNamestoNamespace.json');
    const data = await fs.readFile(pdfMappingFilePath, 'utf8');
    const pdfMapping = JSON.parse(data);
    
    const namespaceToPdfMap = invertMapping(pdfMapping);
    res.status(200).json(namespaceToPdfMap);
  }
  catch(e){
    console.log('Error in class mapping', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
