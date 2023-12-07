import * as fs from 'fs';
import * as path from 'path';

function updatePdfNamesToNamespace(folderName: string, className: string, subjectName: string): void {
    const folderPath = path.join('docs', folderName);
    const jsonFilePath = path.join('utils', 'pdfNamestoNamespace.json');
    const classMaterialMappingFilePath = path.join('utils', 'chatAccessDocuments.json');

    console.log(folderPath, 'folder path');
    console.log(jsonFilePath, 'file path');

    try {
        // Read the contents of the folder
        const files = fs.readdirSync(folderPath);
        const pdfNames = files.filter(file => file.endsWith('.pdf')).map(file => file.replace('.pdf', ''));

        // Read and parse the JSON file
        const jsonFile = fs.readFileSync(jsonFilePath, 'utf8');
        let jsonData = JSON.parse(jsonFile);

        const classMaterialMappingFile = fs.readFileSync(classMaterialMappingFilePath, 'utf8');
        let classMaterialMapping = JSON.parse(classMaterialMappingFile);


        // Append new keys and values, if they don't already exist
        pdfNames.forEach(pdfName => {
            const formattedName = pdfName.replace(/_/g, ' ');
            const mappedName = `${className} ${formattedName}`;
        
            if (!jsonData.hasOwnProperty(pdfName)) {
                jsonData[pdfName] = [mappedName];
            }
        
            if (!classMaterialMapping.hasOwnProperty(subjectName)) {
                classMaterialMapping[subjectName] = [];
            }
            
            if (!classMaterialMapping[subjectName].includes(mappedName)) {
                classMaterialMapping[subjectName].push(mappedName);
            }
        });
        

        // Write the updated JSON back to the file
        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));
        fs.writeFileSync(classMaterialMappingFilePath, JSON.stringify(classMaterialMapping, null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

export const run = async () => {
    const nameOfFolder = 'AEM_2241';
    const nameOfClassToAppendInFront = 'AEM 2241'
    const subjectNameForChatTS = 'AEM 2241' // usually the same thing as nameOfClassToAppendInFront

    const pdfNames = updatePdfNamesToNamespace(nameOfFolder, nameOfClassToAppendInFront, subjectNameForChatTS);
}

(async () => {
    await run();
  })();