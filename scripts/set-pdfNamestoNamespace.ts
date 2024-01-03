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
        
            //Adds the pdf name to the mapping for pdf name to namespace
            if (!jsonData.hasOwnProperty(mappedName)) {
                jsonData[pdfName] = [mappedName];
            }
            
            //Create class key for the dictionary for chat.ts access documents IF it doesn't exist
            if (!classMaterialMapping.hasOwnProperty(subjectName)) {
                classMaterialMapping[subjectName] = [];
            }
            
            if (!classMaterialMapping[subjectName].includes(mappedName)) {
                classMaterialMapping[subjectName].push(mappedName);
            }
        });
        
        //Add Class X All Materials
        const allMaterials = `${folderName} All Materials`;
        if (!jsonData.hasOwnProperty(allMaterials)) {
            jsonData[allMaterials] = [allMaterials];
        }
        if (!classMaterialMapping.hasOwnProperty(subjectName)) {
            classMaterialMapping[subjectName] = [];
        }
        if (!classMaterialMapping[subjectName].includes(allMaterials)) {
            classMaterialMapping[subjectName].push(allMaterials);
        }

        // Write the updated JSON back to the file
        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));
        fs.writeFileSync(classMaterialMappingFilePath, JSON.stringify(classMaterialMapping, null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

export const run = async () => {
    const nameOfFolder = 'INFO_2950';
    const nameOfClassToAppendInFront = 'INFO 2950' // Seperate class code and number with a space
    const subjectNameForChatTS = 'INFO 2950' // usually the same thing as nameOfClassToAppendInFront

    const pdfNames = updatePdfNamesToNamespace(nameOfFolder, nameOfClassToAppendInFront, subjectNameForChatTS);
}

(async () => {
    await run();
  })();